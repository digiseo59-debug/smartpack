'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FilterTabs } from '@/components/ui/filter-tabs'
import { FabButton } from '@/components/layout/fab-button'
import { Tag } from '@/components/ui/tag'
import { formatDH, formatDateShort, getPaymentLabel, getDateRange } from '@/lib/utils/format'
import { useAuth } from '@/lib/auth/auth-context'
import type { Sale } from '@/types/database'

const filterOptions = [
  { key: 'all', label: 'Tout' },
  { key: 'today', label: "Aujourd'hui" },
  { key: 'week', label: 'Semaine' },
  { key: 'month', label: 'Mois' },
]

export default function VentesPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { isAdmin } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    loadSales()
  }, [filter])

  async function loadSales() {
    setLoading(true)
    let query = supabase
      .from('sales')
      .select('*, client:clients(name), creator:profiles(full_name)')
      .order('date', { ascending: false })

    if (filter !== 'all') {
      const { from, to } = getDateRange(filter)
      query = query.gte('date', from.toISOString()).lte('date', to.toISOString())
    }

    const { data } = await query
    setSales(data ?? [])
    setLoading(false)
  }

  const totalAmount = sales.reduce((sum, s) => sum + (s.total_amount ?? 0), 0)

  return (
    <>
      <FilterTabs tabs={filterOptions} active={filter} onChange={setFilter} />

      {!loading && sales.length > 0 && (
        <div className="px-4 lg:px-6 mb-4">
          <div className="card p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{sales.length} ventes</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatDH(totalAmount)}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl gradient-gold flex items-center justify-center shadow-lg shadow-gold/20">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-9 h-9 border-[2.5px] border-gray-200 border-t-gold rounded-full animate-spin" />
        </div>
      ) : sales.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100">
            <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
          </div>
          <p className="text-sm text-gray-500 font-semibold">Aucune vente</p>
          <p className="text-xs text-gray-300 mt-1">Appuyez sur + pour creer une vente</p>
        </div>
      ) : (
        <div className="px-4 lg:px-6 pb-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {sales.map((sale) => (
            <div
              key={sale.id}
              className="card card-hover p-4 cursor-pointer"
              onClick={() => router.push(`/ventes/${sale.id}`)}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-xs text-gray-400">
                    {formatDateShort(sale.date)}
                    <span className="ml-2 text-gray-300">{sale.ref_number}</span>
                  </p>
                  <h3 className="text-[15px] font-bold text-gray-900 mt-1">
                    {(sale.client as unknown as { name: string })?.name ?? 'Client inconnu'}
                  </h3>
                </div>
                <p className="text-lg font-bold gold-text">{formatDH(sale.total_amount)}</p>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                <Tag variant="user">
                  {(sale.creator as unknown as { full_name: string })?.full_name ?? 'Inconnu'}
                </Tag>
                <Tag variant="cash">{getPaymentLabel(sale.payment_mode)}</Tag>
                {sale.is_credit && (
                  <Tag variant="credit">Credit: {formatDH(sale.credit_amount)}</Tag>
                )}
                {sale.is_gift && <Tag variant="gift">Offerte</Tag>}
              </div>
            </div>
          ))}
        </div>
      )}

      <FabButton onClick={() => router.push('/ventes/nouveau')} />
    </>
  )
}
