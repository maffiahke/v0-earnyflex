"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2 } from "lucide-react"
import { playSound, initAudio } from "@/lib/sounds"

const fakeNames = [
  "John from Nairobi",
  "Mary from Mombasa",
  "Peter from Kisumu",
  "Jane from Nakuru",
  "David from Eldoret",
  "Grace from Thika",
  "Michael from Machakos",
  "Sarah from Nyeri",
  "James from Kakamega",
  "Lucy from Kiambu",
  "Daniel from Ruiru",
  "Faith from Naivasha",
]

const counties = [
  "Nairobi",
  "Mombasa",
  "Kisumu",
  "Nakuru",
  "Eldoret",
  "Thika",
  "Machakos",
  "Nyeri",
  "Kakamega",
  "Kiambu",
  "Ruiru",
  "Naivasha",
]

const earningMessages = [
  "just earned KSh 50 from music",
  "just earned KSh 30 from trivia",
  "just earned KSh 100 referral bonus",
  "just withdrew KSh 500",
  "just activated their account",
  "just earned KSh 25 from daily check-in",
]

export function SocialProofToast() {
  const [show, setShow] = useState(false)
  const [message, setMessage] = useState({ name: "", action: "" })

  useEffect(() => {
    initAudio()

    const showToast = () => {
      const randomName = fakeNames[Math.floor(Math.random() * fakeNames.length)]
      const randomAction = earningMessages[Math.floor(Math.random() * earningMessages.length)]

      setMessage({ name: randomName, action: randomAction })
      setShow(true)
      console.log("[v0] Showing toast, playing clap sound")
      playSound("notification")

      setTimeout(() => setShow(false), 4000)
    }

    const initialTimeout = setTimeout(showToast, 5000)

    const interval = setInterval(showToast, Math.random() * 10000 + 20000)

    return () => {
      clearTimeout(initialTimeout)
      clearInterval(interval)
    }
  }, [])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -50, x: "-50%" }}
          animate={{ opacity: 1, y: 0, x: "-50%" }}
          exit={{ opacity: 0, y: -50, x: "-50%" }}
          className="fixed top-4 left-1/2 z-50 rounded-lg px-4 py-3 shadow-lg backdrop-blur-xl bg-slate-900/90 border border-slate-700/50 max-w-md w-[90%] sm:w-auto"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
            <p className="text-xs sm:text-sm text-white break-words line-clamp-2">
              <span className="font-semibold">{message.name}</span> {message.action}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
