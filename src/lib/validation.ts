import { z } from 'zod'
import { t } from '../content/he'

// כללי ולידציה מהאפיון (5.1), עם הודעות השגיאה מילה במילה
const email = z.string().trim().min(1, t.validation.emailRequired).pipe(z.email(t.validation.emailInvalid))
const passwordAny = z.string().min(1, t.validation.passwordRequired)
const passwordNew = passwordAny.min(8, t.validation.passwordMin)

export const loginSchema = z.object({ email, password: passwordAny })
export const registerSchema = z.object({ email, password: passwordNew })
export const forgotSchema = z.object({ email })
export const resetSchema = z.object({ password: passwordNew })

export type LoginValues = z.infer<typeof loginSchema>
export type RegisterValues = z.infer<typeof registerSchema>
export type ForgotValues = z.infer<typeof forgotSchema>
export type ResetValues = z.infer<typeof resetSchema>

// שגיאת רשת (אין חיבור / השרת לא ענה) - מציגים "משהו השתבש"
export function isNetworkError(err: unknown): boolean {
  const e = err as { name?: string; status?: number; message?: string } | null
  return !!e && (e.name === 'AuthRetryableFetchError' || e.status === 0 || /fetch|network/i.test(e.message ?? ''))
}
