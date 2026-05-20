'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FilterTabs } from '@/components/ui/filter-tabs'
import { FabButton } from '@/components/layout/fab-button'
import { Tag } from '@/components/ui/tag'
import { formatDH, formatDateShort, getPaymentLabel, getDateRange } from '@/lib/utils/format'
import { useAuth } from '@/lib/auth/auth-context'
import type { Purchase } from '@/types/database'

const filterOptions = [
  { key: 'all', label: 'Tout' },
  { key: 'today', label: "Aujourd'hui" },
  { key: 'week', label: 'Semaine' },
  { key: 'month', label: 'Mois' },
]

export default function AchatsPage() {
  const [achats, setAchats] = useState<Purchase[]>([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { isAdmin } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    loadAchats()
  }, [filter])

  async function loadAchats() {
    setLoading(true)
    let query = supabase
      .from('purchases')
      .select('*, supplier:suppliers(name), creator:profiles(full_name)')
      .order('date', { ascending: false })

    if (filter !== 'all') {
      const { from, to } = getDateRange(filter)
      query = query.gte('date', from.toISOString()).lte('date', to.toISOString())
    }

    const { data } = await query
    setAchats(data ?? [])
    setLoading(false)
  }

  return (
    <>
      <FilterTabs tabs={filterOptions} active={filter} onChange={setFilter} color="orange" />

      <div className="px-4 pt-1 pb-2">
        <Tag variant="orange">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
          </svg>
          Fournisseurs
        </Tag>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-9 h-9 border-3 border-gray-200 border-t-orange rounded-full animate-spin" />
        </div>
      ) : achats.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-sm">Aucun achat trouve</p>
        </div>
      ) : (
        <div className="space-y-2 px-4">
          {achats.map((achat) => (
            <div key={achat.id} className="bg-white rounded-xl p-3.5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs text-gray-400">{formatDateShort(achat.date)}</span>
                <div className="text-lg font-bold text-orange">{formatDH(achat.total_amount)}</div>
              </div>
              <div className="text-[15px] font-semibold mb-2.5">
                {(achat.supplier as unknown as { name: string })?.name ?? 'Fournisseur inconnu'}
              </div>
              <div className="flex gap-2 flex-wrap">
                <Tag variant="user">
                  par {(achat.creator as unknown as { full_name: string })?.full_name ?? 'Inconnu'}
                </Tag>
                <Tag variant="cash">{getPaymentLabel(achat.payment_mode)}</Tag>
                {achat.is_credit && <Tag variant="credit">Credit: {formatDH(achat.credit_amount)}</Tag>}
              </div>
            </div>
          ))}
        </div>
      )}

      {isAdmin && <FabButton onClick={() => router.push('/achats/nouveau')} variant="orange" />}
    </>
  )
}
