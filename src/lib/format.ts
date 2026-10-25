const dateFormat = new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })

export function formatDate(iso: string): string {
  return dateFormat.format(new Date(iso))
}

// Wert für <input type="date"> (YYYY-MM-DD) in lokaler Zeit.
export function toDateInput(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function fromDateInput(value: string): string | undefined {
  if (!value) return undefined
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d, 12).toISOString()
}

const DAY = 24 * 60 * 60 * 1000

export function daysBetween(fromIso: string, toIso: string): number {
  const start = new Date(fromIso)
  const end = new Date(toIso)
  const a = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())
  const b = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate())
  return Math.round((b - a) / DAY)
}

export function formatDuration(days: number): string {
  const d = Math.abs(days)
  if (d === 0) return 'am selben Tag'
  if (d === 1) return '1 Tag'
  if (d < 14) return `${d} Tage`
  if (d < 60) return `${Math.round(d / 7)} Wochen`
  if (d < 730) return `${Math.round(d / 30.44)} Monate`
  return `${(d / 365.25).toFixed(1).replace('.', ',')} Jahre`
}

export function formatAgo(iso: string): string {
  const days = daysBetween(iso, new Date().toISOString())
  if (days <= 0) return 'heute'
  if (days === 1) return 'gestern'
  if (days < 14) return `vor ${days} Tagen`
  if (days < 60) return `vor ${Math.round(days / 7)} Wochen`
  if (days < 730) return `vor ${Math.round(days / 30.44)} Monaten`
  return `vor ${(days / 365.25).toFixed(1).replace('.', ',')} Jahren`
}

export function formatShortDate(iso: string): string {
  return new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'short', year: '2-digit' }).format(new Date(iso))
}
