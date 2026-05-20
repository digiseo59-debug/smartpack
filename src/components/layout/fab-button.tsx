'use client'

interface FabButtonProps {
  onClick: () => void
  variant?: 'green' | 'orange'
}

export function FabButton({ onClick }: FabButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-24 lg:bottom-8 right-6 lg:right-8 w-14 h-14 rounded-2xl text-primary border-none text-2xl flex items-center justify-center cursor-pointer z-[999] transition-all active:scale-90 hover:scale-105 btn-gold"
    >
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
      </svg>
    </button>
  )
}
