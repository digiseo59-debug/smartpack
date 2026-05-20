'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      router.replace(user ? '/ventes' : '/login')
    })
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center gradient-dark">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center overflow-hidden ring-2 ring-gold/20">
          <img src="/logo.jpg" alt="SmartPack" className="w-full h-full object-cover" />
        </div>
        <div className="w-8 h-8 border-2 border-white/10 border-t-gold rounded-full animate-spin mx-auto mt-4" />
      </div>
    </div>
  )
}
