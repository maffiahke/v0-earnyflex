"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useStore } from "@/lib/store"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Music2, TrendingUp, Users } from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
  const router = useRouter()
  const currentUser = useStore((state) => state.currentUser)

  useEffect(() => {
    if (currentUser) {
      if (currentUser.isAdmin) {
        router.push("/admin")
      } else {
        router.push("/dashboard")
      }
    }
  }, [currentUser, router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-20 -left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute -bottom-20 -right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 10,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center z-10 max-w-4xl"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="inline-block mb-6"
        >
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto">
            <Music2 className="w-10 h-10 text-white" />
          </div>
        </motion.div>

        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-success bg-clip-text text-transparent leading-tight">
          Earnify
        </h1>

        <p className="text-xl md:text-2xl text-foreground/80 mb-12 leading-relaxed text-balance">
          Earn Kenyan Shillings by listening to music, answering trivia, and referring friends
        </p>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card p-6 rounded-xl"
          >
            <Music2 className="w-8 h-8 text-primary mb-3 mx-auto" />
            <h3 className="font-semibold text-lg mb-2">Listen & Earn</h3>
            <p className="text-sm text-muted-foreground">Complete music tasks and get rewarded instantly</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-card p-6 rounded-xl"
          >
            <TrendingUp className="w-8 h-8 text-success mb-3 mx-auto" />
            <h3 className="font-semibold text-lg mb-2">Answer Trivia</h3>
            <p className="text-sm text-muted-foreground">Test your knowledge and earn money</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="glass-card p-6 rounded-xl"
          >
            <Users className="w-8 h-8 text-accent mb-3 mx-auto" />
            <h3 className="font-semibold text-lg mb-2">Refer Friends</h3>
            <p className="text-sm text-muted-foreground">Get bonus when your referrals activate</p>
          </motion.div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/auth/register">
            <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground">
              Get Started Free
            </Button>
          </Link>
          <Link href="/auth/login">
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto border-primary/50 text-foreground hover:bg-primary/10 bg-transparent"
            >
              Sign In
            </Button>
          </Link>
        </div>

        <p className="text-sm text-muted-foreground mt-8 max-w-2xl mx-auto leading-relaxed text-pretty">
          Join thousands of Kenyans earning money daily across the country by completing simple tasks whenever you want
        </p>
      </motion.div>
    </div>
  )
}
