'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { Profile, UserRole } from '@/types/database'
import type { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  role: UserRole
  loading: boolean
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  role: 'salarie',
  loading: true,
  isAdmin: false,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function init() {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const ref = new URL(supabaseUrl).hostname.split('.')[0]
        const storageKey = `sb-${ref}-auth-token`
        const raw = localStorage.getItem(storageKey)

        if (!raw) {
          if (mounted) setLoading(false)
          return
        }

        const session = JSON.parse(raw)
        if (!session?.access_token || !session?.user) {
          if (mounted) setLoading(false)
          return
        }

        if (mounted) setUser(session.user)

        const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        const profileRes = await window.fetch(
          `${baseUrl}/rest/v1/profiles?id=eq.${session.user.id}&select=*`,
          {
            headers: {
              'apikey': apiKey,
              'Authorization': `Bearer ${session.access_token}`,
            },
          }
        )
        const profiles = await profileRes.json()
        if (mounted && profiles?.length > 0) {
          setProfile(profiles[0] as Profile)
        }
      } catch (e) {
        console.error('Auth init error:', e)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    init()

    return () => { mounted = false }
  }, [])

  const role = (profile?.role ?? 'salarie') as UserRole

  return (
    <AuthContext.Provider value={{ user, profile, role, loading, isAdmin: role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
