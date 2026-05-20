'use client'

interface SearchBoxProps {
  placeholder: string
  value: string
  onChange: (value: string) => void
}

export function SearchBox({ placeholder, value, onChange }: SearchBoxProps) {
  return (
    <div className="flex items-center bg-surface rounded-xl px-4 py-3 border border-border focus-within:border-gold/40 focus-within:shadow-[0_0_0_3px_rgba(200,169,96,0.1)] transition-all">
      <svg className="w-[18px] h-[18px] text-muted mr-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border-none bg-transparent outline-none text-sm w-full font-[inherit] text-foreground placeholder:text-muted/60"
      />
      {value && (
        <button onClick={() => onChange('')} className="ml-2 text-muted hover:text-foreground transition-colors cursor-pointer">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}
