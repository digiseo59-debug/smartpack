'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth/auth-context'
import { useTheme } from '@/lib/theme/theme-context'
import toast from 'react-hot-toast'

interface AppHeaderProps {
  title: string
}

export function AppHeader({ title }: AppHeaderProps) {
  const router = useRouter()
  const { profile, isAdmin } = useAuth()
  const { theme, toggle } = useTheme()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Deconnecte')
    window.location.href = '/login'
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-[1000] h-[72px]">
      <div className="absolute inset-0 bg-[#0c0c0c]/95 glass border-b border-[rgba(200,169,96,0.1)]" />
      <div className="relative max-w-7xl mx-auto h-full px-5 lg:px-8 flex justify-between items-center">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl overflow-hidden ring-1.5 ring-gold/20 shadow-lg shadow-gold/10">
            <img src="/logo.jpg" alt="SmartPack" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-[16px] font-bold text-white tracking-tight">{title}</h1>
            <p className="text-[10px] text-gold/50 font-medium -mt-0.5 hidden sm:block tracking-wider uppercase">Smart Pack</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {isAdmin && (
            <button
              onClick={() => router.push('/admin')}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-gold transition-all cursor-pointer border border-gold/15 hover:border-gold/30 bg-gold/5 hover:bg-gold/10"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Admin
            </button>
          )}

          <div className="hidden sm:flex items-center gap-3 mr-1 pl-3 border-l border-white/8">
            <div className="w-8 h-8 rounded-xl gradient-gold flex items-center justify-center text-[11px] font-bold text-[#1a1a1a] shadow-lg shadow-gold/15">
              {profile?.full_name?.charAt(0)?.toUpperCase() ?? 'U'}
            </div>
            <div className="text-right">
              <p className="text-[12px] font-semibold text-white/90">{profile?.full_name ?? 'Utilisateur'}</p>
              <p className="text-[10px] text-gold/40 font-medium">{isAdmin ? 'Admin' : 'Salarie'}</p>
            </div>
          </div>

          <button
            onClick={toggle}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/8 hover:border-gold/20 transition-all cursor-pointer"
            title={theme === 'light' ? 'Mode sombre' : 'Mode clair'}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <svg className="w-[18px] h-[18px] text-gold/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            ) : (
              <svg className="w-[18px] h-[18px] text-gold/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
          </button>

          <button
            onClick={handleLogout}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-red/10 border border-white/8 hover:border-red/30 transition-all cursor-pointer group"
            title="Se deconnecter"
            aria-label="Logout"
          >
            <svg className="w-[18px] h-[18px] text-white/50 group-hover:text-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}
