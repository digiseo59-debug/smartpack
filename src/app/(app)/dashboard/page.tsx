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
}

export default function DashboardPage() {
  const [period, setPeriod] = useState('month')
  const [stats, setStats] = useState<Stats>({ revenue: 0, profit: 0, purchases: 0, margin: 0, expenses: 0, stockValue: 0 })
  const [debtors, setDebtors] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const { isAdmin, role } = useAuth()
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

    const revenue = (salesRes.data ?? []).reduce((sum, s) => sum + (s.total_amount ?? 0), 0)
    const purchases = (purchasesRes.data ?? []).reduce((sum, p) => sum + (p.total_amount ?? 0), 0)
    const expenses = (expensesRes.data ?? []).reduce((sum, e) => sum + (e.amount ?? 0), 0)
    const stockValue = (stockRes.data ?? []).reduce((sum, p) => sum + (p.stock ?? 0) * (p.cost_price ?? 0), 0)
    const profit = revenue - purchases
    const margin = revenue > 0 ? Math.round((profit / revenue) * 1000) / 10 : 0

    setStats({ revenue, profit, purchases, margin, expenses, stockValue })
    setDebtors(debtorsRes.data ?? [])
    setLoading(false)
  }

  const totalReceivables = debtors.reduce((sum, d) => sum + d.credit, 0)
  const cashRegister = stats.revenue - stats.purchases - stats.expenses

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="w-9 h-9 border-3 border-gray-200 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
      <FilterTabs tabs={periodTabs} active={period} onChange={setPeriod} />

      {/* Main KPIs */}
      <div className="grid grid-cols-2 gap-2.5 px-4 py-3">
        <StatCard icon="chart" color="green" value={formatDH(stats.revenue)} label="Chiffre d'affaires" />
        <StatCard icon="dollar" color="blue" value={formatDH(stats.profit)} label="Benefice Brut" />
        <StatCard icon="truck" color="orange" value={formatDH(stats.purchases)} label="Total Achats" />
        <StatCard icon="percent" color="purple" value={`${stats.margin}%`} label="Marge" />
      </div>

      {/* Secondary KPIs */}
      <div className="flex gap-2.5 px-4 mb-2.5">
        <div className="flex-1 bg-white rounded-[14px] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)] text-center">
          <div className="w-9 h-9 rounded-[10px] bg-red-light text-red flex items-center justify-center mx-auto mb-2">
            <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="text-base font-bold text-red">{formatDH(cashRegister)}</div>
          <div className="text-xs text-gray-400">Caisse</div>
        </div>
        <div className="flex-1 bg-white rounded-[14px] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)] text-center">
          <div className="w-9 h-9 rounded-[10px] bg-blue-light text-blue flex items-center justify-center mx-auto mb-2">
            <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div className="text-base font-bold text-blue">{formatDH(stats.stockValue)}</div>
          <div className="text-xs text-gray-400">Stock FIFO</div>
        </div>
        <div className="flex-1 bg-white rounded-[14px] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)] text-center">
          <div className="w-9 h-9 rounded-[10px] bg-purple-light text-purple flex items-center justify-center mx-auto mb-2">
            <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div className="text-base font-bold text-purple">{formatDH(stats.stockValue + cashRegister)}</div>
          <div className="text-xs text-gray-400">Capital</div>
        </div>
      </div>

      {/* Expenses */}
      {stats.expenses > 0 && (
        <div className="mx-4 mb-2.5">
          <div className="bg-red-light rounded-[14px] p-4 flex items-center gap-2.5">
            <svg className="w-5 h-5 text-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <div>
              <div className="text-sm font-bold text-red">Charges (periode)</div>
              <div className="text-base font-bold text-red">-{formatDH(stats.expenses)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Client receivables */}
      <div className="px-4 pt-4 pb-2">
        <h3 className="text-sm font-bold">Creances Clients</h3>
      </div>
      <div className="mx-4 mb-4 bg-white rounded-xl p-4">
        <div className="flex justify-between pb-2.5 border-b border-gray-50 mb-2">
          <span className="text-[13px] text-gray-400">Total creances</span>
          <strong className="text-[15px] text-red">{formatDH(totalReceivables)}</strong>
        </div>
        {debtors.slice(0, 10).map(d => (
          <div key={d.id} className="flex justify-between items-center py-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-red-light text-red flex items-center justify-center text-[13px] font-semibold">
                {d.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-[13px] font-semibold">{d.name}</span>
            </div>
            <span className="text-sm font-bold text-red">{formatDH(d.credit)}</span>
          </div>
        ))}
      </div>

      {/* Admin link */}
      {isAdmin && (
        <div className="px-4 pb-6">
          <button
            onClick={() => router.push('/admin')}
            className="w-full py-3 bg-white text-primary border-[1.5px] border-primary rounded-[10px] text-sm font-semibold flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Administration
          </button>
        </div>
      )}
    </>
  )
}

function StatCard({ icon, color, value, label }: { icon: string; color: string; value: string; label: string }) {
  const colorClasses: Record<string, { bg: string; text: string }> = {
    green: { bg: 'bg-primary-light', text: 'text-primary' },
    blue: { bg: 'bg-blue-light', text: 'text-blue' },
    orange: { bg: 'bg-orange-light', text: 'text-orange' },
    purple: { bg: 'bg-purple-light', text: 'text-purple' },
  }
  const c = colorClasses[color] ?? colorClasses.green

  return (
    <div className="bg-white rounded-[14px] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
      <div className={`w-9 h-9 rounded-[10px] ${c.bg} ${c.text} flex items-center justify-center mb-2.5`}>
        <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      </div>
      <div className={`text-lg font-bold mb-1 ${c.text}`}>{value}</div>
      <div className="text-xs text-gray-400">{label}</div>
    </div>
  )
}
