"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Wallet, ArrowUpCircle, ArrowDownCircle, Clock, CheckCircle, XCircle, Lock } from "lucide-react"
import { motion } from "framer-motion"
import { createBrowserClient } from "@/lib/supabase/client"
import { getUserProfile } from "@/lib/supabase/queries"

export default function WalletPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [user, setUser] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [depositAmount, setDepositAmount] = useState("")
  const [depositMethod, setDepositMethod] = useState<"mpesa" | "bank">("mpesa")
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [withdrawMethod, setWithdrawMethod] = useState<"mpesa" | "bank">("mpesa")

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

      const { data: txns } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", authUser.id)
        .order("created_at", { ascending: false })

      setTransactions(txns || [])
    } catch (error) {
      console.error("Error loading user:", error)
      router.push("/auth/login")
    } finally {
      setLoading(false)
    }
  }

  async function handleDeposit() {
    const amount = Number.parseFloat(depositAmount)
    if (!amount || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      })
      return
    }

    try {
      const supabase = createBrowserClient()
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (!authUser) return

      await supabase.from("transactions").insert({
        user_id: authUser.id,
        type: "deposit",
        amount,
        status: "pending",
        payment_method: depositMethod,
        description: `Deposit via ${depositMethod.toUpperCase()}`,
        created_at: new Date().toISOString(),
      })

      toast({
        title: "Deposit Request Submitted",
        description: "Your deposit will be processed by admin",
      })

      setDepositAmount("")
      loadUser()
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "Failed to submit deposit request",
        variant: "destructive",
      })
    }
  }

  async function handleWithdraw() {
    if (!user?.is_activated) {
      toast({
        title: "Account Not Activated",
        description: "Please activate your account to withdraw",
        variant: "destructive",
      })
      router.push("/dashboard/activation")
      return
    }

    const amount = Number.parseFloat(withdrawAmount)
    if (!amount || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      })
      return
    }

    if (amount > (user?.wallet_balance || 0)) {
      toast({
        title: "Insufficient balance",
        description: "You do not have enough balance",
        variant: "destructive",
      })
      return
    }

    try {
      const supabase = createBrowserClient()
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (!authUser) return

      await supabase.from("transactions").insert({
        user_id: authUser.id,
        type: "withdraw",
        amount,
        status: "pending",
        payment_method: withdrawMethod,
        description: `Withdrawal via ${withdrawMethod.toUpperCase()}`,
        created_at: new Date().toISOString(),
      })

      toast({
        title: "Withdrawal Request Submitted",
        description: "Your withdrawal will be processed by admin",
      })

      setWithdrawAmount("")
      loadUser()
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "Failed to submit withdrawal request",
        variant: "destructive",
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-success" />
      case "pending":
        return <Clock className="w-4 h-4 text-accent" />
      case "rejected":
        return <XCircle className="w-4 h-4 text-destructive" />
      default:
        return null
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <ArrowDownCircle className="w-5 h-5 text-success" />
      case "withdraw":
        return <ArrowUpCircle className="w-5 h-5 text-accent" />
      default:
        return <Wallet className="w-5 h-5 text-primary" />
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
          <h1 className="text-3xl font-bold">Wallet</h1>
          <p className="text-muted-foreground">Manage your deposits and withdrawals</p>
        </div>

        {/* Balance Card */}
        <Card className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Available Balance</p>
              <p className="text-4xl font-bold text-primary">KSh {Number(user.wallet_balance).toLocaleString()}</p>
            </div>
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <Wallet className="w-8 h-8 text-primary" />
            </div>
          </div>
        </Card>

        {/* Deposit & Withdraw Tabs */}
        <Tabs defaultValue="deposit" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="deposit">Deposit</TabsTrigger>
            <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
          </TabsList>

          <TabsContent value="deposit">
            <Card className="glass-card p-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="deposit-method">Payment Method</Label>
                  <Select value={depositMethod} onValueChange={(value: any) => setDepositMethod(value)}>
                    <SelectTrigger id="deposit-method">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mpesa">M-Pesa</SelectItem>
                      <SelectItem value="bank">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deposit-amount">Amount (KSh)</Label>
                  <Input
                    id="deposit-amount"
                    type="number"
                    placeholder="Enter amount"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="bg-background/50"
                  />
                </div>

                <Button
                  onClick={handleDeposit}
                  className="w-full bg-success hover:bg-success/90 text-success-foreground"
                >
                  <ArrowDownCircle className="w-4 h-4 mr-2" />
                  Request Deposit
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="withdraw">
            <Card className="glass-card p-6">
              {!user.is_activated ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-8 h-8 text-accent" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Account Not Activated</h3>
                  <p className="text-muted-foreground mb-4">Please activate your account to unlock withdrawals</p>
                  <Button onClick={() => router.push("/dashboard/activation")}>View Activation Packages</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="withdraw-method">Payment Method</Label>
                    <Select value={withdrawMethod} onValueChange={(value: any) => setWithdrawMethod(value)}>
                      <SelectTrigger id="withdraw-method">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mpesa">M-Pesa</SelectItem>
                        <SelectItem value="bank">Bank Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="withdraw-amount">Amount (KSh)</Label>
                    <Input
                      id="withdraw-amount"
                      type="number"
                      placeholder="Enter amount"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="bg-background/50"
                    />
                  </div>

                  <Button
                    onClick={handleWithdraw}
                    className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                  >
                    <ArrowUpCircle className="w-4 h-4 mr-2" />
                    Request Withdrawal
                  </Button>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>

        {/* Transaction History */}
        <Card className="glass-card p-6">
          <h2 className="text-xl font-semibold mb-4">Transaction History</h2>

          {transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.map((transaction, index) => (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass p-4 rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      {getTypeIcon(transaction.type)}
                      <div>
                        <p className="font-medium capitalize">{transaction.type}</p>
                        <p className="text-sm text-muted-foreground">
                          {transaction.description || `${transaction.type} via ${transaction.payment_method}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(transaction.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <div>
                        <p
                          className={`font-semibold ${
                            transaction.type === "deposit" ||
                            transaction.type === "earning" ||
                            transaction.type === "bonus"
                              ? "text-success"
                              : "text-accent"
                          }`}
                        >
                          {transaction.type === "withdraw" ? "-" : "+"}KSh {Number(transaction.amount).toLocaleString()}
                        </p>
                        <div className="flex items-center gap-1 justify-end">
                          {getStatusIcon(transaction.status)}
                          <span className="text-xs capitalize">{transaction.status}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No transactions yet</p>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}
