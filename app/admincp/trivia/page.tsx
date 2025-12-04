"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Brain, Plus, Pencil, Trash2, CheckCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { createBrowserClient } from "@/lib/supabase/client"
import {
  createTriviaQuestion,
  updateTriviaQuestion,
  deleteTriviaQuestion,
  deleteTriviaQuestions,
} from "@/app/actions/admin-trivia"

export default function AdminTriviaPage() {
  const router = useRouter()
  const { toast } = useToast()
  const authCheckRef = useRef(false)
  const supabaseRef = useRef<any>(null)

  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [triviaQuestions, setTriviaQuestions] = useState<any[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    question: "",
    options: ["", "", "", ""],
    correctAnswer: 0,
    reward: 30,
    packageId: "", // Add package assignment field
  })

  const [packages, setPackages] = useState<any[]>([])

  useEffect(() => {
    if (authCheckRef.current) return
    authCheckRef.current = true
    checkAuth()
  }, [])

  useEffect(() => {
    if (isAdmin) {
      loadPackages()
    }
  }, [isAdmin])

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
        .from("trivia_questions")
        .select("*")
        .order("created_at", { ascending: false })

      if (!error && data) {
        setTriviaQuestions(data)
        setLoading(false)
      }

      // Subscribe to real-time changes
      const subscription = supabaseRef.current
        .channel("trivia-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "trivia_questions",
          },
          (payload: any) => {
            if (payload.eventType === "INSERT") {
              setTriviaQuestions((prev) => [payload.new, ...prev])
            } else if (payload.eventType === "UPDATE") {
              setTriviaQuestions((prev) =>
                prev.map((question) => (question.id === payload.new.id ? payload.new : question)),
              )
            } else if (payload.eventType === "DELETE") {
              setTriviaQuestions((prev) => prev.filter((question) => question.id !== payload.old.id))
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

  const loadPackages = async () => {
    try {
      const { data, error } = await supabaseRef.current
        .from("activation_packages")
        .select("id, name")
        .eq("is_active", true)
        .order("price", { ascending: true })

      if (!error && data) {
        setPackages(data)
      }
    } catch (error) {
      console.error("[v0] Error loading packages:", error)
    }
  }

  if (loading || !isAdmin) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.options.some((opt) => opt.trim() === "")) {
      toast({
        title: "Error",
        description: "All options must be filled",
        variant: "destructive",
      })
      return
    }

    const result = editingQuestion
      ? await updateTriviaQuestion(editingQuestion, {
          question: formData.question,
          options: formData.options,
          correctAnswer: formData.correctAnswer,
          reward: formData.reward,
          packageId: formData.packageId || null, // Include package assignment
        })
      : await createTriviaQuestion({
          question: formData.question,
          options: formData.options,
          correctAnswer: formData.correctAnswer,
          reward: formData.reward,
          packageId: formData.packageId || null, // Include package assignment
        })

    if (result.error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error,
      })
      return
    }

    toast({
      title: editingQuestion ? "Trivia Question Updated" : "Trivia Question Added",
      description: editingQuestion
        ? "Question has been updated successfully"
        : "New question has been added successfully",
    })

    setShowForm(false)
    setEditingQuestion(null)
    setFormData({
      question: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
      reward: 30,
      packageId: "", // Reset package assignment
    })
  }

  const handleEdit = (question: any) => {
    setEditingQuestion(question.id)
    setFormData({
      question: question.question,
      options: question.options,
      correctAnswer: question.correct_answer || question.correctAnswer,
      reward: question.reward,
      packageId: question.package_id || "", // Include package in edit
    })
    setShowForm(true)
  }

  const handleDelete = async (questionId: string) => {
    if (confirm("Are you sure you want to delete this trivia question?")) {
      const result = await deleteTriviaQuestion(questionId)

      if (result.error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error,
        })
        return
      }

      toast({
        title: "Trivia Question Deleted",
        description: "Question has been removed",
      })
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select questions to delete",
      })
      return
    }

    if (confirm(`Are you sure you want to delete ${selectedIds.length} question(s)?`)) {
      const result = await deleteTriviaQuestions(selectedIds)

      if (result.error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error,
        })
        return
      }

      toast({
        title: "Questions Deleted",
        description: `${selectedIds.length} question(s) have been removed`,
      })
      setSelectedIds([])
    }
  }

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  const updateOption = (index: number, value: string) => {
    const newOptions = [...formData.options]
    newOptions[index] = value
    setFormData({ ...formData, options: newOptions })
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Trivia Questions Management</h1>
            <p className="text-muted-foreground">Manage trivia questions and rewards</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Question
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
                <h2 className="text-xl font-semibold mb-4">
                  {editingQuestion ? "Edit Trivia Question" : "Add New Trivia Question"}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label>Question</Label>
                    <Input
                      value={formData.question}
                      onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                      placeholder="Enter the trivia question"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Answer Options</Label>
                    {formData.options.map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                          placeholder={`Option ${index + 1}`}
                          required
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant={formData.correctAnswer === index ? "default" : "outline"}
                          onClick={() => setFormData({ ...formData, correctAnswer: index })}
                        >
                          {formData.correctAnswer === index && <CheckCircle className="w-4 h-4 mr-2" />}
                          Correct
                        </Button>
                      </div>
                    ))}
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

                  <div>
                    <Label>Assigned Package (Optional)</Label>
                    <select
                      value={formData.packageId}
                      onChange={(e) => setFormData({ ...formData, packageId: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">All Users (No Package Required)</option>
                      {packages.map((pkg) => (
                        <option key={pkg.id} value={pkg.id}>
                          {pkg.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground mt-1">
                      If selected, only users with this package can see this question
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit">{editingQuestion ? "Update Question" : "Add Question"}</Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowForm(false)
                        setEditingQuestion(null)
                        setFormData({
                          question: "",
                          options: ["", "", "", ""],
                          correctAnswer: 0,
                          reward: 30,
                          packageId: "", // Reset package assignment
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
              <span className="text-sm font-medium">{selectedIds.length} question(s) selected</span>
              <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                Delete Selected
              </Button>
            </div>
          </Card>
        )}

        <Card className="glass-card p-6">
          <h2 className="text-xl font-semibold mb-4">All Trivia Questions ({triviaQuestions.length})</h2>
          <div className="space-y-3">
            {triviaQuestions.map((question, index) => (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass p-4 rounded-lg"
              >
                <div className="flex flex-col md:flex-row gap-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(question.id)}
                    onChange={() => toggleSelection(question.id)}
                    className="w-4 h-4 rounded mt-2"
                  />
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                        <Brain className="w-6 h-6 text-accent" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm text-success font-medium">KSh {question.reward}</span>
                        </div>
                        <h3 className="font-semibold mb-2">{question.question}</h3>
                        <div className="space-y-1">
                          {question.options.map((option: string, idx: number) => (
                            <div
                              key={idx}
                              className={`text-sm flex items-center gap-2 ${
                                idx === (question.correct_answer || question.correctAnswer)
                                  ? "text-success font-medium"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {idx === (question.correct_answer || question.correctAnswer) && (
                                <CheckCircle className="w-3 h-3" />
                              )}
                              <span>
                                {idx + 1}. {option}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(question)}>
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(question.id)}
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
