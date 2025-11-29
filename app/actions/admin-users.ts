"use server"

import { createClient } from "@supabase/supabase-js"

const getAdminClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(supabaseUrl, supabaseServiceKey)
}

export async function updateUserBanStatus(userId: string, isBanned: boolean) {
  const supabase = getAdminClient()

  const { error } = await supabase.from("users").update({ is_banned: !isBanned }).eq("id", userId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function updateUserActivationStatus(userId: string, isActivated: boolean) {
  const supabase = getAdminClient()

  const { error } = await supabase.from("users").update({ is_activated: !isActivated }).eq("id", userId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function addUserBalance(userId: string, amount: number, currentBalance: number, currentEarnings: number) {
  const supabase = getAdminClient()

  const { error } = await supabase
    .from("users")
    .update({
      wallet_balance: currentBalance + amount,
      total_earnings: currentEarnings + amount,
    })
    .eq("id", userId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function resetUserCheckin(userId: string) {
  const supabase = getAdminClient()

  const { error } = await supabase.from("users").update({ last_checkin: null }).eq("id", userId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function deleteUsers(userIds: string[]) {
  const supabase = getAdminClient()

  const { error } = await supabase.from("users").delete().in("id", userIds)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}
