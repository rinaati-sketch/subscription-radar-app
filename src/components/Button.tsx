import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { LoaderCircle } from 'lucide-react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'

// לחצן לפי רכיב Button ב-Figma (שלב 6) ומפרט התנועה (שלב 7)
const base =
  'inline-flex items-center justify-center gap-2 min-h-[52px] font-extrabold text-[17px] leading-tight select-none ' +
  'transition-[transform,box-shadow,opacity] duration-[var(--motion-duration-fast)] ease-[var(--motion-easing-out)] ' +
  'disabled:cursor-default'
const boxed =
  'px-[26px] rounded-[var(--radius-button)] border-[length:var(--border-default)] border-ink shadow-[var(--shadow-md)] ' +
  'enabled:hover:translate-x-[2px] enabled:hover:translate-y-[2px] enabled:hover:shadow-[var(--shadow-sm)] ' +
  'enabled:active:translate-x-[5px] enabled:active:translate-y-[5px] enabled:active:shadow-none enabled:active:duration-[var(--motion-duration-instant)]'
const variants: Record<Variant, string> = {
  primary: `${boxed} bg-primary text-white`,
  secondary: `${boxed} bg-surface text-ink`,
  danger: `${boxed} bg-danger text-white`,
  ghost: 'px-2 text-[var(--color-text-link)] underline decoration-[var(--color-focus-ring)] decoration-4 underline-offset-4',
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  loading?: boolean
  loadingText?: string
  icon?: ReactNode
  full?: boolean
}

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'primary', loading, loadingText, icon, full, className = '', children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={`${base} ${variants[variant]} ${full ? 'w-full' : ''} ${disabled && !loading ? 'opacity-45' : ''} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <LoaderCircle className="size-5 animate-spin" aria-hidden="true" /> : icon}
      <span>{loading && loadingText ? loadingText : children}</span>
    </button>
  )
})
