"use server"

import { createClient } from "@/lib/supabase/server"

export async function createTriviaQuestion(data: {
  question: string
  options: string[]
  correctAnswer: number
  reward: number
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Unauthorized" }
  }

  const { data: result, error } = await supabase
    .from("trivia_questions")
    .insert([
      {
        question: data.question,
        options: data.options,
        correct_answer: data.correctAnswer,
        reward: data.reward,
        is_active: true,
      },
    ])
    .select()
    .single()

  if (error) {
    console.error("[v0] Error creating trivia question:", error)
    return { error: error.message }
  }

  return { data: result }
}

export async function updateTriviaQuestion(
  id: string,
  data: {
    question: string
    options: string[]
    correctAnswer: number
    reward: number
  },
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Unauthorized" }
  }

  const { data: result, error } = await supabase
    .from("trivia_questions")
    .update({
      question: data.question,
      options: data.options,
      correct_answer: data.correctAnswer,
      reward: data.reward,
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("[v0] Error updating trivia question:", error)
    return { error: error.message }
  }

  return { data: result }
}

export async function deleteTriviaQuestion(id: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Unauthorized" }
  }

  const { error } = await supabase.from("trivia_questions").delete().eq("id", id)

  if (error) {
    console.error("[v0] Error deleting trivia question:", error)
    return { error: error.message }
  }

  return { success: true }
}

export async function deleteTriviaQuestions(ids: string[]) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Unauthorized" }
  }

  const { error } = await supabase.from("trivia_questions").delete().in("id", ids)

  if (error) {
    console.error("[v0] Error deleting trivia questions:", error)
    return { error: error.message }
  }

  return { success: true }
}
