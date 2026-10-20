import type { ReactNode } from 'react'
import { Logo } from './Logo'

// מסגרת מסכי ההרשמה וההתחברות (Figma: Screens / Auth + Desktop)
// טלפון: עמודה אחת על הרקע. מחשב (768+): כרטיס במרכז עם עיגולים ברקע כמו בדף הנחיתה
export function AuthLayout({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="relative min-h-dvh overflow-hidden">
      <div aria-hidden="true" className="hidden md:block">
        <span className="absolute -top-10 end-[8%] size-64 rounded-full border-[3px] border-ink bg-[var(--color-focus-ring)]" />
        <span className="absolute bottom-16 start-[6%] size-36 rounded-full border-[3px] border-ink bg-[var(--color-status-pending-bg)]" />
        <span className="absolute top-40 start-[16%] size-20 rounded-full border-[3px] border-ink bg-primary" />
      </div>
      <main className="relative mx-auto flex w-full max-w-[480px] flex-col gap-5 px-4 pt-10 pb-10 md:my-16 md:rounded-[var(--radius-card)] md:border-[3px] md:border-ink md:bg-surface md:p-9 md:shadow-[var(--shadow-lg)]">
        <div className="flex justify-center pb-2"><Logo /></div>
        <h1 className="font-black text-[length:var(--layout-title-size)] leading-tight">{title}</h1>
        {subtitle && <p className="-mt-2 text-muted">{subtitle}</p>}
        {children}
      </main>
    </div>
  )
}

export function LinkRow({ lead, children }: { lead?: string; children: ReactNode }) {
  return (
    <p className="flex flex-wrap items-center gap-1 text-muted">
      {lead && <span>{lead}</span>}
      {children}
    </p>
  )
}
