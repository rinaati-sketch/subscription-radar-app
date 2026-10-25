import { useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CalendarPlus, CircleCheck, ExternalLink, Flag } from 'lucide-react'
import { useRefresh } from '../../lib/queries'
import {
  confirmCancelled, decisionState, getSubscription, keepSubscription, markForCancel,
  type DecisionState, type Subscription,
} from '../../lib/subscriptions'
import { cycleText, fmtDate, fmtMoney, lastCancelDay, ltrText, nameText } from '../../lib/format'
import { downloadCancelReminder } from '../../lib/ics'
import { t } from '../../content/he'
import { Banner } from '../../components/Banner'
import { Button } from '../../components/Button'
import { TextLink } from '../../components/TextLink'
import { TrialLabel } from '../../components/StatusBadge'

// פורטל ההחלטה (/decide/:id) - אפיון 5.4, Figma: Screens / Decide
type Result = { kind: 'kept'; sub: Subscription } | { kind: 'marked' } | { kind: 'confirmed' } | null
type Busy = 'keep' | 'mark' | 'confirm' | null

export function Decide() {
  const { id = '' } = useParams()
  const q = useQuery({
    queryKey: ['decide', id],
    queryFn: async () => {
      const [state, sub] = await Promise.all([decisionState(id), getSubscription(id)])
      return { state: sub ? state : ('not_found' as DecisionState), sub }
    },
    refetchOnWindowFocus: false,
  })
  const refresh = useRefresh()
  const [result, setResult] = useState<Result>(null)
  const [busy, setBusy] = useState<Busy>(null)
  const [failed, setFailed] = useState(false)

  if (q.isPending) {
    return <Frame><div aria-busy="true" className="flex flex-col gap-4"><div className="skeleton h-9 w-2/3" /><div className="skeleton h-56" /></div></Frame>
  }
  if (q.isError) {
    return (
      <Frame>
        <Banner type="error" actions={<Button variant="secondary" loading={q.isFetching} onClick={() => q.refetch()}>{t.list.retry}</Button>}>{t.common.networkError}</Banner>
      </Frame>
    )
  }
  const { state, sub } = q.data
  if (state === 'not_found' || !sub) {
    return (
      <Frame title={t.decide.notFoundTitle}>
        <p>{t.decide.notFound}</p>
        <Back />
      </Frame>
    )
  }

  const run = async (kind: Exclude<Busy, null>) => {
    setBusy(kind)
    setFailed(false)
    try {
      if (kind === 'keep') setResult({ kind: 'kept', sub: await keepSubscription(sub.id) })
      if (kind === 'mark') { await markForCancel(sub.id); setResult({ kind: 'marked' }) }
      if (kind === 'confirm') { await confirmCancelled(sub.id); setResult({ kind: 'confirmed' }) }
      await refresh()
    } catch {
      setFailed(true)
    } finally {
      setBusy(null)
    }
  }

  const date = ltrText(fmtDate(sub.next_renewal_date))
  const last = ltrText(fmtDate(lastCancelDay(sub.next_renewal_date)))
  const title = t.decide.title(nameText(sub.name))
  const error = failed && <Banner type="error">{t.common.networkError}</Banner>
  const cancelLink = (variant: 'primary' | 'ghost') =>
    sub.cancel_url && (
      <a
        href={sub.cancel_url}
        target="_blank"
        rel="noopener noreferrer"
        className={
          variant === 'primary'
            ? 'inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[var(--radius-button)] border-[length:var(--border-default)] border-ink bg-primary px-[26px] text-[17px] font-extrabold text-white shadow-[var(--shadow-md)] transition-[transform,box-shadow] duration-[var(--motion-duration-fast)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[var(--shadow-sm)]'
            : 'inline-flex min-h-11 items-center justify-center gap-2 self-center px-2 font-extrabold text-[var(--color-text-link)] underline decoration-[var(--color-focus-ring)] decoration-4 underline-offset-4'
        }
      >
        <span>{t.decide.toCancelPage}</span>
        <ExternalLink className="size-5" aria-hidden="true" />
        <span className="sr-only">{t.decide.newTab}</span>
      </a>
    )

  // תוצאות פעולה במסך הזה
  if (result?.kind === 'kept') {
    return (
      <Frame title={title}>
        <Done>{t.decide.kept(nameText(sub.name), ltrText(fmtDate(result.sub.next_renewal_date)))}</Done>
        <Back secondary />
      </Frame>
    )
  }
  if (result?.kind === 'confirmed') {
    return (
      <Frame title={title}>
        <Done>{t.decide.confirmed(nameText(sub.name))}</Done>
        <Back secondary />
      </Frame>
    )
  }
  if (result?.kind === 'marked') {
    return (
      <Frame title={title}>
        <Banner type="clarification">{t.decide.marked(nameText(sub.name), last)}</Banner>
        {error}
        <div className="flex flex-col gap-3">
          {cancelLink('primary')}
          <Button variant="secondary" full icon={<CalendarPlus className="size-5" aria-hidden="true" />} onClick={() => downloadCancelReminder(sub.name, lastCancelDay(sub.next_renewal_date))}>{t.decide.calendar}</Button>
          <Button variant="secondary" full loading={busy === 'confirm'} onClick={() => run('confirm')}>{t.decide.confirmCancelled}</Button>
        </div>
        <Back />
      </Frame>
    )
  }

  if (state === 'decided_kept' || state === 'decided_cancelled') {
    return (
      <Frame title={title}>
        <Banner type="success">{state === 'decided_kept' ? t.decide.decidedKept : t.decide.decidedCancelled}</Banner>
        <Back secondary />
      </Frame>
    )
  }

  if (state === 'marked') {
    return (
      <Frame title={title}>
        <Details sub={sub} date={date} last={last} />
        <Banner type="clarification">{t.decide.reentry(nameText(sub.name))}</Banner>
        {error}
        <div className="flex flex-col gap-3">
          <Button full loading={busy === 'confirm'} disabled={!!busy} onClick={() => run('confirm')}>{t.decide.confirmCancelled}</Button>
          <Button variant="secondary" full loading={busy === 'keep'} disabled={!!busy} onClick={() => run('keep')}>{t.decide.keep}</Button>
          {cancelLink('ghost')}
        </div>
        <Back />
      </Frame>
    )
  }

  return (
    <Frame title={title}>
      <Details sub={sub} date={date} last={last} />
      <div className="flex flex-col gap-1.5">
        <p className="text-[length:var(--font-size-card)] font-extrabold leading-relaxed">{t.decide.question(date, last)}</p>
        <p className="text-[length:var(--font-size-small)] text-muted">{t.decide.earlier}</p>
      </div>
      {error}
      <div className="flex flex-col gap-3">
        <Button full loading={busy === 'keep'} disabled={!!busy} onClick={() => run('keep')}>{t.decide.keep}</Button>
        <Button variant="secondary" full loading={busy === 'mark'} disabled={!!busy} icon={<Flag className="size-5" aria-hidden="true" />} onClick={() => run('mark')}>{t.decide.mark}</Button>
        <p className="text-center text-[length:var(--font-size-small)] text-muted">{t.decide.markNote}</p>
      </div>
      <Back />
    </Frame>
  )
}

