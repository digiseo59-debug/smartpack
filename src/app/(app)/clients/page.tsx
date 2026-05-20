'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SearchBox } from '@/components/ui/search-box'
import { formatDH } from '@/lib/utils/format'
import { ModalSheet } from '@/components/ui/modal-sheet'
import { FabButton } from '@/components/layout/fab-button'
import toast from 'react-hot-toast'
import type { Client } from '@/types/database'

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editClient, setEditClient] = useState<Client | null>(null)
  const [form, setForm] = useState({ name: '', location: '', phone: '', notes: '' })
  const supabase = createClient()

  useEffect(() => { loadClients() }, [])

  async function loadClients() {
    const { data } = await supabase.from('clients').select('*').order('name')
    setClients(data ?? [])
    setLoading(false)
  }

  function openNew() {
    setEditClient(null)
    setForm({ name: '', location: '', phone: '', notes: '' })
    setModalOpen(true)
  }

  function openEdit(c: Client) {
    setEditClient(c)
    setForm({ name: c.name, location: c.location || '', phone: c.phone || '', notes: c.notes || '' })
    setModalOpen(true)
  }

  async function saveClient() {
    if (!form.name.trim()) { toast.error('Nom requis'); return }

    if (editClient) {
      const { error } = await supabase.from('clients').update({
        name: form.name.trim(),
        location: form.location.trim(),
        phone: form.phone.trim(),
        notes: form.notes.trim(),
      }).eq('id', editClient.id)
      if (error) { toast.error(error.message); return }
      toast.success('Client modifie')
    } else {
      const { error } = await supabase.from('clients').insert({
        name: form.name.trim(),
        location: form.location.trim(),
        phone: form.phone.trim(),
        notes: form.notes.trim(),
        created_by: (await supabase.auth.getUser()).data.user?.id,
      })
      if (error) { toast.error(error.message); return }
      toast.success('Client cree')
    }

    setModalOpen(false)
    loadClients()
  }

  async function deleteClient() {
    if (!editClient) return
    if (!confirm(`Supprimer "${editClient.name}" ?`)) return
    const { error } = await supabase.from('clients').delete().eq('id', editClient.id)
    if (error) { toast.error(error.message); return }
    toast.success('Client supprime')
    setModalOpen(false)
    loadClients()
  }

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  const totalCredit = filtered.reduce((sum, c) => sum + (c.credit > 0 ? c.credit : 0), 0)
  const debtorCount = filtered.filter(c => c.credit > 0).length

  return (
    <div className="px-4 lg:px-6 py-4 space-y-4">
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="hero-stat p-4">
            <div className="relative z-10">
              <div className="w-8 h-8 rounded-xl bg-gold/10 flex items-center justify-center mb-2">
                <svg className="w-4 h-4 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Total</p>
              <p className="text-2xl font-black text-white mt-1 stat-number">{filtered.length}</p>
            </div>
          </div>
          <div className="hero-stat p-4">
            <div className="relative z-10">
              <div className="w-8 h-8 rounded-xl bg-red/10 flex items-center justify-center mb-2">
                <svg className="w-4 h-4 text-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Debiteurs</p>
              <p className="text-2xl font-black text-red mt-1 stat-number">{debtorCount}</p>
            </div>
          </div>
          <div className="hero-stat p-4">
            <div className="relative z-10">
              <div className="w-8 h-8 rounded-xl bg-red/10 flex items-center justify-center mb-2">
                <svg className="w-4 h-4 text-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 1v8m0 0v1" />
                </svg>
              </div>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Creances</p>
              <p className="text-lg font-black text-red mt-1 stat-number">{formatDH(totalCredit)}</p>
            </div>
          </div>
        </div>
      )}

      <SearchBox placeholder="Rechercher un client..." value={search} onChange={setSearch} />

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-9 h-9 border-[2.5px] border-border border-t-gold rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="hidden lg:block glass-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-5 py-3.5 text-[10px] font-bold text-muted uppercase tracking-widest">Client</th>
                  <th className="text-left px-5 py-3.5 text-[10px] font-bold text-muted uppercase tracking-widest">Ville</th>
                  <th className="text-left px-5 py-3.5 text-[10px] font-bold text-muted uppercase tracking-widest">Telephone</th>
                  <th className="text-right px-5 py-3.5 text-[10px] font-bold text-muted uppercase tracking-widest">Solde</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} onClick={() => openEdit(c)} className="border-b border-border/50 hover:bg-gold/3 cursor-pointer transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl gradient-gold flex items-center justify-center text-xs font-black text-[#1a1a1a] shrink-0 shadow-md shadow-gold/15">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-bold text-foreground">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-muted font-medium">{c.location || '—'}</td>
                    <td className="px-5 py-3.5 text-xs text-muted font-medium">{c.phone || '—'}</td>
                    <td className="px-5 py-3.5 text-right">
                      {c.credit > 0 ? (
                        <span className="inline-block px-3 py-1 rounded-lg text-xs font-bold bg-red-light text-red">{formatDH(c.credit)}</span>
                      ) : (
                        <span className="inline-block px-3 py-1 rounded-lg text-xs font-bold bg-gold/8 text-gold-dark">Solde</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="lg:hidden grid grid-cols-1 gap-2.5">
            {filtered.map(c => (
              <div key={c.id} onClick={() => openEdit(c)} className="glass-card card-hover p-4 flex items-center gap-3 cursor-pointer">
                <div className="w-11 h-11 rounded-xl gradient-gold flex items-center justify-center text-base font-black text-[#1a1a1a] shrink-0 shadow-md shadow-gold/15">
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{c.name}</p>
                  {c.location && <p className="text-xs text-muted truncate mt-0.5">{c.location}</p>}
                </div>
                {c.credit > 0 ? (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-red-light text-red shrink-0">{formatDH(c.credit)}</span>
                ) : (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-gold/8 text-gold-dark shrink-0">Solde</span>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <FabButton onClick={openNew} />

      <ModalSheet open={modalOpen} onClose={() => setModalOpen(false)} title={editClient ? 'Modifier client' : 'Nouveau client'}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Nom *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nom du client" className="input-field" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Ville</label>
            <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Ville / Emplacement" className="input-field" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Telephone</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="06XXXXXXXX" className="input-field" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Notes</label>
            <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes internes" className="input-field" />
          </div>
          {editClient && editClient.credit > 0 && (
            <div className="p-3 rounded-xl bg-red-light border border-red/20">
              <p className="text-[10px] font-bold text-red uppercase tracking-widest">Credit en cours</p>
              <p className="text-lg font-black text-red mt-0.5">{formatDH(editClient.credit)}</p>
            </div>
          )}
          <div className="flex gap-2 pt-2">
            {editClient && (
              <button onClick={deleteClient} className="px-4 py-3.5 bg-red-light text-red rounded-xl text-sm font-bold cursor-pointer hover:bg-red/15 transition-colors">
                Supprimer
              </button>
            )}
            <button onClick={saveClient} className="flex-1 py-3.5 btn-gold rounded-xl text-[15px] cursor-pointer">
              {editClient ? 'Enregistrer' : 'Creer le client'}
            </button>
          </div>
        </div>
      </ModalSheet>
    </div>
  )
}
