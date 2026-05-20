'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ModalSheet } from '@/components/ui/modal-sheet'
import { SearchBox } from '@/components/ui/search-box'
import { formatDH } from '@/lib/utils/format'
import toast from 'react-hot-toast'
import type { Client, Category, Product, SaleFormArticle, PaymentMode } from '@/types/database'

export default function NewSalePage() {
  const router = useRouter()
  const supabase = createClient()

  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [articles, setArticles] = useState<SaleFormArticle[]>([])
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash')
  const [isGift, setIsGift] = useState(false)
  const [isCredit, setIsCredit] = useState(false)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [clients, setClients] = useState<Client[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])

  const [clientModalOpen, setClientModalOpen] = useState(false)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [productModalOpen, setProductModalOpen] = useState(false)
  const [successModalOpen, setSuccessModalOpen] = useState(false)
  const [lastRefNumber, setLastRefNumber] = useState('')

  const [clientSearch, setClientSearch] = useState('')
  const [catSearch, setCatSearch] = useState('')
  const [prodSearch, setProdSearch] = useState('')
  const [selectedCategoryName, setSelectedCategoryName] = useState('')

  useEffect(() => {
    loadClients()
    loadCategories()
  }, [])

  async function loadClients() {
    const { data } = await supabase.from('clients').select('*').order('name')
    setClients(data ?? [])
  }

  async function loadCategories() {
    const { data } = await supabase.from('categories').select('*').order('sort_order')
    setCategories(data ?? [])
  }

  async function loadProducts(categoryId: string) {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .order('name')
    setProducts(data ?? [])
  }

  function selectCategory(cat: Category) {
    setSelectedCategoryName(cat.name)
    setCategoryModalOpen(false)
    setProductModalOpen(true)
    loadProducts(cat.id)
  }

  function addProduct(product: Product) {
    const article: SaleFormArticle = {
      id: crypto.randomUUID(),
      product_id: product.id,
      name: product.name,
      stock: product.stock,
      qty: 1,
      price: product.price,
      is_special: false,
    }
    setArticles(prev => [...prev, article])
    setProductModalOpen(false)
    toast.success(`${product.name} ajoute`)
  }

  function addSpecialProduct() {
    const name = prompt('Nom du produit special:')
    if (!name) return
    const article: SaleFormArticle = {
      id: crypto.randomUUID(),
      product_id: null,
      name,
      stock: 999,
      qty: 1,
      price: 0,
      is_special: true,
    }
    setArticles(prev => [...prev, article])
    toast.success('Produit special ajoute')
  }

  function removeArticle(id: string) {
    setArticles(prev => prev.filter(a => a.id !== id))
  }

  function updateArticle(id: string, field: 'qty' | 'price', value: number) {
    setArticles(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a))
  }

  const total = articles.reduce((sum, a) => sum + a.qty * a.price, 0)

  async function confirmSale() {
    if (!selectedClient) {
      toast.error('Veuillez selectionner un client')
      return
    }
    if (articles.length === 0) {
      toast.error('Veuillez ajouter au moins un article')
      return
    }

    setSubmitting(true)

    const { data, error } = await supabase.rpc('create_sale', {
      p_client_id: selectedClient.id,
      p_payment_mode: paymentMode,
      p_is_credit: isCredit,
      p_is_gift: isGift,
      p_notes: notes,
      p_items: articles.map(a => ({
        product_id: a.product_id,
        product_name: a.name,
        quantity: a.qty,
        unit_price: a.price,
        is_special: a.is_special,
      })),
    })

    setSubmitting(false)

    if (error) {
      toast.error('Erreur: ' + error.message)
      return
    }

    const { data: sale } = await supabase
      .from('sales')
      .select('ref_number')
      .eq('id', data)
      .single()

    setLastRefNumber(sale?.ref_number ?? '')
    setSuccessModalOpen(true)
  }

  function closeAndReset() {
    setSuccessModalOpen(false)
    router.push('/ventes')
  }

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(clientSearch.toLowerCase())
  )
  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(catSearch.toLowerCase())
  )
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(prodSearch.toLowerCase())
  )

  return (
    <div className="px-4 py-3 space-y-3">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-muted hover:text-foreground mb-2 transition-colors cursor-pointer"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Retour
      </button>

      {/* Client Section */}
      <div className="card p-4">
        <div className="text-xs font-semibold text-gold uppercase tracking-wider mb-3">Client</div>
        <button
          onClick={() => setClientModalOpen(true)}
          className="w-full px-3.5 py-3 border-[1.5px] border-border rounded-xl text-sm bg-surface flex justify-between items-center cursor-pointer hover:border-gold/40 transition-colors"
        >
          <span className="flex items-center gap-2 text-foreground">
            <svg className="w-4 h-4 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {selectedClient?.name ?? 'Selectionner un client'}
          </span>
          <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {selectedClient && (
          <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-gold-50 text-gold-dark">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {selectedClient.name}
            <button onClick={() => setSelectedClient(null)} className="ml-1 cursor-pointer">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Articles Section */}
      <div className="card p-4">
        <div className="text-xs font-semibold text-gold uppercase tracking-wider mb-3">Articles</div>

        {articles.length === 0 ? (
          <p className="text-center py-5 text-muted/60 text-sm">Aucun article ajoute</p>
        ) : (
          <div className="space-y-2.5 mb-3">
            {articles.map((art) => (
              <div key={art.id} className="bg-primary-light rounded-xl p-3.5">
                <div className="flex justify-between items-start mb-2.5">
                  <div>
                    <div className="text-sm font-semibold text-foreground">{art.name}</div>
                    <div className="text-[11px] text-muted">Stock: {art.stock} Piece</div>
                  </div>
                  <button onClick={() => removeArticle(art.id)} className="text-red cursor-pointer">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="grid grid-cols-[1fr_1fr_auto] gap-2.5 items-end">
                  <div>
                    <label className="text-[11px] text-muted block mb-1">Quantite</label>
                    <input
                      type="number"
                      value={art.qty}
                      min={1}
                      onChange={(e) => updateArticle(art.id, 'qty', parseInt(e.target.value) || 1)}
                      className="input-field !py-2.5 text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted block mb-1">Prix (DH)</label>
                    <input
                      type="number"
                      value={art.price}
                      step={0.01}
                      onChange={(e) => updateArticle(art.id, 'price', parseFloat(e.target.value) || 0)}
                      className="input-field !py-2.5 text-center"
                    />
                  </div>
                  <div className="text-sm font-bold gold-text text-right pb-2">
                    {formatDH(art.qty * art.price)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2.5">
          <button
            onClick={() => setCategoryModalOpen(true)}
            className="flex-1 py-3 bg-surface text-gold border-[1.5px] border-gold/30 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 cursor-pointer hover:border-gold transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Depuis stock
          </button>
          <button
            onClick={addSpecialProduct}
            className="flex-1 py-3 bg-surface text-purple border-[1.5px] border-purple/30 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 cursor-pointer hover:border-purple transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            Special
          </button>
        </div>
      </div>

      {/* Gift toggle */}
      <div className="card p-4">
        <div className="text-xs font-semibold text-gold uppercase tracking-wider mb-3">Type de vente</div>
        <div className="flex justify-between items-center py-3">
          <div>
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <svg className="w-4 h-4 text-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
              Vente offerte
            </h4>
            <p className="text-xs text-muted">Toute la vente sera offerte</p>
          </div>
          <button
            onClick={() => setIsGift(!isGift)}
            className={`w-12 h-[26px] rounded-full relative transition-colors cursor-pointer ${isGift ? 'bg-gold' : 'bg-border'}`}
          >
            <span className={`absolute w-[22px] h-[22px] bg-white rounded-full top-0.5 left-0.5 transition-transform shadow-sm ${isGift ? 'translate-x-[22px]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Payment Section */}
      <div className="card p-4">
        <div className="text-xs font-semibold text-gold uppercase tracking-wider mb-3">Paiement</div>
        <div className="flex gap-2 mt-2">
          {([
            { mode: 'cash' as const, label: 'Especes', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
            { mode: 'transfer' as const, label: 'Virement', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
            { mode: 'check' as const, label: 'Cheque', icon: 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z' },
          ]).map(({ mode, label, icon }) => (
            <button
              key={mode}
              onClick={() => setPaymentMode(mode)}
              className={`flex-1 py-2.5 border-[1.5px] rounded-xl text-center text-xs font-medium transition-all flex flex-col items-center gap-1 cursor-pointer ${
                paymentMode === mode
                  ? 'gradient-dark text-white border-transparent'
                  : 'text-muted border-border hover:border-gold/30'
              }`}
            >
              <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
              </svg>
              {label}
            </button>
          ))}
        </div>

        <div className="flex justify-between items-center py-3 mt-3">
          <h4 className="text-sm font-semibold text-foreground">Vente a credit</h4>
          <button
            onClick={() => setIsCredit(!isCredit)}
            className={`w-12 h-[26px] rounded-full relative transition-colors cursor-pointer ${isCredit ? 'bg-gold' : 'bg-border'}`}
          >
            <span className={`absolute w-[22px] h-[22px] bg-white rounded-full top-0.5 left-0.5 transition-transform shadow-sm ${isCredit ? 'translate-x-[22px]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="card p-4">
        <div className="text-xs font-semibold text-gold uppercase tracking-wider mb-3">Recapitulatif</div>
        <div className="flex justify-between items-center py-4 border-t-2 border-border mt-2">
          <span className="text-sm text-muted">Total</span>
          <strong className="text-[22px] gold-text">{formatDH(total)}</strong>
        </div>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes (optionnel)"
          className="input-field mt-3"
        />
        <button
          onClick={confirmSale}
          disabled={submitting}
          className="w-full py-3.5 btn-gold rounded-xl text-[15px] mt-4 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {submitting ? (
            <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Confirmer la vente
            </>
          )}
        </button>
      </div>

      {/* Client Modal */}
      <ModalSheet open={clientModalOpen} onClose={() => setClientModalOpen(false)} title="Selectionner un client">
        <SearchBox placeholder="Rechercher..." value={clientSearch} onChange={setClientSearch} />
        <button
          onClick={() => { setClientModalOpen(false); toast('Creation client - contactez admin') }}
          className="inline-flex items-center gap-1 px-3.5 py-2 border-[1.5px] border-dashed border-gold rounded-xl text-gold text-[13px] font-semibold mb-3 mt-3 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nouveau client
        </button>
        {filteredClients.map(c => (
          <div
            key={c.id}
            onClick={() => { setSelectedClient(c); setClientModalOpen(false) }}
            className="flex items-center py-3 border-b border-border/30 cursor-pointer hover:bg-primary-light/50 rounded-lg px-2 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl gradient-dark text-gold flex items-center justify-center text-base mr-3 shrink-0 font-bold">
              {c.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-foreground">{c.name}</div>
              {c.location && <div className="text-xs text-muted">{c.location}</div>}
            </div>
            {c.credit > 0 && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-red-light text-red">{formatDH(c.credit)}</span>
            )}
          </div>
        ))}
      </ModalSheet>

      {/* Category Modal */}
      <ModalSheet open={categoryModalOpen} onClose={() => setCategoryModalOpen(false)} title="Choisir une categorie">
        <SearchBox placeholder="Rechercher une categorie..." value={catSearch} onChange={setCatSearch} />
        <div className="grid grid-cols-2 gap-3 py-2">
          {filteredCategories.map(cat => (
            <div
              key={cat.id}
              onClick={() => selectCategory(cat)}
              className="bg-primary-light rounded-2xl p-5 text-center cursor-pointer transition-all active:scale-[0.97] border-2 border-transparent hover:border-gold/40"
            >
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-2.5 text-2xl text-white ${
                cat.color === 'cat-orange' ? 'bg-orange' :
                cat.color === 'cat-brown' ? 'bg-[#8d6e63]' :
                cat.color === 'cat-green' ? 'bg-gold' : 'bg-muted'
              }`}>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div className="text-sm font-semibold text-foreground">{cat.name}</div>
            </div>
          ))}
        </div>
      </ModalSheet>

      {/* Product Modal */}
      <ModalSheet
        open={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        title={selectedCategoryName}
        backAction={() => { setProductModalOpen(false); setCategoryModalOpen(true) }}
      >
        <SearchBox placeholder="Rechercher un produit..." value={prodSearch} onChange={setProdSearch} />
        {filteredProducts.map(p => (
          <div
            key={p.id}
            onClick={() => addProduct(p)}
            className="flex justify-between items-center py-3.5 border-b border-border/30 cursor-pointer hover:bg-primary-light/50 rounded-lg px-2 transition-colors"
          >
            <div>
              <h4 className="text-sm font-semibold text-foreground">{p.name}</h4>
              <div className="text-[13px] gold-text font-medium mt-0.5">{formatDH(p.price)}</div>
            </div>
            <div className="text-right">
              <div className={`text-base font-bold ${p.stock === 0 ? 'text-red' : p.stock < 50 ? 'text-orange' : 'text-foreground'}`}>
                {p.stock}
              </div>
              <div className="text-[11px] text-muted">en stock</div>
              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold mt-1 ${
                p.stock === 0 ? 'bg-red-light text-red' :
                p.stock < p.low_stock_threshold ? 'bg-orange-light text-orange' :
                'bg-gold-50 text-gold-dark'
              }`}>
                {p.stock === 0 ? 'Rupture' : p.stock < p.low_stock_threshold ? 'Stock bas' : 'OK'}
              </span>
            </div>
          </div>
        ))}
      </ModalSheet>

      {/* Success Modal */}
      <ModalSheet open={successModalOpen} onClose={closeAndReset} title="">
        <div className="text-center py-8">
          <div className="w-[70px] h-[70px] bg-gold-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Vente creee avec succes !</h3>
          <p className="text-[13px] text-muted mb-5">Bon N° {lastRefNumber}</p>
          <button
            onClick={closeAndReset}
            className="w-full py-3.5 btn-gold rounded-xl text-[15px] cursor-pointer"
          >
            Retour aux ventes
          </button>
        </div>
      </ModalSheet>
    </div>
  )
}
