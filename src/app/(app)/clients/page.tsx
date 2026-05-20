'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SearchBox } from '@/components/ui/search-box'
import { formatDH } from '@/lib/utils/format'
import { useAuth } from '@/lib/auth/auth-context'
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
  const { isAdmin } = useAuth()
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

    if (error) { toast.error('Erreur: ' + error.message); return }

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

  return (
    <>
      <div className="px-4 py-3">
        <SearchBox placeholder="Rechercher un client..." value={search} onChange={setSearch} />
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-9 h-9 border-3 border-gray-200 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="px-4">
          {filtered.map(c => (
            <div key={c.id} className="flex items-center py-3 border-b border-gray-50">
              <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center text-base mr-3 shrink-0">
                {c.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold">{c.name}</div>
                {c.location && <div className="text-xs text-gray-400">{c.location}</div>}
              </div>
              {c.credit > 0 ? (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-red-light text-red">
                  Credit: {formatDH(c.credit)}
                </span>
              ) : (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-primary-light text-primary">
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
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Nom *</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nom du client"
              className="w-full px-3.5 py-3 border-[1.5px] border-gray-200 rounded-[10px] text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Ville</label>
            <input
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              placeholder="Ville / Emplacement"
              className="w-full px-3.5 py-3 border-[1.5px] border-gray-200 rounded-[10px] text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Telephone</label>
            <input
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="06XXXXXXXX"
              className="w-full px-3.5 py-3 border-[1.5px] border-gray-200 rounded-[10px] text-sm outline-none focus:border-primary"
            />
          </div>
          <button
            onClick={createNewClient}
            className="w-full py-3.5 bg-primary text-white border-none rounded-[10px] text-[15px] font-semibold flex items-center justify-center gap-2"
          >
            Creer le client
          </button>
        </div>
      </ModalSheet>
    </>
  )
}
