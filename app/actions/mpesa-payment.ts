"use server"

import { createClient } from "@/lib/supabase/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function initiateMpesaPayment(phoneNumber: string, amount: number, userId: string) {
  try {
    console.log("[v0] Initiating M-Pesa payment for user:", userId)

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

    // Get PayHero credentials from environment or app settings
    const PAYHERO_API_KEY = process.env.PAYHERO_API_KEY
    const PAYHERO_CHANNEL_ID = process.env.PAYHERO_CHANNEL_ID

    if (!PAYHERO_API_KEY || !PAYHERO_CHANNEL_ID) {
      console.error("[v0] Missing PayHero credentials")
      return {
        success: false,
        error: "Payment gateway not configured. Please contact admin.",
      }
    }

    // Format phone number (remove leading 0 if present, ensure 254 prefix)
    let formattedPhone = phoneNumber.trim().replace(/\s/g, "")
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "254" + formattedPhone.substring(1)
    } else if (!formattedPhone.startsWith("254")) {
      formattedPhone = "254" + formattedPhone
    }

    console.log("[v0] Creating transaction record...")

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

    console.log("[v0] Transaction created:", transaction.id)

    // Generate callback URL
    const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://earnyflex.vercel.app"}/api/mpesa-callback`

    console.log("[v0] Initiating PayHero STK Push...")

    // Initiate STK Push with PayHero
    const response = await fetch("https://backend.payhero.co.ke/api/v2/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYHERO_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amount,
        phone_number: formattedPhone,
        channel_id: Number.parseInt(PAYHERO_CHANNEL_ID),
        provider: "m-pesa",
        external_reference: transaction.id,
        callback_url: callbackUrl,
      }),
    })

    const result = await response.json()

    console.log("[v0] PayHero response:", result)

    if (!response.ok || !result.success) {
      console.error("[v0] PayHero API error:", result)

      await supabaseAdmin
        .from("transactions")
        .update({
          status: "rejected",
          payment_details: {
            ...transaction.payment_details,
            error: result.message || "Payment initiation failed",
          },
        })
        .eq("id", transaction.id)

      return {
        success: false,
        error: result.message || "Failed to initiate payment",
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

    console.log("[v0] M-Pesa STK Push initiated successfully")

    return {
      success: true,
      reference: result.reference,
      checkoutRequestId: result.CheckoutRequestID,
      transactionId: transaction.id,
      message: "Payment request sent to your phone. Please enter your M-Pesa PIN to complete.",
    }
  } catch (error) {
    console.error("[v0] Error initiating M-Pesa payment:", error)
    return {
      success: false,
      error: error.message || "An error occurred while processing your payment",
    }
  }
}
