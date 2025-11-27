import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    console.log("[v0] M-Pesa C2B Validation Request:", body)

    // Validation logic - you can add custom rules here
    // For example, check if bill_ref_number is valid user ID

    // Accept all transactions for now
    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: "Accepted",
    })
  } catch (error) {
    console.error("[v0] Validation error:", error)

    // Reject transaction on error
    return NextResponse.json({
      ResultCode: 1,
      ResultDesc: "Rejected",
    })
  }
}
