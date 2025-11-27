"use client"

import { useEffect, useState, useRef } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { AdminLayout } from "@/components/admin-layout"
import { Card } from "@/components/ui/card"
import { Users, UserCheck, Clock, DollarSign } from "lucide-react"
import { motion } from "framer-motion"

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activatedUsers: 0,
    pendingDeposits: 0,
    pendingWithdrawals: 0,
    totalRevenue: 0,
  })
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const statsRef = useRef(false)

  useEffect(() => {
    if (statsRef.current) return
    statsRef.current = true

    const fetchStats = async () => {
      try {
        const supabase = createBrowserClient()

        const [usersData, activatedData, depositsData, withdrawalsData, revenueData] = await Promise.all([
          supabase.from("users").select("count", { count: "exact" }),
          supabase.from("users").select("count", { count: "exact" }).eq("is_activated", true),
          supabase
            .from("transactions")
            .select("count", { count: "exact" })
            .eq("type", "deposit")
            .eq("status", "pending"),
          supabase
            .from("transactions")
            .select("count", { count: "exact" })
            .eq("type", "withdraw")
            .eq("status", "pending"),
          supabase.from("transactions").select("amount").eq("type", "deposit").eq("status", "completed"),
        ])

        const revenue = (revenueData.data || []).reduce((sum, t) => sum + (t.amount || 0), 0)

        setStats({
          totalUsers: usersData.count || 0,
          activatedUsers: activatedData.count || 0,
          pendingDeposits: depositsData.count || 0,
          pendingWithdrawals: withdrawalsData.count || 0,
          totalRevenue: revenue,
        })

        const { data: txData } = await supabase
          .from("transactions")
          .select("*, users!user_id(name, email)")
          .order("created_at", { ascending: false })
          .limit(5)

        setTransactions(txData || [])
      } catch (err) {
        console.error("[v0] Stats fetch error:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const statCards = [
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "primary" },
    { label: "Activated Users", value: stats.activatedUsers, icon: UserCheck, color: "success" },
    { label: "Pending Deposits", value: stats.pendingDeposits, icon: Clock, color: "accent" },
    { label: "Pending Withdrawals", value: stats.pendingWithdrawals, icon: Clock, color: "accent" },
    { label: "Total Revenue", value: `KSh ${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: "success" },
  ]

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Overview of Earnify platform</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="glass-card p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-full bg-${stat.color}/20 flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 text-${stat.color}`} />
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Recent Activity */}
        <Card className="glass-card p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction, index) => (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass p-4 rounded-lg flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium capitalize">{transaction.type}</p>
                    <p className="text-sm text-muted-foreground">
                      {transaction.users?.name || `User ID: ${transaction.user_id}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">KSh {transaction.amount}</p>
                    <p className="text-xs capitalize text-muted-foreground">{transaction.status}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  )
}
