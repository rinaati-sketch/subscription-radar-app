import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CircleAlert, CircleCheck } from 'lucide-react'
import { useRefresh, useSubscription } from '../../lib/queries'
import {
  createSubscription, DuplicateError, restoreSubscription, updateSubscription,
  type Subscription, type SubscriptionInput,
} from '../../lib/subscriptions'
import { alertDay, daysBetween, fmtDate, ltrText, nameText, parseDate, todayIso } from '../../lib/format'
import { t } from '../../content/he'
import { Field } from '../../components/Field'
import { Button } from '../../components/Button'
import { Banner } from '../../components/Banner'
import { TextLink } from '../../components/TextLink'
import { useToast } from '../../components/Toast'

type Mode = 'add' | 'edit' | 'restore'

// קישור: משלימים https:// אם חסר, ובודקים שזו כתובת אתר אמיתית
function normalizeUrl(raw: string): string | null {
  const v = raw.trim()
  if (!v) return ''
  const withScheme = /^[a-z][a-z\d+.-]*:\/\//i.test(v) ? v : `https://${v}`
  try {
    const u = new URL(withScheme)
    if (!/^https?:$/.test(u.protocol) || !u.hostname.includes('.') || /\s/.test(v)) return null
    return u.href
  } catch {
    return null
  }
}

// כללי הטופס מהאפיון (5.3), עם הודעות השגיאה מילה במילה
const schema = z.object({
  name: z.string().trim().min(1, t.form.nameRequired),
  cost: z.string().trim().refine(v => { const n = Number(v.replace(',', '.')); return v !== '' && Number.isFinite(n) && n > 0 }, t.form.costInvalid),
  currency: z.enum(['ILS', 'USD'], { error: t.form.currencyRequired }),
  billing_cycle: z.enum(['monthly', 'yearly'], { error: t.form.cycleRequired }),
  date: z.string().refine(v => { const iso = parseDate(v); return !!iso && iso > todayIso() }, t.form.dateInvalid),
  cancel_url: z.string().refine(v => normalizeUrl(v) !== null, t.form.urlInvalid),
  is_trial: z.boolean(),
})
type Values = z.infer<typeof schema>

const toInput = (v: Values): SubscriptionInput => ({
  name: v.name.trim(),
  cost: Number(v.cost.replace(',', '.')),
  currency: v.currency,
  billing_cycle: v.billing_cycle,
  next_renewal_date: parseDate(v.date)!,
  cancel_url: normalizeUrl(v.cancel_url) || null,
  is_trial: v.is_trial,
})

const fromSub = (s: Subscription, mode: Mode): Values => ({
  name: s.name,
  cost: String(Number(s.cost)),
  currency: s.currency,
  billing_cycle: s.billing_cycle,
  // בהחזרה למעקב צריך תאריך עתידי חדש - תאריך שעבר לא ממולא מראש
  date: mode === 'restore' && s.next_renewal_date <= todayIso() ? '' : fmtDate(s.next_renewal_date),
  cancel_url: s.cancel_url ?? '',
  is_trial: s.is_trial,
})

const empty: Values = { name: '', cost: '', currency: 'ILS', billing_cycle: 'monthly', date: '', cancel_url: '', is_trial: false }

// טופס אחד ל-/subscriptions/new, /:id/edit, /:id/restore - Figma: Screens / Form
export function SubscriptionForm({ mode }: { mode: Mode }) {
  const { id = '' } = useParams()
  if (mode === 'add') return <FormBody mode="add" initial={empty} />
  return <Loaded id={id} mode={mode} />
}

