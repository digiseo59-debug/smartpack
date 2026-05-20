'use client'

import { usePathname } from 'next/navigation'
import { AppHeader } from '@/components/layout/app-header'
import { BottomNav } from '@/components/layout/bottom-nav'
import { useAuth } from '@/lib/auth/auth-context'
import { useEffect } from 'react'

const pageTitles: Record<string, string> = {
  '/ventes': 'Ventes',
  '/ventes/nouveau': 'Nouvelle Vente',
  '/achats': 'Achats',
  '/achats/nouveau': 'Nouvel Achat',
  '/stock': 'Stock',
  '/clients': 'Clients',
  '/dashboard': 'Dashboard',
  '/admin': 'Administration',
  '/admin/users': 'Utilisateurs',
  '/admin/categories': 'Categories',
  '/admin/products': 'Produits',
  '/admin/suppliers': 'Fournisseurs',
  '/admin/expenses': 'Depenses',
  '/admin/settings': 'Parametres',
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, profile, role, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/login'
    }
  }, [loading, user])

  const title = pageTitles[pathname] ?? 'SmartPack'

  if (loading || !user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl overflow-hidden ring-2 ring-gold/20">
            <img src="/logo.jpg" alt="SmartPack" className="w-full h-full object-cover" />
          </div>
          <div className="w-8 h-8 border-[2.5px] border-border border-t-gold rounded-full animate-spin mx-auto mt-3" />
        </div>
      </div>
    )
  }

  const hideNav = pathname === '/ventes/nouveau' || pathname === '/achats/nouveau'

  return (
    <>
      <AppHeader title={title} />
      <div className="flex">
        {!hideNav && <BottomNav role={role} />}
        <main className={`pt-[72px] pb-24 lg:pb-6 min-h-screen w-full animate-fade-in ${!hideNav ? 'lg:pl-[280px]' : ''}`}>
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </>
  )
}
