'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ModalSheet } from '@/components/ui/modal-sheet'
import { SearchBox } from '@/components/ui/search-box'
import { formatDH } from '@/lib/utils/format'
import toast from 'react-hot-toast'
import type { Supplier, PaymentMode } from '@/types/database'

interface PurchaseArticle {
  id: string
  product_name: string
  qty: number
  cost: number
}

export default function NewPurchasePage() {
  const router = useRouter()
  const supabase = createClient()

  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [articles, setArticles] = useState<PurchaseArticle[]>([])
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash')
  const [isCredit, setIsCredit] = useState(false)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [supplierModalOpen, setSupplierModalOpen] = useState(false)
  const [supplierSearch, setSupplierSearch] = useState('')

  useEffect(() => {
    supabase.from('suppliers').select('*').order('name').then(({ data }) => setSuppliers(data ?? []))
  }, [])

  function addArticle() {
    setArticles(prev => [...prev, { id: crypto.randomUUID(), product_name: '', qty: 1, cost: 0 }])
  }

  function updatePurchaseArticle(id: string, field: keyof PurchaseArticle, value: string | number) {
    setArticles(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a))
  }

  function removeArticle(id: string) {
    setArticles(prev => prev.filter(a => a.id !== id))
  }

  const total = articles.reduce((sum, a) => sum + a.qty * a.cost, 0)

  async function confirmPurchase() {
    if (!selectedSupplier) { toast.error('Selectionnez un fournisseur'); return }
    if (articles.length === 0) { toast.error('Ajoutez au moins un article'); return }

    setSubmitting(true)

    const { data: counter } = await supabase.from('settings').select('value').eq('key', 'purchase_counter').single()
    const counterValue = counter?.value as Record<string, number> | null
    const nextId = counterValue?.next_id ?? 1
    const refNumber = `ACH-${counterValue?.year ?? 2026}-${String(nextId).padStart(3, '0')}`

    const { error } = await supabase.from('purchases').insert({
      ref_number: refNumber,
      supplier_id: selectedSupplier.id,
      total_amount: total,
      payment_mode: paymentMode,
      is_credit: isCredit,
      credit_amount: isCredit ? total : 0,
      notes,
      created_by: (await supabase.auth.getUser()).data.user?.id,
    })

    if (!error) {
      await supabase.from('settings').update({
        value: { ...counterValue, next_id: nextId + 1 },
      }).eq('key', 'purchase_counter')

      toast.success('Achat cree avec succes')
      router.push('/achats')
    } else {
      toast.error('Erreur: ' + error.message)
    }

    setSubmitting(false)
  }

  const filteredSuppliers = suppliers.filter(s => s.name.toLowerCase().includes(supplierSearch.toLowerCase()))

  return (
    <div className="px-4 py-3 space-y-3">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-500 mb-2">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Retour
      </button>

      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="text-xs font-semibold text-orange uppercase tracking-wider mb-3">Fournisseur</div>
        <button
          onClick={() => setSupplierModalOpen(true)}
          className="w-full px-3.5 py-3 border-[1.5px] border-gray-200 rounded-[10px] text-sm bg-white flex justify-between items-center"
        >
          <span>{selectedSupplier?.name ?? 'Selectionner un fournisseur'}</span>
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="text-xs font-semibold text-orange uppercase tracking-wider mb-3">Articles</div>
        {articles.map(art => (
          <div key={art.id} className="bg-gray-50 rounded-[10px] p-3.5 mb-2">
            <div className="flex justify-between mb-2">
              <input
                type="text"
                value={art.product_name}
                onChange={(e) => updatePurchaseArticle(art.id, 'product_name', e.target.value)}
                placeholder="Nom du produit"
                className="border-none bg-transparent text-sm font-semibold outline-none flex-1"
              />
              <button onClick={() => removeArticle(art.id)} className="text-red text-lg ml-2">&times;</button>
            </div>
            <div className="grid grid-cols-[1fr_1fr_auto] gap-2.5 items-end">
              <div>
                <label className="text-[11px] text-gray-400 block mb-1">Quantite</label>
                <input type="number" value={art.qty} min={1}
                  onChange={(e) => updatePurchaseArticle(art.id, 'qty', parseInt(e.target.value) || 1)}
                  className="w-full py-2.5 px-2 border-[1.5px] border-gray-300 rounded-lg text-sm text-center" />
              </div>
              <div>
                <label className="text-[11px] text-gray-400 block mb-1">Cout (DH)</label>
                <input type="number" value={art.cost} step={0.01}
                  onChange={(e) => updatePurchaseArticle(art.id, 'cost', parseFloat(e.target.value) || 0)}
                  className="w-full py-2.5 px-2 border-[1.5px] border-gray-300 rounded-lg text-sm text-center" />
              </div>
              <div className="text-sm font-bold text-orange text-right pb-2">{formatDH(art.qty * art.cost)}</div>
            </div>
          </div>
        ))}
        <button onClick={addArticle}
          className="w-full py-3 bg-white text-orange border-[1.5px] border-orange rounded-[10px] text-sm font-semibold flex items-center justify-center gap-1.5 mt-2">
          + Ajouter un article
        </button>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex justify-between items-center py-4 border-t-2 border-gray-200">
          <span className="text-sm text-gray-500">Total</span>
          <strong className="text-[22px] text-orange">{formatDH(total)}</strong>
        </div>
        <div className="flex justify-between items-center py-3">
          <h4 className="text-sm font-semibold">Achat a credit</h4>
          <button onClick={() => setIsCredit(!isCredit)}
            className={`w-12 h-[26px] rounded-full relative transition-colors cursor-pointer ${isCredit ? 'bg-orange' : 'bg-gray-300'}`}>
            <span className={`absolute w-[22px] h-[22px] bg-white rounded-full top-0.5 left-0.5 transition-transform shadow-sm ${isCredit ? 'translate-x-[22px]' : ''}`} />
          </button>
        </div>
        <button onClick={confirmPurchase} disabled={submitting}
          className="w-full py-3.5 bg-orange text-white border-none rounded-[10px] text-[15px] font-semibold mt-4 flex items-center justify-center gap-2 disabled:bg-gray-300">
          {submitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Confirmer achat'}
        </button>
      </div>

      <ModalSheet open={supplierModalOpen} onClose={() => setSupplierModalOpen(false)} title="Selectionner un fournisseur">
        <SearchBox placeholder="Rechercher..." value={supplierSearch} onChange={setSupplierSearch} />
        {filteredSuppliers.map(s => (
          <div key={s.id} onClick={() => { setSelectedSupplier(s); setSupplierModalOpen(false) }}
            className="flex items-center py-3 border-b border-gray-50 cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-orange text-white flex items-center justify-center text-base mr-3">
              {s.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold">{s.name}</div>
              {s.location && <div className="text-xs text-gray-400">{s.location}</div>}
            </div>
          </div>
        ))}
      </ModalSheet>
    </div>
  )
}
