'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FabButton } from '@/components/layout/fab-button'
import { Tag } from '@/components/ui/tag'
import { formatDH, formatDateShort, getPaymentLabel, getDateRange } from '@/lib/utils/format'
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
  const creditSales = sales.filter(s => s.is_credit)
  const totalCredit = creditSales.reduce((sum, s) => sum + (s.credit_amount ?? 0), 0)

  return (
    <div className="px-4 lg:px-6 py-4 space-y-4">
      {/* ── Hero Stats ── */}
      {!loading && sales.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="hero-stat p-4 col-span-2 lg:col-span-1">
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{sales.length} ventes</p>
                <p className="text-2xl font-black text-gold mt-1 stat-number">{formatDH(totalAmount)}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl gradient-gold flex items-center justify-center shadow-lg shadow-gold/20">
                <svg className="w-6 h-6 text-[#1a1a1a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="hero-stat p-4">
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Credits</p>
              <p className="text-xl font-black text-red mt-1 stat-number">{formatDH(totalCredit)}</p>
              <p className="text-[10px] text-white/30 mt-0.5">{creditSales.length} ventes</p>
            </div>
          </div>

          <div className="hero-stat p-4">
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Encaisse</p>
              <p className="text-xl font-black text-white mt-1 stat-number">{formatDH(totalAmount - totalCredit)}</p>
              <p className="text-[10px] text-white/30 mt-0.5">{sales.length - creditSales.length} ventes</p>
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

      {/* ── Sales List ── */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-9 h-9 border-[2.5px] border-border border-t-gold rounded-full animate-spin" />
        </div>
      ) : sales.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gold/5 border border-border flex items-center justify-center">
            <svg className="w-8 h-8 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
          </div>
          <p className="text-sm text-muted font-semibold">Aucune vente</p>
          <p className="text-xs text-muted/50 mt-1">Appuyez sur + pour creer une vente</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden lg:block glass-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-5 py-3.5 text-[10px] font-bold text-muted uppercase tracking-widest">Date</th>
                  <th className="text-left px-5 py-3.5 text-[10px] font-bold text-muted uppercase tracking-widest">Client</th>
                  <th className="text-left px-5 py-3.5 text-[10px] font-bold text-muted uppercase tracking-widest">Ref</th>
                  <th className="text-left px-5 py-3.5 text-[10px] font-bold text-muted uppercase tracking-widest">Vendeur</th>
                  <th className="text-left px-5 py-3.5 text-[10px] font-bold text-muted uppercase tracking-widest">Paiement</th>
                  <th className="text-right px-5 py-3.5 text-[10px] font-bold text-muted uppercase tracking-widest">Montant</th>
                </tr>
              </thead>
              <tbody>
                {sales.map(sale => (
                  <tr
                    key={sale.id}
                    onClick={() => router.push(`/ventes/${sale.id}`)}
                    className="border-b border-border/50 hover:bg-gold/3 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-3.5 text-xs text-muted font-medium">{formatDateShort(sale.date)}</td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-bold text-foreground">{(sale.client as unknown as { name: string })?.name ?? 'Inconnu'}</p>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-muted/60 font-mono">{sale.ref_number}</td>
                    <td className="px-5 py-3.5 text-xs text-muted font-medium">{(sale.creator as unknown as { full_name: string })?.full_name ?? ''}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-1.5">
                        <Tag variant="cash">{getPaymentLabel(sale.payment_mode)}</Tag>
                        {sale.is_credit && <Tag variant="credit">Credit</Tag>}
                        {sale.is_gift && <Tag variant="gift">Offerte</Tag>}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="text-sm font-bold gold-text">{formatDH(sale.total_amount)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden grid grid-cols-1 gap-2.5">
            {sales.map(sale => (
              <div
                key={sale.id}
                className="glass-card card-hover p-4 cursor-pointer"
                onClick={() => router.push(`/ventes/${sale.id}`)}
              >
                <div className="flex justify-between items-start mb-2.5">
                  <div>
                    <p className="text-[11px] text-muted">
                      {formatDateShort(sale.date)}
                      <span className="ml-2 text-muted/40 font-mono">{sale.ref_number}</span>
                    </p>
                    <h3 className="text-[15px] font-bold text-foreground mt-0.5">
                      {(sale.client as unknown as { name: string })?.name ?? 'Client inconnu'}
                    </h3>
                  </div>
                  <p className="text-lg font-black gold-text stat-number">{formatDH(sale.total_amount)}</p>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  <Tag variant="user">
                    {(sale.creator as unknown as { full_name: string })?.full_name ?? 'Inconnu'}
                  </Tag>
                  <Tag variant="cash">{getPaymentLabel(sale.payment_mode)}</Tag>
                  {sale.is_credit && <Tag variant="credit">Credit: {formatDH(sale.credit_amount)}</Tag>}
                  {sale.is_gift && <Tag variant="gift">Offerte</Tag>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <FabButton onClick={() => router.push('/ventes/nouveau')} />
    </div>
  )
}
