"use client"

import type { ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Users, DollarSign, Music, Brain, Settings, LogOut, Menu, X, Package } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

const navigation = [
  { name: "Dashboard", href: "/admincp", icon: LayoutDashboard },
  { name: "Users", href: "/admincp/users", icon: Users },
  { name: "Transactions", href: "/admincp/transactions", icon: DollarSign },
  { name: "Music Tasks", href: "/admincp/music", icon: Music },
  { name: "Trivia", href: "/admincp/trivia", icon: Brain },
  { name: "Packages", href: "/admincp/packages", icon: Package },
  { name: "Settings", href: "/admincp/settings", icon: Settings },
]

export function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
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
            <div>
              <span className="text-xl font-bold">Earnify</span>
              <p className="text-xs text-muted-foreground">Admin Panel</p>
            </div>
          </div>

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
            <span className="font-bold">Earnify Admin</span>
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
                <span className="text-lg font-bold">Admin Menu</span>
                <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

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
        <div className="px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          <div className="mx-auto max-w-7xl">{children}</div>
        </div>
      </main>
    </div>
  )
}
