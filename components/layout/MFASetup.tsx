'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Shield, ShieldCheck, QrCode, Key, X, Check, AlertTriangle } from 'lucide-react'

export function MFASetup() {
  const [step, setStep] = useState<'idle' | 'qr' | 'verify' | 'done' | 'disable'>('idle')
  const [qrCode, setQrCode] = useState('')
  const [secret, setSecret] = useState('')
  const [factorId, setFactorId] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasMFA, setHasMFA] = useState<boolean | null>(null)
  const supabase = createClient()

  async function checkMFA() {
    const { data } = await supabase.auth.mfa.listFactors()
    setHasMFA((data?.totp?.length ?? 0) > 0)
    if ((data?.totp?.length ?? 0) > 0) {
      setFactorId(data!.totp[0].id)
    }
  }

  useState(() => { checkMFA() })

  async function startEnroll() {
    setLoading(true); setError('')
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Google Authenticator',
      })
      if (error) throw error
      setQrCode(data.totp.qr_code)
      setSecret(data.totp.secret)
      setFactorId(data.id)
      setStep('qr')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Fehler beim Einrichten')
    } finally {
      setLoading(false)
    }
  }

  async function verifyAndActivate() {
    if (code.length !== 6) { setError('6-stelliger Code erforderlich'); return }
    setLoading(true); setError('')
    try {
      const { data: challenge } = await supabase.auth.mfa.challenge({ factorId })
      const { error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge!.id,
        code,
      })
      if (error) throw error
      setStep('done')
      setHasMFA(true)
    } catch (e: unknown) {
      setError('Falscher Code — bitte nochmal versuchen')
    } finally {
      setLoading(false)
    }
  }

  async function disableMFA() {
    setLoading(true); setError('')
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId })
      if (error) throw error
      setHasMFA(false)
      setStep('idle')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Fehler beim Deaktivieren')
    } finally {
      setLoading(false)
    }
  }

  if (hasMFA === null) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between p-4 bg-muted/40 rounded-xl">
        <div className="flex items-center gap-3">
          {hasMFA
            ? <ShieldCheck className="w-5 h-5 text-green-500" />
            : <Shield className="w-5 h-5 text-muted-foreground" />
          }
          <div>
            <p className="text-sm font-medium">Zwei-Faktor-Authentifizierung</p>
            <p className="text-xs text-muted-foreground">
              {hasMFA ? 'Aktiviert — Google Authenticator' : 'Nicht aktiviert'}
            </p>
          </div>
        </div>
        {hasMFA ? (
          <button onClick={() => setStep('disable')} className="text-xs text-red-500 hover:text-red-600 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
            Deaktivieren
          </button>
        ) : (
          <button onClick={startEnroll} disabled={loading} className="text-xs bg-primary text-primary-foreground rounded-lg px-3 py-1.5 hover:bg-primary/90 disabled:opacity-50 transition-all">
            {loading ? 'Laden...' : 'Aktivieren'}
          </button>
        )}
      </div>

      {/* QR Code Step */}
      {step === 'qr' && (
        <div className="border border-border rounded-xl p-4 space-y-4">
          <p className="text-sm font-medium flex items-center gap-2"><QrCode className="w-4 h-4" /> QR-Code scannen</p>
          <p className="text-xs text-muted-foreground">Öffne Google Authenticator und scanne den QR-Code:</p>
          <div className="flex justify-center">
            <img src={qrCode} alt="QR Code" className="w-40 h-40 rounded-lg border border-border" />
          </div>
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer hover:text-foreground">Manueller Code (falls QR nicht funktioniert)</summary>
            <p className="mt-1 font-mono bg-muted rounded px-2 py-1 break-all">{secret}</p>
          </details>
          <button onClick={() => setStep('verify')} className="w-full bg-primary text-primary-foreground rounded-lg py-2 text-sm font-medium hover:bg-primary/90">
            Weiter zur Verifizierung
          </button>
        </div>
      )}

      {/* Verify Step */}
      {step === 'verify' && (
        <div className="border border-border rounded-xl p-4 space-y-3">
          <p className="text-sm font-medium flex items-center gap-2"><Key className="w-4 h-4" /> Code eingeben</p>
          <p className="text-xs text-muted-foreground">Gib den 6-stelligen Code aus Google Authenticator ein:</p>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            onKeyDown={(e) => e.key === 'Enter' && verifyAndActivate()}
            className="w-full bg-background border border-border rounded-lg px-3 py-3 text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="000000"
            autoFocus
          />
          {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{error}</p>}
          <button onClick={verifyAndActivate} disabled={loading || code.length !== 6} className="w-full bg-primary text-primary-foreground rounded-lg py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
            {loading ? 'Verifiziere...' : 'Aktivieren'}
          </button>
        </div>
      )}

      {/* Success */}
      {step === 'done' && (
        <div className="border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 rounded-xl p-4 flex items-center gap-3">
          <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-green-700 dark:text-green-400">MFA erfolgreich aktiviert!</p>
            <p className="text-xs text-green-600 dark:text-green-500">Ab jetzt wird beim Login ein Code verlangt.</p>
          </div>
        </div>
      )}

      {/* Disable confirmation */}
      {step === 'disable' && (
        <div className="border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-xl p-4 space-y-3">
          <p className="text-sm font-medium text-red-700 dark:text-red-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> MFA wirklich deaktivieren?
          </p>
          <p className="text-xs text-red-600 dark:text-red-500">Das macht dein Konto weniger sicher.</p>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2">
            <button onClick={disableMFA} disabled={loading} className="flex-1 bg-red-500 text-white rounded-lg py-2 text-sm font-medium hover:bg-red-600 disabled:opacity-50">
              {loading ? 'Deaktiviere...' : 'Ja, deaktivieren'}
            </button>
            <button onClick={() => setStep('idle')} className="flex-1 border border-border rounded-lg py-2 text-sm text-muted-foreground hover:bg-muted">
              Abbrechen
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
