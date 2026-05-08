'use client'

import { useState, useEffect } from 'react'
import { X, Check, Palette, Type, Shield, User } from 'lucide-react'
import { MFASetup } from '@/components/layout/MFASetup'
import { AccountSettings } from '@/components/layout/AccountSettings'

interface SettingsModalProps {
  onClose: () => void
}

const THEMES = [
  {
    id: 'default',
    name: 'Klassisch',
    description: 'Warmes Beige & Dunkelblau',
    preview: { bg: '#f5f0e8', primary: '#1e3a6e', accent: '#2d7a4f' },
  },
  {
    id: 'slate',
    name: 'Slate',
    description: 'Kühles Grau & Indigo',
    preview: { bg: '#f1f5f9', primary: '#4f46e5', accent: '#0891b2' },
  },
  {
    id: 'rose',
    name: 'Rose',
    description: 'Warmweiss & Rosa',
    preview: { bg: '#fff1f2', primary: '#e11d48', accent: '#f97316' },
  },
  {
    id: 'emerald',
    name: 'Emerald',
    description: 'Natur & Grün',
    preview: { bg: '#f0fdf4', primary: '#059669', accent: '#0284c7' },
  },
  {
    id: 'amber',
    name: 'Amber',
    description: 'Warm & Golden',
    preview: { bg: '#fffbeb', primary: '#d97706', accent: '#dc2626' },
  },
  {
    id: 'violet',
    name: 'Violet',
    description: 'Modern & Lila',
    preview: { bg: '#f5f3ff', primary: '#7c3aed', accent: '#db2777' },
  },
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Dunkel & Tiefblau',
    preview: { bg: '#0f172a', primary: '#38bdf8', accent: '#34d399' },
    dark: true,
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Dunkel & Waldgrün',
    preview: { bg: '#0d1f0f', primary: '#4ade80', accent: '#fbbf24' },
    dark: true,
  },
]

const FONTS = [
  {
    id: 'dm',
    name: 'DM Sans + Serif',
    description: 'Standard — Modern & Elegant',
    family: '"DM Sans", system-ui, sans-serif',
    displayFamily: '"DM Serif Display", Georgia, serif',
    preview: 'Finanzplan 2025',
  },
  {
    id: 'inter',
    name: 'Inter',
    description: 'Alles Inter — Neutral & Klar',
    family: '"Inter", system-ui, sans-serif',
    displayFamily: '"Inter", system-ui, sans-serif',
    preview: 'Finanzplan 2025',
  },
  {
    id: 'system',
    name: 'System',
    description: 'Nativ — Schnell & Vertraut',
    family: 'system-ui, -apple-system, sans-serif',
    displayFamily: 'system-ui, -apple-system, sans-serif',
    preview: 'Finanzplan 2025',
  },
  {
    id: 'playfair',
    name: 'Playfair',
    description: 'Luxuriös — Serif überall',
    family: 'Georgia, "Times New Roman", serif',
    displayFamily: 'Georgia, "Times New Roman", serif',
    preview: 'Finanzplan 2025',
  },
  {
    id: 'mono',
    name: 'Monospace',
    description: 'Technisch & Präzise',
    family: '"Courier New", Courier, monospace',
    displayFamily: '"Courier New", Courier, monospace',
    preview: 'Finanzplan 2025',
  },
  {
    id: 'rounded',
    name: 'Rounded',
    description: 'Freundlich & Weich',
    family: '"Trebuchet MS", Arial, sans-serif',
    displayFamily: '"Trebuchet MS", Arial, sans-serif',
    preview: 'Finanzplan 2025',
  },
]

