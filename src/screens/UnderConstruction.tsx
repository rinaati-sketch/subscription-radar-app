import { useLocation, useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { Logo } from '../components/Logo'
import { Button } from '../components/Button'
import { supabase } from '../lib/supabase'
import { useAuth } from '../app/auth'
import { t } from '../content/he'

// מסך זמני למסכים המוגנים - מוחלף במסכים האמיתיים בצעדים הבאים של שלב 11
export function UnderConstruction() {
  const { pathname } = useLocation()
  const { session } = useAuth()
  const navigate = useNavigate()
  const logout = async () => {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center gap-5 px-4 text-center">
      <Logo size={56} />
      <h1 className="font-black text-[length:var(--layout-title-size)] leading-tight">המסך הזה בבנייה</h1>
      <p className="text-muted max-w-sm">
        ההתחברות עובדת. המסכים של רשימת המנויים יעלו כאן בצעד הבא.
      </p>
      {session?.user.email && (
        <p className="text-sm text-muted">מחוברת בתור <bdi dir="ltr">{session.user.email}</bdi> · <bdi dir="ltr">{pathname}</bdi></p>
      )}
      <Button variant="secondary" icon={<LogOut className="size-5" aria-hidden="true" />} onClick={logout}>{t.common.logout}</Button>
    </main>
  )
}
