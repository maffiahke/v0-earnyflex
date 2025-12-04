"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { AdminLayout } from "@/components/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle, XCircle, Clock } from "lucide-react"
import { motion } from "framer-motion"
import { approveDeposit, rejectDeposit, approveWithdrawal, rejectWithdrawal } from "@/app/actions/admin-transactions"

export default function AdminTransactionsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createBrowserClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/admincp/login")
        return
      }

      const { data: txData, error } = await supabase
        .from("transactions")
        .select("*, users!user_id(name, email)")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("[v0] Error fetching transactions:", error)
      }

      setTransactions(txData || [])
      setLoading(false)
    }

    checkAuth()
  }, [router])

  const pendingDeposits = transactions.filter((t) => t.type === "deposit" && t.status === "pending")
  const pendingWithdrawals = transactions.filter((t) => t.type === "withdraw" && t.status === "pending")

  const handleApproveDeposit = async (transactionId: string, userId: string, amount: number) => {
    const result = await approveDeposit(transactionId, userId, amount)

    if (result.success) {
      setTransactions(transactions.map((t) => (t.id === transactionId ? { ...t, status: "completed" } : t)))
      toast({
        title: "Deposit Approved",
        description: `KSh ${amount} credited to user`,
      })
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to approve deposit",
        variant: "destructive",
      })
    }
  }

  const handleRejectDeposit = async (transactionId: string) => {
    const result = await rejectDeposit(transactionId)

    if (result.success) {
      setTransactions(transactions.map((t) => (t.id === transactionId ? { ...t, status: "rejected" } : t)))
      toast({
        title: "Deposit Rejected",
        description: "Deposit request has been rejected",
      })
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to reject deposit",
        variant: "destructive",
      })
    }
  }

  const handleApproveWithdrawal = async (transactionId: string, userId: string, amount: number) => {
    const result = await approveWithdrawal(transactionId, userId, amount)

    if (result.success) {
      setTransactions(transactions.map((t) => (t.id === transactionId ? { ...t, status: "completed" } : t)))
      toast({
        title: "Withdrawal Approved",
        description: `KSh ${amount} deducted from user wallet`,
      })
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to approve withdrawal",
        variant: "destructive",
      })
    }
  }

  const handleRejectWithdrawal = async (transactionId: string) => {
    const result = await rejectWithdrawal(transactionId)

    if (result.success) {
      setTransactions(transactions.map((t) => (t.id === transactionId ? { ...t, status: "rejected" } : t)))
      toast({
        title: "Withdrawal Rejected",
        description: "Funds remain in user wallet",
      })
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to reject withdrawal",
        variant: "destructive",
      })
    }
  }

  if (loading) return null

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Transaction Management</h1>
          <p className="text-muted-foreground">Approve or reject deposits and withdrawals</p>
        </div>

        <Tabs defaultValue="deposits">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="deposits">Deposits ({pendingDeposits.length})</TabsTrigger>
            <TabsTrigger value="withdrawals">Withdrawals ({pendingWithdrawals.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="deposits">
            <Card className="glass-card p-6">
              <h2 className="text-xl font-semibold mb-4">Pending Deposits</h2>
              {pendingDeposits.length > 0 ? (
                <div className="space-y-3">
                  {pendingDeposits.map((transaction, index) => (
                    <motion.div
                      key={transaction.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="glass p-4 rounded-lg"
                    >
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex-1">
                          <p className="font-semibold mb-1">{transaction.users?.name}</p>
                          <p className="text-sm text-muted-foreground mb-1">Amount: KSh {transaction.amount}</p>
                          <p className="text-sm text-muted-foreground mb-1">
                            Method: {transaction.payment_method?.toUpperCase()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(transaction.created_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() =>
                              handleApproveDeposit(transaction.id, transaction.user_id, transaction.amount)
                            }
                            className="bg-success hover:bg-success/90 text-success-foreground"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRejectDeposit(transaction.id)}
                            className="text-destructive"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No pending deposits</p>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="withdrawals">
            <Card className="glass-card p-6">
              <h2 className="text-xl font-semibold mb-4">Pending Withdrawals</h2>
              {pendingWithdrawals.length > 0 ? (
                <div className="space-y-3">
                  {pendingWithdrawals.map((transaction, index) => (
                    <motion.div
                      key={transaction.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="glass p-4 rounded-lg"
                    >
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex-1">
                          <p className="font-semibold mb-1">{transaction.users?.name}</p>
                          <p className="text-sm text-muted-foreground mb-1">Amount: KSh {transaction.amount}</p>
                          <p className="text-sm text-muted-foreground mb-1">
                            Method: {transaction.payment_method?.toUpperCase()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(transaction.created_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() =>
                              handleApproveWithdrawal(transaction.id, transaction.user_id, transaction.amount)
                            }
                            className="bg-success hover:bg-success/90 text-success-foreground"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRejectWithdrawal(transaction.id)}
                            className="text-destructive"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No pending withdrawals</p>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}
