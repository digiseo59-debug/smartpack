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

  async function createExpense() {
    if (!form.description.trim() || !form.amount) { toast.error('Description et montant requis'); return }
    const { error } = await supabase.from('expenses').insert({
      ...form,
      created_by: (await supabase.auth.getUser()).data.user?.id,
    })
    if (error) { toast.error(error.message); return }
    toast.success('Charge ajoutee')
    setModalOpen(false)
    setForm({ description: '', amount: 0, category: 'general' })
    loadExpenses()
  }

  const total = expenses.reduce((sum, e) => sum + e.amount, 0)

  return (
    <div className="px-4 py-3">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-500 mb-3">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Retour
      </button>

      <div className="bg-red-light rounded-xl p-4 mb-4 flex items-center gap-3">
        <svg className="w-6 h-6 text-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        <div>
          <div className="text-sm text-red font-semibold">Total charges</div>
          <div className="text-lg font-bold text-red">{formatDH(total)}</div>
        </div>
      </div>

      <button onClick={() => setModalOpen(true)}
        className="w-full py-3 bg-red text-white rounded-[10px] text-sm font-semibold mb-4">
        + Ajouter une charge
      </button>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-9 h-9 border-3 border-gray-200 border-t-red rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {expenses.map(e => (
            <div key={e.id} className="bg-white rounded-xl p-4 flex justify-between items-center">
              <div>
                <div className="text-sm font-semibold">{e.description}</div>
                <div className="text-xs text-gray-400 mt-0.5">{formatDate(e.date)} - {e.category}</div>
              </div>
              <span className="text-sm font-bold text-red">-{formatDH(e.amount)}</span>
            </div>
          ))}
        </div>
      )}

      <ModalSheet open={modalOpen} onClose={() => setModalOpen(false)} title="Nouvelle charge">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Description *</label>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ex: Loyer, Electricite..."
              className="w-full px-3.5 py-3 border-[1.5px] border-gray-200 rounded-[10px] text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Montant (DH) *</label>
            <input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
              className="w-full px-3.5 py-3 border-[1.5px] border-gray-200 rounded-[10px] text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Categorie</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-3.5 py-3 border-[1.5px] border-gray-200 rounded-[10px] text-sm outline-none focus:border-primary bg-white">
              <option value="general">General</option>
              <option value="loyer">Loyer</option>
              <option value="electricite">Electricite</option>
              <option value="eau">Eau</option>
              <option value="transport">Transport</option>
              <option value="salaires">Salaires</option>
              <option value="autre">Autre</option>
            </select>
          </div>
          <button onClick={createExpense}
            className="w-full py-3.5 bg-red text-white rounded-[10px] text-[15px] font-semibold">
            Ajouter la charge
          </button>
        </div>
      </ModalSheet>
    </div>
  )
}
