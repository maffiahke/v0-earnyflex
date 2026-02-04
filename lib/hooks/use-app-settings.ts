"use client"

import { useRef } from "react"
import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import type { RealtimeChannel } from "@supabase/supabase-js"

export interface AppSettings {
  appName: string
  currencySymbol: string
  welcomeBonus: number
  dailyCheckInReward: number
  referralBonus: number
  minWithdrawal: number
  maxWithdrawal: number
  minDeposit: number
  maxDeposit: number
}

export interface PaymentMethods {
  mpesa: {
    businessNumber: string
    accountName: string
  }
  bank: {
    bankName: string
    accountNumber: string
    accountName: string
  }
}

export interface SocialProofSettings {
  fakeNames: string[]
  counties: string[]
  earningMessages: string[]
}

export interface MpesaConfig {
  consumerKey: string
  consumerSecret: string
  shortcode: string
  passkey: string
  environment: "sandbox" | "production"
}

export interface LipanaConfig {
  publishableKey: string
  secretKey: string
  environment: "sandbox" | "production"
}

export interface PaymentMethodsEnabled {
  lipana: boolean
  mpesa: boolean
  bank: boolean
}

export function useAppSettings() {
  const [appSettings, setAppSettings] = useState<AppSettings>({
    appName: "Earnify",
    currencySymbol: "KSh",
    welcomeBonus: 100,
    dailyCheckInReward: 25,
    referralBonus: 150,
    minWithdrawal: 500,
    maxWithdrawal: 50000,
    minDeposit: 100,
    maxDeposit: 100000,
  })

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethods>({
    mpesa: {
      businessNumber: "123456",
      accountName: "Earnify",
    },
    bank: {
      bankName: "Equity Bank",
      accountNumber: "0123456789",
      accountName: "Earnify Ltd",
    },
  })

  const [socialProofSettings, setSocialProofSettings] = useState<SocialProofSettings>({
    fakeNames: ["John K.", "Mary W.", "Peter M.", "Grace N.", "David O."],
    counties: ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret"],
    earningMessages: ["just earned", "completed a task worth", "just made", "successfully earned"],
  })

  const [mpesaConfig, setMpesaConfig] = useState<MpesaConfig>({
    consumerKey: "",
    consumerSecret: "",
    shortcode: "",
    passkey: "",
    environment: "sandbox",
  })

  const [lipanaConfig, setLipanaConfig] = useState<LipanaConfig>({
    publishableKey: "",
    secretKey: "",
    environment: "production",
  })

  const [paymentMethodsEnabled, setPaymentMethodsEnabled] = useState<PaymentMethodsEnabled>({
    lipana: true,
    mpesa: true,
    bank: true,
  })

  const [loading, setLoading] = useState(true)
  const supabaseRef = useRef<any>(null)
  const subscriptionRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    loadSettings()

    // Setup real-time subscription
    const supabase = createBrowserClient()
    supabaseRef.current = supabase

    const channel = supabase
      .channel("app_settings_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "app_settings",
        },
        (payload: any) => {
          console.log("[v0] App settings changed:", payload)

          if (payload.new.key === "appSettings") {
            setAppSettings(payload.new.value)
          } else if (payload.new.key === "paymentMethods") {
            setPaymentMethods(payload.new.value)
          } else if (payload.new.key === "socialProofSettings") {
            setSocialProofSettings(payload.new.value)
          } else if (payload.new.key === "mpesaConfig") {
            setMpesaConfig(payload.new.value)
          } else if (payload.new.key === "lipanaConfig") {
            setLipanaConfig(payload.new.value)
          } else if (payload.new.key === "paymentMethodsEnabled") {
            setPaymentMethodsEnabled(payload.new.value)
          }
        },
      )
      .subscribe()

    subscriptionRef.current = channel

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current)
      }
    }
  }, [])

  async function loadSettings() {
    try {
      const supabase = createBrowserClient()

      const { data, error } = await supabase.from("app_settings").select("*")

      if (error) {
        console.error("[v0] Error loading settings from database:", error.message)
        setLoading(false)
        return
      }

      if (data && data.length > 0) {
        data.forEach((setting: any) => {
          try {
            const value = typeof setting.value === "string" ? JSON.parse(setting.value) : setting.value

            if (setting.key === "appSettings" && value) {
              setAppSettings(value)
            } else if (setting.key === "paymentMethods" && value) {
              setPaymentMethods(value)
            } else if (setting.key === "socialProofSettings" && value) {
              setSocialProofSettings(value)
            } else if (setting.key === "mpesaConfig" && value) {
              setMpesaConfig(value)
            } else if (setting.key === "lipanaConfig" && value) {
              setLipanaConfig(value)
            } else if (setting.key === "paymentMethodsEnabled" && value) {
              setPaymentMethodsEnabled(value)
            }
          } catch (parseErr) {
            console.error(`[v0] Error parsing setting ${setting.key}:`, parseErr)
          }
        })
      }
    } catch (err) {
      console.error("[v0] Unexpected error loading settings:", err)
    } finally {
      setLoading(false)
    }
  }

  return {
    appSettings,
    paymentMethods,
    socialProofSettings,
    mpesaConfig,
    lipanaConfig,
    paymentMethodsEnabled, // Added paymentMethodsEnabled to return value
    loading,
  }
}
