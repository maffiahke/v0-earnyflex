"use server"

import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"

export async function initiateLipanaStkPush(phone: string, amount: number, userId: string) {
  try {
    console.log("[v0] Lipana STK Push initiated:", { phone, amount, userId })

    // Authenticate user
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user || user.id !== userId) {
      console.error("[v0] Authentication failed:", authError)
      return { success: false, error: "Unauthorized. Please log in again." }
    }

    // Get Lipana API configuration from database
    const { data: configData, error: configError } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "lipanaConfig")
      .single()

    const lipanaConfig = configData?.value as {
      publishableKey?: string
      secretKey?: string
      environment?: "sandbox" | "production"
    } | null

    // Fallback to environment variables
    const apiKey = (lipanaConfig?.secretKey || process.env.LIPANA_SECRET_KEY || "").trim()
    const environment = lipanaConfig?.environment || process.env.LIPANA_ENVIRONMENT || "production"

    if (!apiKey) {
      console.error("[v0] Lipana API key not configured")
      return { success: false, error: "Payment gateway not configured. Please contact support." }
    }

    // Validate minimum amount (Ksh 10)
    if (amount < 10) {
      return { success: false, error: "Minimum transaction amount is Ksh 10" }
    }

    // Format phone number (Lipana accepts +254... or 254... format)
    let formattedPhone = phone.replace(/\s/g, "")
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "+254" + formattedPhone.substring(1)
    } else if (formattedPhone.startsWith("254")) {
      formattedPhone = "+" + formattedPhone
    } else if (!formattedPhone.startsWith("+")) {
      formattedPhone = "+254" + formattedPhone
    }

    console.log("[v0] Formatted phone:", formattedPhone)
    console.log("[v0] Environment:", environment)
    console.log("[v0] API Key configured:", apiKey ? "Yes" : "No")

    // Create admin client to bypass RLS
    const adminClient = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Create pending transaction
    const { data: transaction, error: txError } = await adminClient
      .from("transactions")
      .insert({
        user_id: userId,
        type: "deposit",
        amount,
        status: "pending",
        payment_method: "mpesa_stk",
        description: "M-Pesa STK Push via Lipana",
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (txError) {
      console.error("[v0] Failed to create transaction:", txError)
      return { success: false, error: "Failed to create transaction record" }
    }

    console.log("[v0] Transaction created:", transaction.id)

    // Initiate Lipana STK Push
    const lipanaUrl = "https://api.lipana.dev/v1/transactions/push-stk"
    const payload = {
      phone: formattedPhone,
      amount: Math.floor(amount), // Ensure integer
    }

    console.log("[v0] Lipana request payload:", payload)

    const response = await fetch(lipanaUrl, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    const responseText = await response.text()
    console.log("[v0] Lipana response status:", response.status)
    console.log("[v0] Lipana response text:", responseText)

    let responseData
    try {
      responseData = JSON.parse(responseText)
    } catch {
      responseData = { message: responseText }
    }

    if (!response.ok) {
      console.error("[v0] Lipana API error:", responseData)

      // Update transaction as failed
      await adminClient
        .from("transactions")
        .update({
          status: "failed",
          description: `Failed: ${responseData.message || "Unknown error"}`,
        })
        .eq("id", transaction.id)

      return {
        success: false,
        error: responseData.message || `Payment failed (${response.status})`,
      }
    }

    console.log("[v0] Lipana STK Push successful:", responseData)

    // Update transaction with Lipana details
    const lipanaTransactionId = responseData.data?.transactionId
    const checkoutRequestID = responseData.data?.checkoutRequestID

    await adminClient
      .from("transactions")
      .update({
        description: `M-Pesa STK Push via Lipana - ${lipanaTransactionId || "Pending"}`,
        metadata: {
          lipanaTransactionId,
          checkoutRequestID,
          phone: formattedPhone,
        },
      })
      .eq("id", transaction.id)

    return {
      success: true,
      message: responseData.data?.message || "STK push sent successfully",
      transactionId: lipanaTransactionId,
      checkoutRequestID,
    }
  } catch (error: any) {
    console.error("[v0] Lipana STK Push exception:", error)
    return {
      success: false,
      error: error.message || "An unexpected error occurred",
    }
  }
}
