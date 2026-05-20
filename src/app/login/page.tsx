'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { getStorageKey } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000)

      const res = await window.fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
        },
        body: JSON.stringify({ email, password }),
        signal: controller.signal,
      })

      clearTimeout(timeout)
      const data = await res.json()

      if (!res.ok || data.error) {
        toast.error(data.error_description || data.msg || 'Email ou mot de passe incorrect')
        setLoading(false)
        return
      }

      localStorage.setItem(getStorageKey(), JSON.stringify({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        token_type: data.token_type,
        expires_in: data.expires_in,
        expires_at: data.expires_at,
        user: data.user,
      }))

      toast.success('Connexion reussie')
      window.location.href = '/ventes'
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(msg)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-[45%] gradient-dark relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0">
          <div className="absolute top-16 right-16 w-80 h-80 rounded-full border border-gold/10" />
          <div className="absolute bottom-24 left-12 w-64 h-64 rounded-full border border-gold/5" />
          <div className="absolute top-1/3 left-1/4 w-40 h-40 rounded-full bg-gold/3" />
        </div>
        <div className="relative z-10 text-center px-16 max-w-lg">
          <div className="w-24 h-24 mx-auto mb-8 rounded-2xl overflow-hidden shadow-2xl ring-2 ring-gold/20">
            <img src="/logo.jpg" alt="SmartPack" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">SmartPack</h1>
          <div className="w-12 h-0.5 bg-gold mx-auto mb-4" />
          <p className="text-white/50 text-base leading-relaxed">
            Plateforme de gestion commerciale pour votre entreprise d&apos;emballage
          </p>
          <div className="mt-16 grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold gold-text mb-1">100%</div>
              <div className="text-white/40 text-xs">Securise</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold gold-text mb-1">24/7</div>
              <div className="text-white/40 text-xs">Accessible</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold gold-text mb-1">PWA</div>
              <div className="text-white/40 text-xs">Mobile</div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-[55%] flex items-center justify-center p-6 bg-white dark:bg-background">
        <div className="w-full max-w-[440px]">
          <div className="lg:hidden text-center mb-10">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl overflow-hidden shadow-lg ring-2 ring-gold/20">
              <img src="/logo.jpg" alt="SmartPack" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">SmartPack</h1>
            <div className="w-8 h-0.5 bg-gold mx-auto mt-2 mb-1" />
            <p className="text-muted text-sm">Gestion Commerciale</p>
          </div>

          <div className="lg:px-2">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-foreground hidden lg:block">Bienvenue</h2>
              <p className="text-muted text-sm mt-2 hidden lg:block">Connectez-vous a votre espace de gestion</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label htmlFor="email" className="flex items-center gap-1.5 text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                  <svg className="w-4 h-4 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  required
                  className="input-field"
                />
              </div>

              <div>
                <label htmlFor="password" className="flex items-center gap-1.5 text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                  <svg className="w-4 h-4 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Mot de passe
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Votre mot de passe"
                  required
                  className="input-field"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 btn-gold text-[15px] flex items-center justify-center gap-2 rounded-xl"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                ) : (
                  'Se connecter'
                )}
              </button>
            </form>

            <p className="text-center text-muted/50 text-xs mt-10">
              SmartPack v1.0 — Emballage Meknes
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
