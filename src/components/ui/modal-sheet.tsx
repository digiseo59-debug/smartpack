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
      className="fixed inset-0 bg-black/50 z-[2000] flex items-end md:items-center justify-center md:p-5"
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      <div className="bg-white w-full max-h-[85vh] md:max-h-[90vh] md:max-w-[480px] rounded-t-[20px] md:rounded-[20px] overflow-hidden flex flex-col animate-slide-up">
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-2" />
        <div className="px-4 py-3 flex justify-between items-center border-b border-gray-100">
          <div className="flex items-center gap-3">
            {backAction && (
              <button onClick={backAction} className="text-gray-500">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <h3 className="text-base font-semibold">{title}</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 text-xl leading-none">&times;</button>
        </div>
        <div className="overflow-y-auto flex-1 p-4">
          {children}
        </div>
      </div>
    </div>
  )
}
