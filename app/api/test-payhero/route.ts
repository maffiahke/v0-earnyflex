import { NextResponse } from "next/server"

export async function GET() {
  const PAYHERO_BASIC_AUTH_TOKEN = process.env.PAYHERO_API_KEY
  const PAYHERO_CHANNEL_ID = process.env.PAYHERO_CHANNEL_ID

  const testData = {
    credentials_configured: {
      basic_auth_token_exists: !!PAYHERO_BASIC_AUTH_TOKEN,
      token_length: PAYHERO_BASIC_AUTH_TOKEN?.length || 0,
      token_preview: PAYHERO_BASIC_AUTH_TOKEN ? `${PAYHERO_BASIC_AUTH_TOKEN.substring(0, 20)}...` : "NOT SET",
      channel_id: PAYHERO_CHANNEL_ID || "NOT SET",
    },
    environment: {
      site_url: process.env.NEXT_PUBLIC_SITE_URL || "NOT SET",
      callback_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://earnyflex.vercel.app"}/api/mpesa-callback`,
    },
  }

  if (!PAYHERO_BASIC_AUTH_TOKEN || !PAYHERO_CHANNEL_ID) {
    return NextResponse.json({
      status: "error",
      message: "PayHero credentials not configured",
      details: testData,
      instructions:
        'Add PAYHERO_API_KEY (paste the complete "Basic Auth Token" from PayHero dashboard) and PAYHERO_CHANNEL_ID to your environment variables',
    })
  }

  // Test API connection
  try {
    const response = await fetch("https://backend.payhero.co.ke/api/v2/payments", {
      method: "POST",
      headers: {
        Authorization: PAYHERO_BASIC_AUTH_TOKEN,
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
      auth_format: "Using PayHero-provided Basic Auth Token directly",
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
