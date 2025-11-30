"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Settings, DollarSign, Gift, MessageSquare, Plus, Trash2 } from "lucide-react"
import { motion } from "framer-motion"
import { useAppSettings } from "@/lib/hooks/use-app-settings"
import {
  saveAppSettings,
  savePaymentMethods,
  saveSocialProofSettings,
  saveMpesaConfig,
  saveLipanaConfig,
  savePaymentMethodsEnabled,
} from "@/app/actions/admin-settings"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

export default function AdminSettingsPage() {
  const { toast } = useToast()

  const {
    appSettings: liveSettings,
    paymentMethods: livePaymentMethods,
    socialProofSettings: liveSocialProofSettings,
    mpesaConfig: liveMpesaConfig, // Get M-Pesa config from hook
  } = useAppSettings()

  const [appSettings, setAppSettings] = useState(liveSettings)
  const [paymentMethods, setPaymentMethods] = useState(livePaymentMethods)
  const [socialProofSettings, setSocialProofSettings] = useState(liveSocialProofSettings)
  const [mpesaConfig, setMpesaConfig] = useState({
    consumerKey: "",
    consumerSecret: "",
    shortcode: "",
    passkey: "",
    environment: "sandbox" as "sandbox" | "production",
  })
  const [lipanaConfig, setLipanaConfig] = useState({
    publishableKey: "",
    secretKey: "",
    environment: "production" as "sandbox" | "production",
  })
  const [paymentMethodsEnabled, setPaymentMethodsEnabled] = useState({
    lipana: true,
    mpesa: true,
    bank: true,
  })

  const [loading, setLoading] = useState(false)
  const [newName, setNewName] = useState("")
  const [newCounty, setNewCounty] = useState("")
  const [newMessage, setNewMessage] = useState("")

  useEffect(() => {
    setAppSettings(liveSettings)
    if (liveSettings && liveSettings.lipanaConfig) {
      setLipanaConfig(liveSettings.lipanaConfig)
    }
    if (liveSettings && liveSettings.paymentMethodsEnabled) {
      setPaymentMethodsEnabled(liveSettings.paymentMethodsEnabled)
    }
  }, [liveSettings])

  useEffect(() => {
    setPaymentMethods(livePaymentMethods)
  }, [livePaymentMethods])

  useEffect(() => {
    setSocialProofSettings(liveSocialProofSettings)
  }, [liveSocialProofSettings])

  useEffect(() => {
    if (liveMpesaConfig && Object.keys(liveMpesaConfig).length > 0) {
      setMpesaConfig(liveMpesaConfig)
    }
  }, [liveMpesaConfig])

  const handleSaveAppSettings = async () => {
    setLoading(true)
    try {
      const result = await saveAppSettings(appSettings)

      if (!result.success) {
        toast({
          title: "Error",
          description: "Failed to save settings: " + (result.error || "Unknown error"),
          variant: "destructive",
        })
        console.log("[v0] Save error:", result.error)
        return
      }

      toast({
        title: "Settings Saved",
        description: "App settings have been updated successfully",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "An error occurred while saving settings",
        variant: "destructive",
      })
      console.log("[v0] Error:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleSavePaymentMethods = async () => {
    setLoading(true)
    try {
      const result = await savePaymentMethods(paymentMethods)

      if (!result.success) {
        toast({
          title: "Error",
          description: "Failed to save payment methods: " + (result.error || "Unknown error"),
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Payment Methods Saved",
        description: "Payment methods have been updated successfully",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "An error occurred while saving payment methods",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSocialProofSettings = async () => {
    setLoading(true)
    try {
      const result = await saveSocialProofSettings(socialProofSettings)

      if (!result.success) {
        toast({
          title: "Error",
          description: "Failed to save social proof settings: " + (result.error || "Unknown error"),
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Social Proof Settings Saved",
        description: "Social proof settings have been updated successfully",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "An error occurred while saving social proof settings",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const addFakeName = () => {
    if (newName.trim()) {
      setSocialProofSettings({
        ...socialProofSettings,
        fakeNames: [...socialProofSettings.fakeNames, newName.trim()],
      })
      setNewName("")
      toast({ title: "Name Added", description: "New name added to social proof list" })
    }
  }

  const removeFakeName = (index: number) => {
    setSocialProofSettings({
      ...socialProofSettings,
      fakeNames: socialProofSettings.fakeNames.filter((_, i) => i !== index),
    })
    toast({ title: "Name Removed", description: "Name removed from social proof list" })
  }

  const addCounty = () => {
    if (newCounty.trim()) {
      setSocialProofSettings({
        ...socialProofSettings,
        counties: [...socialProofSettings.counties, newCounty.trim()],
      })
      setNewCounty("")
      toast({ title: "County Added", description: "New county added to social proof list" })
    }
  }

  const removeCounty = (index: number) => {
    setSocialProofSettings({
      ...socialProofSettings,
      counties: socialProofSettings.counties.filter((_, i) => i !== index),
    })
    toast({ title: "County Removed", description: "County removed from social proof list" })
  }

  const addMessage = () => {
    if (newMessage.trim()) {
      setSocialProofSettings({
        ...socialProofSettings,
        earningMessages: [...socialProofSettings.earningMessages, newMessage.trim()],
      })
      setNewMessage("")
      toast({ title: "Message Added", description: "New message added to social proof list" })
    }
  }

  const removeMessage = (index: number) => {
    setSocialProofSettings({
      ...socialProofSettings,
      earningMessages: socialProofSettings.earningMessages.filter((_, i) => i !== index),
    })
    toast({ title: "Message Removed", description: "Message removed from social proof list" })
  }

  const handleSaveMpesaConfig = async () => {
    setLoading(true)
    try {
      const result = await saveMpesaConfig(mpesaConfig)

      if (!result.success) {
        toast({
          title: "Error",
          description: "Failed to save M-Pesa configuration: " + (result.error || "Unknown error"),
          variant: "destructive",
        })
        return
      }

      toast({
        title: "M-Pesa Configuration Saved",
        description: "M-Pesa STK Push settings have been updated successfully",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "An error occurred while saving M-Pesa configuration",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveLipanaConfig = async () => {
    setLoading(true)
    try {
      await saveLipanaConfig(lipanaConfig)
      toast({
        title: "Success",
        description: "Lipana configuration saved successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save Lipana configuration",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSavePaymentMethodsEnabled = async () => {
    setLoading(true)
    try {
      await savePaymentMethodsEnabled(paymentMethodsEnabled)
      toast({
        title: "Success",
        description: "Payment methods settings saved successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save payment methods settings",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">App Settings</h1>
          <p className="text-muted-foreground">Configure app-wide settings and payment methods</p>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="glass">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="payments">Payment Methods</TabsTrigger>
            <TabsTrigger value="social-proof">Social Proof</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card className="glass-card p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                General App Settings
              </h2>
              <div className="space-y-4">
                <div>
                  <Label>App Name</Label>
                  <Input
                    value={appSettings.appName}
                    onChange={(e) => setAppSettings({ ...appSettings, appName: e.target.value })}
                    placeholder="Earnify"
                  />
                </div>
                <div>
                  <Label>Currency Symbol</Label>
                  <Input
                    value={appSettings.currencySymbol}
                    onChange={(e) => setAppSettings({ ...appSettings, currencySymbol: e.target.value })}
                    placeholder="KSh"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Welcome Bonus (KSh)</Label>
                    <Input
                      type="number"
                      value={appSettings.welcomeBonus}
                      onChange={(e) => setAppSettings({ ...appSettings, welcomeBonus: Number(e.target.value) })}
                      min="0"
                    />
                  </div>
                  <div>
                    <Label>Daily Check-in Reward (KSh)</Label>
                    <Input
                      type="number"
                      value={appSettings.dailyCheckInReward}
                      onChange={(e) => setAppSettings({ ...appSettings, dailyCheckInReward: Number(e.target.value) })}
                      min="0"
                    />
                  </div>
                  <div>
                    <Label>Referral Bonus (KSh)</Label>
                    <Input
                      type="number"
                      value={appSettings.referralBonus}
                      onChange={(e) => setAppSettings({ ...appSettings, referralBonus: Number(e.target.value) })}
                      min="0"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="text-lg font-semibold mb-3">Transaction Limits</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Minimum Withdrawal (KSh)</Label>
                      <Input
                        type="number"
                        value={appSettings.minWithdrawal}
                        onChange={(e) => setAppSettings({ ...appSettings, minWithdrawal: Number(e.target.value) })}
                        min="0"
                      />
                    </div>
                    <div>
                      <Label>Maximum Withdrawal (KSh)</Label>
                      <Input
                        type="number"
                        value={appSettings.maxWithdrawal}
                        onChange={(e) => setAppSettings({ ...appSettings, maxWithdrawal: Number(e.target.value) })}
                        min="0"
                      />
                    </div>
                    <div>
                      <Label>Minimum Deposit (KSh)</Label>
                      <Input
                        type="number"
                        value={appSettings.minDeposit}
                        onChange={(e) => setAppSettings({ ...appSettings, minDeposit: Number(e.target.value) })}
                        min="0"
                      />
                    </div>
                    <div>
                      <Label>Maximum Deposit (KSh)</Label>
                      <Input
                        type="number"
                        value={appSettings.maxDeposit}
                        onChange={(e) => setAppSettings({ ...appSettings, maxDeposit: Number(e.target.value) })}
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                <Button onClick={handleSaveAppSettings} disabled={loading}>
                  <Gift className="w-4 h-4 mr-2" />
                  {loading ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Payment Methods Control
                </CardTitle>
                <CardDescription>Enable or disable payment methods for deposits</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 glass rounded-lg">
                    <div>
                      <h4 className="font-medium">Lipana STK Push</h4>
                      <p className="text-sm text-muted-foreground">Automatic M-Pesa payment via Lipana</p>
                    </div>
                    <Select
                      value={paymentMethodsEnabled.lipana ? "enabled" : "disabled"}
                      onValueChange={(value) =>
                        setPaymentMethodsEnabled({ ...paymentMethodsEnabled, lipana: value === "enabled" })
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="enabled">Enabled</SelectItem>
                        <SelectItem value="disabled">Disabled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between p-4 glass rounded-lg">
                    <div>
                      <h4 className="font-medium">Manual M-Pesa Paybill</h4>
                      <p className="text-sm text-muted-foreground">Manual payment via M-Pesa paybill</p>
                    </div>
                    <Select
                      value={paymentMethodsEnabled.mpesa ? "enabled" : "disabled"}
                      onValueChange={(value) =>
                        setPaymentMethodsEnabled({ ...paymentMethodsEnabled, mpesa: value === "enabled" })
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="enabled">Enabled</SelectItem>
                        <SelectItem value="disabled">Disabled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between p-4 glass rounded-lg">
                    <div>
                      <h4 className="font-medium">Bank Transfer</h4>
                      <p className="text-sm text-muted-foreground">Manual payment via bank transfer</p>
                    </div>
                    <Select
                      value={paymentMethodsEnabled.bank ? "enabled" : "disabled"}
                      onValueChange={(value) =>
                        setPaymentMethodsEnabled({ ...paymentMethodsEnabled, bank: value === "enabled" })
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="enabled">Enabled</SelectItem>
                        <SelectItem value="disabled">Disabled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button onClick={handleSavePaymentMethodsEnabled} disabled={loading} className="w-full">
                  <DollarSign className="w-4 h-4 mr-2" />
                  {loading ? "Saving..." : "Save Payment Methods Settings"}
                </Button>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Lipana Payment Gateway
                </CardTitle>
                <CardDescription>
                  Configure Lipana API credentials for automatic M-Pesa STK Push payments
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="lipana-publishable-key">Lipana Publishable Key</Label>
                  <Input
                    id="lipana-publishable-key"
                    type="text"
                    placeholder="lip_pk_live_... or lip_pk_test_..."
                    value={lipanaConfig.publishableKey}
                    onChange={(e) => setLipanaConfig({ ...lipanaConfig, publishableKey: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">Safe to expose in client-side code (optional)</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lipana-secret-key">Lipana Secret Key</Label>
                  <Input
                    id="lipana-secret-key"
                    type="password"
                    placeholder="lip_sk_live_... or lip_sk_test_..."
                    value={lipanaConfig.secretKey}
                    onChange={(e) => setLipanaConfig({ ...lipanaConfig, secretKey: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Your Lipana secret API key (keep this private and secure)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lipana-environment">Environment</Label>
                  <Select
                    value={lipanaConfig.environment}
                    onValueChange={(value: "sandbox" | "production") =>
                      setLipanaConfig({ ...lipanaConfig, environment: value })
                    }
                  >
                    <SelectTrigger id="lipana-environment">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sandbox">Sandbox (Testing - lip_sk_test_...)</SelectItem>
                      <SelectItem value="production">Production (Live - lip_sk_live_...)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="mt-4 p-4 bg-muted/50 rounded-lg border space-y-2">
                  <p className="text-sm font-medium mb-2">How to get Lipana API keys:</p>
                  <ol className="text-sm space-y-1 list-decimal list-inside">
                    <li>
                      Sign up at{" "}
                      <a
                        href="https://lipana.dev"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        lipana.dev
                      </a>
                    </li>
                    <li>Complete onboarding process</li>
                    <li>Navigate to API Keys in your dashboard</li>
                    <li>Create new API key pair</li>
                    <li>Copy your secret key (lip_sk_live_...) and paste it above</li>
                  </ol>
                  <p className="text-xs text-muted-foreground mt-2">
                    For testing, use sandbox keys (lip_sk_test_...). No real money is processed in sandbox mode.
                  </p>
                </div>
                <Button onClick={handleSaveLipanaConfig} disabled={loading} className="w-full">
                  <DollarSign className="w-4 h-4 mr-2" />
                  {loading ? "Saving..." : "Save Lipana Configuration"}
                </Button>
              </CardContent>
            </Card>

            <Card className="glass-card p-6">
              <h2 className="text-xl font-semibold mb-4">M-Pesa Details (Manual Fallback)</h2>
              <p className="text-sm text-muted-foreground mb-4">
                These details are shown to users for manual bank transfers if automatic payments are unavailable
              </p>
              <div className="space-y-4">
                <div>
                  <Label>Business Number (Till/Paybill)</Label>
                  <Input
                    value={paymentMethods.mpesa.businessNumber}
                    onChange={(e) =>
                      setPaymentMethods({
                        ...paymentMethods,
                        mpesa: { ...paymentMethods.mpesa, businessNumber: e.target.value },
                      })
                    }
                    placeholder="123456"
                  />
                </div>
                <div>
                  <Label>Account Name</Label>
                  <Input
                    value={paymentMethods.mpesa.accountName}
                    onChange={(e) =>
                      setPaymentMethods({
                        ...paymentMethods,
                        mpesa: { ...paymentMethods.mpesa, accountName: e.target.value },
                      })
                    }
                    placeholder="Earnify"
                  />
                </div>
              </div>
            </Card>

            <Card className="glass-card p-6">
              <h2 className="text-xl font-semibold mb-4">Bank Details</h2>
              <div className="space-y-4">
                <div>
                  <Label>Bank Name</Label>
                  <Input
                    value={paymentMethods.bank.bankName}
                    onChange={(e) =>
                      setPaymentMethods({
                        ...paymentMethods,
                        bank: { ...paymentMethods.bank, bankName: e.target.value },
                      })
                    }
                    placeholder="Equity Bank"
                  />
                </div>
                <div>
                  <Label>Account Number</Label>
                  <Input
                    value={paymentMethods.bank.accountNumber}
                    onChange={(e) =>
                      setPaymentMethods({
                        ...paymentMethods,
                        bank: { ...paymentMethods.bank, accountNumber: e.target.value },
                      })
                    }
                    placeholder="0123456789"
                  />
                </div>
                <div>
                  <Label>Account Name</Label>
                  <Input
                    value={paymentMethods.bank.accountName}
                    onChange={(e) =>
                      setPaymentMethods({
                        ...paymentMethods,
                        bank: { ...paymentMethods.bank, accountName: e.target.value },
                      })
                    }
                    placeholder="Earnify Ltd"
                  />
                </div>
              </div>
            </Card>

            <Button onClick={handleSavePaymentMethods} disabled={loading}>
              <DollarSign className="w-4 h-4 mr-2" />
              {loading ? "Saving..." : "Save Payment Methods"}
            </Button>
          </TabsContent>

          <TabsContent value="social-proof">
            <div className="space-y-4">
              <Card className="glass-card p-6">
                <h2 className="text-xl font-semibold mb-4">Fake Names for Social Proof</h2>
                <div className="flex gap-2 mb-4">
                  <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Enter a name" />
                  <Button onClick={addFakeName}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {socialProofSettings.fakeNames.map((name, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="glass px-3 py-2 rounded-full flex items-center gap-2"
                    >
                      <span>{name}</span>
                      <button
                        onClick={() => removeFakeName(index)}
                        className="text-destructive hover:text-destructive/80"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </Card>

              <Card className="glass-card p-6">
                <h2 className="text-xl font-semibold mb-4">Counties for Social Proof</h2>
                <div className="flex gap-2 mb-4">
                  <Input
                    value={newCounty}
                    onChange={(e) => setNewCounty(e.target.value)}
                    placeholder="Enter a county"
                  />
                  <Button onClick={addCounty}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {socialProofSettings.counties.map((county, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="glass px-3 py-2 rounded-full flex items-center gap-2"
                    >
                      <span>{county}</span>
                      <button
                        onClick={() => removeCounty(index)}
                        className="text-destructive hover:text-destructive/80"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </Card>

              <Card className="glass-card p-6">
                <h2 className="text-xl font-semibold mb-4">Earning Messages</h2>
                <div className="flex gap-2 mb-4">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Enter a message template"
                  />
                  <Button onClick={addMessage}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {socialProofSettings.earningMessages.map((message, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="glass p-3 rounded-lg flex items-center justify-between"
                    >
                      <span className="text-sm">{message}</span>
                      <button
                        onClick={() => removeMessage(index)}
                        className="text-destructive hover:text-destructive/80"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </Card>

              <Button onClick={handleSaveSocialProofSettings} disabled={loading} className="w-full">
                <MessageSquare className="w-4 h-4 mr-2" />
                {loading ? "Saving..." : "Save Social Proof Settings"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}
