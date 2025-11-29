"use server"

import { createClient } from "@supabase/supabase-js"

const getAdminClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(supabaseUrl, supabaseServiceKey)
}

export async function createPackage(data: {
  name: string
  price: number
  benefits: string[]
  description: string
}) {
  const supabase = getAdminClient()

  const { error } = await supabase.from("activation_packages").insert([
    {
      ...data,
      is_active: true,
    },
  ])

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function updatePackage(
  id: string,
  data: {
    name: string
    price: number
    benefits: string[]
    description: string
  },
) {
  const supabase = getAdminClient()

  const { error } = await supabase
    .from("activation_packages")
    .update({
      ...data,
      is_active: true,
    })
    .eq("id", id)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function deletePackages(packageIds: string[]) {
  const supabase = getAdminClient()

  const { error } = await supabase.from("activation_packages").delete().in("id", packageIds)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}
