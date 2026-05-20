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

  const colorMap: Record<string, string> = {
    'cat-orange': 'bg-orange',
    'cat-brown': 'bg-[#8d6e63]',
    'cat-green': 'bg-gold',
    'cat-gray': 'bg-muted',
  }

  return (
    <div className="px-4 lg:px-6 py-4 space-y-4">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors cursor-pointer">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Retour
      </button>

      <button onClick={() => setModalOpen(true)}
        className="w-full py-3.5 btn-gold rounded-xl text-sm font-bold cursor-pointer">
        + Ajouter une categorie
      </button>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-9 h-9 border-[2.5px] border-border border-t-gold rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {categories.map(cat => (
            <div key={cat.id} className="glass-card card-hover p-5 text-center cursor-pointer">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 text-white shadow-lg ${colorMap[cat.color] ?? 'bg-muted'}`}>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <p className="text-sm font-bold text-foreground">{cat.name}</p>
              <p className="text-[10px] text-muted mt-0.5 font-medium">{cat.slug}</p>
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
            <div className="flex gap-3">
              {Object.entries(colorMap).map(([key, cls]) => (
                <button key={key} onClick={() => setForm({ ...form, color: key })}
                  className={`w-11 h-11 rounded-xl cursor-pointer transition-all ${cls} ${form.color === key ? 'ring-2 ring-gold ring-offset-2 ring-offset-background scale-110' : 'opacity-60 hover:opacity-100'}`} />
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
