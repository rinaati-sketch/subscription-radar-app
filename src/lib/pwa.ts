import { registerSW } from 'virtual:pwa-register'

// גרסה חדשה נטענת מעצמה: בודקים עדכון בכל פתיחה ובכל שעה, והדף מתרענן כשהגרסה החדשה מוכנה
export function setupPwa(): void {
  registerSW({
    immediate: true,
    onRegisteredSW(_url, registration) {
      if (!registration) return
      registration.update()
      setInterval(() => registration.update(), 60 * 60 * 1000)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') registration.update()
      })
    },
  })
}
