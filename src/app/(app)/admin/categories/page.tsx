'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth/auth-context'
import { ModalSheet } from '@/components/ui/modal-sheet'
import toast from 'react-hot-toast'
import type { Category } from '@/types/database'

export default function CategoriesAdminPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ name: '', slug: '', icon: 'fa-folder', color: 'cat-orange' })
  const { isAdmin } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (!isAdmin) { router.replace('/ventes'); return }
    loadCategories()
  }, [isAdmin])

  async function loadCategories() {
    const { data } = await supabase.from('categories').select('*').order('sort_order')
    setCategories(data ?? [])
    setLoading(false)
  }

  async function createCategory() {
    if (!form.name.trim()) { toast.error('Nom requis'); return }
    const slug = form.slug || form.name.toLowerCase().replace(/\s+/g, '-')
    const { error } = await supabase.from('categories').insert({ ...form, slug, sort_order: categories.length })
    if (error) { toast.error(error.message); return }
    toast.success('Categorie creee')
    setModalOpen(false)
    setForm({ name: '', slug: '', icon: 'fa-folder', color: 'cat-orange' })
    loadCategories()
  }

  return (
    <div className="px-4 lg:px-6 py-4">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-muted hover:text-foreground mb-4 transition-colors cursor-pointer">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Retour
      </button>

      <button onClick={() => setModalOpen(true)}
        className="w-full py-3 btn-gold rounded-xl text-sm font-semibold mb-4 cursor-pointer">
        + Ajouter une categorie
      </button>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-9 h-9 border-[2.5px] border-border border-t-gold rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {categories.map(cat => (
            <div key={cat.id} className="card p-5 text-center">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-2.5 text-white ${
                cat.color === 'cat-orange' ? 'bg-orange' :
                cat.color === 'cat-brown' ? 'bg-[#8d6e63]' :
                cat.color === 'cat-green' ? 'bg-gold' : 'bg-muted'
              }`}>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div className="text-sm font-semibold text-foreground">{cat.name}</div>
              <div className="text-xs text-muted mt-0.5">{cat.slug}</div>
            </div>
          ))}
        </div>
      )}

      <ModalSheet open={modalOpen} onClose={() => setModalOpen(false)} title="Nouvelle categorie">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Nom *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Boite, Box..." className="input-field" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Couleur</label>
            <div className="flex gap-2">
              {['cat-orange', 'cat-green', 'cat-brown', 'cat-gray'].map(c => (
                <button key={c} onClick={() => setForm({ ...form, color: c })}
                  className={`w-10 h-10 rounded-full border-2 cursor-pointer ${form.color === c ? 'border-gold ring-2 ring-gold/20' : 'border-transparent'} ${
                    c === 'cat-orange' ? 'bg-orange' : c === 'cat-green' ? 'bg-gold' : c === 'cat-brown' ? 'bg-[#8d6e63]' : 'bg-muted'
                  }`} />
              ))}
            </div>
          </div>
          <button onClick={createCategory}
            className="w-full py-3.5 btn-gold rounded-xl text-[15px] cursor-pointer">
            Creer la categorie
          </button>
        </div>
      </ModalSheet>
    </div>
  )
}
