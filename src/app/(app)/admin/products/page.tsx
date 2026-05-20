'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth/auth-context'
import { ModalSheet } from '@/components/ui/modal-sheet'
import { SearchBox } from '@/components/ui/search-box'
import { FabButton } from '@/components/layout/fab-button'
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
  const [form, setForm] = useState({ name: '', category_id: '', stock: 0, price: 0, cost_price: 0, low_stock_threshold: 20, stock_type: 'normal' as 'normal' | 'serigraphie' })
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
    setForm({ name: '', category_id: categories[0]?.id ?? '', stock: 0, price: 0, cost_price: 0, low_stock_threshold: 20, stock_type: 'normal' })
    setModalOpen(true)
  }

  function openEdit(p: Product) {
    setEditProduct(p)
    setForm({
      name: p.name,
      category_id: p.category_id,
      stock: p.stock,
      price: p.price,
      cost_price: p.cost_price,
      low_stock_threshold: p.low_stock_threshold,
      stock_type: (p.stock_type as 'normal' | 'serigraphie') ?? 'normal',
    })
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

  async function deleteProduct() {
    if (!editProduct) return
    if (!confirm(`Supprimer "${editProduct.name}" ?`)) return

    const { error } = await supabase.from('products').update({ is_active: false }).eq('id', editProduct.id)
    if (error) { toast.error(error.message); return }
    toast.success('Produit supprime')
    setModalOpen(false)
    loadData()
  }

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="px-4 lg:px-6 py-4 space-y-4">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors cursor-pointer">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Retour
      </button>

      <SearchBox placeholder="Rechercher un produit..." value={search} onChange={setSearch} />

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-9 h-9 border-[2.5px] border-border border-t-gold rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden lg:block glass-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-5 py-3.5 text-[10px] font-bold text-muted uppercase tracking-widest">Produit</th>
                  <th className="text-left px-5 py-3.5 text-[10px] font-bold text-muted uppercase tracking-widest">Categorie</th>
                  <th className="text-right px-5 py-3.5 text-[10px] font-bold text-muted uppercase tracking-widest">Prix</th>
                  <th className="text-right px-5 py-3.5 text-[10px] font-bold text-muted uppercase tracking-widest">Stock</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} onClick={() => openEdit(p)} className="border-b border-border/50 hover:bg-gold/3 cursor-pointer transition-colors">
                    <td className="px-5 py-3.5 text-sm font-bold text-foreground">{p.name}</td>
                    <td className="px-5 py-3.5 text-xs text-muted font-medium">{(p.category as unknown as { name: string })?.name}</td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-foreground text-right">{formatDH(p.price)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <span className={`text-lg font-black stat-number ${p.stock > p.low_stock_threshold ? 'text-foreground' : p.stock > 0 ? 'text-orange' : 'text-red'}`}>
                        {p.stock}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {filtered.map(p => (
              <div key={p.id} onClick={() => openEdit(p)}
                className="glass-card card-hover p-4 flex justify-between items-center cursor-pointer">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{p.name}</p>
                  <p className="text-xs text-muted mt-0.5">
                    {(p.category as unknown as { name: string })?.name}
                    <span className="mx-1.5 text-border">·</span>
                    {formatDH(p.price)}
                  </p>
                </div>
                <div className={`text-xl font-black ml-3 stat-number ${p.stock > p.low_stock_threshold ? 'text-foreground' : p.stock > 0 ? 'text-orange' : 'text-red'}`}>
                  {p.stock}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <FabButton onClick={openNew} />

      <ModalSheet open={modalOpen} onClose={() => setModalOpen(false)} title={editProduct ? 'Modifier produit' : 'Nouveau produit'}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Nom *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nom du produit" className="input-field" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Categorie *</label>
            <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="input-field">
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Type de stock</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, stock_type: 'normal' })}
                className={`py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${form.stock_type === 'normal' ? 'hero-stat text-white' : 'bg-surface border border-border text-muted'}`}
              >
                Normal
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, stock_type: 'serigraphie' })}
                className={`py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${form.stock_type === 'serigraphie' ? 'hero-stat text-white' : 'bg-surface border border-border text-muted'}`}
              >
                Serigraphie
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Stock</label>
              <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) || 0 })} className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Prix vente (DH)</label>
              <input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Prix achat (DH)</label>
              <input type="number" step="0.01" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: parseFloat(e.target.value) || 0 })} className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Seuil bas</label>
              <input type="number" value={form.low_stock_threshold} onChange={(e) => setForm({ ...form, low_stock_threshold: parseInt(e.target.value) || 20 })} className="input-field" />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            {editProduct && (
              <button onClick={deleteProduct} className="px-4 py-3.5 bg-red-light text-red rounded-xl text-sm font-bold cursor-pointer hover:bg-red/15 transition-colors">
                Supprimer
              </button>
            )}
            <button onClick={saveProduct} className="flex-1 py-3.5 btn-gold rounded-xl text-[15px] cursor-pointer">
              {editProduct ? 'Enregistrer' : 'Creer le produit'}
            </button>
          </div>
        </div>
      </ModalSheet>
    </div>
  )
}
