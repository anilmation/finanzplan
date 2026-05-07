'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Trash2, LogOut, AlertTriangle, RefreshCw } from 'lucide-react'

export function AccountSettings() {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  async function signOutAllSessions() {
    setLoading(true)
    try {
      await supabase.auth.signOut({ scope: 'global' })
      window.location.href = '/auth/login'
    } finally {
      setLoading(false)
    }
  }

  async function deleteAccount() {
    if (deleteConfirmText !== 'LÖSCHEN') return
    setLoading(true)
    setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const resp = await fetch('/api/account/delete', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      })
      if (!resp.ok) throw new Error('Fehler beim Löschen')
      await supabase.auth.signOut()
      window.location.href = '/auth/login'
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Sign out all devices */}
      <div className="flex items-center justify-between p-4 bg-muted/40 rounded-xl">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Alle Geräte abmelden</p>
            <p className="text-xs text-muted-foreground">Beendet alle aktiven Sessions</p>
          </div>
        </div>
        <button
          onClick={signOutAllSessions}
          disabled={loading}
          className="text-xs border border-border rounded-lg px-3 py-1.5 hover:bg-muted transition-all disabled:opacity-50"
        >
          Abmelden
        </button>
      </div>

      {/* Delete account */}
      <div className="border border-red-200 dark:border-red-900 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-3">
          <Trash2 className="w-4 h-4 text-red-500" />
          <div>
            <p className="text-sm font-medium text-red-700 dark:text-red-400">Konto löschen</p>
            <p className="text-xs text-muted-foreground">Alle Daten werden unwiderruflich gelöscht</p>
          </div>
        </div>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="text-xs text-red-500 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
          >
            Konto löschen
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-red-500" />
              Tippe <strong>LÖSCHEN</strong> zur Bestätigung:
            </p>
            <input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="w-full bg-background border border-red-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
              placeholder="LÖSCHEN"
              autoFocus
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={deleteAccount}
                disabled={deleteConfirmText !== 'LÖSCHEN' || loading}
                className="flex-1 bg-red-500 text-white rounded-lg py-2 text-xs font-medium hover:bg-red-600 disabled:opacity-40"
              >
                {loading ? 'Lösche...' : 'Endgültig löschen'}
              </button>
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText('') }}
                className="flex-1 border border-border rounded-lg py-2 text-xs text-muted-foreground hover:bg-muted"
              >
                Abbrechen
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
