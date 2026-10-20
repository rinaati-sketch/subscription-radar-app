// פורמטים מהאפיון: תאריך DD/MM/YYYY, סכום "{עלות} {מטבע}"
export type Currency = 'ILS' | 'USD'
export const currencySymbol: Record<Currency, string> = { ILS: '₪', USD: '$' }

const pad = (n: number) => String(n).padStart(2, '0')

// 'YYYY-MM-DD' (מהמסד) -> 'DD/MM/YYYY'
export function fmtDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

// 'DD/MM/YYYY' -> 'YYYY-MM-DD', או null אם לא תאריך אמיתי
export function parseDate(text: string): string | null {
  const m = text.trim().match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/)
  if (!m) return null
  const d = Number(m[1]), mo = Number(m[2]), y = Number(m[3])
  const dt = new Date(Date.UTC(y, mo - 1, d))
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null
  return `${y}-${pad(mo)}-${pad(d)}`
}

export function todayIso(): string {
  const n = new Date()
  return `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}`
}

export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d + days))
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`
}

export function daysBetween(fromIso: string, toIso: string): number {
  const a = Date.parse(`${fromIso}T00:00:00Z`), b = Date.parse(`${toIso}T00:00:00Z`)
  return Math.round((b - a) / 86_400_000)
}

// "בעוד 9 ימים" / "מחר" / "היום" (Design guidelines, טקסט וטון)
export function daysLeftText(renewalIso: string): string {
  const n = daysBetween(todayIso(), renewalIso)
  if (n === 0) return 'היום'
  if (n === 1) return 'מחר'
  if (n < 0) return `לפני ${-n} ימים`
  return `בעוד ${n} ימים`
}

// המועד האחרון לביטול = היום שלפני החידוש (אפיון 6)
export const lastCancelDay = (renewalIso: string) => addDays(renewalIso, -1)
// תאריך ההתראה = 14 יום לפני החידוש
export const alertDay = (renewalIso: string) => addDays(renewalIso, -14)

export function fmtCost(cost: number | string): string {
  const n = Number(cost)
  return Number.isInteger(n) ? String(n) : n.toFixed(2)
}
export function fmtMoney(cost: number | string, currency: Currency): string {
  return `${fmtCost(cost)} ${currencySymbol[currency]}`
}

export const cycleText = { monthly: 'חודשי', yearly: 'שנתי' } as const
