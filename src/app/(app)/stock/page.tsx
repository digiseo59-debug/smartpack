'use client'

import { useEffect, useState } from 'react'
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

  return (
    <>
      {/* Stock type filter */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto">
        {[
          { key: 'all', label: 'Toutes', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
          { key: 'normal', label: 'Normal', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
          { key: 'serigraphie', label: 'Serigraphie', icon: 'M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2z' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setStockType(t.key)}
            className={`px-4 py-2 rounded-full text-xs font-semibold border-[1.5px] whitespace-nowrap flex items-center gap-1.5 transition-all ${
              stockType === t.key ? 'bg-primary text-white border-primary' : 'bg-white text-gray-500 border-gray-200'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={t.icon} />
            </svg>
            {t.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="px-4">
        <SearchBox placeholder="Rechercher un produit..." value={search} onChange={setSearch} />
      </div>

      {/* Category filter */}
      <div className="flex gap-2 px-4 pb-2 overflow-x-auto">
        <button
          onClick={() => setCategoryFilter('all')}
          className={`px-4 py-2 rounded-full text-xs font-semibold border-[1.5px] whitespace-nowrap transition-all ${
            categoryFilter === 'all' ? 'bg-primary text-white border-primary' : 'bg-white text-gray-500 border-gray-200'
          }`}
        >
          Toutes
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategoryFilter(cat.slug)}
            className={`px-4 py-2 rounded-full text-xs font-semibold border-[1.5px] whitespace-nowrap transition-all ${
              categoryFilter === cat.slug ? 'bg-primary text-white border-primary' : 'bg-white text-gray-500 border-gray-200'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-9 h-9 border-3 border-gray-200 border-t-primary rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-sm">Aucun produit trouve</p>
        </div>
      ) : (
        <div className="space-y-2 px-4 pb-4">
          {filtered.map(p => {
            const status = getStockStatus(p.stock, p.low_stock_threshold)
            return (
              <div key={p.id} className="bg-white rounded-xl px-4 py-3.5 flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-semibold">{p.name}</h4>
                  <div className="text-xs text-gray-400 mt-1">
                    Prix ref: <span className="font-semibold text-foreground">{formatDH(p.price)}</span>
                  </div>
                  {status === 'low' && (
                    <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-orange-light text-orange mt-1">
                      Stock bas
                    </span>
                  )}
                  {status === 'out' && (
                    <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-red-light text-red mt-1">
                      Rupture
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <div className={`text-xl font-bold ${status === 'ok' ? 'text-primary' : status === 'low' ? 'text-orange' : 'text-red'}`}>
                    {p.stock}
                  </div>
                  <div className="text-[11px] text-gray-400">Piece</div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
