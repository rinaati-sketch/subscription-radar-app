// הפניה אחרי התחברות: רק כתובת פנימית (מתחילה ב-/ ולא ב-//), אחרת לרשימת המנויים
export function safeNext(next: string | null | undefined): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return '/subscriptions'
  return next
}

// כניסה ראשונה מהדפדפן -> הרשמה, כניסה חוזרת -> התחברות (אפיון 5.1)
const SEEN_KEY = 'radar_seen'
export function markSeen(): void {
  try { localStorage.setItem(SEEN_KEY, '1') } catch { /* מצב פרטי - לא קריטי */ }
}
export function hasSeen(): boolean {
  try { return localStorage.getItem(SEEN_KEY) === '1' } catch { return false }
}

// כתובת מלאה של מסך באפליקציה, לקישורים במיילים (אימות ואיפוס סיסמה)
export function appUrl(path: string): string {
  return `${window.location.origin}${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`
}
