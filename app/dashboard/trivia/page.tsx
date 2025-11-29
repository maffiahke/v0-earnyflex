"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { playSound, initAudio } from "@/lib/sounds"
import { Brain, CheckCircle, XCircle, Lock } from "lucide-react"
import { motion } from "framer-motion"
import confetti from "canvas-confetti"
import { createBrowserClient } from "@/lib/supabase/client"
import { getUserProfile, getTriviaQuestions, canDoTask, completeTask } from "@/lib/supabase/queries"

export default function TriviaPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [user, setUser] = useState<any>(null)
  const [questions, setQuestions] = useState<any[]>([])
  const [currentQuestion, setCurrentQuestion] = useState<any>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [loading, setLoading] = useState(true)
  const [canDoToday, setCanDoToday] = useState(false)

  useEffect(() => {
    loadData()
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

      const triviaQuestions = await getTriviaQuestions()
      setQuestions(triviaQuestions)

      const canDo = await canDoTask(authUser.id, "trivia")
      setCanDoToday(canDo)

      initAudio()
    } catch (error) {
      console.error("Error loading data:", error)
      router.push("/auth/login")
    } finally {
      setLoading(false)
    }
  }

  const startQuestion = (question: any) => {
    setQuestions(questions.filter((q) => q.id !== question.id))
    setCurrentQuestion(question)
    setSelectedAnswer(null)
    setShowResult(false)
    setIsCorrect(false)
  }

  async function handleAnswerSubmit() {
    if (selectedAnswer === null || !user) return

    const correct = selectedAnswer === currentQuestion.correct_answer
    setIsCorrect(correct)
    setShowResult(true)

    if (correct) {
      playSound("success")
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      })

      try {
        const supabase = createBrowserClient()
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser()

        if (!authUser) return

        await Promise.all([
          completeTask(authUser.id, Number(currentQuestion.reward), "trivia"),
          supabase.from("transactions").insert({
            user_id: authUser.id,
            type: "earning",
            amount: currentQuestion.reward,
            status: "completed",
            description: `Answered trivia: ${currentQuestion.question}`,
            created_at: new Date().toISOString(),
          }),
        ])

        toast({
          title: "Correct!",
          description: `You earned KSh ${currentQuestion.reward}`,
        })

        setCanDoToday(false)

        const profile = await getUserProfile(authUser.id)
        setUser(profile)
      } catch (error) {
        console.error("Error:", error)
        toast({
          title: "Error",
          description: "Failed to record your earnings. Please contact support.",
          variant: "destructive",
        })
        setQuestions((prev) => [...prev, currentQuestion])
      }
    } else {
      playSound("error")
      toast({
        title: "Incorrect",
        description: "Try another question",
        variant: "destructive",
      })
    }

    setTimeout(() => {
      setCurrentQuestion(null)
      setShowResult(false)
    }, 3000)
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Trivia Questions</h1>
            <p className="text-muted-foreground">Answer correctly to earn money (once per day)</p>
          </div>
        </div>

        {!canDoToday && !currentQuestion && (
          <Card className="glass-card p-6 border-accent/50">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-accent" />
              <div>
                <p className="font-semibold">Daily Limit Reached</p>
                <p className="text-sm text-muted-foreground">Come back tomorrow to earn more</p>
              </div>
            </div>
          </Card>
        )}

        {currentQuestion ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="glass-card p-8">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
                    <Brain className="w-6 h-6 text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Question</p>
                  </div>
                </div>

                <div>
                  <h2 className="text-2xl font-bold mb-6">{currentQuestion.question}</h2>

                  <div className="space-y-3">
                    {currentQuestion.options.map((option: string, index: number) => (
                      <motion.button
                        key={index}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => !showResult && setSelectedAnswer(index)}
                        disabled={showResult}
                        className={`w-full glass p-4 rounded-lg text-left transition-all ${
                          selectedAnswer === index
                            ? showResult
                              ? isCorrect
                                ? "bg-success/20 border-success"
                                : "bg-destructive/20 border-destructive"
                              : "bg-primary/20 border-primary"
                            : showResult && index === currentQuestion.correct_answer
                              ? "bg-success/20 border-success"
                              : "hover:bg-primary/10"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{option}</span>
                          {showResult && index === currentQuestion.correct_answer && (
                            <CheckCircle className="w-5 h-5 text-success" />
                          )}
                          {showResult && selectedAnswer === index && !isCorrect && (
                            <XCircle className="w-5 h-5 text-destructive" />
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {!showResult ? (
                  <Button
                    onClick={handleAnswerSubmit}
                    disabled={selectedAnswer === null}
                    className="w-full bg-primary hover:bg-primary/90"
                    size="lg"
                  >
                    Submit Answer
                  </Button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass p-4 rounded-lg text-center"
                  >
                    {isCorrect ? (
                      <>
                        <p className="text-success font-semibold mb-2">Correct Answer!</p>
                        <p className="text-2xl font-bold text-success">+KSh {currentQuestion.reward}</p>
                      </>
                    ) : (
                      <p className="text-destructive font-semibold">
                        Incorrect. The correct answer was: {currentQuestion.options[currentQuestion.correct_answer]}
                      </p>
                    )}
                  </motion.div>
                )}
              </div>
            </Card>
          </motion.div>
        ) : questions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {questions.map((question) => (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
              >
                <Card className="glass-card p-6 cursor-pointer" onClick={() => startQuestion(question)}>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                      <Brain className="w-6 h-6 text-success" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-success">+KSh {question.reward}</span>
                      </div>
                      <p className="font-medium line-clamp-2">{question.question}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="glass-card p-12 text-center">
            <Brain className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Questions Available</h3>
            <p className="text-muted-foreground">Check back later for more trivia questions</p>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
