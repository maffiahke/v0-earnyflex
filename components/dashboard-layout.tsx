"use client"

import type { ReactNode } from "react"
import { useStore } from "@/lib/store"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Music, Brain, Wallet, Users, User, Lock, LogOut, Menu, X } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Music Tasks", href: "/dashboard/music", icon: Music },
  { name: "Trivia", href: "/dashboard/trivia", icon: Brain },
  { name: "Wallet", href: "/dashboard/wallet", icon: Wallet },
  { name: "Referral", href: "/dashboard/referral", icon: Users },
  { name: "Activation", href: "/dashboard/activation", icon: Lock },
  { name: "Profile", href: "/dashboard/profile", icon: User },
]

export function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const logout = useStore((state) => state.logout)
  const currentUser = useStore((state) => state.currentUser)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  return (
    <div className="min-h-screen">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto glass-card border-r border-border/50 px-6 py-8">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Music className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">Earnify</span>
          </div>

          {currentUser && (
            <div className="glass p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Wallet Balance</p>
              <p className="text-2xl font-bold text-primary">KSh {currentUser.walletBalance.toLocaleString()}</p>
            </div>
          )}

          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        "group flex gap-x-3 rounded-lg p-3 text-sm font-semibold transition-all",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground hover:bg-primary/10 hover:text-primary",
                      )}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {item.name}
                    </Link>
                  </li>
                )
              })}
              <li className="mt-auto">
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="mr-3 h-5 w-5" />
                  Logout
                </Button>
              </li>
            </ul>
          </nav>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="sticky top-0 z-40 lg:hidden">
        <div className="flex h-16 items-center justify-between gap-x-4 glass-card border-b border-border/50 px-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Music className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold">Earnify</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 lg:hidden"
          >
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
            <div className="fixed inset-y-0 right-0 w-full max-w-xs glass-card border-l border-border/50 p-6">
              <div className="flex items-center justify-between mb-6">
                <span className="text-lg font-bold">Menu</span>
                <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {currentUser && (
                <div className="glass p-4 rounded-lg mb-6">
                  <p className="text-sm text-muted-foreground mb-1">Wallet Balance</p>
                  <p className="text-2xl font-bold text-primary">KSh {currentUser.walletBalance.toLocaleString()}</p>
                </div>
              )}

              <nav className="flex flex-col gap-2">
                {navigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex gap-x-3 rounded-lg p-3 text-sm font-semibold transition-all",
                        isActive ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-primary/10",
                      )}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {item.name}
                    </Link>
                  )
                })}
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  className="justify-start text-destructive hover:text-destructive hover:bg-destructive/10 mt-4"
                >
                  <LogOut className="mr-3 h-5 w-5" />
                  Logout
                </Button>
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="lg:pl-72">
        <div className="px-4 py-8 sm:px-6 lg:px-8 lg:py-12 pb-24 lg:pb-12">
          <div className="mx-auto max-w-7xl">{children}</div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-slate-900/95 backdrop-blur-xl border-t border-slate-700/50">
        <div className="grid grid-cols-5 gap-1 p-2">
          {navigation.slice(0, 5).map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg p-2 text-xs transition-all",
                  isActive ? "bg-primary/20 text-primary" : "text-slate-400 hover:text-white",
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[10px]">{item.name.split(" ")[0]}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
