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
        <div className="w-9 h-9 border-3 border-gray-200 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="px-4 py-3">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-500 mb-3">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Retour
      </button>

      <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
        <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Informations entreprise</h3>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1.5">Nom de l'entreprise</label>
          <input value={settings.name} onChange={(e) => setSettings({ ...settings, name: e.target.value })}
            className="w-full px-3.5 py-3 border-[1.5px] border-gray-200 rounded-[10px] text-sm outline-none focus:border-primary" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1.5">Sous-titre</label>
          <input value={settings.subtitle} onChange={(e) => setSettings({ ...settings, subtitle: e.target.value })}
            className="w-full px-3.5 py-3 border-[1.5px] border-gray-200 rounded-[10px] text-sm outline-none focus:border-primary" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1.5">Telephone</label>
          <input value={settings.phone} onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
            className="w-full px-3.5 py-3 border-[1.5px] border-gray-200 rounded-[10px] text-sm outline-none focus:border-primary" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1.5">Adresse</label>
          <input value={settings.address} onChange={(e) => setSettings({ ...settings, address: e.target.value })}
            className="w-full px-3.5 py-3 border-[1.5px] border-gray-200 rounded-[10px] text-sm outline-none focus:border-primary" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1.5">Devise</label>
          <input value={settings.currency} onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
            className="w-full px-3.5 py-3 border-[1.5px] border-gray-200 rounded-[10px] text-sm outline-none focus:border-primary" />
        </div>
        <button onClick={saveSettings}
          className="w-full py-3.5 bg-primary text-white rounded-[10px] text-[15px] font-semibold">
          Enregistrer
        </button>
      </div>
    </div>
  )
}
