"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Lock, CheckCircle, Sparkles } from "lucide-react"
import { motion } from "framer-motion"
import { createBrowserClient } from "@/lib/supabase/client"
import { getUserProfile, getActivationPackages } from "@/lib/supabase/queries"
import { playSound } from "@/lib/sounds"

export default function ActivationPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [user, setUser] = useState<any>(null)
  const [packages, setPackages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
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
      setUser(profile)

      const pkgs = await getActivationPackages()
      setPackages(pkgs)
    } catch (error) {
      console.error("Error loading data:", error)
      router.push("/auth/login")
    } finally {
      setLoading(false)
    }
  }

  async function handleActivate(packageId: string) {
    if (!user) return

    const pkg = packages.find((p) => p.id === packageId)
    if (!pkg) return

    const walletBalance = user.wallet_balance || 0
    if (walletBalance < Number(pkg.price)) {
      toast({
        title: "Insufficient Balance",
        description: `You need KSh ${(Number(pkg.price) - walletBalance).toLocaleString()} more. Please deposit funds to continue.`,
        variant: "destructive",
      })
      router.push("/dashboard/wallet")
      return
    }

    try {
      const supabase = createBrowserClient()
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (!authUser) return

      const expiryDate = new Date()
      const durationDays = pkg.duration_days || 30
      expiryDate.setDate(expiryDate.getDate() + durationDays)

      await supabase
        .from("users")
        .update({
          is_activated: true,
          active_package_id: packageId,
          package_expiry_date: expiryDate.toISOString(),
          wallet_balance: walletBalance - Number(pkg.price),
          package_activated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", authUser.id)

      await supabase.from("transactions").insert({
        user_id: authUser.id,
        type: "activation",
        amount: pkg.price,
        status: "completed",
        description: `Account activation - ${pkg.name} package (expires ${expiryDate.toLocaleDateString()})`,
        created_at: new Date().toISOString(),
      })

      playSound("success")
      toast({
        title: "Account Activated!",
        description: `You can now access all tasks. Subscription expires on ${expiryDate.toLocaleDateString()}`,
      })

      router.push("/dashboard")
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "Failed to activate account",
        variant: "destructive",
      })
    }
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

  if (user.is_activated) {
    const packageExpired = user.package_expiry_date && new Date(user.package_expiry_date) < new Date()

    if (packageExpired) {
      return (
        <DashboardLayout>
          <div className="space-y-6">
            <div className="text-center max-w-2xl mx-auto">
              <h1 className="text-3xl font-bold mb-3">Renew Your Subscription</h1>
              <p className="text-muted-foreground">
                Your subscription has expired. Choose a package to continue earning.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {packages.map((pkg, index) => (
                <motion.div
                  key={pkg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`glass-card p-8 ${index === 1 ? "border-accent border-2" : ""}`}>
                    {index === 1 && (
                      <div className="flex items-center justify-center gap-2 mb-4">
                        <Sparkles className="w-4 h-4 text-accent" />
                        <span className="text-xs font-semibold text-accent uppercase">Most Popular</span>
                      </div>
                    )}

                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold mb-2">{pkg.name}</h3>
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-4xl font-bold text-primary">
                          KSh {Number(pkg.price).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">{pkg.duration_days || 30} days access</p>
                    </div>

                    <div className="space-y-3 mb-6">
                      {pkg.benefits &&
                        pkg.benefits.map((benefit: string, idx: number) => (
                          <div key={idx} className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                            <span className="text-sm">{benefit}</span>
                          </div>
                        ))}
                    </div>

                    <Button
                      onClick={() => handleActivate(pkg.id)}
                      className={`w-full ${
                        index === 1
                          ? "bg-accent hover:bg-accent/90 text-accent-foreground"
                          : "bg-primary hover:bg-primary/90 text-primary-foreground"
                      }`}
                      size="lg"
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      Renew Now
                    </Button>

                    <p className="text-xs text-center text-muted-foreground mt-4">
                      {(user.wallet_balance || 0) >= Number(pkg.price)
                        ? "Sufficient wallet balance"
                        : `Need KSh ${(Number(pkg.price) - (user.wallet_balance || 0)).toLocaleString()} more`}
                    </p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </DashboardLayout>
      )
    }

    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="glass-card p-12 text-center max-w-md">
            <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-success" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Account Active</h2>
            <p className="text-muted-foreground mb-2">Your subscription is active and you can enjoy all features</p>
            {user.package_expiry_date && (
              <p className="text-sm text-muted-foreground mb-6">
                Expires on: {new Date(user.package_expiry_date).toLocaleDateString()}
              </p>
            )}
            <Button onClick={() => router.push("/dashboard")}>Go to Dashboard</Button>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-3">Activate Your Account</h1>
          <p className="text-muted-foreground">Choose a package to unlock withdrawals and earn referral bonuses</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {packages.map((pkg, index) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`glass-card p-8 ${index === 1 ? "border-accent border-2" : ""}`}>
                {index === 1 && (
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Sparkles className="w-4 h-4 text-accent" />
                    <span className="text-xs font-semibold text-accent uppercase">Most Popular</span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">{pkg.name}</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-primary">KSh {Number(pkg.price).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{pkg.duration_days || 30} days access</p>
                </div>

                <div className="space-y-3 mb-6">
                  {pkg.benefits &&
                    pkg.benefits.map((benefit: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{benefit}</span>
                      </div>
                    ))}
                </div>

                <Button
                  onClick={() => handleActivate(pkg.id)}
                  className={`w-full ${
                    index === 1
                      ? "bg-accent hover:bg-accent/90 text-accent-foreground"
                      : "bg-primary hover:bg-primary/90 text-primary-foreground"
                  }`}
                  size="lg"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Activate Now
                </Button>

                <p className="text-xs text-center text-muted-foreground mt-4">
                  {(user.wallet_balance || 0) >= Number(pkg.price)
                    ? "Sufficient wallet balance"
                    : `Need KSh ${(Number(pkg.price) - (user.wallet_balance || 0)).toLocaleString()} more`}
                </p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
