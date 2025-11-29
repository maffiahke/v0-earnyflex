"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2 } from "lucide-react"
import { playSound, initAudio } from "@/lib/sounds"
import { useAppSettings } from "@/lib/hooks/use-app-settings"

export function SocialProofToast() {
  const [show, setShow] = useState(false)
  const [message, setMessage] = useState({ name: "", action: "" })
  const { socialProofSettings, appSettings } = useAppSettings()

  useEffect(() => {
    initAudio()

    const showToast = () => {
      const names =
        socialProofSettings.fakeNames.length > 0 ? socialProofSettings.fakeNames : ["John K.", "Mary W.", "Peter M."]

      const counties =
        socialProofSettings.counties.length > 0 ? socialProofSettings.counties : ["Nairobi", "Mombasa", "Kisumu"]

      const randomName = names[Math.floor(Math.random() * names.length)]
      const randomCounty = counties[Math.floor(Math.random() * counties.length)]
      const fullName = `${randomName} from ${randomCounty}`

      const earningMessages = [
        "just earned KSh 30 from music",
        "just earned KSh 30 from trivia",
        `just earned KSh ${appSettings.referralBonus} referral bonus`,
        "just activated their account with KSh 500",
        "just activated their account with KSh 1000",
        "just activated their account with KSh 2500",
      ]

      const randomAction = earningMessages[Math.floor(Math.random() * earningMessages.length)]

      setMessage({ name: fullName, action: randomAction })
      setShow(true)
      console.log("[v0] Showing social proof toast")
      playSound("notification")

      setTimeout(() => setShow(false), 4000)
    }

    const initialTimeout = setTimeout(showToast, 5000)

    const interval = setInterval(showToast, Math.random() * 10000 + 20000)

    return () => {
      clearTimeout(initialTimeout)
      clearInterval(interval)
    }
  }, [socialProofSettings, appSettings])

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
