'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatDH, formatDate, getPaymentLabel } from '@/lib/utils/format'
import { Tag } from '@/components/ui/tag'
import toast from 'react-hot-toast'
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
      .select('*, client:clients(name), creator:profiles(full_name)')
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
      <div className="flex justify-center py-10">
        <div className="w-9 h-9 border-3 border-gray-200 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  if (!sale) {
    return <div className="text-center py-16 text-gray-400">Vente introuvable</div>
  }

  const clientName = (sale.client as unknown as { name: string })?.name ?? 'Client inconnu'
  const creatorName = (sale.creator as unknown as { full_name: string })?.full_name ?? 'Inconnu'
  const totalQty = items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <div className="px-4 py-3">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-500 mb-3">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Retour
      </button>

      {/* Receipt */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
        <div className="bg-primary text-white p-4 text-center">
          <h3 className="text-base font-semibold mb-1">Smart Pack</h3>
          <p className="text-[11px] opacity-90">Bon de vente N° {sale.ref_number}</p>
        </div>
        <div className="p-4">
          <div className="flex justify-between text-[13px] mb-3">
            <span className="text-gray-400">{formatDate(sale.date)}</span>
            <Tag variant="cash">{getPaymentLabel(sale.payment_mode)}</Tag>
          </div>

          <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg mb-3">
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-semibold">
              {clientName.charAt(0).toUpperCase()}
            </div>
            <span className="font-semibold text-sm">{clientName}</span>
          </div>

          {/* Items header */}
          <div className="flex py-1.5 border-b border-gray-200 text-[11px] font-semibold text-gray-400 uppercase">
            <span className="flex-[2]">Article</span>
            <span className="flex-[0.5] text-center">QTE</span>
            <span className="flex-[0.8] text-right">P.U</span>
            <span className="flex-[0.8] text-right">Total</span>
          </div>

          {items.map(item => (
            <div key={item.id} className="flex py-1.5 text-[13px]">
              <span className="flex-[2]">{item.product_name}</span>
              <span className="flex-[0.5] text-center">{item.quantity}</span>
              <span className="flex-[0.8] text-right">{item.unit_price.toFixed(2)}</span>
              <span className="flex-[0.8] text-right font-semibold">{item.subtotal.toFixed(2)}</span>
            </div>
          ))}

          <div className="flex justify-between text-[13px] border-t border-gray-200 mt-2 pt-2">
            <span className="text-gray-400">Sous-total ({totalQty} articles)</span>
            <span className="font-semibold">{formatDH(sale.total_amount)}</span>
          </div>

          <div className="flex justify-between border-t-2 border-gray-800 mt-2 pt-2.5 font-bold text-[15px]">
            <span>TOTAL</span>
            <span>{formatDH(sale.total_amount)}</span>
          </div>
        </div>
      </div>

      {/* Share */}
      <div className="flex justify-center gap-8 py-4">
        <button onClick={shareWhatsApp} className="flex flex-col items-center gap-1.5 cursor-pointer">
          <div className="w-[50px] h-[50px] rounded-full bg-[#25d366] text-white flex items-center justify-center text-xl">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
            </svg>
          </div>
          <span className="text-xs text-gray-500">WhatsApp</span>
        </button>
        <button onClick={() => window.print()} className="flex flex-col items-center gap-1.5 cursor-pointer">
          <div className="w-[50px] h-[50px] rounded-full bg-blue text-white flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
          </div>
          <span className="text-xs text-gray-500">Imprimer</span>
        </button>
      </div>

      <div className="flex gap-2 mt-2">
        <Tag variant="user">par {creatorName}</Tag>
        {sale.is_credit && <Tag variant="credit">Credit: {formatDH(sale.credit_amount)}</Tag>}
        {sale.is_gift && <Tag variant="gift">Offerte</Tag>}
      </div>
    </div>
  )
}
