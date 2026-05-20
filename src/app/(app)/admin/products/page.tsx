'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth/auth-context'
import { ModalSheet } from '@/components/ui/modal-sheet'
import { SearchBox } from '@/components/ui/search-box'
import { formatDH } from '@/lib/utils/format'
import toast from 'react-hot-toast'
import type { Product, Category } from '@/types/database'

export default function ProductsAdminPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [form, setForm] = useState({ name: '', category_id: '', stock: 0, price: 0, cost_price: 0, low_stock_threshold: 20 })
  const { isAdmin } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (!isAdmin) { router.replace('/ventes'); return }
    loadData()
  }, [isAdmin])

  async function loadData() {
    const [{ data: prods }, { data: cats }] = await Promise.all([
      supabase.from('products').select('*, category:categories(name)').order('name'),
      supabase.from('categories').select('*').order('sort_order'),
    ])
    setProducts(prods ?? [])
    setCategories(cats ?? [])
    setLoading(false)
  }

  function openNew() {
    setEditProduct(null)
    setForm({ name: '', category_id: categories[0]?.id ?? '', stock: 0, price: 0, cost_price: 0, low_stock_threshold: 20 })
    setModalOpen(true)
  }

  function openEdit(p: Product) {
    setEditProduct(p)
    setForm({ name: p.name, category_id: p.category_id, stock: p.stock, price: p.price, cost_price: p.cost_price, low_stock_threshold: p.low_stock_threshold })
    setModalOpen(true)
  }

  async function saveProduct() {
    if (!form.name || !form.category_id) { toast.error('Nom et categorie requis'); return }

    if (editProduct) {
      const { error } = await supabase.from('products').update(form).eq('id', editProduct.id)
      if (error) { toast.error(error.message); return }
      toast.success('Produit modifie')
    } else {
      const { error } = await supabase.from('products').insert(form)
      if (error) { toast.error(error.message); return }
      toast.success('Produit cree')
    }

    setModalOpen(false)
    loadData()
  }

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="px-4 py-3">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-500 mb-3">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Retour
      </button>

      <button onClick={openNew}
        className="w-full py-3 bg-primary text-white rounded-[10px] text-sm font-semibold flex items-center justify-center gap-2 mb-4">
        + Ajouter un produit
      </button>

      <SearchBox placeholder="Rechercher un produit..." value={search} onChange={setSearch} />

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-9 h-9 border-3 border-gray-200 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(p => (
            <div key={p.id} onClick={() => openEdit(p)}
              className="bg-white rounded-xl p-4 flex justify-between items-center cursor-pointer active:scale-[0.99] transition-transform">
              <div>
                <div className="text-sm font-semibold">{p.name}</div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {(p.category as unknown as { name: string })?.name} - {formatDH(p.price)}
                </div>
              </div>
              <div className={`text-lg font-bold ${p.stock > 20 ? 'text-primary' : p.stock > 0 ? 'text-orange' : 'text-red'}`}>
                {p.stock}
              </div>
            </div>
          ))}
        </div>
      )}

      <ModalSheet open={modalOpen} onClose={() => setModalOpen(false)} title={editProduct ? 'Modifier produit' : 'Nouveau produit'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Nom *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nom du produit"
              className="w-full px-3.5 py-3 border-[1.5px] border-gray-200 rounded-[10px] text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Categorie *</label>
            <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              className="w-full px-3.5 py-3 border-[1.5px] border-gray-200 rounded-[10px] text-sm outline-none focus:border-primary bg-white">
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Stock</label>
              <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) || 0 })}
                className="w-full px-3.5 py-3 border-[1.5px] border-gray-200 rounded-[10px] text-sm outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Prix vente (DH)</label>
              <input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                className="w-full px-3.5 py-3 border-[1.5px] border-gray-200 rounded-[10px] text-sm outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Prix achat (DH)</label>
              <input type="number" step="0.01" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: parseFloat(e.target.value) || 0 })}
                className="w-full px-3.5 py-3 border-[1.5px] border-gray-200 rounded-[10px] text-sm outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Seuil stock bas</label>
              <input type="number" value={form.low_stock_threshold} onChange={(e) => setForm({ ...form, low_stock_threshold: parseInt(e.target.value) || 20 })}
                className="w-full px-3.5 py-3 border-[1.5px] border-gray-200 rounded-[10px] text-sm outline-none focus:border-primary" />
            </div>
          </div>
          <button onClick={saveProduct}
            className="w-full py-3.5 bg-primary text-white rounded-[10px] text-[15px] font-semibold">
            {editProduct ? 'Enregistrer' : 'Creer le produit'}
          </button>
        </div>
      </ModalSheet>
    </div>
  )
}
