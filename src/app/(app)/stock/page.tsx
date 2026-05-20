'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SearchBox } from '@/components/ui/search-box'
import { FabButton } from '@/components/layout/fab-button'
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

  return (
    <>
      {/* Type filter */}
      <div className="flex gap-2 px-4 lg:px-6 py-4 overflow-x-auto">
        {[
          { key: 'all', label: 'Tous' },
          { key: 'normal', label: 'Normal' },
          { key: 'serigraphie', label: 'Serigraphie' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setStockType(t.key)}
            className={`px-5 py-2 rounded-xl text-[13px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
              stockType === t.key
                ? 'bg-primary text-white shadow-lg shadow-black/10'
                : 'card text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="px-4 lg:px-6">
        <SearchBox placeholder="Rechercher un produit..." value={search} onChange={setSearch} />
      </div>

      {/* Category pills */}
      <div className="flex gap-2 px-4 lg:px-6 py-3 overflow-x-auto">
        <button
          onClick={() => setCategoryFilter('all')}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            categoryFilter === 'all' ? 'bg-gold text-white' : 'card text-gray-500'
          }`}
        >
          Toutes
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategoryFilter(cat.slug)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              categoryFilter === cat.slug ? 'bg-gold text-white' : 'card text-gray-500'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Stats */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-2 gap-3 px-4 lg:px-6 mb-3">
          <div className="card p-4">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Stock total</p>
            <p className="text-xl font-bold mt-1">{totalStock}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Valeur FIFO</p>
            <p className="text-xl font-bold gold-text mt-1">{formatDH(totalValue)}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-9 h-9 border-[2.5px] border-gray-200 dark:border-gray-700 border-t-gold rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-gray-400 font-medium">Aucun produit trouve</p>
        </div>
      ) : (
        <div className="px-4 lg:px-6 pb-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map(p => {
            const status = getStockStatus(p.stock, p.low_stock_threshold)
            return (
              <div
                key={p.id}
                onClick={() => isAdmin && router.push('/admin/products')}
                className={`card ${isAdmin ? 'card-hover cursor-pointer' : ''} p-4 flex justify-between items-center`}
              >
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold truncate">{p.name}</h4>
                  <p className="text-xs text-gray-400 mt-1">
                    Prix: <span className="font-semibold">{formatDH(p.price)}</span>
                  </p>
                  {status === 'low' && (
                    <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-orange-light text-orange mt-1.5">
                      Stock bas
                    </span>
                  )}
                  {status === 'out' && (
                    <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-red-light text-red mt-1.5">
                      Rupture
                    </span>
                  )}
                </div>
                <div className="text-right ml-3">
                  <div className={`text-2xl font-bold ${status === 'ok' ? '' : status === 'low' ? 'text-orange' : 'text-red'}`}>
                    {p.stock}
                  </div>
                  <div className="text-[10px] text-gray-400 font-medium">unites</div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {isAdmin && <FabButton onClick={() => router.push('/admin/products')} />}
    </>
  )
}
