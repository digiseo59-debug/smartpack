'use client'

interface FabButtonProps {
  onClick: () => void
  variant?: 'green' | 'orange'
}

export function FabButton({ onClick, variant = 'green' }: FabButtonProps) {
  const bgClass = variant === 'green'
    ? 'bg-primary shadow-[0_4px_12px_rgba(45,122,62,0.4)]'
    : 'bg-orange shadow-[0_4px_12px_rgba(230,126,34,0.4)]'

  return (
    <button
      onClick={onClick}
      className={`fixed bottom-20 right-5 w-14 h-14 rounded-full text-white border-none text-2xl flex items-center justify-center cursor-pointer z-[999] transition-transform active:scale-95 ${bgClass}`}
    >
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
      </svg>
    </button>
  )
}