function Loaded({ id, mode }: { id: string; mode: Mode }) {
  const { data, isPending, isError, refetch, isFetching } = useSubscription(id)
  if (isPending) return <FormFrame title={mode === 'edit' ? t.form.editTitle : t.form.restoreTitle}><div aria-busy="true" className="flex flex-col gap-4">{[0, 1, 2, 3].map(i => <div key={i} className="skeleton h-14" />)}</div></FormFrame>
  if (isError) {
    return (
      <FormFrame title={mode === 'edit' ? t.form.editTitle : t.form.restoreTitle}>
        <Banner type="error" actions={<Button variant="secondary" loading={isFetching} onClick={() => refetch()}>{t.list.retry}</Button>}>{t.common.networkError}</Banner>
      </FormFrame>
    )
  }
  if (!data) {
    return (
      <FormFrame title={t.decide.notFoundTitle}>
        <p>{t.decide.notFound}</p>
        <TextLink to="/subscriptions">{t.form.backToList}</TextLink>
      </FormFrame>
    )
  }
  // החזרה למעקב רק למנוי מבוטל; עריכה - רק למנוי שעדיין במעקב
  if (mode === 'restore' && data.status !== 'cancelled') return <Navigate to={`/subscriptions/${id}/edit`} replace />
  if (mode === 'edit' && data.status === 'cancelled') return <Navigate to={`/subscriptions/${id}/restore`} replace />
  return <FormBody mode={mode} initial={fromSub(data, mode)} sub={data} />
}

function FormFrame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mx-auto flex w-full max-w-[560px] flex-col gap-5 md:rounded-[var(--radius-card)] md:border-[length:var(--border-default)] md:border-ink md:bg-surface md:p-9 md:shadow-[var(--shadow-lg)]">
      <h1 className="text-[length:var(--layout-title-size)] font-black leading-tight">{title}</h1>
      {children}
    </section>
  )
}

type Problem = { kind: 'duplicate'; name: string; date: string; existingId: string | null } | { kind: 'save' } | null

function FormBody({ mode, initial, sub }: { mode: Mode; initial: Values; sub?: Subscription }) {
  const navigate = useNavigate()
  const refresh = useRefresh()
  const toast = useToast()
  const [problem, setProblem] = useState<Problem>(null)
  const [added, setAdded] = useState<Subscription | null>(null)
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: initial,
    mode: 'onTouched',
  })
  useEffect(() => { if (added) window.scrollTo({ top: 0 }) }, [added])

  const onSubmit = async (v: Values) => {
    setProblem(null)
    const input = toInput(v)
    try {
      if (mode === 'add') {
        const s = await createSubscription(input)
        await refresh()
        setAdded(s)
      } else if (mode === 'edit') {
        await updateSubscription(sub!.id, input)
        await refresh()
        toast(t.form.saved)
        navigate('/subscriptions')
      } else {
        await updateSubscription(sub!.id, input)
        await restoreSubscription(sub!.id, input.next_renewal_date)
        await refresh()
        toast(t.form.restored(nameText(input.name)))
        navigate('/subscriptions')
      }
    } catch (e) {
      if (e instanceof DuplicateError) {
        setProblem({ kind: 'duplicate', name: nameText(input.name), date: ltrText(fmtDate(input.next_renewal_date)), existingId: e.existing?.id ?? null })
      } else {
        setProblem({ kind: 'save' })
      }
    }
  }

  if (added) return <Added s={added} />

  const title = mode === 'add' ? t.form.addTitle : mode === 'edit' ? t.form.editTitle : t.form.restoreTitle
  const submit = mode === 'add' ? t.form.addSubmit : mode === 'edit' ? t.form.editSubmit : t.form.restoreSubmit
  const submitForm = handleSubmit(onSubmit)

  return (
    <FormFrame title={title}>
      <form noValidate onSubmit={submitForm} className="flex flex-col gap-5">
        <Field label={t.form.name} autoComplete="off" error={errors.name?.message} {...register('name')} />

        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3">
          <Field label={t.form.cost} inputMode="decimal" ltr error={errors.cost?.message} {...register('cost')} />
          <Select label={t.form.currency} error={errors.currency?.message} {...register('currency')}>
            <option value="ILS">₪</option>
            <option value="USD">$</option>
          </Select>
        </div>

        <fieldset className="flex flex-col gap-1.5">
          <legend className="pb-1.5 font-extrabold text-[17px]">{t.form.cycle}</legend>
          <div className="grid grid-cols-2 gap-1 rounded-[var(--radius-field)] border-[length:var(--border-default)] border-ink bg-field p-1">
            {(['monthly', 'yearly'] as const).map(c => (
              <label key={c} className="relative flex min-h-11 cursor-pointer items-center justify-center rounded-[10px] font-extrabold has-[:checked]:bg-ink has-[:checked]:text-[var(--color-text-on-dark)] has-[:focus-visible]:shadow-[0_0_0_4px_var(--color-focus-ring)]">
                <input type="radio" value={c} className="sr-only" {...register('billing_cycle')} />
                {c === 'monthly' ? t.form.monthly : t.form.yearly}
              </label>
            ))}
          </div>
          {errors.billing_cycle && <ErrorMsg>{errors.billing_cycle.message}</ErrorMsg>}
        </fieldset>

        <Field label={t.form.date} placeholder={t.form.datePlaceholder} inputMode="numeric" ltr autoComplete="off" error={errors.date?.message} {...register('date')} />

        <Field
          label={t.form.url}
          type="url"
          inputMode="url"
          ltr
          autoComplete="off"
          help={t.form.urlHelp}
          error={errors.cancel_url?.message}
          {...register('cancel_url', {
            onBlur: e => { const n = normalizeUrl(e.target.value); if (n) setValue('cancel_url', n) },
          })}
        />

        <label className="flex cursor-pointer items-start gap-3">
          <input type="checkbox" className="mt-1 size-6 shrink-0 cursor-pointer accent-[var(--color-action-primary)]" {...register('is_trial')} />
          <span className="flex flex-col">
            <span className="font-extrabold">{t.form.trial}</span>
            <span className="text-[15px] text-muted">{t.form.trialHelp}</span>
          </span>
        </label>

        {problem?.kind === 'duplicate' && (
          <Banner type="error" actions={problem.existingId && <TextLink to={`/subscriptions/${problem.existingId}/edit`}>{t.form.toExisting}</TextLink>}>
            {t.form.duplicate(problem.name, problem.date)}
          </Banner>
        )}
        {problem?.kind === 'save' && (
          <Banner type="error" actions={<Button type="button" variant="secondary" loading={isSubmitting} onClick={submitForm}>{t.form.retry}</Button>}>
            {t.form.saveError}
          </Banner>
        )}

        <Button type="submit" full loading={isSubmitting} loadingText={t.form.saving}>{submit}</Button>
        <TextLink to={mode === 'restore' ? '/subscriptions/cancelled' : '/subscriptions'} className="self-center">{t.form.backToList}</TextLink>
      </form>
    </FormFrame>
  )
}

