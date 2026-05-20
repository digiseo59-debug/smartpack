'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FilterTabs } from '@/components/ui/filter-tabs'
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

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div className="w-full h-1.5 rounded-full bg-border/50 mt-2">
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

function KpiCard({ label, value, icon, color, barValue, barMax, barColor, sub }: {
  label: string
  value: string
  icon: React.ReactNode
  color: string
  barValue?: number
  barMax?: number
  barColor?: string
  sub?: string
}) {
  return (
    <div className="bg-surface rounded-2xl p-4 border border-border hover:border-gold/30 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          {icon}
        </div>
        {sub && <span className="text-[11px] font-semibold text-muted">{sub}</span>}
      </div>
      <p className="text-[11px] font-semibold text-muted uppercase tracking-wider mt-2">{label}</p>
      <p className="text-lg font-bold text-foreground mt-0.5 tracking-tight">{value}</p>
      {barValue !== undefined && barMax !== undefined && barColor && (
        <MiniBar value={barValue} max={barMax} color={barColor} />
      )}
    </div>
  )
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

  const maxKpi = Math.max(stats.revenue, stats.purchases, stats.expenses, stats.stockValue, 1)

  return (
    <div className="pb-6">
      <FilterTabs tabs={periodTabs} active={period} onChange={setPeriod} />

      {/* Hero — Revenue + Profit + Margin */}
      <div className="px-4 lg:px-6 mb-4">
        <div className="gradient-dark rounded-2xl p-5 lg:p-6 text-white relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-gold/5" />
          <div className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full bg-gold/5" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg gradient-gold flex items-center justify-center shadow-lg shadow-gold/20">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-[11px] font-bold text-gold uppercase tracking-widest">Chiffre d&apos;affaires</span>
              <span className="ml-auto text-[11px] text-white/30 font-medium">{stats.saleCount} ventes</span>
            </div>
            <p className="text-3xl lg:text-4xl font-extrabold tracking-tight">{formatDH(stats.revenue)}</p>

            <div className="grid grid-cols-3 gap-4 mt-5 pt-4 border-t border-white/8">
              <div>
                <p className="text-[10px] text-white/40 font-semibold uppercase tracking-wider">Benefice</p>
                <p className={`text-base font-bold mt-0.5 ${stats.profit >= 0 ? 'text-gold' : 'text-red'}`}>
                  {formatDH(stats.profit)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-white/40 font-semibold uppercase tracking-wider">Marge</p>
                <p className="text-base font-bold text-gold mt-0.5">{stats.margin}%</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-white/40 font-semibold uppercase tracking-wider">Caisse</p>
                <p className={`text-base font-bold mt-0.5 ${cashRegister >= 0 ? 'text-gold' : 'text-red'}`}>
                  {formatDH(cashRegister)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Grid — 2x2 mobile, 4-col desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-4 lg:px-6 mb-4">
        <KpiCard
          label="Achats"
          value={formatDH(stats.purchases)}
          sub={`${stats.purchaseCount} ops`}
          icon={
            <svg className="w-4 h-4 text-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          }
          color="bg-orange-light"
          barValue={stats.purchases}
          barMax={maxKpi}
          barColor="bg-orange"
        />
        <KpiCard
          label="Charges"
          value={formatDH(stats.expenses)}
          icon={
            <svg className="w-4 h-4 text-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          }
          color="bg-red-light"
          barValue={stats.expenses}
          barMax={maxKpi}
          barColor="bg-red"
        />
        <KpiCard
          label="Valeur Stock"
          value={formatDH(stats.stockValue)}
          icon={
            <svg className="w-4 h-4 text-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
          color="bg-blue-light"
          barValue={stats.stockValue}
          barMax={maxKpi}
          barColor="bg-blue"
        />
        <KpiCard
          label="Capital"
          value={formatDH(capital)}
          icon={
            <svg className="w-4 h-4 text-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
          color="bg-purple-light"
          barValue={capital}
          barMax={maxKpi}
          barColor="bg-purple"
        />
      </div>

      {/* Financial breakdown — visual ratio bar */}
      <div className="px-4 lg:px-6 mb-4">
        <div className="bg-surface rounded-2xl border border-border p-4 lg:p-5">
          <h3 className="text-[11px] font-bold text-muted uppercase tracking-widest mb-4">Repartition financiere</h3>
          <div className="flex h-3 rounded-full overflow-hidden bg-border/30 mb-4">
            {stats.revenue > 0 && (
              <>
                <div className="bg-gold transition-all duration-500" style={{ width: `${(stats.profit / stats.revenue) * 100}%` }} />
                <div className="bg-orange transition-all duration-500" style={{ width: `${(stats.purchases / stats.revenue) * 100}%` }} />
                <div className="bg-red transition-all duration-500" style={{ width: `${(stats.expenses / stats.revenue) * 100}%` }} />
              </>
            )}
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
                <p className="text-xs font-bold text-foreground">
                  {stats.revenue > 0 ? Math.round((stats.purchases / stats.revenue) * 100) : 0}%
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red shrink-0" />
              <div>
                <p className="text-[10px] text-muted font-medium">Charges</p>
                <p className="text-xs font-bold text-foreground">
                  {stats.revenue > 0 ? Math.round((stats.expenses / stats.revenue) * 100) : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Receivables — polished table */}
      <div className="px-4 lg:px-6 pb-6">
        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          {/* Header */}
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-red-light flex items-center justify-center">
                <svg className="w-4 h-4 text-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Creances Clients</h3>
                <p className="text-[10px] text-muted font-medium">{debtors.length} clients debiteurs</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted font-semibold uppercase tracking-wider">Total</p>
              <p className="text-base font-extrabold text-red">{formatDH(totalReceivables)}</p>
            </div>
          </div>

          {/* Table header */}
          {debtors.length > 0 && (
            <div className="px-5 py-2 border-b border-border/50 grid grid-cols-[1fr_auto_auto] gap-3 text-[10px] font-bold text-muted uppercase tracking-widest">
              <span>Client</span>
              <span className="text-right w-16 hidden sm:block">Part</span>
              <span className="text-right w-24">Montant</span>
            </div>
          )}

          {/* Rows */}
          {debtors.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-primary-light flex items-center justify-center">
                <svg className="w-6 h-6 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-muted">Aucune creance</p>
              <p className="text-xs text-muted/60 mt-1">Tous les clients sont a jour</p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {debtors.slice(0, 15).map((d, i) => {
                const pct = totalReceivables > 0 ? Math.round((d.credit / totalReceivables) * 100) : 0
                return (
                  <div
                    key={d.id}
                    className="px-5 py-3 grid grid-cols-[1fr_auto_auto] gap-3 items-center hover:bg-primary-light/50 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-primary-light text-foreground flex items-center justify-center text-xs font-bold shrink-0 group-hover:bg-gold/10 group-hover:text-gold transition-colors">
                        {i + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{d.name}</p>
                        {d.location && (
                          <p className="text-[10px] text-muted truncate">{d.location}</p>
                        )}
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-1.5 w-16 justify-end">
                      <div className="w-10 h-1.5 rounded-full bg-border/40 overflow-hidden">
                        <div className="h-full rounded-full bg-red/70" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] font-semibold text-muted w-8 text-right">{pct}%</span>
                    </div>
                    <p className="text-sm font-bold text-red w-24 text-right tabular-nums">{formatDH(d.credit)}</p>
                  </div>
                )
              })}
            </div>
          )}

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
        </div>
      </div>
    </div>
  )
}
