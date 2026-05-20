'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatDH, formatDate, getPaymentLabel } from '@/lib/utils/format'
import { Tag } from '@/components/ui/tag'
import type { Sale, SaleItem } from '@/types/database'

export default function SaleDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()
  const [sale, setSale] = useState<Sale | null>(null)
  const [items, setItems] = useState<SaleItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSale()
  }, [id])

  async function loadSale() {
    const { data: saleData } = await supabase
      .from('sales')
      .select('*, client:clients(name, phone, location), creator:profiles(full_name)')
      .eq('id', id)
      .single()

    const { data: itemsData } = await supabase
      .from('sale_items')
      .select('*')
      .eq('sale_id', id)

    setSale(saleData)
    setItems(itemsData ?? [])
    setLoading(false)
  }

  function shareWhatsApp() {
    if (!sale) return
    const clientName = (sale.client as unknown as { name: string })?.name ?? 'Client'
    let text = `*Smart Pack*\nBon de vente N° ${sale.ref_number}\n${formatDate(sale.date)}\nClient: ${clientName}\n\n`
    items.forEach(item => {
      text += `${item.product_name} x${item.quantity} = ${formatDH(item.subtotal)}\n`
    })
    text += `\n*TOTAL: ${formatDH(sale.total_amount)}*`
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-9 h-9 border-[2.5px] border-border border-t-gold rounded-full animate-spin" />
      </div>
    )
  }

  if (!sale) {
    return <div className="text-center py-16 text-muted">Vente introuvable</div>
  }

  const client = sale.client as unknown as { name: string; phone?: string; location?: string }
  const clientName = client?.name ?? 'Client inconnu'
  const creatorName = (sale.creator as unknown as { full_name: string })?.full_name ?? 'Inconnu'
  const totalQty = items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <div className="px-4 lg:px-6 py-4 max-w-2xl mx-auto">
      {/* Back button — hidden on print */}
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-muted hover:text-foreground mb-4 transition-colors cursor-pointer print:hidden">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Retour
      </button>

      {/* ═══════ INVOICE ═══════ */}
      <div className="bg-white rounded-3xl overflow-hidden shadow-xl border border-[rgba(200,169,96,0.2)] print:shadow-none print:rounded-none print:border print:border-gray-300">

        {/* ── Gold Header Band ── */}
        <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a25 50%, #1a1a1a 100%)' }}>
          <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(ellipse at 30% 50%, rgba(200,169,96,0.4), transparent 70%)' }} />
          <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, #c8a960, transparent)' }} />
          <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, #c8a960, transparent)' }} />

          <div className="relative flex items-center justify-between px-6 py-5 print:px-4 print:py-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden ring-2 ring-[rgba(200,169,96,0.4)] shadow-lg print:w-10 print:h-10">
                <img src="/logo.jpg" alt="SmartPack" className="w-full h-full object-cover" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white tracking-tight print:text-base">Smart Pack</h2>
                <p className="text-[11px] font-medium text-[#c8a960] tracking-wider uppercase">Emballage Professionnel</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-[#c8a960] uppercase tracking-widest">Bon de vente</p>
              <p className="text-sm font-bold text-white mt-0.5">{sale.ref_number}</p>
            </div>
          </div>
        </div>

        {/* ── Invoice Body ── */}
        <div className="px-6 py-5 print:px-4 print:py-3">

          {/* Date + Payment row */}
          <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Date</p>
              <p className="text-sm font-semibold text-gray-800">{formatDate(sale.date)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Paiement</p>
              <span className="inline-block px-3 py-1 rounded-lg text-xs font-bold bg-[#1a1a1a] text-[#c8a960]">
                {getPaymentLabel(sale.payment_mode)}
              </span>
            </div>
          </div>

          {/* Client card */}
          <div className="rounded-2xl p-4 mb-5 border border-gray-100" style={{ background: 'linear-gradient(135deg, #faf8f3, #f5f0e8)' }}>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Client</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-white shadow-md" style={{ background: 'linear-gradient(135deg, #c8a960, #dfc080)' }}>
                {clientName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{clientName}</p>
                {client?.location && <p className="text-xs text-gray-500">{client.location}</p>}
                {client?.phone && <p className="text-xs text-gray-500">{client.phone}</p>}
              </div>
            </div>
          </div>

          {/* ── Items Table ── */}
          <div className="rounded-2xl overflow-hidden border border-gray-100 mb-5">
            {/* Table header */}
            <div className="flex px-4 py-2.5" style={{ background: 'linear-gradient(135deg, #1a1a1a, #2a2a25)' }}>
              <span className="flex-[2.5] text-[10px] font-bold text-[#c8a960] uppercase tracking-widest">Article</span>
              <span className="flex-[0.6] text-center text-[10px] font-bold text-[#c8a960] uppercase tracking-widest">Qte</span>
              <span className="flex-[0.8] text-right text-[10px] font-bold text-[#c8a960] uppercase tracking-widest">P.U</span>
              <span className="flex-[1] text-right text-[10px] font-bold text-[#c8a960] uppercase tracking-widest">Total</span>
            </div>

            {/* Table rows */}
            {items.map((item, idx) => (
              <div key={item.id} className={`flex px-4 py-3 text-[13px] ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${idx < items.length - 1 ? 'border-b border-gray-50' : ''}`}>
                <span className="flex-[2.5] font-medium text-gray-800 truncate pr-2">{item.product_name}</span>
                <span className="flex-[0.6] text-center font-semibold text-gray-600">{item.quantity}</span>
                <span className="flex-[0.8] text-right text-gray-500">{formatDH(item.unit_price)}</span>
                <span className="flex-[1] text-right font-bold text-gray-900">{formatDH(item.subtotal)}</span>
              </div>
            ))}

            {/* Subtotal row */}
            <div className="flex px-4 py-2.5 bg-gray-50 border-t border-gray-100">
              <span className="flex-[2.5] text-xs text-gray-500 font-medium">{totalQty} articles</span>
              <span className="flex-[0.6]" />
              <span className="flex-[0.8]" />
              <span className="flex-[1] text-right text-sm font-bold text-gray-700">{formatDH(sale.total_amount)}</span>
            </div>
          </div>

          {/* ── TOTAL ── */}
          <div className="rounded-2xl p-4 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a25 50%, #1a1a1a 100%)' }}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(200,169,96,0.15)' }}>
                <svg className="w-4 h-4 text-[#c8a960]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-sm font-bold text-white uppercase tracking-wider">Total</span>
            </div>
            <span className="text-xl font-black tracking-tight" style={{ color: '#c8a960' }}>{formatDH(sale.total_amount)}</span>
          </div>

          {/* Credit info */}
          {sale.is_credit && (
            <div className="mt-3 rounded-xl p-3 flex items-center justify-between border border-red-100 bg-red-50 print:bg-white">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-xs font-bold text-red-600 uppercase tracking-wider">Credit restant</span>
              </div>
              <span className="text-sm font-black text-red-600">{formatDH(sale.credit_amount)}</span>
            </div>
          )}

          {sale.is_gift && (
            <div className="mt-3 rounded-xl p-3 flex items-center gap-2 border border-purple-100 bg-purple-50 print:bg-white">
              <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
              </div>
              <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Vente offerte</span>
            </div>
          )}

          {/* ── Footer ── */}
          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <p className="text-[10px] text-gray-400 font-medium">Vendeur: {creatorName}</p>
            <div className="flex items-center justify-center gap-1.5 mt-2">
              <div className="w-4 h-4 rounded overflow-hidden">
                <img src="/logo.jpg" alt="" className="w-full h-full object-cover opacity-40" />
              </div>
              <p className="text-[9px] font-bold text-gray-300 uppercase tracking-[0.2em]">Smart Pack — Emballage Meknes</p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════ ACTION BUTTONS ═══════ */}
      <div className="flex justify-center gap-5 py-6 print:hidden">
        <button onClick={shareWhatsApp} className="flex flex-col items-center gap-2 cursor-pointer group">
          <div className="w-14 h-14 rounded-2xl bg-[#25d366] text-white flex items-center justify-center group-hover:scale-105 transition-transform shadow-lg shadow-[#25d366]/25">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
            </svg>
          </div>
          <span className="text-xs text-muted font-semibold">WhatsApp</span>
        </button>

        <button onClick={() => window.print()} className="flex flex-col items-center gap-2 cursor-pointer group">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform shadow-lg" style={{ background: 'linear-gradient(135deg, #1a1a1a, #2a2a25)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
            <svg className="w-5.5 h-5.5 text-[#c8a960]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
          </div>
          <span className="text-xs text-muted font-semibold">Imprimer</span>
        </button>

        <button onClick={() => { navigator.clipboard.writeText(window.location.href); }} className="flex flex-col items-center gap-2 cursor-pointer group">
          <div className="w-14 h-14 rounded-2xl bg-surface border border-border flex items-center justify-center group-hover:scale-105 group-hover:border-gold/30 transition-all">
            <svg className="w-5 h-5 text-muted group-hover:text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <span className="text-xs text-muted font-semibold">Copier</span>
        </button>
      </div>

      {/* Tags row */}
      <div className="flex gap-2 justify-center print:hidden pb-4">
        <Tag variant="user">par {creatorName}</Tag>
        {sale.is_credit && <Tag variant="credit">Credit: {formatDH(sale.credit_amount)}</Tag>}
        {sale.is_gift && <Tag variant="gift">Offerte</Tag>}
      </div>
    </div>
  )
}
