import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Lipana webhook received")

    // Get webhook signature
    const signature = request.headers.get("x-lipana-signature")
    const body = await request.text()

    console.log("[v0] Webhook signature:", signature)
    console.log("[v0] Webhook body:", body)

    // Verify webhook signature
    const webhookSecret = process.env.LIPANA_WEBHOOK_SECRET
    if (webhookSecret && signature) {
      const computedSignature = crypto.createHmac("sha256", webhookSecret).update(body).digest("hex")

      if (signature !== computedSignature) {
        console.error("[v0] Invalid webhook signature")
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }
    }

    const data = JSON.parse(body)
    const event = data.event
    const paymentData = data.data

    console.log("[v0] Webhook event:", event)
    console.log("[v0] Payment data:", paymentData)

    // Only process successful payments
    if (event !== "payment.success") {
      console.log("[v0] Ignoring non-success event:", event)
      return NextResponse.json({ received: true })
    }

    const transactionId = paymentData.transactionId
    const amount = paymentData.amount
    const phone = paymentData.phone

    // Create admin client to bypass RLS
    const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Find transaction by Lipana transaction ID
    const { data: transactions, error: findError } = await adminClient
      .from("transactions")
      .select("*")
      .eq("status", "pending")
      .ilike("description", `%${transactionId}%`)
      .limit(1)

    if (findError || !transactions || transactions.length === 0) {
      console.error("[v0] Transaction not found for:", transactionId)
      // Still return success to Lipana
      return NextResponse.json({ received: true })
    }

    const transaction = transactions[0]
    const userId = transaction.user_id

    console.log("[v0] Found transaction:", transaction.id, "for user:", userId)

    // Update transaction status
    await adminClient
      .from("transactions")
      .update({
        status: "completed",
        description: `Completed: M-Pesa payment via Lipana - ${transactionId}`,
        updated_at: new Date().toISOString(),
      })
      .eq("id", transaction.id)

    // Get current user balance
    const { data: userData } = await adminClient.from("users").select("balance").eq("id", userId).single()

    const currentBalance = userData?.balance || 0
    const newBalance = currentBalance + amount

    // Update user balance
    await adminClient
      .from("users")
      .update({
        balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    console.log("[v0] User balance updated:", { userId, oldBalance: currentBalance, newBalance })

    return NextResponse.json({ received: true, processed: true })
  } catch (error: any) {
    console.error("[v0] Webhook processing error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
