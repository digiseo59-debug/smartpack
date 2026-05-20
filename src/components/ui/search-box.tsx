'use client'

interface SearchBoxProps {
  placeholder: string
  value: string
  onChange: (value: string) => void
}

export function SearchBox({ placeholder, value, onChange }: SearchBoxProps) {
  return (
    <div className="flex items-center bg-gray-100 rounded-[10px] px-3.5 py-2.5 mb-3">
      <svg className="w-4 h-4 text-gray-400 mr-2.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border-none bg-transparent outline-none text-sm w-full font-[inherit]"
      />
    </div>
  )
}
