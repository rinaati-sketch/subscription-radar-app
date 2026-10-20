import type { ReactNode } from 'react'
import { CircleAlert, CircleCheck, Clock, Info } from 'lucide-react'

// באנר לפי רכיב Banner ב-Figma: Success / Error / Missed / Clarification
type Type = 'success' | 'error' | 'missed' | 'clarification'
const styles: Record<Type, { box: string; icon: ReactNode; text: string }> = {
  success: { box: 'bg-highlight border-ink', icon: <CircleCheck />, text: 'text-ink' },
  missed: { box: 'bg-highlight border-ink', icon: <Clock />, text: 'text-ink' },
  error: { box: 'bg-[var(--color-feedback-error-bg)] border-[var(--color-border-danger)]', icon: <CircleAlert />, text: 'text-[var(--color-text-danger)]' },
  clarification: { box: 'bg-[var(--color-feedback-info-bg)] border-ink', icon: <Info />, text: 'text-ink' },
}

export function Banner({ type, children, actions }: { type: Type; children: ReactNode; actions?: ReactNode }) {
  const s = styles[type]
  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      className={`flex flex-col gap-3 rounded-[18px] border-[length:var(--border-default)] px-5 py-4 animate-[banner-in_var(--motion-duration-moderate)_var(--motion-easing-standard)] ${s.box}`}
    >
      <div className={`flex items-start gap-2.5 ${s.text}`}>
        <span className="mt-0.5 shrink-0 [&>svg]:size-[22px]" aria-hidden="true">{s.icon}</span>
        <p className="text-[17px] font-medium leading-relaxed">{children}</p>
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </div>
  )
}
