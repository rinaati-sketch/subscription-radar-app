import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { CircleAlert } from 'lucide-react'

// שדה לפי רכיב Field ב-Figma: תווית, שדה, טקסט עזרה או הודעת שגיאה (במקום העזרה)
type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  help?: string
  error?: string
  trailing?: ReactNode
  ltr?: boolean
}

export const Field = forwardRef<HTMLInputElement, Props>(function Field(
  { label, help, error, trailing, ltr, className = '', id, ...rest },
  ref,
) {
  const autoId = useId()
  const inputId = id ?? autoId
  const msgId = `${inputId}-msg`
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={inputId} className="font-extrabold text-[17px]">{label}</label>
      <div
        className={`flex items-center gap-2 min-h-[52px] px-3.5 rounded-[var(--radius-field)] border-[length:var(--border-default)] transition-[background,border-color] duration-[var(--motion-duration-fast)] focus-within:shadow-[0_0_0_4px_var(--color-focus-ring)] ${
          error ? 'border-[var(--color-border-danger)] bg-[var(--color-feedback-error-bg)]' : 'border-ink bg-field'
        }`}
      >
        <input
          ref={ref}
          id={inputId}
          dir={ltr ? 'ltr' : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || help ? msgId : undefined}
          className={`flex-1 min-w-0 bg-transparent text-[17px] outline-none focus-visible:shadow-none ${ltr ? 'text-end' : ''}`}
          {...rest}
        />
        {trailing}
      </div>
      {error ? (
        <p id={msgId} role="alert" className="flex items-start gap-1.5 text-[14px] font-bold text-[var(--color-text-danger)] animate-[field-msg_var(--motion-duration-fast)_ease-out]">
          <CircleAlert className="size-4 mt-0.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      ) : help ? (
        <p id={msgId} className="text-[15px] text-muted">{help}</p>
      ) : null}
    </div>
  )
})
