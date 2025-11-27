"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Users, Copy, Share2, Gift, CheckCircle } from "lucide-react"
import { motion } from "framer-motion"
import { createBrowserClient } from "@/lib/supabase/client"
import { getUserProfile } from "@/lib/supabase/queries"

export default function ReferralPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [referralLink, setReferralLink] = useState("")
  const [loading, setLoading] = useState(true)

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
      setUser(profile)
      setReferralLink(`${window.location.origin}/auth/register?ref=${profile.referral_code}`)
    } catch (error) {
      console.error("Error loading user:", error)
      router.push("/auth/login")
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink)
    toast({
      title: "Copied!",
      description: "Referral link copied to clipboard",
    })
  }

  const shareReferral = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join Earnify",
          text: "Earn money by listening to music, answering trivia, and more!",
          url: referralLink,
        })
      } catch (err) {
        console.log("Share cancelled")
      }
    } else {
      copyToClipboard()
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Referral Program</h1>
          <p className="text-muted-foreground">Invite friends and earn bonuses</p>
        </div>

        {/* Referral Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="glass-card p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Referrals</p>
                  <p className="text-3xl font-bold">{user.total_referrals || 0}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="glass-card p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Activated</p>
                  <p className="text-3xl font-bold text-success">{user.activated_referrals || 0}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-success" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="glass-card p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Earnings</p>
                  <p className="text-3xl font-bold text-accent">
                    KSh {((user.activated_referrals || 0) * 100).toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                  <Gift className="w-6 h-6 text-accent" />
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Referral Link Card */}
        <Card className="glass-card p-6">
          <h2 className="text-xl font-semibold mb-4">Your Referral Link</h2>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input value={referralLink} readOnly className="bg-background/50 font-mono text-sm" />
              <Button onClick={copyToClipboard} variant="outline" className="flex-shrink-0 bg-transparent">
                <Copy className="w-4 h-4" />
              </Button>
              <Button onClick={shareReferral} className="flex-shrink-0">
                <Share2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="glass p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">Your Referral Code:</span>{" "}
                <span className="font-mono text-primary">{user.referral_code}</span>
              </p>
            </div>
          </div>
        </Card>

        {/* How it Works */}
        <Card className="glass-card p-6">
          <h2 className="text-xl font-semibold mb-4">How It Works</h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <span className="font-bold text-primary">1</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Share Your Link</h3>
                <p className="text-sm text-muted-foreground">Send your unique referral link to friends and family</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                <span className="font-bold text-success">2</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">They Sign Up</h3>
                <p className="text-sm text-muted-foreground">Your friend creates an account using your link</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                <span className="font-bold text-accent">3</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Earn Bonus</h3>
                <p className="text-sm text-muted-foreground">Get KSh 100-250 when they activate their account</p>
              </div>
            </div>
          </div>
        </Card>

        {!user.is_activated && (
          <Card className="glass-card p-6 border-accent/50">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                <Gift className="w-6 h-6 text-accent" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">Unlock Higher Referral Bonuses</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Activate your account to earn up to KSh 250 per activated referral
                </p>
                <Button
                  onClick={() => router.push("/dashboard/activation")}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  View Activation Packages
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
