'use client'

interface FilterTabsProps {
  tabs: { key: string; label: string }[]
  active: string
  onChange: (key: string) => void
  color?: 'green' | 'orange'
}

export function FilterTabs({ tabs, active, onChange, color = 'green' }: FilterTabsProps) {
  const activeClass = color === 'green'
    ? 'bg-primary text-white border-primary'
    : 'bg-orange text-white border-orange'

  return (
    <div className="flex gap-2 px-4 py-3 bg-white overflow-x-auto scrollbar-none">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`px-4 py-1.5 rounded-full text-[13px] font-medium border whitespace-nowrap transition-all ${
            active === tab.key
              ? activeClass
              : 'bg-white text-gray-500 border-gray-300'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
