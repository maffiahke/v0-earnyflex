"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Mail, Calendar, CheckCircle, XCircle, Copy } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
import { getUserProfile, updateUserProfile } from "@/lib/supabase/queries"

export default function ProfilePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [name, setName] = useState("")
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
      setName(profile.name)
    } catch (error) {
      console.error("Error loading user:", error)
      router.push("/auth/login")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateName = async () => {
    if (!user || !name.trim() || name === user.name) return

    try {
      await updateUserProfile(user.id, { name: name.trim() })
      toast({
        title: "Profile Updated",
        description: "Your name has been updated successfully",
      })
      setUser({ ...user, name: name.trim() })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      })
    }
  }

  const copyReferralCode = () => {
    if (!user) return
    const referralLink = `${window.location.origin}/auth/register?ref=${user.referral_code}`
    navigator.clipboard.writeText(referralLink)
    toast({
      title: "Copied!",
      description: "Referral link copied to clipboard",
    })
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
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-muted-foreground">Manage your account information</p>
        </div>

        {/* Profile Info */}
        <Card className="glass-card p-6">
          <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="flex gap-2">
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="bg-background/50" />
                <Button onClick={handleUpdateName} disabled={!name.trim() || name === user.name}>
                  Update
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <div className="flex items-center gap-3 text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span>{user.email}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Account Status</Label>
              <div className="flex items-center gap-3">
                {user.is_activated ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span className="text-success">Activated</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-accent" />
                    <span className="text-accent">Not Activated</span>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Member Since</Label>
              <div className="flex items-center gap-3 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>{new Date(user.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Referral Info */}
        <Card className="glass-card p-6">
          <h2 className="text-xl font-semibold mb-4">Referral Information</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Your Referral Code</Label>
              <div className="flex gap-2">
                <Input value={user.referral_code} readOnly className="bg-background/50 font-mono" />
                <Button onClick={copyReferralCode} variant="outline">
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="glass p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Total Referrals</p>
                <p className="text-2xl font-bold">{user.total_referrals || 0}</p>
              </div>
              <div className="glass p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Activated Referrals</p>
                <p className="text-2xl font-bold text-success">{user.activated_referrals || 0}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
