"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export type User = {
  id: string
  name: string
  email: string
  referralCode: string
  isActivated: boolean
  isBanned: boolean
  isAdmin: boolean
  walletBalance: number
  pendingEarnings: number
  totalEarnings: number
  totalReferrals: number
  activatedReferrals: number
  lastCheckIn: string | null
  createdAt: string
  password?: string // Added for admin credentials
}

export type Transaction = {
  id: string
  userId: string
  type: "deposit" | "withdraw" | "earning" | "referral" | "checkin"
  amount: number
  status: "pending" | "completed" | "rejected"
  method?: "mpesa" | "bank"
  details?: string
  createdAt: string
}

export type MusicTask = {
  id: string
  title: string
  artist: string
  audioUrl: string
  duration: number
  reward: number
  imageUrl?: string
}

export type TriviaQuestion = {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  reward: number
  category: string
}

export type ActivationPackage = {
  id: string
  name: string
  price: number
  referralBonus: number
  features: string[]
}

type Store = {
  currentUser: User | null
  users: User[]
  transactions: Transaction[]
  musicTasks: MusicTask[]
  triviaQuestions: TriviaQuestion[]
  activationPackages: ActivationPackage[]

  // Auth
  login: (email: string, password: string) => User | null
  register: (name: string, email: string, password: string) => User
  logout: () => void

  // User actions
  updateUser: (userId: string, updates: Partial<User>) => void
  checkIn: (userId: string) => void
  completeTask: (userId: string, amount: number) => void
  activateAccount: (userId: string, packageId: string) => void

  // Transactions
  createTransaction: (transaction: Omit<Transaction, "id" | "createdAt">) => void
  updateTransaction: (transactionId: string, updates: Partial<Transaction>) => void

  // Admin
  addMusicTask: (task: Omit<MusicTask, "id">) => void
  updateMusicTask: (taskId: string, updates: Partial<MusicTask>) => void
  deleteMusicTask: (taskId: string) => void
  addTriviaQuestion: (question: Omit<TriviaQuestion, "id">) => void
  updateTriviaQuestion: (questionId: string, updates: Partial<TriviaQuestion>) => void
  deleteTriviaQuestion: (questionId: string) => void

  // Activation Package Management
  addActivationPackage: (pkg: Omit<ActivationPackage, "id">) => void
  updateActivationPackage: (packageId: string, updates: Partial<ActivationPackage>) => void
  deleteActivationPackage: (packageId: string) => void
}

// Mock data
const mockMusicTasks: MusicTask[] = [
  {
    id: "1",
    title: "Sunset Dreams",
    artist: "Kenya Beats",
    audioUrl: "/audio/sample1.mp3",
    duration: 180,
    reward: 50,
    imageUrl: "/abstract-soundscape.png",
  },
  {
    id: "2",
    title: "Nairobi Nights",
    artist: "Urban Sound",
    audioUrl: "/audio/sample2.mp3",
    duration: 240,
    reward: 75,
    imageUrl: "/music-album-cover-night.jpg",
  },
]

const mockTriviaQuestions: TriviaQuestion[] = [
  {
    id: "1",
    question: "What is the capital city of Kenya?",
    options: ["Mombasa", "Nairobi", "Kisumu", "Nakuru"],
    correctAnswer: 1,
    reward: 30,
    category: "Geography",
  },
  {
    id: "2",
    question: "Which year did Kenya gain independence?",
    options: ["1960", "1963", "1965", "1970"],
    correctAnswer: 1,
    reward: 30,
    category: "History",
  },
]

const mockPackages: ActivationPackage[] = [
  {
    id: "1",
    name: "Starter",
    price: 500,
    referralBonus: 100,
    features: ["Unlock withdrawals", "Earn from referrals", "Priority support"],
  },
  {
    id: "2",
    name: "Premium",
    price: 1000,
    referralBonus: 250,
    features: ["Unlock withdrawals", "Earn from referrals", "2x earning bonus", "Priority support", "Exclusive tasks"],
  },
]

