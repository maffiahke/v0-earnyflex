import { NextResponse } from "next/server"

export async function GET() {
  const PAYHERO_API_KEY = process.env.PAYHERO_API_KEY
  const PAYHERO_CHANNEL_ID = process.env.PAYHERO_CHANNEL_ID

  const testData = {
    credentials_configured: {
      api_key_exists: !!PAYHERO_API_KEY,
      api_key_length: PAYHERO_API_KEY?.length || 0,
      api_key_preview: PAYHERO_API_KEY ? `${PAYHERO_API_KEY.substring(0, 10)}...` : "NOT SET",
      channel_id: PAYHERO_CHANNEL_ID || "NOT SET",
    },
    environment: {
      site_url: process.env.NEXT_PUBLIC_SITE_URL || "NOT SET",
      callback_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://earnyflex.vercel.app"}/api/mpesa-callback`,
    },
  }

  if (!PAYHERO_API_KEY || !PAYHERO_CHANNEL_ID) {
    return NextResponse.json({
      status: "error",
      message: "PayHero credentials not configured",
      details: testData,
      instructions:
        "Add PAYHERO_API_KEY and PAYHERO_CHANNEL_ID to your environment variables in the Vars section of v0",
    })
  }

  // Test API connection
  try {
    const response = await fetch("https://backend.payhero.co.ke/api/v2/payments", {
      method: "POST",
      headers: {
        Authorization: PAYHERO_API_KEY, // Removed Bearer prefix - PayHero expects API key directly
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: 10,
        phone_number: "0700000000",
        channel_id: Number.parseInt(PAYHERO_CHANNEL_ID),
        provider: "m-pesa",
        external_reference: "test-" + Date.now(),
        callback_url: testData.environment.callback_url,
      }),
    })

    const responseText = await response.text()
    let result

    try {
      result = JSON.parse(responseText)
    } catch {
      result = responseText
    }

    return NextResponse.json({
      status: response.ok ? "success" : "error",
      http_status: response.status,
      payhero_response: result,
      test_data: testData,
      note: "This was a test transaction with phone 0700000000 which should not actually process",
    })
  } catch (error: any) {
    return NextResponse.json({
      status: "error",
      message: "Failed to connect to PayHero API",
      error: error.message,
      test_data: testData,
    })
  }
}
