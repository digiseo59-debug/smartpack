'use client'

import { Toaster } from 'react-hot-toast'

export function ToastProvider() {
  return (
    <Toaster
      position="bottom-center"
      toastOptions={{
        duration: 2500,
        style: {
          background: '#333',
          color: '#fff',
          borderRadius: '8px',
          fontSize: '14px',
          marginBottom: '80px',
        },
      }}
    />
  )
}
