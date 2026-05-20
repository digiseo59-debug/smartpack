'use client'

import { usePathname } from 'next/navigation'
import { AppHeader } from '@/components/layout/app-header'
import { BottomNav } from '@/components/layout/bottom-nav'
import { useAuth } from '@/lib/auth/auth-context'

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
  '/admin/settings': 'Parametres',
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { role, loading } = useAuth()

  const title = pageTitles[pathname] ?? 'SmartPack'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-9 h-9 border-3 border-gray-200 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  const hideNav = pathname === '/ventes/nouveau' || pathname === '/achats/nouveau'

  return (
    <>
      <AppHeader title={title} />
      <main className="pt-14 pb-[70px] min-h-screen animate-fade-in">
        {children}
      </main>
      {!hideNav && <BottomNav role={role} />}
    </>
  )
}