const DEFAULT_ADMIN = {
  id: "admin-default",
  name: "Admin",
  email: "admin@earnify.com",
  password: "admin123", // Default password
  referralCode: "ADMIN",
  isActivated: true,
  isBanned: false,
  isAdmin: true,
  walletBalance: 0,
  pendingEarnings: 0,
  totalEarnings: 0,
  totalReferrals: 0,
  activatedReferrals: 0,
  lastCheckIn: null,
  createdAt: new Date().toISOString(),
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users: [DEFAULT_ADMIN],
      transactions: [],
      musicTasks: mockMusicTasks,
      triviaQuestions: mockTriviaQuestions,
      activationPackages: mockPackages,

      login: (email, password) => {
        const users = get().users
        if (email === "admin@earnify.com" && password === "admin123") {
          const admin = users.find((u) => u.email === email)
          if (admin) {
            set({ currentUser: admin })
            return admin
          }
        }

        const user = users.find((u) => u.email === email)
        if (user && !user.isBanned) {
          set({ currentUser: user })
          return user
        }
        return null
      },

      register: (name, email, password) => {
        const referralCode = Math.random().toString(36).substring(2, 8).toUpperCase()
        const newUser: User = {
          id: Date.now().toString(),
          name,
          email,
          referralCode,
          isActivated: false,
          isBanned: false,
          isAdmin: email.includes("admin"),
          walletBalance: 100, // Welcome bonus
          pendingEarnings: 0,
          totalEarnings: 0,
          totalReferrals: 0,
          activatedReferrals: 0,
          lastCheckIn: null,
          createdAt: new Date().toISOString(),
          password, // Added for admin credentials
        }

        set((state) => ({
          users: [...state.users, newUser],
          currentUser: newUser,
        }))

        return newUser
      },

      logout: () => set({ currentUser: null }),

      updateUser: (userId, updates) => {
        set((state) => ({
          users: state.users.map((u) => (u.id === userId ? { ...u, ...updates } : u)),
          currentUser: state.currentUser?.id === userId ? { ...state.currentUser, ...updates } : state.currentUser,
        }))
      },

      checkIn: (userId) => {
        const today = new Date().toISOString().split("T")[0]
        const user = get().users.find((u) => u.id === userId)

        if (user && user.lastCheckIn !== today) {
          get().updateUser(userId, {
            walletBalance: user.walletBalance + 25,
            totalEarnings: user.totalEarnings + 25,
            lastCheckIn: today,
          })

          get().createTransaction({
            userId,
            type: "checkin",
            amount: 25,
            status: "completed",
          })
        }
      },

      completeTask: (userId, amount) => {
        const user = get().users.find((u) => u.id === userId)
        if (user) {
          get().updateUser(userId, {
            walletBalance: user.walletBalance + amount,
            totalEarnings: user.totalEarnings + amount,
          })
        }
      },

      activateAccount: (userId, packageId) => {
        const user = get().users.find((u) => u.id === userId)
        const pkg = get().activationPackages.find((p) => p.id === packageId)

        if (user && pkg && user.walletBalance >= pkg.price) {
          get().updateUser(userId, {
            isActivated: true,
            walletBalance: user.walletBalance - pkg.price,
          })
        }
      },

      createTransaction: (transaction) => {
        const newTransaction: Transaction = {
          ...transaction,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
        }

        set((state) => ({
          transactions: [...state.transactions, newTransaction],
        }))
      },

      updateTransaction: (transactionId, updates) => {
        set((state) => ({
          transactions: state.transactions.map((t) => (t.id === transactionId ? { ...t, ...updates } : t)),
        }))
      },

      addMusicTask: (task) => {
        set((state) => ({
          musicTasks: [...state.musicTasks, { ...task, id: Date.now().toString() }],
        }))
      },

      updateMusicTask: (taskId, updates) => {
        set((state) => ({
          musicTasks: state.musicTasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t)),
        }))
      },

      deleteMusicTask: (taskId) => {
        set((state) => ({
          musicTasks: state.musicTasks.filter((t) => t.id !== taskId),
        }))
      },

      addTriviaQuestion: (question) => {
        set((state) => ({
          triviaQuestions: [...state.triviaQuestions, { ...question, id: Date.now().toString() }],
        }))
      },

      updateTriviaQuestion: (questionId, updates) => {
        set((state) => ({
          triviaQuestions: state.triviaQuestions.map((q) => (q.id === questionId ? { ...q, ...updates } : q)),
        }))
      },

      deleteTriviaQuestion: (questionId) => {
        set((state) => ({
          triviaQuestions: state.triviaQuestions.filter((q) => q.id !== questionId),
        }))
      },

      // Activation Package Management
      addActivationPackage: (pkg) => {
        set((state) => ({
          activationPackages: [...state.activationPackages, { ...pkg, id: Date.now().toString() }],
        }))
      },

      updateActivationPackage: (packageId, updates) => {
        set((state) => ({
          activationPackages: state.activationPackages.map((p) => (p.id === packageId ? { ...p, ...updates } : p)),
        }))
      },

      deleteActivationPackage: (packageId) => {
        set((state) => ({
          activationPackages: state.activationPackages.filter((p) => p.id !== packageId),
        }))
      },
    }),
    {
      name: "earnify-storage",
    },
  ),
)
