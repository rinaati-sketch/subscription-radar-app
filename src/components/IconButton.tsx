import type { ButtonHTMLAttributes, ReactNode } from 'react'

// לחצן סמל 44px עם תווית נגישה (בטבלה ובכרטיסים: עריכה, מחיקה, התנתקות)
type Props = ButtonHTMLAttributes<HTMLButtonElement> & { label: string; icon: ReactNode; danger?: boolean }

export function IconButton({ label, icon, danger, className = '', ...rest }: Props) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex size-11 shrink-0 items-center justify-center rounded-[12px] border-[length:var(--border-small)] border-ink bg-surface shadow-[var(--shadow-sm)] transition-[transform,box-shadow] duration-[var(--motion-duration-fast)] ease-[var(--motion-easing-out)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none [&>svg]:size-5 ${danger ? 'text-[var(--color-text-danger)]' : 'text-ink'} ${className}`}
      {...rest}
    >
      {icon}
    </button>
  )
}
