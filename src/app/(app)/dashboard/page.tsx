'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDH, getDateRange } from '@/lib/utils/format'
import { useAuth } from '@/lib/auth/auth-context'
import { useRouter } from 'next/navigation'
import type { Client } from '@/types/database'

const periodTabs = [
  { key: 'today', label: "Aujourd'hui" },
  { key: 'week', label: 'Semaine' },
  { key: 'month', label: 'Mois' },
  { key: 'quarter', label: 'Trimestre' },
]

interface Stats {
  revenue: number
  profit: number
  purchases: number
  margin: number
  expenses: number
  stockValue: number
  saleCount: number
  purchaseCount: number
}

export default function DashboardPage() {
  const [period, setPeriod] = useState('month')
  const [stats, setStats] = useState<Stats>({
    revenue: 0, profit: 0, purchases: 0, margin: 0,
    expenses: 0, stockValue: 0, saleCount: 0, purchaseCount: 0,
  })
  const [debtors, setDebtors] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const { role } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (role === 'salarie') {
      router.replace('/ventes')
      return
    }
    loadStats()
  }, [period, role])

  async function loadStats() {
    setLoading(true)
    const { from, to } = getDateRange(period)

    const [salesRes, purchasesRes, expensesRes, debtorsRes, stockRes] = await Promise.all([
      supabase.from('sales').select('total_amount').gte('date', from.toISOString()).lte('date', to.toISOString()).eq('is_gift', false),
      supabase.from('purchases').select('total_amount').gte('date', from.toISOString()).lte('date', to.toISOString()),
      supabase.from('expenses').select('amount').gte('date', from.toISOString()).lte('date', to.toISOString()),
      supabase.from('clients').select('*').gt('credit', 0).order('credit', { ascending: false }),
      supabase.from('products').select('stock, cost_price'),
    ])

    const salesData = salesRes.data ?? []
    const purchasesData = purchasesRes.data ?? []
    const expensesData = expensesRes.data ?? []

    const revenue = salesData.reduce((sum: number, s: Record<string, unknown>) => sum + ((s.total_amount as number) ?? 0), 0)
    const purchases = purchasesData.reduce((sum: number, p: Record<string, unknown>) => sum + ((p.total_amount as number) ?? 0), 0)
    const expenses = expensesData.reduce((sum: number, e: Record<string, unknown>) => sum + ((e.amount as number) ?? 0), 0)
    const stockValue = (stockRes.data ?? []).reduce((sum: number, p: Record<string, unknown>) => sum + ((p.stock as number) ?? 0) * ((p.cost_price as number) ?? 0), 0)
    const profit = revenue - purchases
    const margin = revenue > 0 ? Math.round((profit / revenue) * 1000) / 10 : 0

    setStats({
      revenue, profit, purchases, margin, expenses, stockValue,
      saleCount: salesData.length,
      purchaseCount: purchasesData.length,
    })
    setDebtors((debtorsRes.data ?? []) as Client[])
    setLoading(false)
  }

  const totalReceivables = debtors.reduce((sum, d) => sum + d.credit, 0)
  const cashRegister = stats.revenue - stats.purchases - stats.expenses
  const capital = stats.stockValue + cashRegister

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 border-[3px] border-border border-t-gold rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="px-4 lg:px-6 py-4 space-y-4">
      {/* ── Period Tabs ── */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {periodTabs.map(t => (
          <button
            key={t.key}
            onClick={() => setPeriod(t.key)}
            className={`px-5 py-2.5 rounded-xl text-[13px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
              period === t.key
                ? 'hero-stat text-white shadow-lg'
                : 'bg-surface text-muted border border-border hover:border-gold/30'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Revenue Hero ── */}
      <div className="hero-stat p-5 lg:p-6">
        <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-gold/5" />
        <div className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full bg-gold/5" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-xl gradient-gold flex items-center justify-center shadow-lg shadow-gold/20">
              <svg className="w-4.5 h-4.5 text-[#1a1a1a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-[11px] font-bold text-gold uppercase tracking-widest">Chiffre d&apos;affaires</span>
            <span className="ml-auto text-[11px] text-white/30 font-medium">{stats.saleCount} ventes</span>
          </div>
          <p className="text-3xl lg:text-4xl font-black text-white tracking-tight stat-number">{formatDH(stats.revenue)}</p>

          <div className="grid grid-cols-3 gap-4 mt-5 pt-4 border-t border-white/8">
            <div>
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Benefice</p>
              <p className={`text-base font-black mt-0.5 stat-number ${stats.profit >= 0 ? 'text-gold' : 'text-red'}`}>
                {formatDH(stats.profit)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Marge</p>
              <p className="text-base font-black text-gold mt-0.5 stat-number">{stats.margin}%</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Caisse</p>
              <p className={`text-base font-black mt-0.5 stat-number ${cashRegister >= 0 ? 'text-gold' : 'text-red'}`}>
                {formatDH(cashRegister)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="hero-stat p-4">
          <div className="relative z-10">
            <div className="w-8 h-8 rounded-xl bg-orange/10 flex items-center justify-center mb-2">
              <svg className="w-4 h-4 text-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Achats</p>
            <p className="text-lg font-black text-orange mt-1 stat-number">{formatDH(stats.purchases)}</p>
            <p className="text-[10px] text-white/30 mt-0.5">{stats.purchaseCount} ops</p>
          </div>
        </div>

        <div className="hero-stat p-4">
          <div className="relative z-10">
            <div className="w-8 h-8 rounded-xl bg-red/10 flex items-center justify-center mb-2">
              <svg className="w-4 h-4 text-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Charges</p>
            <p className="text-lg font-black text-red mt-1 stat-number">{formatDH(stats.expenses)}</p>
          </div>
        </div>

        <div className="hero-stat p-4">
          <div className="relative z-10">
            <div className="w-8 h-8 rounded-xl bg-blue/10 flex items-center justify-center mb-2">
              <svg className="w-4 h-4 text-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Valeur Stock</p>
            <p className="text-lg font-black text-blue mt-1 stat-number">{formatDH(stats.stockValue)}</p>
          </div>
        </div>

        <div className="hero-stat p-4">
          <div className="relative z-10">
            <div className="w-8 h-8 rounded-xl bg-purple/10 flex items-center justify-center mb-2">
              <svg className="w-4 h-4 text-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Capital</p>
            <p className="text-lg font-black text-purple mt-1 stat-number">{formatDH(capital)}</p>
          </div>
        </div>
      </div>

      {/* ── Financial Breakdown ── */}
      {stats.revenue > 0 && (
        <div className="glass-card p-5">
          <h3 className="text-[10px] font-bold text-gold uppercase tracking-widest mb-4">Repartition financiere</h3>
          <div className="flex h-3 rounded-full overflow-hidden bg-border/30 mb-4">
            <div className="bg-gold transition-all duration-500" style={{ width: `${Math.max((stats.profit / stats.revenue) * 100, 0)}%` }} />
            <div className="bg-orange transition-all duration-500" style={{ width: `${(stats.purchases / stats.revenue) * 100}%` }} />
            <div className="bg-red transition-all duration-500" style={{ width: `${(stats.expenses / stats.revenue) * 100}%` }} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-gold shrink-0" />
              <div>
                <p className="text-[10px] text-muted font-medium">Benefice</p>
                <p className="text-xs font-bold text-foreground">{stats.margin}%</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-orange shrink-0" />
              <div>
                <p className="text-[10px] text-muted font-medium">Achats</p>
                <p className="text-xs font-bold text-foreground">{Math.round((stats.purchases / stats.revenue) * 100)}%</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red shrink-0" />
              <div>
                <p className="text-[10px] text-muted font-medium">Charges</p>
                <p className="text-xs font-bold text-foreground">{Math.round((stats.expenses / stats.revenue) * 100)}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Receivables Table ── */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red/10 flex items-center justify-center">
              <svg className="w-4.5 h-4.5 text-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Creances Clients</h3>
              <p className="text-[10px] text-muted font-medium">{debtors.length} debiteurs</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted font-bold uppercase tracking-wider">Total</p>
            <p className="text-lg font-black text-red stat-number">{formatDH(totalReceivables)}</p>
          </div>
        </div>

        {debtors.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-gold/5 flex items-center justify-center">
              <svg className="w-6 h-6 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-muted">Aucune creance</p>
            <p className="text-xs text-muted/50 mt-1">Tous les clients sont a jour</p>
          </div>
        ) : (
          <>
            {/* Desktop table header */}
            <div className="hidden lg:grid grid-cols-[1fr_auto_auto] gap-3 px-5 py-2.5 border-b border-border/50 text-[10px] font-bold text-muted uppercase tracking-widest">
              <span>Client</span>
              <span className="text-right w-20">Part</span>
              <span className="text-right w-28">Montant</span>
            </div>

            <div className="divide-y divide-border/30">
              {debtors.slice(0, 15).map((d, i) => {
                const pct = totalReceivables > 0 ? Math.round((d.credit / totalReceivables) * 100) : 0
                return (
                  <div
                    key={d.id}
                    className="px-5 py-3 grid grid-cols-[1fr_auto_auto] gap-3 items-center hover:bg-gold/3 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl gradient-gold flex items-center justify-center text-[10px] font-black text-[#1a1a1a] shrink-0 shadow-sm">
                        {i + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{d.name}</p>
                        {d.location && <p className="text-[10px] text-muted truncate">{d.location}</p>}
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-1.5 w-20 justify-end">
                      <div className="w-12 h-1.5 rounded-full bg-border/40 overflow-hidden">
                        <div className="h-full rounded-full bg-red/70" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] font-semibold text-muted w-8 text-right">{pct}%</span>
                    </div>
                    <p className="text-sm font-bold text-red w-28 text-right stat-number">{formatDH(d.credit)}</p>
                  </div>
                )
              })}
            </div>

            {debtors.length > 15 && (
              <div className="px-5 py-3 border-t border-border text-center">
                <button
                  onClick={() => router.push('/clients')}
                  className="text-xs font-semibold text-gold hover:text-gold-dark transition-colors cursor-pointer"
                >
                  Voir tous les {debtors.length} clients →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
