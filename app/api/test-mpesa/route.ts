import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Get M-Pesa credentials from database
    const { data: settingsData } = await supabase.from("app_settings").select("value").eq("key", "mpesaConfig").single()

    const mpesaConfig = settingsData?.value as any

    const consumerKey = (mpesaConfig?.consumerKey || process.env.MPESA_CONSUMER_KEY || "").trim()
    const consumerSecret = (mpesaConfig?.consumerSecret || process.env.MPESA_CONSUMER_SECRET || "").trim()
    const shortcode = (mpesaConfig?.shortcode || process.env.MPESA_SHORTCODE || "").trim()
    const passkey = (mpesaConfig?.passkey || process.env.MPESA_PASSKEY || "").trim()
    const environment = (mpesaConfig?.environment || process.env.MPESA_ENVIRONMENT || "sandbox").trim()

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

    const authString = `${consumerKey}:${consumerSecret}`
    const authBase64 = Buffer.from(authString).toString("base64")
    const authHeader = `Basic ${authBase64}`

    console.log("[v0] Consumer Key length:", consumerKey.length)
    console.log("[v0] Consumer Secret length:", consumerSecret.length)
    console.log(
      "[v0] Auth string format check:",
      authString.substring(0, 20) + "..." + authString.substring(authString.length - 5),
    )
    console.log("[v0] Base64 encoded:", authBase64.substring(0, 30) + "...")

    const environments = [
      { name: "sandbox", url: "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials" },
      { name: "production", url: "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials" },
    ]

    const testResults = []

    for (const env of environments) {
      console.log(`[v0] Testing ${env.name} OAuth...`)

      try {
        const authResponse = await fetch(env.url, {
          method: "GET",
          headers: {
            Authorization: authHeader,
            "Content-Type": "application/json",
          },
        })

        const authResponseText = await authResponse.text()
        let authData

        try {
          authData = JSON.parse(authResponseText)
        } catch {
          authData = { raw: authResponseText }
        }

        console.log(`[v0] ${env.name} response:`, JSON.stringify(authData, null, 2))

        testResults.push({
          environment: env.name,
          url: env.url,
          status: authResponse.status,
          statusText: authResponse.statusText,
          success: authResponse.ok,
          response: authData,
          hasAccessToken: !!(authData as any).access_token,
        })
      } catch (error: any) {
        console.error(`[v0] ${env.name} error:`, error.message)
        testResults.push({
          environment: env.name,
          url: env.url,
          error: error.message,
        })
      }
    }

    return NextResponse.json({
      status: testResults.some((r) => r.success) ? "success" : "error",
      message: testResults.some((r) => r.success)
        ? `Authentication successful with ${testResults.find((r) => r.success)?.environment} environment`
        : "Authentication failed in both sandbox and production",
      tests: testResults,
      config: {
        consumerKeyPreview: consumerKey.substring(0, 15) + "...",
        consumerKeyLength: consumerKey.length,
        consumerSecretPreview: consumerSecret.substring(0, 15) + "...",
        consumerSecretLength: consumerSecret.length,
        shortcode,
        passkeyLength: passkey.length,
        configuredEnvironment: environment,
        authBase64Preview: authBase64.substring(0, 30) + "...",
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
