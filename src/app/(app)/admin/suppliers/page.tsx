'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth/auth-context'
import { ModalSheet } from '@/components/ui/modal-sheet'
import { formatDH } from '@/lib/utils/format'
import toast from 'react-hot-toast'
import type { Supplier } from '@/types/database'

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', location: '' })
  const { isAdmin } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (!isAdmin) { router.replace('/ventes'); return }
    loadSuppliers()
  }, [isAdmin])

  async function loadSuppliers() {
    const { data } = await supabase.from('suppliers').select('*').order('name')
    setSuppliers(data ?? [])
    setLoading(false)
  }

  async function createSupplier() {
    if (!form.name.trim()) { toast.error('Nom requis'); return }
    const { error } = await supabase.from('suppliers').insert(form)
    if (error) { toast.error(error.message); return }
    toast.success('Fournisseur cree')
    setModalOpen(false)
    setForm({ name: '', phone: '', location: '' })
    loadSuppliers()
  }

  return (
    <div className="px-4 lg:px-6 py-4">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-muted hover:text-foreground mb-4 transition-colors cursor-pointer">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Retour
      </button>

      <button onClick={() => setModalOpen(true)}
        className="w-full py-3 bg-orange text-white rounded-xl text-sm font-semibold mb-4 cursor-pointer">
        + Ajouter un fournisseur
      </button>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-9 h-9 border-[2.5px] border-border border-t-gold rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {suppliers.map(s => (
            <div key={s.id} className="card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange text-white flex items-center justify-center text-sm font-semibold">
                {s.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-foreground">{s.name}</div>
                {s.location && <div className="text-xs text-muted">{s.location}</div>}
                {s.phone && <div className="text-xs text-muted">{s.phone}</div>}
              </div>
              {s.credit > 0 && (
                <span className="text-xs font-semibold px-2 py-1 rounded-md bg-red-light text-red">
                  {formatDH(s.credit)}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <ModalSheet open={modalOpen} onClose={() => setModalOpen(false)} title="Nouveau fournisseur">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Nom *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nom du fournisseur" className="input-field" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Telephone</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="06XXXXXXXX" className="input-field" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Ville</label>
            <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Ville" className="input-field" />
          </div>
          <button onClick={createSupplier}
            className="w-full py-3.5 bg-orange text-white rounded-xl text-[15px] font-semibold cursor-pointer">
            Creer le fournisseur
          </button>
        </div>
      </ModalSheet>
    </div>
  )
}
