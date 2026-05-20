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

  const activeCount = users.filter(u => u.is_active).length
  const adminCount = users.filter(u => u.role === 'admin').length

  return (
    <div className="px-4 lg:px-6 py-4 space-y-4">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors cursor-pointer">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Retour
      </button>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="hero-stat p-4">
          <div className="relative z-10">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Total</p>
            <p className="text-2xl font-black text-white mt-1 stat-number">{users.length}</p>
          </div>
        </div>
        <div className="hero-stat p-4">
          <div className="relative z-10">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Actifs</p>
            <p className="text-2xl font-black text-gold mt-1 stat-number">{activeCount}</p>
          </div>
        </div>
        <div className="hero-stat p-4">
          <div className="relative z-10">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Admins</p>
            <p className="text-2xl font-black text-purple mt-1 stat-number">{adminCount}</p>
          </div>
        </div>
      </div>

      <button
        onClick={() => setModalOpen(true)}
        className="w-full py-3.5 btn-gold rounded-xl text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
      >
        + Ajouter un utilisateur
      </button>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-9 h-9 border-[2.5px] border-border border-t-gold rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2.5">
          {users.map(u => (
            <div key={u.id} className="glass-card card-hover p-4 flex items-center gap-3 cursor-pointer">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-sm font-black shrink-0 shadow-md ${
                u.role === 'admin' ? 'bg-purple text-white shadow-purple/20' : 'gradient-gold text-[#1a1a1a] shadow-gold/20'
              }`}>
                {u.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{u.full_name}</p>
                <p className="text-xs text-muted mt-0.5">{u.role === 'admin' ? 'Administrateur' : 'Salarie'}</p>
              </div>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${u.is_active ? 'bg-gold/8 text-gold-dark' : 'bg-red-light text-red'}`}>
                {u.is_active ? 'Actif' : 'Inactif'}
              </span>
            </div>
          ))}
        </div>
      )}

      <ModalSheet open={modalOpen} onClose={() => setModalOpen(false)} title="Nouvel utilisateur">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Nom complet *</label>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nom complet" className="input-field" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Email *</label>
            <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="email@exemple.com" className="input-field" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Mot de passe *</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mot de passe" className="input-field" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Role</label>
            <div className="flex gap-2">
              <button onClick={() => setNewRole('salarie')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${newRole === 'salarie' ? 'hero-stat text-white' : 'bg-surface border border-border text-muted'}`}>
                Salarie
              </button>
              <button onClick={() => setNewRole('admin')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${newRole === 'admin' ? 'bg-purple text-white shadow-lg shadow-purple/20' : 'bg-surface border border-border text-muted'}`}>
                Admin
              </button>
            </div>
          </div>
          <button onClick={createUser}
            className="w-full py-3.5 btn-gold rounded-xl text-[15px] cursor-pointer">
            Creer l&apos;utilisateur
          </button>
        </div>
      </ModalSheet>
    </div>
  )
}
