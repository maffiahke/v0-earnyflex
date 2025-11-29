import { createBrowserClient } from "@/lib/supabase/client"

export async function getUserProfile(userId: string) {
  const supabase = createBrowserClient()
  const { data, error } = await supabase.from("users").select("*").eq("id", userId).single()

  if (error) throw error
  return data
}

export async function updateUserProfile(userId: string, updates: any) {
  const supabase = createBrowserClient()
  const { data, error } = await supabase.from("users").update(updates).eq("id", userId).select().single()

  if (error) throw error
  return data
}

export async function getUserTransactions(userId: string) {
  const supabase = createBrowserClient()
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

export async function createTransaction(transaction: any) {
  const supabase = createBrowserClient()
  const { data, error } = await supabase.from("transactions").insert(transaction).select().single()

  if (error) throw error
  return data
}

export async function getMusicTasks() {
  const supabase = createBrowserClient()
  const { data, error } = await supabase
    .from("music_tasks")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

export async function getTriviaQuestions() {
  const supabase = createBrowserClient()
  const { data, error } = await supabase
    .from("trivia_questions")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

export async function getActivationPackages() {
  const supabase = createBrowserClient()
  const { data, error } = await supabase
    .from("activation_packages")
    .select("*")
    .eq("is_active", true)
    .order("price", { ascending: true })

  if (error) throw error
  return data || []
}

export async function getUserReferrals(userId: string) {
  const supabase = createBrowserClient()
  const { data, error } = await supabase
    .from("referrals")
    .select(`
      *,
      referred:users!referrals_referred_id_fkey(id, name, email, is_activated, created_at)
    `)
    .eq("referrer_id", userId)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

export async function getAppSettings() {
  const supabase = createBrowserClient()
  const { data, error } = await supabase.from("app_settings").select("*")

  if (error) throw error

  // Convert array to object
  const settings: any = {}
  data?.forEach((setting) => {
    settings[setting.key] = setting.value
  })

  return settings
}

export async function canDoTask(userId: string, taskType: "music" | "trivia") {
  const supabase = createBrowserClient()
  const { data: user } = await supabase
    .from("users")
    .select(taskType === "music" ? "last_music_task_date" : "last_trivia_task_date")
    .eq("id", userId)
    .single()

  if (!user) return false

  const lastTaskDate = taskType === "music" ? user.last_music_task_date : user.last_trivia_task_date
  const today = new Date().toISOString().split("T")[0]

  return !lastTaskDate || lastTaskDate !== today
}

export async function completeTask(userId: string, reward: number, taskType: "music" | "trivia") {
  const supabase = createBrowserClient()
  const today = new Date().toISOString().split("T")[0]

  // First get current user data
  const { data: user, error: fetchError } = await supabase
    .from("users")
    .select("wallet_balance, total_earnings")
    .eq("id", userId)
    .single()

  if (fetchError) throw fetchError

  const updateField = taskType === "music" ? "last_music_task_date" : "last_trivia_task_date"

  // Update with calculated values
  const { error } = await supabase
    .from("users")
    .update({
      wallet_balance: (user.wallet_balance || 0) + reward,
      total_earnings: (user.total_earnings || 0) + reward,
      [updateField]: today,
    })
    .eq("id", userId)

  if (error) throw error
}

export async function getAllUsers() {
  const supabase = createBrowserClient()
  const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

export async function updateUser(userId: string, updates: any) {
  const supabase = createBrowserClient()
  const { data, error } = await supabase.from("users").update(updates).eq("id", userId).select().single()

  if (error) throw error
  return data
}

export async function banUser(userId: string, isBanned: boolean) {
  const supabase = createBrowserClient()
  const { data, error } = await supabase
    .from("users")
    .update({ is_banned: isBanned })
    .eq("id", userId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function activateUser(userId: string) {
  const supabase = createBrowserClient()
  const { data, error } = await supabase
    .from("users")
    .update({ is_activated: true, activation_date: new Date().toISOString() })
    .eq("id", userId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getAdminStats() {
  const supabase = createBrowserClient()

  const [users, deposits, withdrawals, revenue] = await Promise.all([
    supabase.from("users").select("count", { count: "exact" }),
    supabase.from("transactions").select("*", { count: "exact" }).eq("type", "deposit").eq("status", "pending"),
    supabase.from("transactions").select("*", { count: "exact" }).eq("type", "withdraw").eq("status", "pending"),
    supabase.from("transactions").select("amount").eq("type", "deposit").eq("status", "completed"),
  ])

  return {
    totalUsers: users.count || 0,
    pendingDeposits: deposits.count || 0,
    pendingWithdrawals: withdrawals.count || 0,
    totalRevenue: (revenue.data || []).reduce((sum, t) => sum + (t.amount || 0), 0),
  }
}

export async function getPendingTransactions(type: "deposit" | "withdraw") {
  const supabase = createBrowserClient()
  const { data, error } = await supabase
    .from("transactions")
    .select("*, users!user_id(name, email)")
    .eq("type", type)
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

export async function updateTransaction(transactionId: string, status: "approved" | "rejected" | "completed") {
  const supabase = createBrowserClient()
  const { data, error } = await supabase
    .from("transactions")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", transactionId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function addMusicTask(task: any) {
  const supabase = createBrowserClient()
  const { data, error } = await supabase
    .from("music_tasks")
    .insert({
      ...task,
      is_active: true,
      created_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateMusicTask(taskId: string, updates: any) {
  const supabase = createBrowserClient()
  const { data, error } = await supabase.from("music_tasks").update(updates).eq("id", taskId).select().single()

  if (error) throw error
  return data
}

export async function deleteMusicTask(taskId: string) {
  const supabase = createBrowserClient()
  const { error } = await supabase.from("music_tasks").delete().eq("id", taskId)

  if (error) throw error
}

export async function addTriviaQuestion(question: any) {
  const supabase = createBrowserClient()
  const { data, error } = await supabase
    .from("trivia_questions")
    .insert({
      ...question,
      is_active: true,
      created_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateTriviaQuestion(questionId: string, updates: any) {
  const supabase = createBrowserClient()
  const { data, error } = await supabase.from("trivia_questions").update(updates).eq("id", questionId).select().single()

  if (error) throw error
  return data
}

export async function deleteTriviaQuestion(questionId: string) {
  const supabase = createBrowserClient()
  const { error } = await supabase.from("trivia_questions").delete().eq("id", questionId)

  if (error) throw error
}

export async function addActivationPackage(pkg: any) {
  const supabase = createBrowserClient()
  const { data, error } = await supabase
    .from("activation_packages")
    .insert({
      ...pkg,
      is_active: true,
      created_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateActivationPackage(packageId: string, updates: any) {
  const supabase = createBrowserClient()
  const { data, error } = await supabase
    .from("activation_packages")
    .update(updates)
    .eq("id", packageId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteActivationPackage(packageId: string) {
  const supabase = createBrowserClient()
  const { error } = await supabase.from("activation_packages").delete().eq("id", packageId)

  if (error) throw error
}

export async function updateAppSetting(key: string, value: any) {
  const supabase = createBrowserClient()
  const { data, error } = await supabase
    .from("app_settings")
    .upsert({ key, value }, { onConflict: "key" })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getTotalEarningsByType(userId: string, type: "music" | "trivia") {
  const supabase = createBrowserClient()
  const { data, error } = await supabase
    .from("transactions")
    .select("amount")
    .eq("user_id", userId)
    .eq("type", "earning")
    .ilike("description", `%${type}%`)

  if (error) throw error

  const total = (data || []).reduce((sum, t) => sum + Number(t.amount || 0), 0)
  return total
}

export async function getTotalDeposits(userId: string) {
  const supabase = createBrowserClient()
  const { data, error } = await supabase
    .from("transactions")
    .select("amount")
    .eq("user_id", userId)
    .eq("type", "deposit")
    .eq("status", "completed")

  if (error) throw error

  const total = (data || []).reduce((sum, t) => sum + Number(t.amount || 0), 0)
  return total
}
