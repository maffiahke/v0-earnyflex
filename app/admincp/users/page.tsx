"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { AdminLayout } from "@/components/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Search, Ban, CheckCircle, Wallet, UsersIcon, Calendar, Plus } from "lucide-react"
import { motion } from "framer-motion"
import {
  updateUserBanStatus,
  updateUserActivationStatus,
  addUserBalance,
  resetUserCheckin,
  deleteUsers,
} from "@/app/actions/admin-users"

export default function AdminUsersPage() {
  const router = useRouter()
  const { toast } = useToast()
  const authCheckRef = useRef(false)
  const supabaseRef = useRef<any>(null)

  const [currentUser, setCurrentUser] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddBalance, setShowAddBalance] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState("")
  const [balanceAmount, setBalanceAmount] = useState("")
  const [loading, setLoading] = useState(true)
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])

  useEffect(() => {
    if (authCheckRef.current) return
    authCheckRef.current = true

    const checkAuth = async () => {
      try {
        supabaseRef.current = createBrowserClient()
        const {
          data: { user },
        } = await supabaseRef.current.auth.getUser()

        console.log("[v0] Current user:", user?.email)

        if (!user || user.email !== "admin@earnify.com") {
          console.log("[v0] Unauthorized admin access attempt")
          router.push("/admincp/login")
          return
        }

        setCurrentUser(user)
        setupRealtimeSubscription()
      } catch (err) {
        console.error("[v0] Auth check error:", err)
        router.push("/admincp/login")
      }
    }

    checkAuth()
  }, [router])

  const setupRealtimeSubscription = async () => {
    try {
      console.log("[v0] Fetching users with admin privileges")

      const { data: initialUsers, error: initialError } = await supabaseRef.current
        .from("users")
        .select("*")
        .order("created_at", { ascending: false })

      console.log("[v0] Fetch response:", { usersCount: initialUsers?.length, error: initialError?.message })

      if (initialError) {
        console.error("[v0] Error fetching initial users:", initialError)
        toast({
          variant: "destructive",
          title: "Error fetching users",
          description: initialError.message,
        })
        setLoading(false)
        return
      }

      if (!initialUsers || initialUsers.length === 0) {
        console.log("[v0] No users found in database")
        setUsers([])
      } else {
        console.log("[v0] Successfully fetched users:", initialUsers.length)
        setUsers(initialUsers)
      }

      setLoading(false)

      const subscription = supabaseRef.current
        .channel("users-changes-admin")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "users",
          },
          (payload: any) => {
            console.log("[v0] Real-time update:", payload.eventType)

            if (payload.eventType === "INSERT") {
              setUsers((prev) => [payload.new, ...prev])
            } else if (payload.eventType === "UPDATE") {
              setUsers((prev) => prev.map((user) => (user.id === payload.new.id ? payload.new : user)))
            } else if (payload.eventType === "DELETE") {
              setUsers((prev) => prev.filter((user) => user.id !== payload.old.id))
            }
          },
        )
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    } catch (error) {
      console.error("[v0] Subscription error:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to setup real-time updates",
      })
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.referral_code?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleToggleBan = async (userId: string, isBanned: boolean) => {
    const result = await updateUserBanStatus(userId, isBanned)

    if (!result.success) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
      return
    }

    toast({
      title: !isBanned ? "User Banned" : "User Unbanned",
    })
  }

  const handleToggleActivation = async (userId: string, isActivated: boolean) => {
    const result = await updateUserActivationStatus(userId, isActivated)

    if (!result.success) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
      return
    }

    toast({
      title: !isActivated ? "User Activated" : "User Deactivated",
    })
  }

  const handleAddBalance = async () => {
    if (!balanceAmount || isNaN(Number(balanceAmount))) {
      toast({
        title: "Invalid Amount",
        variant: "destructive",
      })
      return
    }

    const user = users.find((u) => u.id === selectedUserId)
    if (user) {
      const result = await addUserBalance(
        selectedUserId,
        Number(balanceAmount),
        user.wallet_balance || 0,
        user.total_earnings || 0,
      )

      if (!result.success) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Balance Added",
        description: `Added KSh ${balanceAmount} to ${user.name}'s wallet`,
      })
      setShowAddBalance(false)
      setBalanceAmount("")
      setSelectedUserId("")
    }
  }

  const handleResetCheckIn = async (userId: string) => {
    const result = await resetUserCheckin(userId)

    if (!result.success) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Check-in Reset",
    })
  }

  const handleBulkDelete = async () => {
    if (selectedUserIds.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select users to delete",
      })
      return
    }

    if (confirm(`Are you sure you want to delete ${selectedUserIds.length} user(s)? This cannot be undone.`)) {
      const result = await deleteUsers(selectedUserIds)

      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error,
        })
        return
      }

      toast({
        title: "Users Deleted",
        description: `${selectedUserIds.length} user(s) deleted`,
      })
      setSelectedUserIds([])
    }
  }

  const toggleUserSelection = (id: string) => {
    setSelectedUserIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  if (!currentUser || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">Loading users...</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground">Manage all users ({users.length} total)</p>
          </div>
        </div>

        <Card className="glass-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <Search className="w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or referral code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-background/50"
            />
          </div>

          {selectedUserIds.length > 0 && (
            <div className="mb-4 p-4 bg-destructive/10 border border-destructive/50 rounded-lg flex items-center justify-between">
              <span className="text-sm font-medium">{selectedUserIds.length} user(s) selected</span>
              <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                Delete Selected
              </Button>
            </div>
          )}

          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <UsersIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No users found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass p-4 rounded-lg"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <input
                      type="checkbox"
                      checked={selectedUserIds.includes(user.id)}
                      onChange={() => toggleUserSelection(user.id)}
                      className="w-4 h-4 rounded"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{user.name}</h3>
                        {user.is_activated && <CheckCircle className="w-4 h-4 text-success" />}
                        {user.is_banned && <Ban className="w-4 h-4 text-destructive" />}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <div>Email: {user.email}</div>
                        <div className="flex items-center gap-2">
                          <Wallet className="w-4 h-4" />
                          <span>Balance: KSh {(user.wallet_balance || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>Joined: {new Date(user.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>Status: {user.is_activated ? "Activated" : "Pending"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleActivation(user.id, user.is_activated)}
                      >
                        {user.is_activated ? "Deactivate" : "Activate"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleBan(user.id, user.is_banned)}
                        className={user.is_banned ? "text-success" : "text-destructive"}
                      >
                        {user.is_banned ? "Unban" : "Ban"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedUserId(user.id)
                          setShowAddBalance(true)
                        }}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Balance
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleResetCheckIn(user.id)}>
                        Reset Check-in
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </Card>

        {showAddBalance && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-6 max-w-md w-full"
            >
              <h2 className="text-xl font-bold mb-4">Add Balance</h2>
              <div className="space-y-4">
                <div>
                  <Label>Amount to Add (KSh)</Label>
                  <Input
                    type="number"
                    value={balanceAmount}
                    onChange={(e) => setBalanceAmount(e.target.value)}
                    placeholder="Enter amount"
                    min="1"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddBalance} className="flex-1">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Balance
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddBalance(false)
                      setBalanceAmount("")
                      setSelectedUserId("")
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
