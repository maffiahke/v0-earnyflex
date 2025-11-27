import { NextResponse } from "next/server"
import { processMpesaC2BPayment } from "@/app/actions/mpesa-c2b"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    console.log("[v0] M-Pesa C2B Confirmation Request:", body)

    // Extract payment details from Safaricom callback
    const { TransID, TransAmount, MSISDN, BillRefNumber, FirstName, MiddleName, LastName } = body

    // Process the payment
    const result = await processMpesaC2BPayment(TransID, MSISDN, Number.parseFloat(TransAmount), BillRefNumber)

    console.log("[v0] Payment processing result:", result)

    // Always return success to Safaricom to acknowledge receipt
    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: "Success",
    })
  } catch (error) {
    console.error("[v0] Confirmation error:", error)

    // Still return success to avoid retries
    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: "Success",
    })
  }
}
