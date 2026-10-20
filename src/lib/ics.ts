// "הוספה ליומן": קובץ יומן עם אירוע ביום האחרון לביטול (אפיון 5.4). נוצר בדפדפן, בלי שרת
export function downloadCancelReminder(name: string, lastDayIso: string): void {
  const d = lastDayIso.replace(/-/g, '')
  const next = new Date(`${lastDayIso}T00:00:00Z`)
  next.setUTCDate(next.getUTCDate() + 1)
  const end = next.toISOString().slice(0, 10).replace(/-/g, '')
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const title = `המועד האחרון לבטל את ${name}`
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Radar//Subscriptions//HE', 'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${crypto.randomUUID()}@radar`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${d}`,
    `DTEND;VALUE=DATE:${end}`,
    `SUMMARY:${title}`,
    'BEGIN:VALARM', 'TRIGGER:PT9H', 'ACTION:DISPLAY', `DESCRIPTION:${title}`, 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n')
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `radar-${name.replace(/[^\w֐-׿]+/g, '-')}.ics`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
