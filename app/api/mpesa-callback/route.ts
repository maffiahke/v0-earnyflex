import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()

    console.log("[v0] M-Pesa callback received:", payload)

    const supabase = await createClient()

    // Extract transaction details from callback
    const {
      external_reference, // This is our transaction ID
      status, // SUCCESS, FAILED, CANCELLED
      amount,
      phone_number,
      mpesa_reference,
      description,
    } = payload

    if (!external_reference) {
      console.error("[v0] Missing external_reference in callback")
      return NextResponse.json({ error: "Invalid callback data" }, { status: 400 })
    }

    // Get transaction from database
    const { data: transaction, error: txError } = await supabase
      .from("transactions")
      .select("*, users(*)")
      .eq("id", external_reference)
      .single()

    if (txError || !transaction) {
      console.error("[v0] Transaction not found:", external_reference)
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    // Update transaction based on payment status
    if (status === "SUCCESS") {
      // Payment successful - update transaction and user balance
      const { error: updateError } = await supabase
        .from("transactions")
        .update({
          status: "completed",
          payment_details: {
            ...transaction.payment_details,
            mpesa_reference,
            completed_at: new Date().toISOString(),
            callback_data: payload,
          },
        })
        .eq("id", external_reference)

      if (updateError) {
        console.error("[v0] Error updating transaction:", updateError)
      }

      // Update user balance
      const newBalance = Number(transaction.users.wallet_balance || 0) + Number(amount)
      const newDepositedBalance = Number(transaction.users.deposited_balance || 0) + Number(amount)

      await supabase
        .from("users")
        .update({
          wallet_balance: newBalance,
          deposited_balance: newDepositedBalance,
        })
        .eq("id", transaction.user_id)

      console.log("[v0] Payment completed successfully for transaction:", external_reference)
    } else {
      // Payment failed or cancelled
      await supabase
        .from("transactions")
        .update({
          status: "rejected",
          payment_details: {
            ...transaction.payment_details,
            failed_at: new Date().toISOString(),
            failure_reason: description || status,
            callback_data: payload,
          },
        })
        .eq("id", external_reference)

      console.log("[v0] Payment failed/cancelled for transaction:", external_reference)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Error processing M-Pesa callback:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
