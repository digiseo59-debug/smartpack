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
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null)
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

  function openNew() {
    setEditSupplier(null)
    setForm({ name: '', phone: '', location: '' })
    setModalOpen(true)
  }

  function openEdit(s: Supplier) {
    setEditSupplier(s)
    setForm({ name: s.name, phone: s.phone || '', location: s.location || '' })
    setModalOpen(true)
  }

  async function saveSupplier() {
    if (!form.name.trim()) { toast.error('Nom requis'); return }

    if (editSupplier) {
      const { error } = await supabase.from('suppliers').update(form).eq('id', editSupplier.id)
      if (error) { toast.error(error.message); return }
      toast.success('Fournisseur modifie')
    } else {
      const { error } = await supabase.from('suppliers').insert(form)
      if (error) { toast.error(error.message); return }
      toast.success('Fournisseur cree')
    }

    setModalOpen(false)
    loadSuppliers()
  }

  async function deleteSupplier() {
    if (!editSupplier) return
    if (!confirm(`Supprimer "${editSupplier.name}" ?`)) return
    const { error } = await supabase.from('suppliers').delete().eq('id', editSupplier.id)
    if (error) { toast.error(error.message); return }
    toast.success('Fournisseur supprime')
    setModalOpen(false)
    loadSuppliers()
  }

  return (
    <div className="px-4 lg:px-6 py-4 space-y-4">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors cursor-pointer">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Retour
      </button>

      <button onClick={openNew} className="w-full py-3.5 btn-gold rounded-xl text-sm font-bold cursor-pointer">
        + Ajouter un fournisseur
      </button>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-9 h-9 border-[2.5px] border-border border-t-gold rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2.5">
          {suppliers.map(s => (
            <div key={s.id} onClick={() => openEdit(s)} className="glass-card card-hover p-4 flex items-center gap-3 cursor-pointer">
              <div className="w-11 h-11 rounded-xl gradient-gold flex items-center justify-center text-sm font-black text-[#1a1a1a] shrink-0 shadow-md shadow-gold/15">
                {s.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{s.name}</p>
                <div className="flex gap-2 mt-0.5">
                  {s.location && <p className="text-xs text-muted">{s.location}</p>}
                  {s.phone && <p className="text-xs text-muted">{s.phone}</p>}
                </div>
              </div>
              {s.credit > 0 && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-red-light text-red shrink-0">{formatDH(s.credit)}</span>
              )}
            </div>
          ))}
        </div>
      )}

      <ModalSheet open={modalOpen} onClose={() => setModalOpen(false)} title={editSupplier ? 'Modifier fournisseur' : 'Nouveau fournisseur'}>
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
          {editSupplier && editSupplier.credit > 0 && (
            <div className="p-3 rounded-xl bg-red-light border border-red/20">
              <p className="text-[10px] font-bold text-red uppercase tracking-widest">Credit en cours</p>
              <p className="text-lg font-black text-red mt-0.5">{formatDH(editSupplier.credit)}</p>
            </div>
          )}
          <div className="flex gap-2 pt-2">
            {editSupplier && (
              <button onClick={deleteSupplier} className="px-4 py-3.5 bg-red-light text-red rounded-xl text-sm font-bold cursor-pointer hover:bg-red/15 transition-colors">
                Supprimer
              </button>
            )}
            <button onClick={saveSupplier} className="flex-1 py-3.5 btn-gold rounded-xl text-[15px] cursor-pointer">
              {editSupplier ? 'Enregistrer' : 'Creer le fournisseur'}
            </button>
          </div>
        </div>
      </ModalSheet>
    </div>
  )
}
