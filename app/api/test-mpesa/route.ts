import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Get M-Pesa credentials from database
    const { data: settingsData } = await supabase.from("app_settings").select("value").eq("key", "mpesaConfig").single()

    const mpesaConfig = settingsData?.value as any

    // Fallback to environment variables
    const consumerKey = mpesaConfig?.consumerKey || process.env.MPESA_CONSUMER_KEY
    const consumerSecret = mpesaConfig?.consumerSecret || process.env.MPESA_CONSUMER_SECRET
    const shortcode = mpesaConfig?.shortcode || process.env.MPESA_SHORTCODE
    const passkey = mpesaConfig?.passkey || process.env.MPESA_PASSKEY
    const environment = mpesaConfig?.environment || process.env.MPESA_ENVIRONMENT || "sandbox"

    if (!consumerKey || !consumerSecret || !shortcode || !passkey) {
      return NextResponse.json({
        status: "error",
        message: "M-Pesa credentials not configured",
        config: {
          hasConsumerKey: !!consumerKey,
          hasConsumerSecret: !!consumerSecret,
          hasShortcode: !!shortcode,
          hasPasskey: !!passkey,
          environment,
        },
      })
    }

    // Test OAuth authentication
    const authUrl =
      environment === "production"
        ? "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
        : "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"

    const authHeader = "Basic " + Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64")

    console.log("[v0] Testing M-Pesa OAuth...")
    console.log("[v0] Auth URL:", authUrl)
    console.log("[v0] Consumer Key:", consumerKey.substring(0, 10) + "...")
    console.log("[v0] Consumer Secret:", consumerSecret.substring(0, 10) + "...")

    const authResponse = await fetch(authUrl, {
      method: "GET",
      headers: {
        Authorization: authHeader,
      },
    })

    const authResponseText = await authResponse.text()
    let authData

    try {
      authData = JSON.parse(authResponseText)
    } catch {
      authData = { raw: authResponseText }
    }

    return NextResponse.json({
      status: authResponse.ok ? "success" : "error",
      oauth: {
        url: authUrl,
        status: authResponse.status,
        statusText: authResponse.statusText,
        response: authData,
        hasAccessToken: !!(authData as any).access_token,
      },
      config: {
        consumerKeyPreview: consumerKey.substring(0, 15) + "...",
        consumerSecretPreview: consumerSecret.substring(0, 15) + "...",
        shortcode,
        passkeyLength: passkey.length,
        environment,
      },
    })
  } catch (error: any) {
    console.error("[v0] Test M-Pesa error:", error)
    return NextResponse.json({
      status: "error",
      message: error.message,
      stack: error.stack,
    })
  }
}
