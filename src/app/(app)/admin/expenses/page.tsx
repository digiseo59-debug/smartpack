'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth/auth-context'
import { ModalSheet } from '@/components/ui/modal-sheet'
import { formatDH, formatDate } from '@/lib/utils/format'
import toast from 'react-hot-toast'
import type { Expense } from '@/types/database'

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editExpense, setEditExpense] = useState<Expense | null>(null)
  const [form, setForm] = useState({ description: '', amount: 0, category: 'general' })
  const { isAdmin } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (!isAdmin) { router.replace('/ventes'); return }
    loadExpenses()
  }, [isAdmin])

  async function loadExpenses() {
    const { data } = await supabase.from('expenses').select('*').order('date', { ascending: false })
    setExpenses(data ?? [])
    setLoading(false)
  }

  function openNew() {
    setEditExpense(null)
    setForm({ description: '', amount: 0, category: 'general' })
    setModalOpen(true)
  }

  function openEdit(e: Expense) {
    setEditExpense(e)
    setForm({ description: e.description, amount: e.amount, category: e.category })
    setModalOpen(true)
  }

  async function saveExpense() {
    if (!form.description.trim() || !form.amount) { toast.error('Description et montant requis'); return }

    if (editExpense) {
      const { error } = await supabase.from('expenses').update(form).eq('id', editExpense.id)
      if (error) { toast.error(error.message); return }
      toast.success('Charge modifiee')
    } else {
      const { error } = await supabase.from('expenses').insert({
        ...form,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      })
      if (error) { toast.error(error.message); return }
      toast.success('Charge ajoutee')
    }

    setModalOpen(false)
    loadExpenses()
  }

  async function deleteExpense() {
    if (!editExpense) return
    if (!confirm(`Supprimer "${editExpense.description}" ?`)) return
    const { error } = await supabase.from('expenses').delete().eq('id', editExpense.id)
    if (error) { toast.error(error.message); return }
    toast.success('Charge supprimee')
    setModalOpen(false)
    loadExpenses()
  }

  const total = expenses.reduce((sum, e) => sum + e.amount, 0)

  return (
    <div className="px-4 lg:px-6 py-4 space-y-4">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors cursor-pointer">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Retour
      </button>

      <div className="hero-stat p-5">
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{expenses.length} charges</p>
            <p className="text-2xl font-black text-red mt-1 stat-number">{formatDH(total)}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-red/15 flex items-center justify-center">
            <svg className="w-6 h-6 text-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </div>

      <button onClick={openNew} className="w-full py-3.5 btn-gold rounded-xl text-sm font-bold cursor-pointer">
        + Ajouter une charge
      </button>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-9 h-9 border-[2.5px] border-border border-t-gold rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="hidden lg:block glass-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-5 py-3.5 text-[10px] font-bold text-muted uppercase tracking-widest">Date</th>
                  <th className="text-left px-5 py-3.5 text-[10px] font-bold text-muted uppercase tracking-widest">Description</th>
                  <th className="text-left px-5 py-3.5 text-[10px] font-bold text-muted uppercase tracking-widest">Categorie</th>
                  <th className="text-right px-5 py-3.5 text-[10px] font-bold text-muted uppercase tracking-widest">Montant</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map(e => (
                  <tr key={e.id} onClick={() => openEdit(e)} className="border-b border-border/50 hover:bg-gold/3 cursor-pointer transition-colors">
                    <td className="px-5 py-3.5 text-xs text-muted font-medium">{formatDate(e.date)}</td>
                    <td className="px-5 py-3.5 text-sm font-bold text-foreground">{e.description}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-red/8 text-red uppercase">{e.category}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right text-sm font-bold text-red">-{formatDH(e.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="lg:hidden space-y-2.5">
            {expenses.map(e => (
              <div key={e.id} onClick={() => openEdit(e)} className="glass-card card-hover p-4 flex justify-between items-center cursor-pointer">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-foreground truncate">{e.description}</p>
                  <p className="text-xs text-muted mt-0.5">
                    {formatDate(e.date)}
                    <span className="mx-1.5 text-border">·</span>
                    <span className="text-red/70 font-semibold uppercase text-[10px]">{e.category}</span>
                  </p>
                </div>
                <span className="text-sm font-black text-red ml-3 stat-number">-{formatDH(e.amount)}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <ModalSheet open={modalOpen} onClose={() => setModalOpen(false)} title={editExpense ? 'Modifier charge' : 'Nouvelle charge'}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Description *</label>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ex: Loyer, Electricite..." className="input-field" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Montant (DH) *</label>
            <input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} className="input-field" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Categorie</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-field">
              <option value="general">General</option>
              <option value="loyer">Loyer</option>
              <option value="electricite">Electricite</option>
              <option value="eau">Eau</option>
              <option value="transport">Transport</option>
              <option value="salaires">Salaires</option>
              <option value="autre">Autre</option>
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            {editExpense && (
              <button onClick={deleteExpense} className="px-4 py-3.5 bg-red-light text-red rounded-xl text-sm font-bold cursor-pointer hover:bg-red/15 transition-colors">
                Supprimer
              </button>
            )}
            <button onClick={saveExpense} className="flex-1 py-3.5 btn-gold rounded-xl text-[15px] cursor-pointer">
              {editExpense ? 'Enregistrer' : 'Ajouter la charge'}
            </button>
          </div>
        </div>
      </ModalSheet>
    </div>
  )
}
