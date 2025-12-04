"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { playSound, initAudio } from "@/lib/sounds"
import { Play, Pause, Sparkles } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import confetti from "canvas-confetti"
import Image from "next/image"
import { createBrowserClient } from "@/lib/supabase/client"
import { getMusicTasks, canDoTask, completeTask, getUserProfile } from "@/lib/supabase/queries"

export default function MusicTasksPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [user, setUser] = useState<any>(null)
  const [tasks, setTasks] = useState<any[]>([])
  const [currentTask, setCurrentTask] = useState<any>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [showSuccess, setShowSuccess] = useState(false)
  const [loading, setLoading] = useState(true)
  const [canDoToday, setCanDoToday] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  async function loadData() {
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

      const canDo = await canDoTask(authUser.id, "music")
      setCanDoToday(canDo)

      if (canDo) {
        const musicTasks = await getMusicTasks()
        setTasks(musicTasks)
      } else {
        setTasks([])
      }

      initAudio()
    } catch (error) {
      console.error("Error loading data:", error)
      router.push("/auth/login")
    } finally {
      setLoading(false)
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

  const startTask = (task: any) => {
    setCurrentTask(task)
    setTasks(tasks.filter((t) => t.id !== task.id))
    setProgress(0)
    setTimeRemaining(task.duration)
    setIsPlaying(true)

    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + 100 / task.duration
        if (newProgress >= 100) {
          clearInterval(interval)
          handleTaskComplete(task)
          return 100
        }
        return newProgress
      })
      setTimeRemaining((prev) => Math.max(0, prev - 1))
    }, 1000)
    intervalRef.current = interval

    try {
      const encodedUrl = task.audio_url.includes("%") ? task.audio_url : encodeURI(task.audio_url)
      audioRef.current = new Audio(encodedUrl)
      audioRef.current.crossOrigin = "anonymous"

      // Silently handle audio errors - task still works without audio
      audioRef.current.addEventListener("error", () => {
        console.log("[v0] Audio file not available, continuing with silent playback")
      })

      audioRef.current.play().catch(() => {
        console.log("[v0] Could not play audio, continuing silently")
      })
    } catch (error) {
      console.log("[v0] Audio initialization failed, task will work silently")
    }
  }

  const togglePlayPause = () => {
    if (!currentTask) return

    setIsPlaying(!isPlaying)

    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause()
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    } else {
      if (audioRef.current) {
        audioRef.current.play().catch(() => {})
      }
      const interval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + 100 / currentTask.duration
          if (newProgress >= 100) {
            clearInterval(interval)
            handleTaskComplete(currentTask)
            return 100
          }
          return newProgress
        })
        setTimeRemaining((prev) => Math.max(0, prev - 1))
      }, 1000)
      intervalRef.current = interval
    }
  }

  async function handleTaskComplete(task: any) {
    setIsPlaying(false)
    setShowSuccess(true)

    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }

    try {
      const supabase = createBrowserClient()
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (!authUser) return

      await Promise.all([
        completeTask(authUser.id, task.reward, "music", task.id),
        supabase.from("transactions").insert({
          user_id: authUser.id,
          type: "earning",
          amount: task.reward,
          status: "completed",
          description: `Completed music task: ${task.title}`,
          created_at: new Date().toISOString(),
        }),
      ])

      playSound("success")

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      })

      toast({
        title: "Congratulations!",
        description: `You earned KSh ${task.reward}`,
      })

      setCanDoToday(false)
      setTasks([])

      const profile = await getUserProfile(authUser.id)
      setUser(profile)
    } catch (error) {
      console.error("Error completing task:", error)
      toast({
        title: "Error",
        description: "Failed to complete task",
        variant: "destructive",
      })
      setTasks((prev) => [...prev, task])
      setIsPlaying(false)
      setShowSuccess(false)
      setCurrentTask(null)
      return
    }

    setTimeout(() => {
      setShowSuccess(false)
      setCurrentTask(null)
    }, 3000)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Music Tasks</h1>
          <p className="text-muted-foreground">Listen to music and earn money (once per day)</p>
        </div>

        {!canDoToday && !currentTask && (
          <Card className="glass-card p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Come Back Tomorrow!</h2>
            <p className="text-muted-foreground mb-4">You've completed your music task for today.</p>
            <p className="text-sm text-muted-foreground">
              Music tasks refresh daily. Check back tomorrow for more earning opportunities!
            </p>
          </Card>
        )}

        {currentTask ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
            <Card className="glass-card p-8">
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="relative w-48 h-48 rounded-2xl overflow-hidden">
                  <Image src="/abstract-music-album.png" alt={currentTask.title} fill className="object-cover" />
                </div>

                <div>
                  <h2 className="text-2xl font-bold mb-2">{currentTask.title}</h2>
                  <p className="text-muted-foreground">{currentTask.artist || "Unknown Artist"}</p>
                </div>

                <div className="w-full space-y-4">
                  <Progress value={progress} className="h-2" />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{formatTime(currentTask.duration - timeRemaining)}</span>
                    <span>{formatTime(timeRemaining)}</span>
                  </div>
                </div>

                <Button
                  size="lg"
                  onClick={togglePlayPause}
                  className="w-20 h-20 rounded-full bg-primary hover:bg-primary/90"
                >
                  {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
                </Button>

                <div className="glass p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Reward</p>
                  <p className="text-2xl font-bold text-success">+KSh {currentTask.reward}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ) : canDoToday ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tasks.map((task) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
              >
                <Card className="glass-card p-6 cursor-pointer" onClick={() => startTask(task)}>
                  <div className="flex gap-4">
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                      <Image src="/diverse-group-making-music.png" alt={task.title} fill className="object-cover" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{task.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{task.artist || "Unknown"}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{formatTime(task.duration)}</span>
                        <span className="text-sm font-semibold text-success">+KSh {task.reward}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : null}

        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                className="glass-card p-8 rounded-2xl max-w-md text-center"
              >
                <motion.div
                  animate={{
                    rotate: [0, 10, -10, 10, 0],
                    scale: [1, 1.1, 1.1, 1.1, 1],
                  }}
                  transition={{ duration: 0.5 }}
                  className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4"
                >
                  <Sparkles className="w-10 h-10 text-success" />
                </motion.div>
                <h2 className="text-3xl font-bold mb-2">Congratulations!</h2>
                <p className="text-muted-foreground mb-4">You completed the task</p>
                <p className="text-4xl font-bold text-success">+KSh {currentTask?.reward}</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  )
}
