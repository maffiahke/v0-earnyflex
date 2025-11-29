"use server"

import { createClient } from "@supabase/supabase-js"

function getAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function createMusicTask(data: {
  title: string
  artist: string
  audioUrl: string
  duration: number
  reward: number
}) {
  const supabase = getAdminClient()

  const { data: result, error } = await supabase
    .from("music_tasks")
    .insert([
      {
        title: data.title,
        artist: data.artist,
        audio_url: data.audioUrl,
        duration: data.duration,
        reward: data.reward,
        is_active: true,
      },
    ])
    .select()
    .single()

  if (error) {
    console.error("[v0] Error creating music task:", error)
    return { error: error.message }
  }

  return { data: result }
}

export async function updateMusicTask(
  id: string,
  data: {
    title: string
    artist: string
    audioUrl: string
    duration: number
    reward: number
  },
) {
  const supabase = getAdminClient()

  const { data: result, error } = await supabase
    .from("music_tasks")
    .update({
      title: data.title,
      artist: data.artist,
      audio_url: data.audioUrl,
      duration: data.duration,
      reward: data.reward,
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("[v0] Error updating music task:", error)
    return { error: error.message }
  }

  return { data: result }
}

export async function deleteMusicTask(id: string) {
  const supabase = getAdminClient()

  const { error } = await supabase.from("music_tasks").delete().eq("id", id)

  if (error) {
    console.error("[v0] Error deleting music task:", error)
    return { error: error.message }
  }

  return { success: true }
}

export async function deleteMusicTasks(ids: string[]) {
  const supabase = getAdminClient()

  const { error } = await supabase.from("music_tasks").delete().in("id", ids)

  if (error) {
    console.error("[v0] Error deleting music tasks:", error)
    return { error: error.message }
  }

  return { success: true }
}
