import { Link, type LinkProps } from 'react-router-dom'

// קישור טקסט (Button Ghost ב-Figma): סגול, קו תחתון ליים, אזור לחיצה 44px
export function TextLink(props: LinkProps) {
  return (
    <Link
      {...props}
      className={`inline-flex min-h-[44px] items-center px-1 font-extrabold text-[var(--color-text-link)] underline decoration-[var(--color-focus-ring)] decoration-4 underline-offset-4 ${props.className ?? ''}`}
    />
  )
}
