"use server"

import { createClient } from "@/lib/supabase/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function initiateMpesaPayment(phoneNumber: string, amount: number, userId: string) {
  try {
    console.log("[v0] === M-Pesa Payment Initiation Started ===")
    console.log("[v0] User ID:", userId)
    console.log("[v0] Amount:", amount)
    console.log("[v0] Phone:", phoneNumber)

    const cookieStore = await cookies()
    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
            } catch {}
          },
        },
      },
    )

    const { data: payHeroConfigData, error: configError } = await supabaseAdmin
      .from("app_settings")
      .select("value")
      .eq("key", "payHeroConfig")
      .single()

    if (configError || !payHeroConfigData?.value) {
      console.error("[v0] PayHero config not found:", configError)
      return {
        success: false,
        error: "Payment gateway not configured. Please contact admin to configure PayHero credentials.",
      }
    }

    const payHeroConfig = payHeroConfigData.value
    const PAYHERO_BASIC_AUTH_TOKEN = payHeroConfig.basicAuthToken
    const PAYHERO_CHANNEL_ID = payHeroConfig.channelId

    console.log("[v0] PayHero Basic Auth Token exists:", !!PAYHERO_BASIC_AUTH_TOKEN)
    console.log("[v0] PayHero Channel ID:", PAYHERO_CHANNEL_ID)

    if (!PAYHERO_BASIC_AUTH_TOKEN || !PAYHERO_CHANNEL_ID) {
      console.error("[v0] Missing PayHero credentials")
      return {
        success: false,
        error: "Payment gateway credentials incomplete. Contact admin.",
      }
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("[v0] Authentication failed:", authError)
      return {
        success: false,
        error: "Unauthorized. Authentication required.",
      }
    }

    if (user.id !== userId) {
      console.error("[v0] User ID mismatch:", { authUserId: user.id, providedUserId: userId })
      return {
        success: false,
        error: "Unauthorized. User ID mismatch.",
      }
    }

    let formattedPhone = phoneNumber.trim().replace(/\s/g, "")
    console.log("[v0] Original phone:", formattedPhone)

    // Convert to Kenyan format starting with 0
    if (formattedPhone.startsWith("+254")) {
      formattedPhone = "0" + formattedPhone.substring(4)
    } else if (formattedPhone.startsWith("254")) {
      formattedPhone = "0" + formattedPhone.substring(3)
    } else if (!formattedPhone.startsWith("0")) {
      formattedPhone = "0" + formattedPhone
    }

    console.log("[v0] Formatted phone for PayHero:", formattedPhone)

    console.log("[v0] Creating transaction record...")

    const { data: transaction, error: txError } = await supabaseAdmin
      .from("transactions")
      .insert({
        user_id: user.id,
        type: "deposit",
        amount: amount,
        status: "pending",
        payment_method: "mpesa",
        description: `M-Pesa deposit via STK Push`,
        payment_details: {
          phone: formattedPhone,
          initiated_at: new Date().toISOString(),
        },
      })
      .select()
      .single()

    if (txError) {
      console.error("[v0] Error creating transaction:", txError)
      return { success: false, error: `Failed to create transaction: ${txError.message}` }
    }

    console.log("[v0] Transaction created with ID:", transaction.id)

    const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://earnyflex.vercel.app"}/api/mpesa-callback`
    console.log("[v0] Callback URL:", callbackUrl)

    console.log("[v0] Calling PayHero API...")

    const payload = {
      amount: amount,
      phone_number: formattedPhone,
      channel_id: Number.parseInt(PAYHERO_CHANNEL_ID),
      provider: "m-pesa",
      external_reference: transaction.id,
      callback_url: callbackUrl,
    }

    console.log("[v0] PayHero payload:", JSON.stringify(payload, null, 2))

    console.log("[v0] Using PayHero-provided Basic Auth Token")

    // Initiate STK Push with PayHero
    const response = await fetch("https://backend.payhero.co.ke/api/v2/payments", {
      method: "POST",
      headers: {
        Authorization: PAYHERO_BASIC_AUTH_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    console.log("[v0] PayHero response status:", response.status)

    const responseText = await response.text()
    console.log("[v0] PayHero raw response:", responseText)

    let result
    try {
      result = JSON.parse(responseText)
    } catch (e) {
      console.error("[v0] Failed to parse PayHero response:", e)
      return {
        success: false,
        error: "Invalid response from payment gateway",
      }
    }

    console.log("[v0] PayHero parsed response:", result)

    if (!response.ok || !result.success) {
      console.error("[v0] PayHero API error:", {
        status: response.status,
        result: result,
      })

      await supabaseAdmin
        .from("transactions")
        .update({
          status: "failed",
          payment_details: {
            ...transaction.payment_details,
            error: result.message || result.error || "Payment initiation failed",
            payhero_response: result,
          },
        })
        .eq("id", transaction.id)

      return {
        success: false,
        error:
          result.message || result.error || "Failed to initiate payment. Please check your phone number and try again.",
      }
    }

    await supabaseAdmin
      .from("transactions")
      .update({
        payment_details: {
          ...transaction.payment_details,
          payhero_reference: result.reference,
          checkout_request_id: result.CheckoutRequestID,
          status: result.status,
        },
      })
      .eq("id", transaction.id)

    console.log("[v0] === M-Pesa STK Push initiated successfully ===")

    return {
      success: true,
      reference: result.reference,
      checkoutRequestId: result.CheckoutRequestID,
      transactionId: transaction.id,
      message: "Payment request sent to your phone. Please enter your M-Pesa PIN to complete.",
    }
  } catch (error: any) {
    console.error("[v0] === M-Pesa Payment Error ===")
    console.error("[v0] Error details:", error)
    console.error("[v0] Error message:", error?.message)
    console.error("[v0] Error stack:", error?.stack)

    return {
      success: false,
      error: error?.message || "An error occurred while processing your payment. Please try again.",
    }
  }
}
