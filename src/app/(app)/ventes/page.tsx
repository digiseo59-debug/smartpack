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

  return (
    <>
      <FilterTabs tabs={filterOptions} active={filter} onChange={setFilter} />

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-9 h-9 border-3 border-gray-200 border-t-primary rounded-full animate-spin" />
        </div>
      ) : sales.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
          </svg>
          <p className="text-sm">Aucune vente trouvee</p>
        </div>
      ) : (
        <div className="space-y-2 px-4 py-2">
          {sales.map((sale) => (
            <div
              key={sale.id}
              className="bg-white rounded-xl p-3.5 shadow-[0_1px_4px_rgba(0,0,0,0.06)] relative cursor-pointer active:scale-[0.99] transition-transform"
              onClick={() => router.push(`/ventes/${sale.id}`)}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="text-xs text-gray-400">
                    {formatDateShort(sale.date)}
                    <span className="ml-1.5 text-gray-300">{sale.ref_number}</span>
                  </span>
                </div>
                <div className="text-lg font-bold text-primary">{formatDH(sale.total_amount)}</div>
              </div>
              <div className="text-[15px] font-semibold mb-2.5">
                {(sale.client as unknown as { name: string })?.name ?? 'Client inconnu'}
              </div>
              <div className="flex gap-2 flex-wrap">
                <Tag variant="user">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  par {(sale.creator as unknown as { full_name: string })?.full_name ?? 'Inconnu'}
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
