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
  const [newClientModal, setNewClientModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newLocation, setNewLocation] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const supabase = createClient()

  useEffect(() => { loadClients() }, [])

  async function loadClients() {
    const { data } = await supabase.from('clients').select('*').order('name')
    setClients(data ?? [])
    setLoading(false)
  }

  async function createNewClient() {
    if (!newName.trim()) { toast.error('Nom requis'); return }

    const { error } = await supabase.from('clients').insert({
      name: newName.trim(),
      location: newLocation.trim(),
      phone: newPhone.trim(),
      created_by: (await supabase.auth.getUser()).data.user?.id,
    })

    if (error) { toast.error('Erreur: ' + (error?.message || JSON.stringify(error))); return }

    toast.success('Client cree')
    setNewClientModal(false)
    setNewName('')
    setNewLocation('')
    setNewPhone('')
    loadClients()
  }

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  const totalCredit = filtered.reduce((sum, c) => sum + (c.credit > 0 ? c.credit : 0), 0)
  const debtorCount = filtered.filter(c => c.credit > 0).length

  return (
    <>
      <div className="px-4 lg:px-6 py-4">
        <SearchBox placeholder="Rechercher un client..." value={search} onChange={setSearch} />
      </div>

      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-2 gap-3 px-4 lg:px-6 mb-4">
          <div className="card p-4">
            <p className="text-[10px] font-bold text-muted uppercase tracking-widest">{filtered.length} clients</p>
            <p className="text-lg font-bold text-foreground mt-1">{debtorCount} debiteurs</p>
          </div>
          <div className="card p-4">
            <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Total creances</p>
            <p className="text-lg font-bold text-red mt-1">{formatDH(totalCredit)}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-9 h-9 border-[2.5px] border-border border-t-gold rounded-full animate-spin" />
        </div>
      ) : (
        <div className="px-4 lg:px-6 pb-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map(c => (
            <div key={c.id} className="card card-hover p-4 flex items-center gap-3 cursor-pointer">
              <div className="w-11 h-11 rounded-xl gradient-dark text-gold flex items-center justify-center text-base font-bold shrink-0">
                {c.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{c.name}</p>
                {c.location && <p className="text-xs text-muted truncate">{c.location}</p>}
              </div>
              {c.credit > 0 ? (
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-red-light text-red shrink-0">
                  {formatDH(c.credit)}
                </span>
              ) : (
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-gold-50 text-gold-dark shrink-0">
                  Solde
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <FabButton onClick={() => setNewClientModal(true)} />

      <ModalSheet open={newClientModal} onClose={() => setNewClientModal(false)} title="Nouveau client">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Nom *</label>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nom du client" className="input-field" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Ville</label>
            <input value={newLocation} onChange={(e) => setNewLocation(e.target.value)} placeholder="Ville / Emplacement" className="input-field" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Telephone</label>
            <input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="06XXXXXXXX" className="input-field" />
          </div>
          <button onClick={createNewClient} className="w-full py-3.5 btn-gold text-[15px] rounded-xl cursor-pointer">
            Creer le client
          </button>
        </div>
      </ModalSheet>
    </>
  )
}
