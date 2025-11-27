"use server"
import { createClient as createAdminClient } from "@supabase/supabase-js"

export async function processMpesaC2BPayment(
  transactionId: string,
  phoneNumber: string,
  amount: number,
  billRefNumber: string,
) {
  try {
    console.log("[v0] Processing M-Pesa C2B payment:", {
      transactionId,
      phoneNumber,
      amount,
      billRefNumber,
    })

    // Create admin client to bypass RLS
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    // Find user by bill ref number (user ID or phone)
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("*")
      .or(`id.eq.${billRefNumber},phone.eq.${phoneNumber}`)
      .single()

    if (userError || !user) {
      console.error("[v0] User not found for bill ref:", billRefNumber)
      return {
        success: false,
        error: "User not found",
      }
    }

    // Create transaction record
    const { data: transaction, error: txnError } = await supabaseAdmin
      .from("transactions")
      .insert({
        user_id: user.id,
        type: "deposit",
        amount,
        status: "completed",
        payment_method: "mpesa",
        description: `M-Pesa deposit - ${transactionId}`,
        mpesa_transaction_id: transactionId,
        mpesa_phone: phoneNumber,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (txnError) {
      console.error("[v0] Failed to create transaction:", txnError)
      return {
        success: false,
        error: "Failed to record transaction",
      }
    }

    // Update user wallet balance
    const newBalance = Number(user.wallet_balance || 0) + amount
    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({ wallet_balance: newBalance })
      .eq("id", user.id)

    if (updateError) {
      console.error("[v0] Failed to update wallet balance:", updateError)
      return {
        success: false,
        error: "Failed to update balance",
      }
    }

    console.log("[v0] Payment processed successfully. New balance:", newBalance)

    return {
      success: true,
      message: "Payment processed successfully",
      transactionId: transaction.id,
      newBalance,
    }
  } catch (error: any) {
    console.error("[v0] Exception processing C2B payment:", error)
    return {
      success: false,
      error: error.message || "Unknown error",
    }
  }
}
