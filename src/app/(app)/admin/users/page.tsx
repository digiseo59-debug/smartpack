'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth/auth-context'
import { ModalSheet } from '@/components/ui/modal-sheet'
import toast from 'react-hot-toast'
import type { Profile } from '@/types/database'

export default function UsersPage() {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [newName, setNewName] = useState('')
  const [newRole, setNewRole] = useState<'admin' | 'salarie'>('salarie')
  const [newPassword, setNewPassword] = useState('')
  const { isAdmin } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (!isAdmin) { router.replace('/ventes'); return }
    loadUsers()
  }, [isAdmin])

  async function loadUsers() {
    const { data } = await supabase.from('profiles').select('*').order('full_name')
    setUsers(data ?? [])
    setLoading(false)
  }

  async function createUser() {
    if (!newEmail || !newName || !newPassword) {
      toast.error('Remplissez tous les champs')
      return
    }

    const res = await fetch('/api/admin/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newEmail, password: newPassword, full_name: newName, role: newRole }),
    })

    if (res.ok) {
      toast.success('Utilisateur cree')
      setModalOpen(false)
      setNewEmail('')
      setNewName('')
      setNewPassword('')
      loadUsers()
    } else {
      const data = await res.json()
      toast.error(data.error ?? 'Erreur')
    }
  }

  return (
    <div className="px-4 py-3">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-500 mb-3">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Retour
      </button>

      <button
        onClick={() => setModalOpen(true)}
        className="w-full py-3 bg-primary text-white rounded-[10px] text-sm font-semibold flex items-center justify-center gap-2 mb-4"
      >
        + Ajouter un utilisateur
      </button>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-9 h-9 border-3 border-gray-200 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {users.map(u => (
            <div key={u.id} className="bg-white rounded-xl p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold ${u.role === 'admin' ? 'bg-purple' : 'bg-primary'}`}>
                {u.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold">{u.full_name}</div>
                <div className="text-xs text-gray-400">{u.role === 'admin' ? 'Administrateur' : 'Salarie'}</div>
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-md ${u.is_active ? 'bg-primary-light text-primary' : 'bg-red-light text-red'}`}>
                {u.is_active ? 'Actif' : 'Inactif'}
              </span>
            </div>
          ))}
        </div>
      )}

      <ModalSheet open={modalOpen} onClose={() => setModalOpen(false)} title="Nouvel utilisateur">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Nom complet *</label>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nom complet"
              className="w-full px-3.5 py-3 border-[1.5px] border-gray-200 rounded-[10px] text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Email *</label>
            <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="email@exemple.com"
              className="w-full px-3.5 py-3 border-[1.5px] border-gray-200 rounded-[10px] text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Mot de passe *</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mot de passe"
              className="w-full px-3.5 py-3 border-[1.5px] border-gray-200 rounded-[10px] text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Role</label>
            <div className="flex gap-2">
              <button onClick={() => setNewRole('salarie')}
                className={`flex-1 py-2.5 rounded-[10px] text-sm font-medium border-[1.5px] transition-all ${newRole === 'salarie' ? 'bg-primary text-white border-primary' : 'border-gray-200 text-gray-500'}`}>
                Salarie
              </button>
              <button onClick={() => setNewRole('admin')}
                className={`flex-1 py-2.5 rounded-[10px] text-sm font-medium border-[1.5px] transition-all ${newRole === 'admin' ? 'bg-purple text-white border-purple' : 'border-gray-200 text-gray-500'}`}>
                Admin
              </button>
            </div>
          </div>
          <button onClick={createUser}
            className="w-full py-3.5 bg-primary text-white rounded-[10px] text-[15px] font-semibold">
            Creer l'utilisateur
          </button>
        </div>
      </ModalSheet>
    </div>
  )
}
