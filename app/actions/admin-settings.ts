"use server"

import { createServerClient } from "@supabase/ssr"
import { revalidateTag } from "next/cache"

async function createAdminClient() {
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: {
      getAll() {
        return []
      },
      setAll() {},
    },
  })
}

export async function saveAppSettings(appSettings: any) {
  try {
    const supabase = await createAdminClient()

    console.log("[v0] Saving app settings with service role key")

    const { error } = await supabase.from("app_settings").upsert(
      {
        key: "appSettings",
        value: appSettings,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" },
    )

    if (error) {
      console.log("[v0] Supabase error:", error)
      return { success: false, error: error.message || JSON.stringify(error) }
    }

    revalidateTag("app-settings")
    console.log("[v0] App settings saved successfully")
    return { success: true }
  } catch (err: any) {
    console.log("[v0] Exception error:", err)
    return { success: false, error: err?.message || "Unknown error" }
  }
}

export async function savePaymentMethods(paymentMethods: any) {
  try {
    const supabase = await createAdminClient()

    console.log("[v0] Saving payment methods with service role key")

    const { error } = await supabase.from("app_settings").upsert(
      {
        key: "paymentMethods",
        value: paymentMethods,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" },
    )

    if (error) {
      console.log("[v0] Payment methods error:", error)
      return { success: false, error: error.message || JSON.stringify(error) }
    }

    revalidateTag("app-settings")
    console.log("[v0] Payment methods saved successfully")
    return { success: true }
  } catch (err: any) {
    console.log("[v0] Exception error:", err)
    return { success: false, error: err?.message || "Unknown error" }
  }
}

export async function saveSocialProofSettings(socialProofSettings: any) {
  try {
    const supabase = await createAdminClient()

    console.log("[v0] Saving social proof settings with service role key")

    const { error } = await supabase.from("app_settings").upsert(
      {
        key: "socialProofSettings",
        value: socialProofSettings,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" },
    )

    if (error) {
      console.log("[v0] Social proof error:", error)
      return { success: false, error: error.message || JSON.stringify(error) }
    }

    revalidateTag("app-settings")
    console.log("[v0] Social proof settings saved successfully")
    return { success: true }
  } catch (err: any) {
    console.log("[v0] Exception error:", err)
    return { success: false, error: err?.message || "Unknown error" }
  }
}
