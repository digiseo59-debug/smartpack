interface TagProps {
  variant: 'user' | 'cash' | 'credit' | 'orange' | 'gift'
  children: React.ReactNode
}

const variantClasses: Record<string, string> = {
  user: 'bg-primary-50 text-primary border border-primary/10',
  cash: 'bg-blue-light text-blue border border-blue/10',
  credit: 'bg-red-light text-red border border-red/10',
  orange: 'bg-orange-light text-orange border border-orange/10',
  gift: 'bg-purple-light text-purple border border-purple/10',
}

export function Tag({ variant, children }: TagProps) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${variantClasses[variant] ?? ''}`}>
      {children}
    </span>
  )
}
