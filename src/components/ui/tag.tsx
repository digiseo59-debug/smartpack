interface TagProps {
  variant: 'user' | 'cash' | 'credit' | 'orange' | 'gift'
  children: React.ReactNode
}

const variantClasses: Record<string, string> = {
  user: 'bg-primary-light text-primary',
  cash: 'bg-blue-light text-blue',
  credit: 'bg-red-light text-red',
  orange: 'bg-orange-light text-orange',
  gift: 'bg-purple-light text-purple',
}

export function Tag({ variant, children }: TagProps) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium ${variantClasses[variant] ?? ''}`}>
      {children}
    </span>
  )
}
