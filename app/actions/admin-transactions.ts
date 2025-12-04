"use server"

import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function approveDeposit(transactionId: string, userId: string, amount: number) {
  try {
    // Update transaction status
    const { error: txError } = await supabase
      .from("transactions")
      .update({ status: "completed" })
      .eq("id", transactionId)

    if (txError) {
      console.error("[v0] Transaction update error:", txError)
      return { success: false, error: "Failed to update transaction" }
    }

    // Get current balance
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("wallet_balance")
      .eq("id", userId)
      .single()

    if (userError) {
      console.error("[v0] User fetch error:", userError)
      return { success: false, error: "Failed to fetch user balance" }
    }

    // Update wallet balance
    const newBalance = (userData.wallet_balance || 0) + amount
    const { error: updateError } = await supabase.from("users").update({ wallet_balance: newBalance }).eq("id", userId)

    if (updateError) {
      console.error("[v0] Balance update error:", updateError)
      return { success: false, error: "Failed to update wallet balance" }
    }

    revalidatePath("/admincp/transactions")
    return { success: true }
  } catch (error) {
    console.error("[v0] Approve deposit error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function rejectDeposit(transactionId: string) {
  try {
    const { error } = await supabase.from("transactions").update({ status: "rejected" }).eq("id", transactionId)

    if (error) {
      console.error("[v0] Reject deposit error:", error)
      return { success: false, error: "Failed to reject deposit" }
    }

    revalidatePath("/admincp/transactions")
    return { success: true }
  } catch (error) {
    console.error("[v0] Reject deposit error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function approveWithdrawal(transactionId: string, userId: string, amount: number) {
  try {
    // Update transaction status
    const { error: txError } = await supabase
      .from("transactions")
      .update({ status: "completed" })
      .eq("id", transactionId)

    if (txError) {
      console.error("[v0] Transaction update error:", txError)
      return { success: false, error: "Failed to update transaction" }
    }

    // Get current balance
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("wallet_balance")
      .eq("id", userId)
      .single()

    if (userError) {
      console.error("[v0] User fetch error:", userError)
      return { success: false, error: "Failed to fetch user balance" }
    }

    // Update wallet balance (deduct amount)
    const newBalance = (userData.wallet_balance || 0) - amount
    const { error: updateError } = await supabase.from("users").update({ wallet_balance: newBalance }).eq("id", userId)

    if (updateError) {
      console.error("[v0] Balance update error:", updateError)
      return { success: false, error: "Failed to update wallet balance" }
    }

    revalidatePath("/admincp/transactions")
    return { success: true }
  } catch (error) {
    console.error("[v0] Approve withdrawal error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function rejectWithdrawal(transactionId: string) {
  try {
    const { error } = await supabase.from("transactions").update({ status: "rejected" }).eq("id", transactionId)

    if (error) {
      console.error("[v0] Reject withdrawal error:", error)
      return { success: false, error: "Failed to reject withdrawal" }
    }

    revalidatePath("/admincp/transactions")
    return { success: true }
  } catch (error) {
    console.error("[v0] Reject withdrawal error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}
