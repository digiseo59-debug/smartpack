export function formatDH(amount: number): string {
  return new Intl.NumberFormat('fr-MA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ' DH'
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
  }).format(date)
}

export function getDateRange(period: string): { from: Date; to: Date } {
  const now = new Date()
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

  switch (period) {
    case 'today': {
      const from = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
      return { from, to }
    }
    case 'week': {
      const from = new Date(to)
      from.setDate(from.getDate() - 7)
      from.setHours(0, 0, 0, 0)
      return { from, to }
    }
    case 'month': {
      const from = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)
      return { from, to }
    }
    case 'quarter': {
      const quarterStart = Math.floor(now.getMonth() / 3) * 3
      const from = new Date(now.getFullYear(), quarterStart, 1, 0, 0, 0)
      return { from, to }
    }
    default: {
      const from = new Date(2020, 0, 1)
      return { from, to }
    }
  }
}

export function getPaymentLabel(mode: string): string {
  const labels: Record<string, string> = {
    cash: 'Especes',
    transfer: 'Virement',
    check: 'Cheque',
  }
  return labels[mode] ?? mode
}

export function getStockStatus(stock: number, threshold: number = 20): 'ok' | 'low' | 'out' {
  if (stock === 0) return 'out'
  if (stock <= threshold) return 'low'
  return 'ok'
}
