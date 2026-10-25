import type { ReactNode } from 'react'
import { Logo } from './Logo'
import { t } from '../content/he'
import { addDays, alertDay, fmtDate, todayIso } from '../lib/format'

// מסגרת מסכי ההרשמה וההתחברות, בעיצוב של גרסת Lovable:
// כרטיס הטופס, ומ-1024 גם צד ויזואלי עם עיגולים, כותרת וכרטיס מנוי לדוגמה
export function AuthLayout({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="min-h-dvh overflow-x-hidden">
      <div className="mx-auto grid min-h-dvh max-w-7xl items-center gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-2 lg:px-12">
        <div className="flex min-w-0 flex-col items-center gap-8">
          <div className="lg:hidden"><Logo size={48} /></div>
          <main className="card-xl w-full max-w-md p-5 sm:p-9">
            <h1 className="break-words text-[30px] font-black leading-tight sm:text-[36px]">{title}</h1>
            {subtitle && <p className="mt-2 text-muted">{subtitle}</p>}
            <div className="mt-7 flex flex-col gap-5">{children}</div>
          </main>
        </div>
        <Visual />
      </div>
    </div>
  )
}

function Visual() {
  // כרטיס הדוגמה מציג תאריכים אמיתיים יחסית להיום, כדי שלא ייראו ישנים
  const renewal = addDays(todayIso(), 30)
  const rot = (deg: string, delay: string) => ({ ['--rot' as string]: deg, animationDelay: delay })
  return (
    <div className="relative hidden h-[640px] lg:block" aria-hidden="true">
      <div className="absolute end-1/2 top-0 translate-x-1/2"><Logo size={44} /></div>
      <div className="absolute left-0 top-28 size-[520px] rounded-full border-[3px] border-ink bg-ring" />
      <div className="pop-in absolute -left-6 top-16 size-28 rounded-full border-[3px] border-ink bg-[var(--color-status-pending-bg)]" style={{ animationDelay: '.1s' }} />
      <div className="pop-in absolute bottom-20 right-24 size-16 rounded-2xl border-[3px] border-ink bg-primary shadow-[6px_6px_0_var(--color-shadow-default)]" style={rot('18deg', '.5s')} />

      <div className="absolute right-0 top-[200px] text-right">
        <p className="text-[60px] font-black leading-tight">{t.hero.line1}</p>
        <span className="pop-in mt-2 inline-block rounded-2xl border-[3px] border-ink bg-surface px-5 py-1 text-[60px] font-black shadow-[6px_6px_0_var(--color-shadow-default)]" style={rot('-2deg', '.2s')}>
          {t.hero.line2}
        </span>
        <p className="mt-6 max-w-sm rounded-xl bg-surface/70 p-3 text-lg font-medium leading-relaxed">{t.hero.body}</p>
      </div>

      <div className="pop-in absolute bottom-10 left-0 w-72 rounded-2xl border-[3px] border-ink bg-surface p-4 text-right shadow-[6px_6px_0_var(--color-shadow-default)]" style={rot('-4deg', '.35s')}>
        <div className="text-lg font-black"><bdi>Canva Pro</bdi></div>
        <div className="text-sm text-muted">{t.hero.sampleRenews}<bdi dir="ltr">{fmtDate(renewal)}</bdi></div>
        <span className="mt-2 inline-block rounded-full border-[3px] border-ink bg-[var(--color-status-pending-bg)] px-3 py-0.5 text-sm font-extrabold">
          {t.hero.sampleAlert}<bdi dir="ltr">{fmtDate(alertDay(renewal)).slice(0, 5)}</bdi>
        </span>
      </div>

      <div className="pop-in absolute -bottom-4 left-1/3 rounded-2xl border-[3px] border-ink bg-primary px-5 py-3 text-lg font-extrabold text-white shadow-[6px_6px_0_var(--color-shadow-default)]" style={rot('5deg', '.5s')}>
        {t.hero.pill}
      </div>
    </div>
  )
}

export function LinkRow({ lead, children }: { lead?: string; children: ReactNode }) {
  return (
    <p className="flex flex-wrap items-center justify-center gap-1 text-[15px] text-muted">
      {lead && <span>{lead}</span>}
      {children}
    </p>
  )
}
