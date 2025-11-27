const notificationAudio = typeof window !== "undefined" ? new Audio("https://hebbkx1anhila5yf.public.blob.vercel-storage.com/material-buy-success-394517-6kcwZ1ieKogZmyM3hp3rpGZw8cDCuJ.mp3") : null
const successAudio = typeof window !== "undefined" ? new Audio("https://hebbkx1anhila5yf.public.blob.vercel-storage.com/applause-cheer-236786-xxTcMawfGlEikp5YGAa56ZNDqsmrK1.mp3") : null

if (notificationAudio) {
  notificationAudio.preload = "auto"
  notificationAudio.volume = 0.5
  notificationAudio.load()
}

if (successAudio) {
  successAudio.preload = "auto"
  successAudio.volume = 0.6
  successAudio.load()
}

let audioInitialized = false

const unlockAudio = async () => {
  if (audioInitialized) return

  try {
    console.log("[v0] Unlocking audio...")

    // Prime notification audio
    if (notificationAudio) {
      notificationAudio.muted = true
      await notificationAudio.play()
      notificationAudio.pause()
      notificationAudio.currentTime = 0
      notificationAudio.muted = false
      console.log("[v0] Notification audio unlocked")
    }

    // Prime success audio
    if (successAudio) {
      successAudio.muted = true
      await successAudio.play()
      successAudio.pause()
      successAudio.currentTime = 0
      successAudio.muted = false
      console.log("[v0] Success audio unlocked")
    }

    audioInitialized = true
    console.log("[v0] All audio unlocked successfully")
  } catch (err) {
    console.error("[v0] Audio unlock error:", err)
  }
}

// Unlock on any interaction
if (typeof window !== "undefined") {
  ;["click", "touchstart", "keydown"].forEach((event) => {
    document.addEventListener(event, unlockAudio, { once: true })
  })
}

export const playSound = async (type: "success" | "notification" | "error") => {
  if (typeof window === "undefined") return

  // Ensure audio is unlocked
  await unlockAudio()

  try {
    console.log("[v0] Playing sound:", type)

    if (type === "notification" && notificationAudio) {
      notificationAudio.currentTime = 0
      await notificationAudio.play()
      console.log("[v0] ✓ Notification sound played successfully")
      return
    }

    if (type === "success" && successAudio) {
      successAudio.currentTime = 0
      await successAudio.play()
      console.log("[v0] ✓ Success (applause) sound played successfully")
      return
    }

    if (type === "error") {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.type = "sawtooth"
      oscillator.frequency.setValueAtTime(300, audioContext.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.2)
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.2)
      console.log("[v0] ✓ Error sound played successfully")
    }
  } catch (err) {
    console.error("[v0] ✗ Audio playback error:", err)
  }
}

export const initAudio = unlockAudio
