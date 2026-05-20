'use client'

interface FilterTabsProps {
  tabs: { key: string; label: string }[]
  active: string
  onChange: (key: string) => void
  color?: 'green' | 'orange'
}

export function FilterTabs({ tabs, active, onChange }: FilterTabsProps) {
  return (
    <div className="flex gap-2 px-4 lg:px-6 py-4 overflow-x-auto scrollbar-none">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`px-5 py-2 rounded-xl text-[13px] font-semibold whitespace-nowrap transition-all ${
            active === tab.key
              ? 'bg-primary text-white shadow-lg shadow-black/10'
              : 'bg-white text-gray-500 hover:text-gray-700 hover:bg-gray-50 border border-gray-100'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