function Frame({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="card-xl mx-auto flex w-full max-w-[640px] flex-col gap-6 p-5 sm:p-9">
      {title && <h1 className="break-words text-[30px] font-black leading-tight sm:text-[36px]">{title}</h1>}
      {children}
    </section>
  )
}

// אחרי החלטה החזרה היא הפעולה היחידה במסך - לחצן משני; אחרת קישור (ghost)
function Back({ secondary }: { secondary?: boolean }) {
  const navigate = useNavigate()
  if (secondary) return <Button variant="secondary" full onClick={() => navigate('/subscriptions')}>{t.decide.back}</Button>
  return <TextLink to="/subscriptions" className="self-center">{t.decide.back}</TextLink>
}

function Done({ children }: { children: ReactNode }) {
  return (
    <div role="status" className="flex flex-col items-center gap-4 rounded-2xl border-[3px] border-ink bg-highlight px-6 py-8 text-center">
      <span className="flex size-20 items-center justify-center rounded-full border-[length:var(--border-default)] border-ink bg-ring animate-[dialog-in_var(--motion-duration-moderate)_var(--motion-easing-spring)]">
        <CircleCheck className="size-10" aria-hidden="true" />
      </span>
      <p className="text-[length:var(--font-size-card)] font-bold leading-relaxed">{children}</p>
    </div>
  )
}

function Details({ sub, date, last }: { sub: Subscription; date: string; last: string }) {
  const row = (label: string, value: ReactNode, danger?: boolean) => (
    <div className="flex items-center justify-between gap-4 border-b-[length:var(--border-divider)] border-subtle py-3 last:border-b-0">
      <dt className="text-muted">{label}</dt>
      <dd className={`text-end font-extrabold ${danger ? 'text-[var(--color-text-danger)]' : ''}`}>{value}</dd>
    </div>
  )
  return (
    <dl className="rounded-2xl border-[3px] border-ink bg-field px-4 py-1">
      {row(t.decide.rowName, <span className="inline-flex flex-wrap items-center justify-end gap-2"><bdi>{sub.name}</bdi>{sub.is_trial && <TrialLabel />}</span>)}
      {row(t.decide.rowCost, <bdi dir="ltr">{fmtMoney(sub.cost, sub.currency)}</bdi>)}
      {row(t.decide.rowCycle, cycleText[sub.billing_cycle])}
      {row(t.decide.rowDate, date)}
      {row(t.decide.rowLast, last, true)}
    </dl>
  )
}
