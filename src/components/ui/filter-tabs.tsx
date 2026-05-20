'use client'

interface FilterTabsProps {
  tabs: { key: string; label: string }[]
  active: string
  onChange: (key: string) => void
}

export function FilterTabs({ tabs, active, onChange }: FilterTabsProps) {
  return (
    <div className="flex gap-2 px-4 lg:px-6 py-4 overflow-x-auto scrollbar-none">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`px-5 py-2 rounded-xl text-[13px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
            active === tab.key
              ? 'gradient-dark text-white shadow-lg shadow-black/10'
              : 'bg-surface text-muted hover:text-foreground border border-border hover:border-gold/30'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
