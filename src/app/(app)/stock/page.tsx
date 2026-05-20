'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SearchBox } from '@/components/ui/search-box'
import { formatDH, getStockStatus } from '@/lib/utils/format'
import { useAuth } from '@/lib/auth/auth-context'
import type { Product, Category } from '@/types/database'

export default function StockPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [stockType, setStockType] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const { isAdmin } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const [{ data: prods }, { data: cats }] = await Promise.all([
      supabase.from('products').select('*, category:categories(name, slug)').eq('is_active', true).order('name'),
      supabase.from('categories').select('*').order('sort_order'),
    ])
    setProducts(prods ?? [])
    setCategories(cats ?? [])
    setLoading(false)
  }

  const filtered = products.filter(p => {
    if (stockType !== 'all' && p.stock_type !== stockType) return false
    if (categoryFilter !== 'all') {
      const cat = p.category as unknown as { slug: string }
      if (cat?.slug !== categoryFilter) return false
    }
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const totalStock = filtered.reduce((sum, p) => sum + p.stock, 0)
  const totalValue = filtered.reduce((sum, p) => sum + p.stock * p.cost_price, 0)
  const lowCount = filtered.filter(p => getStockStatus(p.stock, p.low_stock_threshold) === 'low').length
  const outCount = filtered.filter(p => getStockStatus(p.stock, p.low_stock_threshold) === 'out').length

  return (
    <div className="px-4 lg:px-6 py-4 space-y-4">
      {/* ── Hero Stats ── */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="hero-stat p-4">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-gold/10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              </div>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Total Stock</p>
              <p className="text-2xl font-black text-white mt-1 stat-number">{totalStock.toLocaleString('fr-FR')}</p>
            </div>
          </div>

          <div className="hero-stat p-4">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-gold/10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Valeur Stock</p>
              <p className="text-xl font-black text-gold mt-1 stat-number">{formatDH(totalValue)}</p>
            </div>
          </div>

          <div className="hero-stat p-4">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-orange/10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Stock Bas</p>
              <p className="text-2xl font-black text-orange mt-1 stat-number">{lowCount}</p>
            </div>
          </div>

          <div className="hero-stat p-4">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-red/10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                </div>
              </div>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Rupture</p>
              <p className="text-2xl font-black text-red mt-1 stat-number">{outCount}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Filters ── */}
      <div className="glass-card p-4 space-y-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { key: 'all', label: 'Tous' },
            { key: 'normal', label: 'Normal' },
            { key: 'serigraphie', label: 'Serigraphie' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setStockType(t.key)}
              className={`px-5 py-2.5 rounded-xl text-[13px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                stockType === t.key
                  ? 'hero-stat text-white shadow-lg'
                  : 'bg-surface text-muted border border-border hover:border-gold/30'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <SearchBox placeholder="Rechercher un produit..." value={search} onChange={setSearch} />

        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              categoryFilter === 'all' ? 'gradient-gold text-[#1a1a1a] shadow-md shadow-gold/20' : 'bg-surface text-muted border border-border hover:border-gold/20'
            }`}
          >
            Toutes
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.slug)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                categoryFilter === cat.slug ? 'gradient-gold text-[#1a1a1a] shadow-md shadow-gold/20' : 'bg-surface text-muted border border-border hover:border-gold/20'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* ── Product List ── */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-9 h-9 border-[2.5px] border-border border-t-gold rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gold/5 border border-border flex items-center justify-center">
            <svg className="w-8 h-8 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <p className="text-sm text-muted font-semibold">Aucun produit trouve</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden lg:block glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-5 py-3.5 text-[10px] font-bold text-muted uppercase tracking-widest">Produit</th>
                    <th className="text-left px-5 py-3.5 text-[10px] font-bold text-muted uppercase tracking-widest">Categorie</th>
                    <th className="text-right px-5 py-3.5 text-[10px] font-bold text-muted uppercase tracking-widest">Prix</th>
                    <th className="text-right px-5 py-3.5 text-[10px] font-bold text-muted uppercase tracking-widest">Stock</th>
                    <th className="text-right px-5 py-3.5 text-[10px] font-bold text-muted uppercase tracking-widest">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => {
                    const status = getStockStatus(p.stock, p.low_stock_threshold)
                    const catName = (p.category as unknown as { name: string })?.name ?? ''
                    return (
                      <tr
                        key={p.id}
                        onClick={() => isAdmin && router.push('/admin/products')}
                        className={`border-b border-border/50 transition-colors ${isAdmin ? 'hover:bg-gold/3 cursor-pointer' : ''}`}
                      >
                        <td className="px-5 py-3.5">
                          <p className="text-sm font-bold text-foreground">{p.name}</p>
                          <p className="text-[10px] text-muted mt-0.5">{p.stock_type === 'serigraphie' ? 'Serigraphie' : 'Normal'}</p>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-muted font-medium">{catName}</td>
                        <td className="px-5 py-3.5 text-sm font-semibold text-foreground text-right">{formatDH(p.price)}</td>
                        <td className="px-5 py-3.5 text-right">
                          <span className={`text-xl font-black stat-number ${status === 'ok' ? 'text-foreground' : status === 'low' ? 'text-orange' : 'text-red'}`}>
                            {p.stock}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          {status === 'ok' && (
                            <span className="inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold bg-gold/8 text-gold">OK</span>
                          )}
                          {status === 'low' && (
                            <span className="inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold bg-orange-light text-orange">Bas</span>
                          )}
                          {status === 'out' && (
                            <span className="inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold bg-red-light text-red">Rupture</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden grid grid-cols-1 gap-2.5">
            {filtered.map(p => {
              const status = getStockStatus(p.stock, p.low_stock_threshold)
              return (
                <div
                  key={p.id}
                  onClick={() => isAdmin && router.push('/admin/products')}
                  className={`glass-card card-hover p-4 flex items-center gap-3 ${isAdmin ? 'cursor-pointer' : ''}`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black shrink-0 stat-number ${
                    status === 'ok' ? 'bg-gold/8 text-foreground' : status === 'low' ? 'bg-orange-light text-orange' : 'bg-red-light text-red'
                  }`}>
                    {p.stock}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-foreground truncate">{p.name}</h4>
                    <p className="text-xs text-muted mt-0.5">
                      {formatDH(p.price)}
                      <span className="mx-1.5 text-border">·</span>
                      {(p.category as unknown as { name: string })?.name}
                    </p>
                  </div>
                  <div className="shrink-0">
                    {status === 'low' && (
                      <span className="inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold bg-orange-light text-orange">Bas</span>
                    )}
                    {status === 'out' && (
                      <span className="inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold bg-red-light text-red">Rupture</span>
                    )}
                    {status === 'ok' && (
                      <svg className="w-4 h-4 text-muted/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* FAB */}
      {isAdmin && (
        <button
          onClick={() => router.push('/admin/products')}
          className="fixed bottom-24 lg:bottom-8 right-6 lg:right-8 w-14 h-14 rounded-2xl text-2xl flex items-center justify-center cursor-pointer z-[999] transition-all active:scale-90 hover:scale-105 btn-gold shadow-xl shadow-gold/30"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}
    </div>
  )
}
