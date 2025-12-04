"use client"

import type React from "react"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Eye, EyeOff } from "lucide-react"
import Link from "next/link"

export default function RegisterPage() {
  const [phone, setPhone] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [fundPassword, setFundPassword] = useState("")
  const [invitationCode, setInvitationCode] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showFundPassword, setShowFundPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isValidatingCode, setIsValidatingCode] = useState(false)
  const [referrerId, setReferrerId] = useState(null)
  const [referrerName, setReferrerName] = useState(null)
  const [referralCodeValid, setReferralCodeValid] = useState(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  // Pre-fill invitation code from URL if present
  useState(() => {
    const ref = searchParams.get("ref")
    if (ref) {
      setInvitationCode(ref)
    }
  })

  const validateReferralCode = async (code: string) => {
    if (!code || code.trim().length === 0) {
      setReferralCodeValid(null)
      return
    }

    if (code.length < 5) {
      setReferralCodeValid(false)
      return
    }

    setIsValidatingCode(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("users")
        .select("id, name")
        .eq("referral_code", code.toUpperCase())
        .single()

      if (error || !data) {
        setReferralCodeValid(false)
      } else {
        setReferralCodeValid(true)
        setReferrerId(data.id)
        setReferrerName(data.name)
      }
    } catch (error) {
      setReferralCodeValid(false)
    } finally {
      setIsValidatingCode(false)
    }
  }

  useState(() => {
    const timer = setTimeout(() => {
      if (invitationCode) {
        validateReferralCode(invitationCode)
      }
    }, 500)
    return () => clearTimeout(timer)
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (!phone.match(/^\+?254[0-9]{9}$/)) {
        throw new Error("Please enter a valid phone number (254XXXXXXXXX)")
      }

      if (fundPassword.length < 4 || !/^\d+$/.test(fundPassword)) {
        throw new Error("Fund password must be at least 4 digits")
      }

      const supabase = createClient()

      const email = `${phone.replace("+", "")}@earnyflex.app`

      const { data: authData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/dashboard`,
          data: {
            name: username,
            phone,
            fund_password: fundPassword,
            ...(referrerId && { referred_by: referrerId }),
          },
        },
      })

      if (error) throw error

      toast({
        title: "Account created successfully!",
        description: referrerName
          ? `Welcome ${username}! You were referred by ${referrerName}.`
          : `Welcome ${username}!`,
      })

      router.push("/auth/login")
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#1a1f3a] flex flex-col">
      <div className="h-32 bg-[#1a1f3a]" />

      <div className="flex-1 bg-white rounded-t-[2rem] px-6 py-8">
        <div className="max-w-md mx-auto">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-[#1a1f3a] rounded-xl flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#7c3aed"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-8 h-8"
              >
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Sign Up</h1>
            <p className="text-gray-500">Register Using Your Invitaiton Code</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="phone" className="text-gray-700 text-sm font-medium mb-2 block">
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+254 Phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="h-14 rounded-xl border-gray-300 bg-white text-base"
              />
            </div>

            <div>
              <Label htmlFor="username" className="text-gray-700 text-sm font-medium mb-2 block">
                User Name
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="User Name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="h-14 rounded-xl border-gray-300 bg-white text-base"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-gray-700 text-sm font-medium mb-2 block">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="h-14 rounded-xl border-gray-300 bg-white text-base pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="fundPassword" className="text-gray-700 text-sm font-medium mb-2 block">
                Fund Password
              </Label>
              <div className="relative">
                <Input
                  id="fundPassword"
                  type={showFundPassword ? "text" : "password"}
                  placeholder="Fund Password"
                  value={fundPassword}
                  onChange={(e) => setFundPassword(e.target.value)}
                  required
                  minLength={4}
                  className="h-14 rounded-xl border-gray-300 bg-white text-base pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowFundPassword(!showFundPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-600"
                >
                  {showFundPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="invitationCode" className="text-gray-700 text-sm font-medium mb-2 block">
                Invitation Code <span className="text-gray-400">(Optional)</span>
              </Label>
              <div className="relative">
                <Input
                  id="invitationCode"
                  type="text"
                  placeholder="216465"
                  value={invitationCode}
                  onChange={(e) => setInvitationCode(e.target.value.toUpperCase())}
                  className="h-14 rounded-xl border-gray-300 bg-white text-base"
                />
                {isValidatingCode && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <div className="animate-spin h-5 w-5 border-2 border-purple-600 border-t-transparent rounded-full" />
                  </div>
                )}
                {!isValidatingCode && referralCodeValid !== null && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    {referralCodeValid ? (
                      <div className="text-green-500">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    ) : (
                      <div className="text-red-500">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 001.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {referralCodeValid === false && <p className="text-red-500 text-sm mt-1">Invalid invitation code</p>}
              {referralCodeValid === true && <p className="text-green-500 text-sm mt-1">Valid invitation code ✓</p>}
            </div>

            <Button
              type="submit"
              disabled={isLoading || referralCodeValid === false}
              className="w-full h-14 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white text-base font-semibold rounded-full mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Creating account..." : "Register"}
            </Button>

            <p className="text-center text-gray-600 mt-6">
              Joined us before?{" "}
              <Link href="/auth/login" className="text-purple-600 font-medium hover:underline">
                Login
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
