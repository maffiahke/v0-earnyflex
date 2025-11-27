"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ShieldCheck, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { playSound } from "@/lib/sounds"

export default function AdminLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = createClient()

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (!data.user) {
        throw new Error("Failed to authenticate user")
      }

      console.log("[v0] Admin authenticated:", data.user.email)

      playSound("success")
      toast({
        title: "Login Successful",
        description: "Welcome to Admin Dashboard",
      })

      // Redirect to admin dashboard
      router.push("/admincp")
    } catch (error: any) {
      playSound("error")
      console.error("[v0] Login error:", error)
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "Invalid admin credentials",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">Admin Login</h1>
          <p className="text-muted-foreground">Access the Earnify admin panel</p>
        </div>

        <Card className="glass-card p-6">
          <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-lg text-sm">
            <p className="font-medium mb-1">Default Admin Credentials:</p>
            <p className="text-muted-foreground">Email: admin@earnify.com</p>
            <p className="text-muted-foreground">Password: admin123</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Admin Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@earnify.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="glass"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="glass"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Not an admin?{" "}
          <Link href="/auth/login" className="text-primary hover:underline">
            User Login
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
