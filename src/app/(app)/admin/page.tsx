'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/auth-context'
import { useEffect } from 'react'

const adminLinks = [
  { href: '/admin/users', label: 'Utilisateurs', desc: 'Ajouter, desactiver des comptes', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  { href: '/admin/categories', label: 'Categories', desc: 'Gerer les categories du stock', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z' },
  { href: '/admin/products', label: 'Produits', desc: 'Ajouter, modifier les produits', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { href: '/admin/suppliers', label: 'Fournisseurs', desc: 'Gerer les fournisseurs', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
  { href: '/admin/expenses', label: 'Charges', desc: 'Gerer les charges periodiques', icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
  { href: '/admin/settings', label: 'Parametres', desc: 'Configuration de application', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
]

export default function AdminPage() {
  const router = useRouter()
  const { isAdmin, loading } = useAuth()

  useEffect(() => {
    if (!loading && !isAdmin) router.replace('/ventes')
  }, [loading, isAdmin])

  if (!isAdmin) return null

  return (
    <div className="px-4 lg:px-6 py-4">
      <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-5">Panneau d&apos;administration</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {adminLinks.map(link => (
          <button
            key={link.href}
            onClick={() => router.push(link.href)}
            className="card card-hover p-5 flex items-center gap-4 text-left cursor-pointer"
          >
            <div className="w-11 h-11 rounded-xl gradient-dark text-gold flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={link.icon} />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">{link.label}</p>
              <p className="text-xs text-muted mt-0.5">{link.desc}</p>
            </div>
            <svg className="w-4 h-4 text-muted/50 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  )
}
