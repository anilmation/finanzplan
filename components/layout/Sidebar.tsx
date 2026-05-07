'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard, ListChecks, Sun, Moon,
  LogOut, ChevronDown, Plus, Menu, X, Settings
} from 'lucide-react'
import { SettingsModal } from '@/components/layout/SettingsModal'

interface NavProps {
  user: { email: string }
  currentYear: number | null
  years: number[]
  onYearChange?: (year: number) => void
  onCreateYear?: () => void
}

export function Sidebar({ user, currentYear, years, onYearChange, onCreateYear }: NavProps) {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const supabase = createClient()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const navItems = [
    { href: '/dashboard', label: 'Übersicht', icon: LayoutDashboard },
    { href: '/planen', label: 'Planung', icon: ListChecks },

  ]

  const sidebarContent = (
    <div className="flex flex-col h-full px-4 py-6">
      {/* Logo */}
      <div className="mb-8 px-2 flex items-center justify-between">
        <h1 className="text-2xl" style={{ fontFamily: 'var(--font-display)' }}>Finanzplan</h1>
        <button className="lg:hidden text-muted-foreground" onClick={() => setMobileOpen(false)}>
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Year selector */}
      <div className="mb-6 px-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Jahr</p>
        <div className="relative">
          <select
            value={currentYear ?? ''}
            onChange={(e) => { onYearChange?.(Number(e.target.value)); setMobileOpen(false) }}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm font-medium appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>
        <button
          onClick={() => { onCreateYear?.(); setMobileOpen(false) }}
          className="mt-2 w-full flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-1 py-1"
        >
          <Plus className="w-3 h-3" /> Neues Jahr erstellen
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href} onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" /> {label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="space-y-1 pt-4 border-t border-border mt-4">
        <button onClick={() => setShowSettings(true)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-all w-full"
        >
          <Settings className="w-4 h-4" /> Einstellungen
        </button>
        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-all w-full"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {theme === 'dark' ? 'Hell' : 'Dunkel'}
        </button>
        <div className="px-3 py-2">
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
        <button onClick={signOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-all w-full"
        >
          <LogOut className="w-4 h-4" /> Abmelden
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl" style={{ fontFamily: 'var(--font-display)' }}>Finanzplan</h1>
        <button onClick={() => setMobileOpen(true)} className="text-muted-foreground hover:text-foreground">
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-64 bg-card border-r border-border h-full overflow-y-auto">
            {sidebarContent}
          </div>
          <div className="flex-1 bg-black/40" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 min-h-screen bg-card border-r border-border">
        {sidebarContent}
      </aside>
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </>
  )
}
