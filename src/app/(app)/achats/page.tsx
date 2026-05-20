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

  const totalAmount = achats.reduce((sum, a) => sum + (a.total_amount ?? 0), 0)

  return (
    <>
      <FilterTabs tabs={filterOptions} active={filter} onChange={setFilter} />

      {!loading && achats.length > 0 && (
        <div className="px-4 lg:px-6 mb-4">
          <div className="card p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-muted uppercase tracking-widest">{achats.length} achats</p>
              <p className="text-2xl font-bold text-foreground mt-1">{formatDH(totalAmount)}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-orange-light flex items-center justify-center">
              <svg className="w-6 h-6 text-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-9 h-9 border-[2.5px] border-border border-t-gold rounded-full animate-spin" />
        </div>
      ) : achats.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto mb-4 bg-primary-light rounded-2xl flex items-center justify-center border border-border">
            <svg className="w-8 h-8 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <p className="text-sm text-muted font-semibold">Aucun achat</p>
        </div>
      ) : (
        <div className="px-4 lg:px-6 pb-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {achats.map((achat) => (
            <div key={achat.id} className="card card-hover p-4 cursor-pointer">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-xs text-muted">{formatDateShort(achat.date)}</p>
                  <h3 className="text-[15px] font-bold text-foreground mt-1">
                    {(achat.supplier as unknown as { name: string })?.name ?? 'Fournisseur inconnu'}
                  </h3>
                </div>
                <p className="text-lg font-bold gold-text">{formatDH(achat.total_amount)}</p>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                <Tag variant="user">
                  {(achat.creator as unknown as { full_name: string })?.full_name ?? 'Inconnu'}
                </Tag>
                <Tag variant="cash">{getPaymentLabel(achat.payment_mode)}</Tag>
                {achat.is_credit && <Tag variant="credit">Credit: {formatDH(achat.credit_amount)}</Tag>}
              </div>
            </div>
          ))}
        </div>
      )}

      {isAdmin && <FabButton onClick={() => router.push('/achats/nouveau')} />}
    </>
  )
}
