// @ts-nocheck
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Step = 'login' | 'mfa'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [factorId, setFactorId] = useState('')
  const [challengeId, setChallengeId] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [step, setStep] = useState<Step>('login')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        if (data.session) {
          window.location.href = '/dashboard'
        } else {
          setMessage('Bestätigungs-E-Mail gesendet. Bitte prüfe dein Postfach.')
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error

        // Check if MFA is required
        if (data.session) {
          const { data: factors } = await supabase.auth.mfa.listFactors()
          if (factors?.totp && factors.totp.length > 0) {
            // MFA required
            const factor = factors.totp[0]
            const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
              factorId: factor.id,
            })
            if (challengeError) throw challengeError
            setFactorId(factor.id)
            setChallengeId(challenge.id)
            setStep('mfa')
            setLoading(false)
            return
          }
          window.location.href = '/dashboard'
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten.')
    } finally {
      setLoading(false)
    }
  }

  async function handleMFA(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code: mfaCode,
      })
      if (error) throw error
      window.location.href = '/dashboard'
    } catch (err) {
      setError('Falscher Code. Bitte versuche es nochmal.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <h1 className="text-4xl mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            Finanzplan
          </h1>
          <p className="text-muted-foreground text-sm">
            Persönliche Budgetplanung
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
          {step === 'login' ? (
            <>
              <h2 className="text-lg font-medium mb-6" style={{ fontFamily: 'var(--font-display)' }}>
                {isSignUp ? 'Konto erstellen' : 'Anmelden'}
              </h2>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-1.5">E-Mail</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                    placeholder="name@beispiel.ch"
                    required
                    autoFocus
                    autoComplete="email"
                  />
                </div>

                <div>
                  <label className="block text-sm text-muted-foreground mb-1.5">Passwort</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                    placeholder="••••••••"
                    required
                    minLength={8}
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  />
                  {isSignUp && (
                    <p className="text-xs text-muted-foreground mt-1">Mindestens 8 Zeichen</p>
                  )}
                </div>

                {error && (
                  <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}
                {message && (
                  <p className="text-sm text-green-600 bg-green-50 dark:bg-green-950/30 rounded-lg px-3 py-2">
                    {message}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Laden...' : isSignUp ? 'Konto erstellen' : 'Anmelden'}
                </button>
              </form>

              <div className="mt-6 pt-5 border-t border-border text-center">
                <button
                  onClick={() => { setIsSignUp(!isSignUp); setError(''); setMessage('') }}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {isSignUp ? 'Bereits ein Konto? Anmelden' : 'Noch kein Konto? Registrieren'}
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-lg font-medium mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                Zwei-Faktor-Code
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                Gib den 6-stelligen Code aus deiner Authenticator-App ein.
              </p>

              <form onSubmit={handleMFA} className="space-y-4">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-3 text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="000000"
                  autoFocus
                  required
                />

                {error && (
                  <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || mfaCode.length !== 6}
                  className="w-full bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                >
                  {loading ? 'Verifiziere...' : 'Bestätigen'}
                </button>

                <button
                  type="button"
                  onClick={() => { setStep('login'); setMfaCode(''); setError('') }}
                  className="w-full text-sm text-muted-foreground hover:text-foreground"
                >
                  Zurück zur Anmeldung
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
