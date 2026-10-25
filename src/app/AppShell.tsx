import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { LogOut } from 'lucide-react'
import { Logo } from '../components/Logo'
import { supabase } from '../lib/supabase'
import { t } from '../content/he'

// מסגרת המסכים המוגנים, בעיצוב של גרסת Lovable: לוגו וקישורי טקסט עם קו ליים,
// ובטלפון הקישורים יורדים לשורה מתחת ללוגו. התוכן עצמו יושב בכרטיס גדול בכל מסך
const items = [
  { to: '/subscriptions', label: t.nav.list, end: true },
  { to: '/subscriptions/cancelled', label: t.nav.cancelled },
  { to: '/subscriptions/new', label: t.nav.add },
]

const link =
  'inline-flex min-h-11 items-center rounded-lg px-2 font-bold text-[var(--color-text-link)] underline decoration-[var(--color-focus-ring)] decoration-4 underline-offset-[3px]'

export function AppShell() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const logout = async () => {
    await supabase.auth.signOut()
    qc.clear()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-dvh overflow-x-hidden px-4 pt-4 pb-[calc(32px+env(safe-area-inset-bottom))] sm:px-8 sm:pt-8">
      <div className="mx-auto max-w-[var(--layout-content-max)]">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <NavLink to="/subscriptions" aria-label={t.appName} className="rounded-lg"><Logo size={40} /></NavLink>
          <nav aria-label={t.nav.main} className="w-full sm:w-auto">
            <ul className="flex flex-wrap items-center gap-x-3">
              {items.map(i => (
                <li key={i.to}>
                  <NavLink
                    to={i.to}
                    end={i.end}
                    className={({ isActive }) => `${link} ${isActive ? 'bg-highlight text-ink' : ''}`}
                  >
                    {i.label}
                  </NavLink>
                </li>
              ))}
              <li>
                <button type="button" onClick={logout} className={`${link} gap-1.5`}>
                  <LogOut className="size-4" aria-hidden="true" />
                  {t.common.logout}
                </button>
              </li>
            </ul>
          </nav>
        </header>
        <main className="animate-[screen-in_var(--motion-duration-fade)_ease-out]">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
