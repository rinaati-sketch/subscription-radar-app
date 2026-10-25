import { useEffect, useId, useRef, type ReactNode } from 'react'

// חלון אישור (Dialog ב-Figma): במרכז ברוחב 440 מ-768, גיליון תחתון בטלפון.
// Esc סוגר, המיקוד נשאר בתוך החלון וחוזר למקום שממנו נפתח
export function ConfirmDialog({ title, body, actions, onClose }: { title: string; body: string; actions: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const bodyId = useId()
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    const box = ref.current!
    const focusables = () => Array.from(box.querySelectorAll<HTMLElement>('button:not([disabled]), a[href]'))
    focusables()[0]?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose() }
      if (e.key !== 'Tab') return
      const f = focusables()
      if (!f.length) return
      const first = f[0], last = f[f.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      prev?.focus()
    }
  }, [onClose])
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-[oklch(0.19_0.03_290/0.4)] animate-[screen-in_var(--motion-duration-fade)_ease-out] md:items-center md:p-4" onClick={onClose}>
      <div
        ref={ref}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        onClick={e => e.stopPropagation()}
        className="flex w-full flex-col gap-4 rounded-t-[var(--radius-card)] border-[length:var(--border-default)] border-b-0 border-ink bg-surface px-5 pt-6 pb-[calc(24px+env(safe-area-inset-bottom))] animate-[sheet-in_var(--motion-duration-moderate)_var(--motion-easing-standard)] md:max-w-[440px] md:rounded-[28px] md:border-4 md:p-7 md:shadow-[6px_6px_0_var(--color-shadow-default)] md:animate-[dialog-in_var(--motion-duration-base)_var(--motion-easing-standard)]"
      >
        <h2 id={titleId} className="text-[length:var(--font-size-section)] font-black leading-tight">{title}</h2>
        <p id={bodyId} className="text-muted">{body}</p>
        <div className="flex flex-col gap-3 pt-2 md:flex-row">{actions}</div>
      </div>
    </div>
  )
}
