'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItem {
  href: string
  label: string
  icon: string
}

interface BottomNavProps {
  role: 'admin' | 'salarie'
}

const adminItems: NavItem[] = [
  { href: '/stock', label: 'Stock', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { href: '/ventes', label: 'Ventes', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z' },
  { href: '/achats', label: 'Achats', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
  { href: '/clients', label: 'Clients', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  { href: '/dashboard', label: 'Stats', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
]

const salarieItems: NavItem[] = [
  { href: '/stock', label: 'Stock', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { href: '/ventes', label: 'Ventes', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z' },
  { href: '/clients', label: 'Clients', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
]

export function BottomNav({ role }: BottomNavProps) {
  const pathname = usePathname()
  const items = role === 'admin' ? adminItems : salarieItems

  return (
    <>
      {/* Mobile bottom nav — frosted glass */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[1000]">
        <div className="absolute inset-0 bg-[#0c0c0c]/90 glass border-t border-[rgba(200,169,96,0.1)]" />
        <div className="relative flex justify-around py-2 pb-[max(10px,env(safe-area-inset-bottom))]">
          {items.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all ${
                  isActive ? 'text-gold' : 'text-white/35'
                }`}
              >
                <div className="relative">
                  {isActive && (
                    <div className="absolute -inset-2.5 bg-gold/8 rounded-xl" />
                  )}
                  <svg className="w-[22px] h-[22px] relative" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isActive ? 2.2 : 1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                </div>
                <span className={`text-[10px] ${isActive ? 'font-bold text-gold' : 'font-medium'}`}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Desktop sidebar — glass panel */}
      <nav className="hidden lg:flex fixed left-0 top-[72px] bottom-0 w-[280px] z-[999] flex-col">
        <div className="absolute inset-0 bg-surface/80 glass border-r border-border" />
        <div className="relative flex-1 flex flex-col py-8 px-4">
          <div className="space-y-1.5">
            {items.map((item) => {
              const isActive = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-[13px] font-semibold transition-all ${
                    isActive
                      ? 'hero-stat text-white shadow-lg'
                      : 'text-muted hover:text-foreground hover:bg-gold/5'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isActive ? 'bg-gold/15' : 'bg-transparent'}`}>
                    <svg className={`w-[20px] h-[20px] ${isActive ? 'text-gold' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isActive ? 2 : 1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                    </svg>
                  </div>
                  <span className="relative z-10">{item.label}</span>
                  {isActive && <div className="ml-auto w-2 h-2 rounded-full bg-gold shadow-lg shadow-gold/30" />}
                </Link>
              )
            })}
          </div>

          {role === 'admin' && (
            <div className="mt-8 pt-6 border-t border-border">
              <p className="px-4 text-[9px] font-bold text-muted/40 uppercase tracking-[0.2em] mb-3">Administration</p>
              <Link
                href="/admin"
                className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-[13px] font-semibold transition-all ${
                  pathname.startsWith('/admin')
                    ? 'hero-stat text-white shadow-lg'
                    : 'text-muted hover:text-foreground hover:bg-gold/5'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${pathname.startsWith('/admin') ? 'bg-gold/15' : 'bg-transparent'}`}>
                  <svg className={`w-[20px] h-[20px] ${pathname.startsWith('/admin') ? 'text-gold' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <span>Parametres</span>
              </Link>
            </div>
          )}

          <div className="mt-auto px-3 py-4">
            <div className="hero-stat p-4">
              <div className="relative z-10 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl gradient-gold flex items-center justify-center shadow-lg shadow-gold/20">
                  <span className="text-[10px] font-black text-[#1a1a1a]">SP</span>
                </div>
                <div>
                  <p className="text-[12px] font-bold text-white">SmartPack</p>
                  <p className="text-[10px] text-gold/40">Emballage Meknes</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </>
  )
}
