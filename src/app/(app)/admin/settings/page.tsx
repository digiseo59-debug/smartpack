'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth/auth-context'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const [settings, setSettings] = useState({ name: '', subtitle: '', currency: 'DH', phone: '', address: '' })
  const [loading, setLoading] = useState(true)
  const { isAdmin } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (!isAdmin) { router.replace('/ventes'); return }
    loadSettings()
  }, [isAdmin])

  async function loadSettings() {
    const { data } = await supabase.from('settings').select('value').eq('key', 'business').single()
    if (data?.value) setSettings(data.value as typeof settings)
    setLoading(false)
  }

  async function saveSettings() {
    const { error } = await supabase.from('settings').update({ value: settings }).eq('key', 'business')
    if (error) { toast.error(error.message); return }
    toast.success('Parametres enregistres')
  }

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="w-9 h-9 border-[2.5px] border-border border-t-gold rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="px-4 lg:px-6 py-4">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-muted hover:text-foreground mb-4 transition-colors cursor-pointer">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Retour
      </button>

      <div className="card p-5 space-y-4">
        <h3 className="text-[10px] font-bold text-gold uppercase tracking-widest">Informations entreprise</h3>
        <div>
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Nom de l&apos;entreprise</label>
          <input value={settings.name} onChange={(e) => setSettings({ ...settings, name: e.target.value })} className="input-field" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Sous-titre</label>
          <input value={settings.subtitle} onChange={(e) => setSettings({ ...settings, subtitle: e.target.value })} className="input-field" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Telephone</label>
          <input value={settings.phone} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} className="input-field" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Adresse</label>
          <input value={settings.address} onChange={(e) => setSettings({ ...settings, address: e.target.value })} className="input-field" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Devise</label>
          <input value={settings.currency} onChange={(e) => setSettings({ ...settings, currency: e.target.value })} className="input-field" />
        </div>
        <button onClick={saveSettings}
          className="w-full py-3.5 btn-gold rounded-xl text-[15px] cursor-pointer">
          Enregistrer
        </button>
      </div>
    </div>
  )
}
