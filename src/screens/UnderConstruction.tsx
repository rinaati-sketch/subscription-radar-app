import { useLocation } from 'react-router-dom'
import { Logo } from '../components/Logo'

// מסך זמני לצעד 1 של שלב 11 - מוחלף במסכים האמיתיים בצעדים הבאים
export function UnderConstruction() {
  const { pathname } = useLocation()
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center gap-5 px-4 text-center">
      <Logo size={56} />
      <h1 className="font-black text-[length:var(--layout-title-size)] leading-tight">האפליקציה בבנייה</h1>
      <p className="text-muted max-w-sm">
        התראה 14 יום לפני כל חידוש - ומחליטים בזמן אם להשאיר או לבטל. המסכים יעלו כאן בקרוב.
      </p>
      <p className="text-sm text-muted">
        כתובת: <bdi dir="ltr">{pathname}</bdi>
      </p>
    </main>
  )
}
