'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

interface AppHeaderProps {
  title: string
}

export function AppHeader({ title }: AppHeaderProps) {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Deconnecte')
    router.push('/login')
  }

  return (
    <header className="bg-primary text-white px-4 py-3 flex justify-between items-center fixed top-0 left-0 right-0 z-[1000] h-14">
      <div className="flex items-center gap-3">
        <img src="/logo.jpg" alt="SmartPack" className="w-8 h-8 rounded-full object-cover" />
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>
      <div className="flex gap-4 items-center">
        <button onClick={handleLogout} className="opacity-80 hover:opacity-100 transition-opacity">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </header>
  )
}
