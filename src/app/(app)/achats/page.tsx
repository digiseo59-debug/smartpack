'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
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
  const creditAchats = achats.filter(a => a.is_credit)
  const totalCredit = creditAchats.reduce((sum, a) => sum + (a.credit_amount ?? 0), 0)

  return (
    <div className="px-4 lg:px-6 py-4 space-y-4">
      {/* ── Hero Stats ── */}
      {!loading && achats.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="hero-stat p-4 col-span-2 lg:col-span-1">
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{achats.length} achats</p>
                <p className="text-2xl font-black text-orange mt-1 stat-number">{formatDH(totalAmount)}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-orange/15 flex items-center justify-center">
                <svg className="w-6 h-6 text-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="hero-stat p-4">
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Credits</p>
              <p className="text-xl font-black text-red mt-1 stat-number">{formatDH(totalCredit)}</p>
              <p className="text-[10px] text-white/30 mt-0.5">{creditAchats.length} achats</p>
            </div>
          </div>

          <div className="hero-stat p-4">
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Paye</p>
              <p className="text-xl font-black text-white mt-1 stat-number">{formatDH(totalAmount - totalCredit)}</p>
              <p className="text-[10px] text-white/30 mt-0.5">{achats.length - creditAchats.length} achats</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Filter Tabs ── */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {filterOptions.map(t => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`px-5 py-2.5 rounded-xl text-[13px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
              filter === t.key
                ? 'hero-stat text-white shadow-lg'
                : 'bg-surface text-muted border border-border hover:border-gold/30'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Purchases List ── */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-9 h-9 border-[2.5px] border-border border-t-gold rounded-full animate-spin" />
        </div>
      ) : achats.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gold/5 border border-border flex items-center justify-center">
            <svg className="w-8 h-8 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <p className="text-sm text-muted font-semibold">Aucun achat</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden lg:block glass-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-5 py-3.5 text-[10px] font-bold text-muted uppercase tracking-widest">Date</th>
                  <th className="text-left px-5 py-3.5 text-[10px] font-bold text-muted uppercase tracking-widest">Fournisseur</th>
                  <th className="text-left px-5 py-3.5 text-[10px] font-bold text-muted uppercase tracking-widest">Par</th>
                  <th className="text-left px-5 py-3.5 text-[10px] font-bold text-muted uppercase tracking-widest">Paiement</th>
                  <th className="text-right px-5 py-3.5 text-[10px] font-bold text-muted uppercase tracking-widest">Montant</th>
                </tr>
              </thead>
              <tbody>
                {achats.map(achat => (
                  <tr key={achat.id} className="border-b border-border/50 hover:bg-gold/3 transition-colors">
                    <td className="px-5 py-3.5 text-xs text-muted font-medium">{formatDateShort(achat.date)}</td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-bold text-foreground">{(achat.supplier as unknown as { name: string })?.name ?? 'Inconnu'}</p>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-muted font-medium">{(achat.creator as unknown as { full_name: string })?.full_name ?? ''}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-1.5">
                        <Tag variant="cash">{getPaymentLabel(achat.payment_mode)}</Tag>
                        {achat.is_credit && <Tag variant="credit">Credit</Tag>}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="text-sm font-bold gold-text">{formatDH(achat.total_amount)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden grid grid-cols-1 gap-2.5">
            {achats.map(achat => (
              <div key={achat.id} className="glass-card card-hover p-4 cursor-pointer">
                <div className="flex justify-between items-start mb-2.5">
                  <div>
                    <p className="text-[11px] text-muted">{formatDateShort(achat.date)}</p>
                    <h3 className="text-[15px] font-bold text-foreground mt-0.5">
                      {(achat.supplier as unknown as { name: string })?.name ?? 'Fournisseur inconnu'}
                    </h3>
                  </div>
                  <p className="text-lg font-black gold-text stat-number">{formatDH(achat.total_amount)}</p>
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
        </>
      )}

      {isAdmin && <FabButton onClick={() => router.push('/achats/nouveau')} />}
    </div>
  )
}
