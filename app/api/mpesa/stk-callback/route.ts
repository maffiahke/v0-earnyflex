import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("[v0] STK Push callback received:", JSON.stringify(body, null, 2))

    const { Body } = body
    const { stkCallback } = Body || {}

    if (!stkCallback) {
      console.error("[v0] Invalid callback format")
      return NextResponse.json({ ResultCode: 1, ResultDesc: "Invalid callback format" })
    }

    const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback

    console.log("[v0] Processing STK callback:", {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
    })

    // Initialize Supabase admin client
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Find the transaction
    const { data: transactions } = await supabase
      .from("transactions")
      .select("*")
      .eq("payment_details->>checkoutRequestId", CheckoutRequestID)
      .eq("status", "pending")

    if (!transactions || transactions.length === 0) {
      console.error("[v0] Transaction not found for CheckoutRequestID:", CheckoutRequestID)
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" })
    }

    const transaction = transactions[0]

    if (ResultCode === 0) {
      // Payment successful
      const metadata = CallbackMetadata?.Item || []
      const amount = metadata.find((item: any) => item.Name === "Amount")?.Value || transaction.amount
      const mpesaReceiptNumber = metadata.find((item: any) => item.Name === "MpesaReceiptNumber")?.Value
      const transactionDate = metadata.find((item: any) => item.Name === "TransactionDate")?.Value
      const phoneNumber = metadata.find((item: any) => item.Name === "PhoneNumber")?.Value

      console.log("[v0] Payment successful:", {
        amount,
        mpesaReceiptNumber,
        transactionDate,
        phoneNumber,
      })

      // Update transaction as completed
      await supabase
        .from("transactions")
        .update({
          status: "completed",
          payment_details: {
            ...transaction.payment_details,
            mpesaReceiptNumber,
            transactionDate,
            phoneNumber,
            resultCode: ResultCode,
            resultDesc: ResultDesc,
          },
        })
        .eq("id", transaction.id)

      // Credit user wallet
      const { data: user } = await supabase
        .from("users")
        .select("wallet_balance")
        .eq("id", transaction.user_id)
        .single()

      if (user) {
        const newBalance = Number(user.wallet_balance || 0) + Number(amount)
        await supabase
          .from("users")
          .update({
            wallet_balance: newBalance,
            deposited_balance: supabase.rpc("increment", { x: Number(amount) }),
          })
          .eq("id", transaction.user_id)

        console.log("[v0] User wallet credited:", {
          userId: transaction.user_id,
          amount,
          newBalance,
        })
      }
    } else {
      // Payment failed
      console.error("[v0] Payment failed:", ResultDesc)

      await supabase
        .from("transactions")
        .update({
          status: "rejected",
          payment_details: {
            ...transaction.payment_details,
            resultCode: ResultCode,
            resultDesc: ResultDesc,
          },
        })
        .eq("id", transaction.id)
    }

    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" })
  } catch (error: any) {
    console.error("[v0] STK callback error:", error)
    return NextResponse.json({ ResultCode: 1, ResultDesc: error.message })
  }
}