function ErrorMsg({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="flex items-start gap-1.5 text-[14px] font-bold text-[var(--color-text-danger)]">
      <CircleAlert className="size-4 mt-0.5 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  )
}

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; error?: string }
function Select({ label, error, children, ref, ...rest }: SelectProps & { ref?: React.Ref<HTMLSelectElement> }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-extrabold text-[17px]">{label}</span>
      <select
        ref={ref}
        aria-invalid={error ? true : undefined}
        className="min-h-[52px] min-w-[84px] rounded-[var(--radius-field)] border-[length:var(--border-default)] border-ink bg-field px-3.5 text-[17px] font-bold"
        {...rest}
      >
        {children}
      </select>
      {error && <ErrorMsg>{error}</ErrorMsg>}
    </label>
  )
}

// מסך הצלחה אחרי הוספה: מתי תישלח ההתראה
function Added({ s }: { s: Subscription }) {
  const navigate = useNavigate()
  const date = ltrText(fmtDate(s.next_renewal_date))
  const soon = daysBetween(todayIso(), s.next_renewal_date) < 14
  return (
    <FormFrame title={t.form.addTitle}>
      <div role="status" className="flex flex-col items-center gap-4 py-4 text-center">
        <span className="flex size-20 items-center justify-center rounded-full border-[length:var(--border-default)] border-ink bg-ring animate-[dialog-in_var(--motion-duration-moderate)_var(--motion-easing-spring)]">
          <CircleCheck className="size-10" aria-hidden="true" />
        </span>
        <p className="text-[length:var(--font-size-card)] font-bold leading-relaxed">
          {soon ? t.form.addedSoon(nameText(s.name), date) : t.form.added(nameText(s.name), ltrText(fmtDate(alertDay(s.next_renewal_date))), date)}
        </p>
      </div>
      <Button variant="secondary" full onClick={() => navigate('/subscriptions')}>{t.form.backToList}</Button>
    </FormFrame>
  )
}
