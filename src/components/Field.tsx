import { forwardRef, useId, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { CircleAlert, Eye, EyeOff } from 'lucide-react'
import { t } from '../content/he'

// שדה: תווית, שדה, טקסט עזרה או הודעת שגיאה (במקום העזרה). עיצוב לפי גרסת Lovable:
// פינות 16, מסגרת 3, טבעת ליים במיקוד, ולשדה סיסמה - לחצן הצגה/הסתרה
type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  help?: string
  error?: string
  trailing?: ReactNode
  ltr?: boolean
}

export const Field = forwardRef<HTMLInputElement, Props>(function Field(
  { label, help, error, trailing, ltr, className = '', id, type, ...rest },
  ref,
) {
  const autoId = useId()
  const inputId = id ?? autoId
  const msgId = `${inputId}-msg`
  const [visible, setVisible] = useState(false)
  const isPassword = type === 'password'
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={inputId} className="text-[15px] font-bold">{label}</label>
      <div
        className={`flex min-h-[52px] items-center gap-2 rounded-[16px] border-[3px] px-4 transition-[background,border-color,box-shadow] duration-[var(--motion-duration-fast)] focus-within:shadow-[0_0_0_5px_var(--color-focus-ring)] ${
          error ? 'border-[var(--color-border-danger)] bg-[var(--color-feedback-error-bg)]' : 'border-ink bg-field'
        }`}
      >
        <input
          ref={ref}
          id={inputId}
          type={isPassword && visible ? 'text' : type}
          dir={ltr ? 'ltr' : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || help ? msgId : undefined}
          className={`min-w-0 flex-1 bg-transparent text-[17px] outline-none focus-visible:shadow-none ${ltr ? 'text-end' : ''}`}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible(v => !v)}
            aria-pressed={visible}
            aria-label={visible ? t.common.hidePassword : t.common.showPassword}
            className="-me-2 flex size-11 shrink-0 items-center justify-center rounded-lg hover:bg-highlight"
          >
            {visible ? <EyeOff className="size-5" aria-hidden="true" /> : <Eye className="size-5" aria-hidden="true" />}
          </button>
        )}
        {trailing}
      </div>
      {error ? (
        <p id={msgId} role="alert" className="flex items-start gap-1.5 text-[14px] font-bold text-[var(--color-text-danger)] animate-[field-msg_var(--motion-duration-fast)_ease-out]">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      ) : help ? (
        <p id={msgId} className="text-[15px] text-muted">{help}</p>
      ) : null}
    </div>
  )
})
