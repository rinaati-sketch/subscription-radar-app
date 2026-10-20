import type { ReactNode } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Ban, LayoutList, LogOut, Plus } from 'lucide-react'
import { Logo } from '../components/Logo'
import { supabase } from '../lib/supabase'
import { t } from '../content/he'

// מסגרת המסכים המוגנים (Figma: Responsive / Nav):
// 768+ ניווט עליון עם קישורים, טלפון: שורה עליונה + ניווט תחתון קבוע
type Item = { to: string; label: string; short: string; icon: ReactNode; end?: boolean }
const items: Item[] = [
  { to: '/subscriptions', label: t.nav.list, short: t.nav.list, icon: <LayoutList />, end: true },
  { to: '/subscriptions/cancelled', label: t.nav.cancelled, short: t.nav.cancelledShort, icon: <Ban /> },
  { to: '/subscriptions/new', label: t.nav.add, short: t.nav.addShort, icon: <Plus /> },
]

export function AppShell() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const logout = async () => {
    await supabase.auth.signOut()
    qc.clear()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-dvh pb-[calc(var(--layout-bottom-nav)+env(safe-area-inset-bottom))] md:pb-0">
      <header className="sticky top-0 z-30 border-b-[length:var(--border-default)] border-ink bg-page">
        <div className="mx-auto flex max-w-[var(--layout-content-max)] items-center justify-between gap-4 px-[var(--layout-page-padding)] py-2.5 md:py-3.5">
          <NavLink to="/subscriptions" aria-label={t.appName} className="rounded-lg"><Logo size={36} /></NavLink>
          <nav aria-label={t.nav.main} className="hidden md:block">
            <ul className="flex items-center gap-2">
              {items.map(i => (
                <li key={i.to}>
                  <NavLink
                    to={i.to}
                    end={i.end}
                    className={({ isActive }) =>
                      `inline-flex min-h-11 items-center rounded-[12px] border-[length:var(--border-small)] px-3.5 font-extrabold transition-colors duration-[var(--motion-duration-fast)] ${
                        isActive ? 'border-ink bg-highlight' : 'border-transparent hover:border-ink'
                      }`
                    }
                  >
                    {i.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <button
            type="button"
            onClick={logout}
            aria-label={t.common.logout}
            className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-[12px] font-extrabold hover:bg-highlight md:px-3"
          >
            <LogOut className="size-5" aria-hidden="true" />
            <span className="hidden md:inline">{t.common.logout}</span>
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[var(--layout-content-max)] px-[var(--layout-page-padding)] pt-6 pb-10 md:pt-10 animate-[screen-in_var(--motion-duration-fade)_ease-out]">
        <Outlet />
      </main>

      <nav aria-label={t.nav.main} className="fixed inset-x-0 bottom-0 z-30 border-t-[length:var(--border-default)] border-ink bg-surface pb-[env(safe-area-inset-bottom)] md:hidden">
        <ul className="grid h-[var(--layout-bottom-nav)] grid-cols-3 items-center px-2">
          {items.map(i => (
            <li key={i.to} className="flex justify-center">
              <NavLink
                to={i.to}
                end={i.end}
                className={({ isActive }) =>
                  `flex min-h-11 min-w-[88px] flex-col items-center justify-center rounded-[var(--radius-pill)] px-3 py-0.5 text-[length:var(--font-size-caption)] font-extrabold leading-tight [&>svg]:size-5 ${
                    isActive ? 'bg-ring text-ink' : 'text-muted'
                  }`
                }
              >
                {i.icon}
                <span>{i.short}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
