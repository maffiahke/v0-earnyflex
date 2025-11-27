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
import { Music, Plus, Pencil, Trash2, Clock } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export default function AdminMusicPage() {
  const router = useRouter()
  const { toast } = useToast()
  const authCheckRef = useRef(false)
  const supabaseRef = useRef<any>(null)

  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [musicTasks, setMusicTasks] = useState<any[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    artist: "",
    audioUrl: "",
    duration: 180,
    reward: 50,
    imageUrl: "",
  })

  useEffect(() => {
    if (authCheckRef.current) return
    authCheckRef.current = true
    checkAuth()
  }, [])

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

      setIsAdmin(true)
      setupRealtimeSubscription()
    } catch (err) {
      console.error("[v0] Auth check failed:", err)
      router.push("/admincp/login")
    }
  }

  const setupRealtimeSubscription = async () => {
    try {
      // Initial load
      const { data, error } = await supabaseRef.current
        .from("music_tasks")
        .select("*")
        .order("created_at", { ascending: false })

      if (!error && data) {
        setMusicTasks(data)
        setLoading(false)
      }

      // Subscribe to real-time changes
      const subscription = supabaseRef.current
        .channel("music-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "music_tasks",
          },
          (payload: any) => {
            if (payload.eventType === "INSERT") {
              setMusicTasks((prev) => [payload.new, ...prev])
            } else if (payload.eventType === "UPDATE") {
              setMusicTasks((prev) => prev.map((task) => (task.id === payload.new.id ? payload.new : task)))
            } else if (payload.eventType === "DELETE") {
              setMusicTasks((prev) => prev.filter((task) => task.id !== payload.old.id))
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

  if (loading || !isAdmin) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const payload = {
      title: formData.title,
      artist: formData.artist,
      audio_url: formData.audioUrl,
      duration: formData.duration,
      reward: formData.reward,
      is_active: true,
    }

    try {
      if (editingTask) {
        console.log("[v0] Updating music task:", editingTask)
        const { error } = await supabaseRef.current.from("music_tasks").update(payload).eq("id", editingTask)

        if (error) {
          console.error("[v0] Update error:", error)
          toast({
            variant: "destructive",
            title: "Error",
            description: error.message,
          })
          return
        }

        toast({
          title: "Music Task Updated",
          description: "Task has been updated successfully",
        })
      } else {
        console.log("[v0] Creating music task")
        const { error } = await supabaseRef.current.from("music_tasks").insert([payload])

        if (error) {
          console.error("[v0] Insert error:", error)
          toast({
            variant: "destructive",
            title: "Error",
            description: error.message,
          })
          return
        }

        toast({
          title: "Music Task Added",
          description: "New task has been added successfully",
        })
      }

      setShowForm(false)
      setEditingTask(null)
      setFormData({
        title: "",
        artist: "",
        audioUrl: "",
        duration: 180,
        reward: 50,
        imageUrl: "",
      })
    } catch (error: any) {
      console.error("[v0] Submit error:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to save task",
      })
    }
  }

  const handleEdit = (task: any) => {
    setEditingTask(task.id)
    setFormData({
      title: task.title,
      artist: task.artist,
      audioUrl: task.audio_url || task.audioUrl,
      duration: task.duration,
      reward: task.reward,
      imageUrl: task.image_url || task.imageUrl || "",
    })
    setShowForm(true)
  }

  const handleDelete = async (taskId: string) => {
    if (confirm("Are you sure you want to delete this music task?")) {
      try {
        console.log("[v0] Deleting music task:", taskId)
        const { error } = await supabaseRef.current.from("music_tasks").delete().eq("id", taskId)

        if (error) {
          console.error("[v0] Delete error:", error)
          toast({
            variant: "destructive",
            title: "Error",
            description: error.message,
          })
          return
        }

        toast({
          title: "Music Task Deleted",
          description: "Task has been removed",
        })
      } catch (error: any) {
        console.error("[v0] Delete catch error:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to delete task",
        })
      }
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select tasks to delete",
      })
      return
    }

    if (confirm(`Are you sure you want to delete ${selectedIds.length} task(s)?`)) {
      try {
        console.log("[v0] Bulk deleting music tasks:", selectedIds)
        const { error } = await supabaseRef.current.from("music_tasks").delete().in("id", selectedIds)

        if (error) {
          console.error("[v0] Bulk delete error:", error)
          toast({
            variant: "destructive",
            title: "Error",
            description: error.message,
          })
          return
        }

        toast({
          title: "Tasks Deleted",
          description: `${selectedIds.length} task(s) have been removed`,
        })
        setSelectedIds([])
      } catch (error: any) {
        console.error("[v0] Bulk delete catch error:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to delete tasks",
        })
      }
    }
  }

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Music Tasks Management</h1>
            <p className="text-muted-foreground">Manage music listening tasks and rewards</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Music Task
          </Button>
        </div>

        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Card className="glass-card p-6">
                <h2 className="text-xl font-semibold mb-4">{editingTask ? "Edit Music Task" : "Add New Music Task"}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Song Title</Label>
                      <Input
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Enter song title"
                        required
                      />
                    </div>
                    <div>
                      <Label>Artist Name</Label>
                      <Input
                        value={formData.artist}
                        onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                        placeholder="Enter artist name"
                        required
                      />
                    </div>
                    <div>
                      <Label>Audio URL</Label>
                      <Input
                        value={formData.audioUrl}
                        onChange={(e) => setFormData({ ...formData, audioUrl: e.target.value })}
                        placeholder="/audio/song.mp3"
                        required
                      />
                    </div>
                    <div>
                      <Label>Image URL (Optional)</Label>
                      <Input
                        value={formData.imageUrl}
                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                        placeholder="/images/cover.jpg"
                      />
                    </div>
                    <div>
                      <Label>Duration (seconds)</Label>
                      <Input
                        type="number"
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                        min="30"
                        required
                      />
                    </div>
                    <div>
                      <Label>Reward (KSh)</Label>
                      <Input
                        type="number"
                        value={formData.reward}
                        onChange={(e) => setFormData({ ...formData, reward: Number(e.target.value) })}
                        min="1"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit">{editingTask ? "Update Task" : "Add Task"}</Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowForm(false)
                        setEditingTask(null)
                        setFormData({
                          title: "",
                          artist: "",
                          audioUrl: "",
                          duration: 180,
                          reward: 50,
                          imageUrl: "",
                        })
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {selectedIds.length > 0 && (
          <Card className="glass-card p-4 bg-destructive/10 border-destructive/50">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{selectedIds.length} task(s) selected</span>
              <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                Delete Selected
              </Button>
            </div>
          </Card>
        )}

        <Card className="glass-card p-6">
          <h2 className="text-xl font-semibold mb-4">All Music Tasks ({musicTasks.length})</h2>
          <div className="space-y-3">
            {musicTasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass p-4 rounded-lg"
              >
                <div className="flex flex-col md:flex-row gap-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(task.id)}
                    onChange={() => toggleSelection(task.id)}
                    className="w-4 h-4 rounded mt-2"
                  />
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <Music className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{task.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">by {task.artist}</p>
                        <div className="flex flex-wrap gap-3 text-sm">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            <span>
                              {Math.floor(task.duration / 60)}:{(task.duration % 60).toString().padStart(2, "0")}
                            </span>
                          </div>
                          <div className="text-success font-medium">Reward: KSh {task.reward}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(task)}>
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(task.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
