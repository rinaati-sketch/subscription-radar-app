import { Link } from 'react-router-dom'
import { t } from '../content/he'

// מסך 404 - לפי Figma (Screens / System)
export function NotFound() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="font-black text-[72px] leading-none" aria-hidden="true">404</p>
      <h1 className="font-extrabold text-[22px]">{t.notFound.title}</h1>
      <p className="text-muted">{t.notFound.body}</p>
      <Link
        to="/"
        className="mt-2 inline-flex min-h-[52px] items-center justify-center rounded-[var(--radius-button)] border-[3px] border-ink bg-primary px-6 font-extrabold text-white shadow-[var(--shadow-md)] transition-[transform,box-shadow] duration-[var(--motion-duration-fast)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[var(--shadow-sm)]"
      >
        {t.notFound.back}
      </Link>
    </main>
  )
}