const THEME_VARS: Record<string, Record<string, string>> = {
  default: {
    '--background': '46 40% 97%',
    '--foreground': '220 15% 15%',
    '--card': '0 0% 100%',
    '--primary': '220 70% 35%',
    '--primary-foreground': '0 0% 100%',
    '--accent': '142 50% 38%',
    '--muted': '46 20% 94%',
    '--muted-foreground': '220 10% 55%',
    '--border': '220 15% 88%',
    '--secondary': '46 30% 92%',
  },
  slate: {
    '--background': '210 40% 96%',
    '--foreground': '222 47% 11%',
    '--card': '0 0% 100%',
    '--primary': '243 75% 59%',
    '--primary-foreground': '0 0% 100%',
    '--accent': '199 89% 37%',
    '--muted': '210 40% 93%',
    '--muted-foreground': '215 16% 47%',
    '--border': '214 32% 87%',
    '--secondary': '210 40% 90%',
  },
  rose: {
    '--background': '350 100% 98%',
    '--foreground': '240 10% 10%',
    '--card': '0 0% 100%',
    '--primary': '347 77% 50%',
    '--primary-foreground': '0 0% 100%',
    '--accent': '25 95% 53%',
    '--muted': '350 50% 95%',
    '--muted-foreground': '240 5% 50%',
    '--border': '350 30% 88%',
    '--secondary': '350 50% 92%',
  },
  emerald: {
    '--background': '138 76% 97%',
    '--foreground': '160 30% 10%',
    '--card': '0 0% 100%',
    '--primary': '160 84% 39%',
    '--primary-foreground': '0 0% 100%',
    '--accent': '199 89% 37%',
    '--muted': '138 40% 93%',
    '--muted-foreground': '160 15% 45%',
    '--border': '138 30% 85%',
    '--secondary': '138 40% 90%',
  },
  amber: {
    '--background': '48 100% 97%',
    '--foreground': '30 20% 10%',
    '--card': '0 0% 100%',
    '--primary': '38 92% 50%',
    '--primary-foreground': '0 0% 100%',
    '--accent': '0 84% 60%',
    '--muted': '48 50% 93%',
    '--muted-foreground': '30 10% 45%',
    '--border': '48 30% 85%',
    '--secondary': '48 50% 90%',
  },
  violet: {
    '--background': '250 100% 98%',
    '--foreground': '260 20% 10%',
    '--card': '0 0% 100%',
    '--primary': '263 70% 50%',
    '--primary-foreground': '0 0% 100%',
    '--accent': '330 81% 60%',
    '--muted': '250 50% 95%',
    '--muted-foreground': '260 10% 50%',
    '--border': '250 30% 88%',
    '--secondary': '250 50% 92%',
  },
  midnight: {
    '--background': '222 47% 8%',
    '--foreground': '210 40% 95%',
    '--card': '222 47% 12%',
    '--primary': '199 89% 61%',
    '--primary-foreground': '222 47% 8%',
    '--accent': '158 64% 52%',
    '--muted': '222 30% 16%',
    '--muted-foreground': '215 20% 60%',
    '--border': '222 30% 22%',
    '--secondary': '222 30% 18%',
  },
  forest: {
    '--background': '130 40% 6%',
    '--foreground': '120 20% 92%',
    '--card': '130 35% 10%',
    '--primary': '120 60% 60%',
    '--primary-foreground': '130 40% 6%',
    '--accent': '45 93% 58%',
    '--muted': '130 25% 14%',
    '--muted-foreground': '120 10% 55%',
    '--border': '130 25% 20%',
    '--secondary': '130 25% 16%',
  },
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'theme' | 'font' | 'security' | 'account'>('theme')
  const [selectedTheme, setSelectedTheme] = useState('default')
  const [selectedFont, setSelectedFont] = useState('dm')

  // Load from localStorage after mount
  useState(() => {
    if (typeof window !== 'undefined') {
      setSelectedTheme(localStorage.getItem('fp-theme') ?? 'default')
      setSelectedFont(localStorage.getItem('fp-font') ?? 'dm')
    }
  })

  function applyTheme(themeId: string) {
    const vars = THEME_VARS[themeId]
    if (!vars) return
    const root = document.documentElement
    // If it's a dark theme, force dark class; otherwise use user's preference
    const theme = THEMES.find(t => t.id === themeId)
    if (theme?.dark) {
      root.classList.add('dark')
    } else {
      // Keep current light/dark mode, just change colors
    }
    Object.entries(vars).forEach(([key, val]) => {
      root.style.setProperty(key, val)
    })
    localStorage.setItem('fp-theme', themeId)
    setSelectedTheme(themeId)
  }

  function applyFont(fontId: string) {
    const font = FONTS.find(f => f.id === fontId)
    if (!font) return
    document.body.style.fontFamily = font.family
    // Apply to all h1/h2/h3 (display font)
    const style = document.getElementById('fp-font-style') || (() => {
      const s = document.createElement('style')
      s.id = 'fp-font-style'
      document.head.appendChild(s)
      return s
    })()
    style.textContent = `
      body { font-family: ${font.family} !important; }
      h1, h2, h3, [style*="font-display"], .font-display { font-family: ${font.displayFamily} !important; }
      [style*="var(--font-display)"] { font-family: ${font.displayFamily} !important; }
    `
    localStorage.setItem('fp-font', fontId)
    setSelectedFont(fontId)
  }

  // Apply saved settings on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('fp-theme')
    const savedFont = localStorage.getItem('fp-font')
    if (savedTheme) applyTheme(savedTheme)
    if (savedFont) applyFont(savedFont)
  }, [])

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <h2 className="text-xl" style={{ fontFamily: 'var(--font-display)' }}>Einstellungen</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1"><X className="w-5 h-5" /></button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4 flex-shrink-0">
          <button onClick={() => setActiveTab('theme')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'theme' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>
            <Palette className="w-4 h-4" /> Design
          </button>
          <button onClick={() => setActiveTab('font')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'font' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>
            <Type className="w-4 h-4" /> Schriftart
          </button>
          <button onClick={() => setActiveTab('security')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'security' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>
            <Shield className="w-4 h-4" /> Sicherheit
          </button>
          <button onClick={() => setActiveTab('account')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'account' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>
            <User className="w-4 h-4" /> Konto
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
          {activeTab === 'theme' && (
            <div className="grid grid-cols-2 gap-3">
              {THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => applyTheme(theme.id)}
                  className={`relative p-3 rounded-xl border-2 text-left transition-all hover:scale-[1.02] ${selectedTheme === theme.id ? 'border-primary' : 'border-border hover:border-primary/40'}`}
                >
                  {selectedTheme === theme.id && (
                    <span className="absolute top-2 right-2 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                  {/* Color preview */}
                  <div className="flex gap-1.5 mb-2">
                    <div className="w-8 h-8 rounded-lg border border-black/10 flex-shrink-0" style={{ background: theme.preview.bg }} />
                    <div className="w-8 h-8 rounded-lg flex-shrink-0" style={{ background: theme.preview.primary }} />
                    <div className="w-8 h-8 rounded-lg flex-shrink-0" style={{ background: theme.preview.accent }} />
                  </div>
                  <p className="text-sm font-medium">{theme.name}</p>
                  <p className="text-xs text-muted-foreground">{theme.description}</p>
                  {theme.dark && <span className="text-xs text-muted-foreground">🌙 Dunkel</span>}
                </button>
              ))}
            </div>
          )}

          {activeTab === 'font' && (
            <div className="space-y-2">
              {FONTS.map((font) => (
                <button
                  key={font.id}
                  onClick={() => applyFont(font.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${selectedFont === font.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40 hover:bg-muted/40'}`}
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm" style={{ fontFamily: font.family }}>{font.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{font.description}</p>
                    <p className="text-base mt-1 font-medium" style={{ fontFamily: font.displayFamily }}>Finanzplan 2025</p>
                    <p className="text-sm text-muted-foreground" style={{ fontFamily: font.family }}>CHF 1'234.56 — Monatlich</p>
                  </div>
                  {selectedFont === font.id && (
                    <div className="w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border flex-shrink-0">
          <p className="text-xs text-muted-foreground">Änderungen werden sofort angewendet und gespeichert.</p>
        </div>
      </div>
    </div>
  )
}
