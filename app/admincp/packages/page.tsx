"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { AdminLayout } from "@/components/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Plus, Edit, Trash2, Package } from "lucide-react"
import { motion } from "framer-motion"
import { createPackage, updatePackage, deletePackages } from "@/app/actions/admin-packages"

export default function AdminPackagesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const authCheckRef = useRef(false)
  const supabaseRef = useRef<any>(null)

  const [currentUser, setCurrentUser] = useState<any>(null)
  const [packages, setPackages] = useState<any[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    benefits: "",
    description: "",
    duration_days: "30",
  })

  useEffect(() => {
    if (authCheckRef.current) return
    authCheckRef.current = true

    const checkAuth = async () => {
      try {
        supabaseRef.current = createBrowserClient()
        const {
          data: { user },
        } = await supabaseRef.current.auth.getUser()

        if (!user) {
          router.push("/admincp/login")
          return
        }

        setCurrentUser(user)
        setupRealtimeSubscription()
      } catch (err) {
        console.error("[v0] Auth check failed:", err)
        router.push("/admincp/login")
      }
    }

    checkAuth()
  }, [router])

  const setupRealtimeSubscription = async () => {
    try {
      // Initial load
      const { data, error } = await supabaseRef.current
        .from("activation_packages")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch packages",
        })
        setLoading(false)
        return
      }

      setPackages(data || [])
      setLoading(false)

      // Subscribe to real-time changes
      const subscription = supabaseRef.current
        .channel("packages-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "activation_packages",
          },
          (payload: any) => {
            if (payload.eventType === "INSERT") {
              setPackages((prev) => [payload.new, ...prev])
            } else if (payload.eventType === "UPDATE") {
              setPackages((prev) => prev.map((pkg) => (pkg.id === payload.new.id ? payload.new : pkg)))
            } else if (payload.eventType === "DELETE") {
              setPackages((prev) => prev.filter((pkg) => pkg.id !== payload.old.id))
            }
          },
        )
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    } catch (error) {
      console.error("[v0] Subscription error:", error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      price: "",
      benefits: "",
      description: "",
      duration_days: "30",
    })
    setIsCreating(false)
    setEditingId(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.price || !formData.benefits) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields",
      })
      return
    }

    const benefitsArray = formData.benefits.split("\n").filter((f) => f.trim())

    const payload = {
      name: formData.name,
      price: Number(formData.price),
      benefits: benefitsArray,
      description: formData.description,
      duration_days: Number(formData.duration_days),
    }

    try {
      let result
      if (editingId) {
        console.log("[v0] Updating package:", editingId)
        result = await updatePackage(editingId, payload)
      } else {
        console.log("[v0] Creating new package")
        result = await createPackage(payload)
      }

      if (!result.success) {
        console.error("[v0] Operation error:", result.error)
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error,
        })
        return
      }

      console.log("[v0] Package saved successfully")
      toast({
        title: editingId ? "Package Updated" : "Package Created",
        description: editingId
          ? "Activation package has been updated successfully"
          : "New activation package has been created",
      })

      resetForm()
    } catch (error: any) {
      console.error("[v0] Submit error:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to save package",
      })
    }
  }

  const startEdit = (pkg: any) => {
    setEditingId(pkg.id)
    setFormData({
      name: pkg.name,
      price: pkg.price.toString(),
      benefits: (pkg.benefits || []).join("\n"),
      description: pkg.description || "",
      duration_days: (pkg.duration_days || 30).toString(),
    })
    setIsCreating(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this package?")) {
      try {
        console.log("[v0] Deleting package:", id)
        const result = await deletePackages([id])

        if (!result.success) {
          console.error("[v0] Delete error:", result.error)
          toast({
            variant: "destructive",
            title: "Error",
            description: result.error,
          })
          return
        }

        console.log("[v0] Package deleted successfully")
        toast({
          title: "Package Deleted",
          description: "Activation package has been removed",
        })
      } catch (error: any) {
        console.error("[v0] Delete catch error:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to delete package",
        })
      }
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select packages to delete",
      })
      return
    }

    if (confirm(`Are you sure you want to delete ${selectedIds.length} package(s)?`)) {
      try {
        console.log("[v0] Bulk deleting packages:", selectedIds)
        const result = await deletePackages(selectedIds)

        if (!result.success) {
          console.error("[v0] Bulk delete error:", result.error)
          toast({
            variant: "destructive",
            title: "Error",
            description: result.error,
          })
          return
        }

        console.log("[v0] Packages deleted successfully")
        toast({
          title: "Packages Deleted",
          description: `${selectedIds.length} package(s) have been removed`,
        })
        setSelectedIds([])
      } catch (error: any) {
        console.error("[v0] Bulk delete catch error:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to delete packages",
        })
      }
    }
  }

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  if (!currentUser || loading) return null

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Activation Packages</h1>
            <p className="text-muted-foreground">Manage activation packages and pricing</p>
          </div>
          <Button onClick={() => setIsCreating(true)} className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Add Package
          </Button>
        </div>

        {selectedIds.length > 0 && (
          <Card className="glass-card p-4 bg-destructive/10 border-destructive/50">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{selectedIds.length} package(s) selected</span>
              <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                Delete Selected
              </Button>
            </div>
          </Card>
        )}

        {isCreating && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="glass-card p-6">
              <h2 className="text-xl font-semibold mb-4">{editingId ? "Edit Package" : "Create New Package"}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Package Name*</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Starter"
                      className="bg-background/50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="price">Price (KSh)*</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="500"
                      className="bg-background/50"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="duration_days">Duration (Days)*</Label>
                    <Input
                      id="duration_days"
                      type="number"
                      value={formData.duration_days}
                      onChange={(e) => setFormData({ ...formData, duration_days: e.target.value })}
                      placeholder="30"
                      className="bg-background/50"
                      min="1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      How many days the package remains active after purchase
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Package description"
                      className="bg-background/50"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="benefits">Benefits (one per line)*</Label>
                  <textarea
                    id="benefits"
                    value={formData.benefits}
                    onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                    placeholder="Unlock withdrawals&#10;Earn from referrals&#10;Priority support"
                    className="w-full min-h-[100px] rounded-md border border-input bg-background/50 px-3 py-2 text-sm"
                    rows={4}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="bg-success hover:bg-success/90">
                    {editingId ? "Update Package" : "Create Package"}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {packages.map((pkg, index) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="glass-card p-6 h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(pkg.id)}
                      onChange={() => toggleSelection(pkg.id)}
                      className="w-4 h-4"
                    />
                    <Package className="w-5 h-5 text-primary" />
                    <h3 className="text-xl font-bold">{pkg.name}</h3>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => startEdit(pkg)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(pkg.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <div className="mb-4">
                  <p className="text-3xl font-bold text-primary">KSh {pkg.price.toLocaleString()}</p>
                  {pkg.description && <p className="text-sm text-muted-foreground">{pkg.description}</p>}
                  <p className="text-sm text-muted-foreground mt-1">Valid for {pkg.duration_days || 30} days</p>
                </div>
                <div className="space-y-2">
                  {(pkg.benefits || []).map((benefit: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-success mt-0.5">✓</span>
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </AdminLayout>
  )
}
