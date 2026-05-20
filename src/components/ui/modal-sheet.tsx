'use client'

import { useEffect, useRef } from 'react'

interface ModalSheetProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  backAction?: () => void
}

export function ModalSheet({ open, onClose, title, children, backAction }: ModalSheetProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[2000] flex items-end lg:items-center justify-center lg:p-6"
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      <div className="bg-white w-full max-h-[85vh] lg:max-h-[85vh] lg:max-w-[520px] rounded-t-2xl lg:rounded-2xl overflow-hidden flex flex-col animate-slide-up shadow-2xl">
        <div className="lg:hidden w-10 h-1 bg-gray-300 rounded-full mx-auto mt-2.5" />
        <div className="px-5 py-4 flex justify-between items-center border-b border-gray-100">
          <div className="flex items-center gap-3">
            {backAction && (
              <button onClick={backAction} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <h3 className="text-[15px] font-bold text-gray-900">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-5">
          {children}
        </div>
      </div>
    </div>
  )
}
