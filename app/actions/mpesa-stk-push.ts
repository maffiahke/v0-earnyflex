"use server"

import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"

export async function initiateStkPush(phoneNumber: string, amount: number, userId: string) {
  try {
    console.log("[v0] STK Push initiated:", { phoneNumber, amount, userId })

    // Authenticate user
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || user.id !== userId) {
      console.error("[v0] Authentication failed")
      return { success: false, error: "Unauthorized" }
    }

    // Get M-Pesa credentials from database
    const { data: settingsData } = await supabase.from("app_settings").select("value").eq("key", "mpesaConfig").single()

    const mpesaConfig = settingsData?.value as any

    // Fallback to environment variables if not in database
    const consumerKey = (mpesaConfig?.consumerKey || process.env.MPESA_CONSUMER_KEY || "").trim()
    const consumerSecret = (mpesaConfig?.consumerSecret || process.env.MPESA_CONSUMER_SECRET || "").trim()
    const shortcode = (mpesaConfig?.shortcode || process.env.MPESA_SHORTCODE || "").trim()
    const passkey = (mpesaConfig?.passkey || process.env.MPESA_PASSKEY || "").trim()
    const environment = (mpesaConfig?.environment || process.env.MPESA_ENVIRONMENT || "sandbox").trim()

    if (!consumerKey || !consumerSecret || !shortcode || !passkey) {
      console.error("[v0] M-Pesa credentials not configured")
      return {
        success: false,
        error: "Payment gateway not configured. Please contact support.",
      }
    }

    console.log("[v0] M-Pesa config loaded:", {
      shortcode,
      environment,
      consumerKeyLength: consumerKey?.length,
      consumerSecretLength: consumerSecret?.length,
      passkeyLength: passkey?.length,
    })

    // Format phone number to 254XXXXXXXXX
    let formattedPhone = phoneNumber.replace(/\s/g, "")
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "254" + formattedPhone.slice(1)
    } else if (formattedPhone.startsWith("+254")) {
      formattedPhone = formattedPhone.slice(1)
    } else if (!formattedPhone.startsWith("254")) {
      formattedPhone = "254" + formattedPhone
    }

    console.log("[v0] Formatted phone:", formattedPhone)

    // Get OAuth token
    const authUrl =
      environment === "production"
        ? "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
        : "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"

    console.log("[v0] OAuth URL:", authUrl)
    const authHeader = "Basic " + Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64")

    const authResponse = await fetch(authUrl, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    })

    console.log("[v0] OAuth response status:", authResponse.status, authResponse.statusText)

    if (!authResponse.ok) {
      const errorText = await authResponse.text()
      console.error("[v0] OAuth failed with status:", authResponse.status)
      console.error("[v0] OAuth error response:", errorText)

      let errorMessage = `Failed to authenticate with M-Pesa. Status: ${authResponse.status}`

      if (authResponse.status === 400) {
        errorMessage += ". Invalid credentials. Please verify your Consumer Key and Consumer Secret."
      } else if (authResponse.status === 401) {
        errorMessage += ". Unauthorized. Please check your API credentials."
      }

      return {
        success: false,
        error: errorMessage,
      }
    }

    const authData = await authResponse.json()
    console.log("[v0] OAuth response:", authData)

    if (!authData.access_token) {
      console.error("[v0] No access token in response:", authData)
      return {
        success: false,
        error: "Failed to obtain access token from M-Pesa",
      }
    }

    const access_token = authData.access_token
    console.log("[v0] Access token obtained successfully")

    // Generate password and timestamp
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:TZ.]/g, "")
      .slice(0, 14)
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64")

    console.log("[v0] Generated timestamp:", timestamp)
    console.log("[v0] Password length:", password.length)

    // Create transaction record
    const adminClient = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { data: transaction, error: txnError } = await adminClient
      .from("transactions")
      .insert({
        user_id: userId,
        type: "deposit",
        amount: Math.floor(amount),
        status: "pending",
        payment_method: "mpesa_stk",
        description: "M-Pesa STK Push deposit",
        payment_details: {
          phone: formattedPhone,
          timestamp,
        },
      })
      .select()
      .single()

    if (txnError) {
      console.error("[v0] Transaction creation failed:", txnError)
      return {
        success: false,
        error: "Failed to create transaction record",
      }
    }

    console.log("[v0] Transaction created:", transaction.id)

    // Initiate STK Push
    const stkUrl =
      environment === "production"
        ? "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest"
        : "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest"

    const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://earnyflex.vercel.app"}/api/mpesa/stk-callback`

    const stkPayload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.floor(amount),
      PartyA: formattedPhone,
      PartyB: shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackUrl,
      AccountReference: userId,
      TransactionDesc: `Deposit KSh ${amount}`,
    }

    console.log("[v0] STK Push URL:", stkUrl)
    console.log("[v0] STK Push payload:", {
      ...stkPayload,
      Password: "REDACTED",
      CallBackURL: callbackUrl,
    })

    const stkResponse = await fetch(stkUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(stkPayload),
    })

    console.log("[v0] STK Push response status:", stkResponse.status)

    const stkData = await stkResponse.json()
    console.log("[v0] STK Push full response:", JSON.stringify(stkData, null, 2))

    if (stkData.ResponseCode === "0" || stkData.ResponseCode === 0) {
      // Update transaction with checkout request ID
      await adminClient
        .from("transactions")
        .update({
          payment_details: {
            ...transaction.payment_details,
            checkoutRequestId: stkData.CheckoutRequestID,
            merchantRequestId: stkData.MerchantRequestID,
          },
        })
        .eq("id", transaction.id)

      return {
        success: true,
        message: "STK Push sent successfully. Please check your phone.",
        checkoutRequestId: stkData.CheckoutRequestID,
      }
    } else {
      // Update transaction as failed
      await adminClient
        .from("transactions")
        .update({
          status: "rejected",
          payment_details: {
            ...transaction.payment_details,
            error: stkData.ResponseDescription || stkData.errorMessage,
          },
        })
        .eq("id", transaction.id)

      console.error("[v0] STK Push rejected:", stkData)

      return {
        success: false,
        error: stkData.ResponseDescription || stkData.errorMessage || stkData.errorCode || "STK Push failed",
      }
    }
  } catch (error: any) {
    console.error("[v0] STK Push error:", error)
    return {
      success: false,
      error: error.message || "An error occurred. Please try again.",
    }
  }
}
