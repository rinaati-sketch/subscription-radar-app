import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { CircleCheck } from 'lucide-react'

// הודעה קצרה (Toast ב-Figma): גלולה כהה עם וי, 4 שניות, מעל הניווט התחתון בטלפון
const ToastContext = createContext<(msg: string) => void>(() => {})
export const useToast = () => useContext(ToastContext)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ msg: string; key: number } | null>(null)
  const show = useCallback((msg: string) => setToast({ msg, key: Date.now() }), [])
  useEffect(() => {
    if (!toast) return
    const id = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(id)
  }, [toast])
  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 z-50 flex justify-center px-4 bottom-[calc(env(safe-area-inset-bottom)+16px)] md:bottom-8"
      >
        {toast && (
          <p
            key={toast.key}
            className="flex items-center gap-2.5 rounded-[var(--radius-pill)] bg-ink px-5 py-3 font-bold text-[length:var(--font-size-body)] text-[var(--color-text-on-dark)] shadow-[var(--shadow-sm)] animate-[toast-in_var(--motion-duration-moderate)_var(--motion-easing-spring)]"
          >
            <CircleCheck className="size-5 shrink-0 text-ring" aria-hidden="true" />
            <span>{toast.msg}</span>
          </p>
        )}
      </div>
    </ToastContext.Provider>
  )
}
