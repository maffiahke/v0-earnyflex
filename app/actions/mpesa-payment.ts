"use server"

import { createClient } from "@/lib/supabase/server"

export async function initiateMpesaPayment(phoneNumber: string, amount: number, userId: string) {
  try {
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

    const supabase = await createClient()

    const { data: transaction, error: txError } = await supabase
      .from("transactions")
      .insert({
        user_id: userId,
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
      return { success: false, error: "Failed to create transaction" }
    }

    // Generate callback URL
    const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://earnyflex.vercel.app"}/api/mpesa-callback`

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

    if (!response.ok || !result.success) {
      console.error("[v0] PayHero API error:", result)

      // Update transaction as failed
      await supabase
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

    // Update transaction with PayHero reference
    await supabase
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

    console.log("[v0] M-Pesa STK Push initiated:", result)

    return {
      success: true,
      reference: result.reference,
      checkoutRequestId: result.CheckoutRequestID,
      transactionId: transaction.id,
      message: "Payment request sent to your phone. Please enter your M-Pesa PIN to complete.",
    }
  } catch (error: any) {
    console.error("[v0] Error initiating M-Pesa payment:", error)
    return {
      success: false,
      error: error.message || "An error occurred while processing your payment",
    }
  }
}
