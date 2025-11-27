"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Wallet, TrendingUp, Gift, CheckCircle2, Music, Brain, Users, Lock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { playSound } from "@/lib/sounds"
import Link from "next/link"
import { createBrowserClient } from "@/lib/supabase/client"
import { getUserProfile, updateUserProfile } from "@/lib/supabase/queries"
import { useAppSettings } from "@/lib/hooks/use-app-settings"

export default function DashboardPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [checkInLoading, setCheckInLoading] = useState(false)
  const [musicEarnings, setMusicEarnings] = useState(0)
  const [triviaEarnings, setTriviaEarnings] = useState(0)
  const [totalDeposits, setTotalDeposits] = useState(0)

  const { appSettings } = useAppSettings()

  useEffect(() => {
    loadUser()
  }, [])

  async function loadUser() {
    try {
      const supabase = createBrowserClient()
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (!authUser) {
        router.push("/auth/login")
        return
      }

      const profile = await getUserProfile(authUser.id)

      if (profile.is_admin) {
        router.push("/admincp")
        return
      }

      setUser(profile)

      const { getTotalEarningsByType, getTotalDeposits } = await import("@/lib/supabase/queries")
      const musicEarn = await getTotalEarningsByType(authUser.id, "music")
      const triviaEarn = await getTotalEarningsByType(authUser.id, "trivia")
      const deposits = await getTotalDeposits(authUser.id)

      setMusicEarnings(musicEarn)
      setTriviaEarnings(triviaEarn)
      setTotalDeposits(deposits)
    } catch (error) {
      console.error("Error loading user:", error)
      router.push("/auth/login")
    } finally {
      setLoading(false)
    }
  }

  async function handleCheckIn() {
    if (!user || !canCheckIn()) return

    setCheckInLoading(true)

    try {
      const today = new Date().toISOString().split("T")[0]
      const reward = appSettings.dailyCheckInReward

      const supabase = createBrowserClient()

      await supabase.from("transactions").insert({
        user_id: user.id,
        type: "bonus",
        amount: reward,
        status: "completed",
        description: "Daily check-in reward",
        created_at: new Date().toISOString(),
      })

      await updateUserProfile(user.id, {
        wallet_balance: (user.wallet_balance || 0) + reward,
        total_earnings: (user.total_earnings || 0) + reward,
        last_checkin: today,
      })

      playSound("success")
      toast({
        title: "Check-in Successful!",
        description: `You earned ${appSettings.currencySymbol} ${reward}`,
      })

      await loadUser()
    } catch (error) {
      console.error("Error checking in:", error)
      toast({
        title: "Error",
        description: "Failed to check in. Please try again.",
        variant: "destructive",
      })
    } finally {
      setCheckInLoading(false)
    }
  }

  function canCheckIn() {
    if (!user?.last_checkin) return true
    const today = new Date().toISOString().split("T")[0]
    return user.last_checkin !== today
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!user) return null

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user.name}!</h1>
          <p className="text-muted-foreground">Here's your earning overview</p>
        </div>

        {/* Wallet Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="glass-card p-6 border-blue-500/30 bg-blue-500/5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Wallet Balance</p>
                  <p className="text-3xl font-bold text-blue-400">
                    {appSettings.currencySymbol} {Number(user.wallet_balance).toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="glass-card p-6 border-orange-500/30 bg-orange-500/5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Deposits</p>
                  <p className="text-3xl font-bold text-orange-400">
                    {appSettings.currencySymbol} {Number(totalDeposits).toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-orange-400" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="glass-card p-6 border-green-500/30 bg-green-500/5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Earnings</p>
                  <p className="text-3xl font-bold text-green-400">
                    {appSettings.currencySymbol} {Number(user.total_earnings).toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Gift className="w-6 h-6 text-green-400" />
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Earning Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <Card className="glass-card p-6 border-primary/30 bg-primary/5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Music Earnings</p>
                  <p className="text-2xl font-bold text-primary">KSh {Number(musicEarnings).toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Music className="w-6 h-6 text-primary" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="glass-card p-6 border-success/30 bg-success/5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Trivia Earnings</p>
                  <p className="text-2xl font-bold text-success">KSh {Number(triviaEarnings).toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
                  <Brain className="w-6 h-6 text-success" />
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Daily Check-in */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <Card className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-success" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Daily Check-in</h3>
                  <p className="text-sm text-muted-foreground">
                    {canCheckIn() ? "Click to earn KSh 25" : "Come back tomorrow!"}
                  </p>
                </div>
              </div>
              <Button
                onClick={handleCheckIn}
                disabled={!canCheckIn() || checkInLoading}
                className="bg-success hover:bg-success/90 text-success-foreground"
              >
                {checkInLoading ? "Checking In..." : canCheckIn() ? "Check In" : "Checked In"}
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Account Status */}
        {!user.is_activated && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card className="glass-card p-6 border-accent/50">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                  <Lock className="w-6 h-6 text-accent" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">Activate Your Account</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Unlock withdrawals and earn referral bonuses by purchasing an activation package
                  </p>
                  <Link href="/dashboard/activation">
                    <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">View Packages</Button>
                  </Link>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/dashboard/music">
              <Card className="glass-card p-6 hover:border-primary/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <Music className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Listen to Music</h3>
                    <p className="text-sm text-muted-foreground">Earn up to KSh 75</p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link href="/dashboard/trivia">
              <Card className="glass-card p-6 hover:border-success/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
                    <Brain className="w-6 h-6 text-success" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Answer Trivia</h3>
                    <p className="text-sm text-muted-foreground">Earn KSh 30 per question</p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link href="/dashboard/referral">
              <Card className="glass-card p-6 hover:border-accent/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                    <Users className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Refer Friends</h3>
                    <p className="text-sm text-muted-foreground">Earn up to KSh 250</p>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
