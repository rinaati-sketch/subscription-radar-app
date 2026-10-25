import { useCallback, useState, type ReactNode } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { useSubscriptions, useRefresh } from '../../lib/queries'
import { answerClarification, deleteSubscription, needsDecision, type Subscription } from '../../lib/subscriptions'
import { cycleText, daysBetween, daysLeftText, fmtDate, fmtMoney, nameText, todayIso } from '../../lib/format'
import { t } from '../../content/he'
import { Banner } from '../../components/Banner'
import { Button } from '../../components/Button'
import { IconButton } from '../../components/IconButton'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { StatusBadge, TrialLabel } from '../../components/StatusBadge'
import { useToast } from '../../components/Toast'

type Mode = 'active' | 'cancelled'

// "המנויים שלי" (/subscriptions) ו"מנויים מבוטלים" (/subscriptions/cancelled) - אפיון 5.2, Figma: Screens / List
export function SubscriptionList({ mode }: { mode: Mode }) {
  const { data, isPending, isError, refetch, isFetching } = useSubscriptions()
  const refresh = useRefresh()
  const toast = useToast()
  const [toDelete, setToDelete] = useState<Subscription | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [actionError, setActionError] = useState(false)
  const [answering, setAnswering] = useState<string | null>(null)

  const rows = (data ?? []).filter(s => (mode === 'cancelled' ? s.status === 'cancelled' : s.status !== 'cancelled'))
  if (mode === 'cancelled') rows.sort((a, b) => (b.decided_at ?? '').localeCompare(a.decided_at ?? ''))

  const closeDialog = useCallback(() => { if (!deleting) setToDelete(null) }, [deleting])
  const confirmDelete = async () => {
    if (!toDelete) return
    setDeleting(true)
    setActionError(false)
    try {
      await deleteSubscription(toDelete.id)
      toast(t.del.done(nameText(toDelete.name)))
      setToDelete(null)
      await refresh()
    } catch {
      setToDelete(null)
      setActionError(true)
    } finally {
      setDeleting(false)
    }
  }

  const answer = async (s: Subscription, charged: boolean) => {
    setAnswering(`${s.id}:${charged}`)
    setActionError(false)
    try {
      await answerClarification(s.id, charged)
      await refresh()
    } catch {
      setActionError(true)
    } finally {
      setAnswering(null)
    }
  }

  const title = mode === 'cancelled' ? t.cancelled.title : t.list.title

  return (
    <div className="card-xl flex flex-col gap-6 p-5 sm:p-9">
      <h1 className="break-words text-[30px] font-black leading-tight sm:text-[36px]">{title}</h1>
      <Tabs active={(data ?? []).filter(s => s.status !== 'cancelled').length} cancelled={(data ?? []).filter(s => s.status === 'cancelled').length} loaded={!!data} />

      {mode === 'active' && data && <Summary subs={rows} />}

      {mode === 'active' && rows.filter(s => s.needs_clarification).map(s => (
        <Banner
          key={`c-${s.id}`}
          type="clarification"
          actions={
            <>
              <Button variant="secondary" loading={answering === `${s.id}:false`} disabled={!!answering} onClick={() => answer(s, false)}>{t.list.clarNo}</Button>
              <Button variant="secondary" loading={answering === `${s.id}:true`} disabled={!!answering} onClick={() => answer(s, true)}>{t.list.clarYes}</Button>
            </>
          }
        >
          {t.list.clarification(nameText(s.name))}
        </Banner>
      ))}
      {mode === 'active' && rows.filter(s => s.missed_alert).map(s => (
        <Banner key={`m-${s.id}`} type="missed">{t.list.missed(nameText(s.name))}</Banner>
      ))}

      {actionError && <Banner type="error">{t.common.networkError}</Banner>}

      {isPending ? (
        <Skeleton />
      ) : isError ? (
        <Banner type="error" actions={<Button variant="secondary" loading={isFetching} onClick={() => refetch()}>{t.list.retry}</Button>}>
          {t.common.networkError}
        </Banner>
      ) : rows.length === 0 ? (
        <Empty mode={mode} />
      ) : (
        <>
          <Table rows={rows} mode={mode} onDelete={setToDelete} />
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:hidden">
            {rows.map(s => <li key={s.id}><Card s={s} mode={mode} onDelete={setToDelete} /></li>)}
          </ul>
        </>
      )}

      {toDelete && (
        <ConfirmDialog
          title={t.del.title(nameText(toDelete.name))}
          body={t.del.body}
          onClose={closeDialog}
          actions={
            <>
              <Button variant="danger" full icon={<Trash2 className="size-5" aria-hidden="true" />} loading={deleting} onClick={confirmDelete}>{t.del.confirm}</Button>
              <Button variant="secondary" full disabled={deleting} onClick={closeDialog}>{t.del.back}</Button>
            </>
          }
        />
      )}
    </div>
  )
}

// לשוניות בעיצוב Lovable: לחצנים עם מסגרת, הפעילה בליים עם צל, ומספר המנויים בכל אחת
function Tabs({ active, cancelled, loaded }: { active: number; cancelled: number; loaded: boolean }) {
  const cls = ({ isActive }: { isActive: boolean }) =>
    `inline-flex min-h-11 items-center rounded-xl border-[3px] border-ink px-4 font-extrabold transition-[background,box-shadow] duration-[var(--motion-duration-fast)] ${
      isActive ? 'bg-ring shadow-[var(--shadow-sm)]' : 'bg-surface hover:bg-highlight'
    }`
  const count = (n: number) => (loaded ? <span className="ms-1">(<bdi dir="ltr">{n}</bdi>)</span> : null)
  return (
    <nav aria-label={t.list.title} className="flex flex-wrap gap-3">
      <NavLink to="/subscriptions" end className={cls}>{t.list.tabActive}{count(active)}</NavLink>
      <NavLink to="/subscriptions/cancelled" className={cls}>{t.list.tabCancelled}{count(cancelled)}</NavLink>
    </nav>
  )
}

function Summary({ subs }: { subs: Subscription[] }) {
  const today = todayIso()
  const soon = subs.filter(s => { const d = daysBetween(today, s.next_renewal_date); return d >= 0 && d <= 14 }).length
  const waiting = subs.filter(s => needsDecision(s.status)).length
  return (
    <section className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-card)] border-[length:var(--border-default)] border-ink bg-primary px-6 py-5 text-[var(--color-text-on-primary)] shadow-[var(--shadow-md)]">
      <div>
        <p className="font-bold opacity-90">{t.list.summaryLabel}</p>
        <p className="text-[28px] font-black leading-tight">{t.list.renewals(soon)}</p>
      </div>
      {waiting > 0 && (
        <span className="rounded-[var(--radius-pill)] border-[length:var(--border-small)] border-ink bg-[var(--color-status-pending-bg)] px-4 py-1.5 font-extrabold text-ink">
          {t.list.waiting(waiting)}
        </span>
      )}
    </section>
  )
}

function Empty({ mode }: { mode: Mode }) {
  const navigate = useNavigate()
  if (mode === 'cancelled') {
    return <p className="rounded-2xl border-[3px] border-dashed border-ink px-6 py-10 text-center text-lg font-medium">{t.cancelled.empty}</p>
  }
  return (
    <div className="flex flex-col items-center gap-3 px-2 py-8 text-center">
      <img src={`${import.meta.env.BASE_URL}logo-mark.svg`} width={64} height={64} alt="" aria-hidden="true" />
      <h2 className="text-[length:var(--font-size-section)] font-black">{t.list.emptyTitle}</h2>
      <p className="max-w-sm text-muted">{t.list.emptyBody}</p>
      <Button className="mt-2" icon={<Plus className="size-5" aria-hidden="true" />} onClick={() => navigate('/subscriptions/new')}>{t.list.emptyCta}</Button>
    </div>
  )
}

function Skeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-3">
      {[0, 1, 2].map(i => (
        <div key={i} className="flex items-center gap-4 rounded-2xl border-[3px] border-subtle p-4">
          <div className="skeleton h-5 w-1/3" />
          <div className="skeleton h-5 w-1/5" />
          <div className="skeleton ms-auto h-8 w-24" />
        </div>
      ))}
    </div>
  )
}

const ltr = (x: ReactNode) => <bdi dir="ltr">{x}</bdi>

function Actions({ s, mode, onDelete, compact }: { s: Subscription; mode: Mode; onDelete: (s: Subscription) => void; compact?: boolean }) {
  const navigate = useNavigate()
  const del = <IconButton label={`${t.list.del} ${s.name}`} danger icon={<Trash2 aria-hidden="true" />} onClick={() => onDelete(s)} />
  if (mode === 'cancelled') {
    return (
      <div className="flex items-center gap-2">
        <Button variant="secondary" className={compact ? '' : 'min-h-11 px-4 text-[15px]'} icon={<RotateCcw className="size-4" aria-hidden="true" />} onClick={() => navigate(`/subscriptions/${s.id}/restore`)}>{t.cancelled.restore}</Button>
        {del}
      </div>
    )
  }
  return (
    <div className="flex items-center gap-2">
      <IconButton label={`${t.list.edit} ${s.name}`} icon={<Pencil aria-hidden="true" />} onClick={() => navigate(`/subscriptions/${s.id}/edit`)} />
      {del}
    </div>
  )
}

function DecideButton({ s }: { s: Subscription }) {
  if (!needsDecision(s.status)) return null
  return (
    <Link
      to={`/decide/${s.id}`}
      className="inline-flex min-h-11 items-center rounded-[12px] border-[length:var(--border-small)] border-ink bg-surface px-4 font-extrabold shadow-[var(--shadow-sm)] transition-[transform,box-shadow] duration-[var(--motion-duration-fast)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
    >
      {t.list.decide}
    </Link>
  )
}

function Table({ rows, mode, onDelete }: { rows: Subscription[]; mode: Mode; onDelete: (s: Subscription) => void }) {
  const th = 'px-3 py-3 text-start font-extrabold'
  return (
    <div className="hidden overflow-x-auto lg:block">
      <table className="w-full border-collapse">
        <thead className="border-b-[3px] border-ink">
          <tr>
            <th scope="col" className={th}>{t.list.colName}</th>
            <th scope="col" className={th}>{t.list.colCost}</th>
            <th scope="col" className={th}>{mode === 'cancelled' ? t.list.colDecided : t.list.colNext}</th>
            <th scope="col" className={th}>{t.list.colStatus}</th>
            <th scope="col" className={th}>{t.list.colActions}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(s => (
            <tr key={s.id} className="border-b-2 border-subtle last:border-b-0">
              <td className="px-3 py-4">
                <div className="flex flex-col items-start">
                  <bdi className="text-[length:var(--font-size-card)] font-extrabold">{s.name}</bdi>
                  {s.is_trial && <TrialLabel />}
                </div>
              </td>
              <td className="px-3 py-4">
                <div className="flex flex-col">
                  <span className="font-bold">{ltr(fmtMoney(s.cost, s.currency))}</span>
                  <span className="text-[length:var(--font-size-small)] text-muted">{cycleText[s.billing_cycle]}</span>
                </div>
              </td>
              <td className="px-3 py-4">
                {mode === 'cancelled' ? (
                  <span className="font-bold">{s.decided_at ? ltr(fmtDate(s.decided_at)) : '-'}</span>
                ) : (
                  <div className="flex flex-col">
                    <span className="font-bold">{ltr(fmtDate(s.next_renewal_date))}</span>
                    <span className="text-[length:var(--font-size-small)] text-muted">{daysLeftText(s.next_renewal_date)}</span>
                  </div>
                )}
              </td>
              <td className="px-3 py-4"><StatusBadge status={s.status} /></td>
              <td className="px-3 py-4">
                <div className="flex items-center gap-2">
                  {mode === 'active' && <DecideButton s={s} />}
                  <Actions s={s} mode={mode} onDelete={onDelete} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Card({ s, mode, onDelete }: { s: Subscription; mode: Mode; onDelete: (s: Subscription) => void }) {
  return (
    <article className="flex h-full flex-col gap-3 rounded-2xl border-[3px] border-ink bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col items-start">
          <h2 className="text-[length:var(--font-size-card)] font-extrabold leading-snug"><bdi>{s.name}</bdi></h2>
          {s.is_trial && <TrialLabel />}
        </div>
        <StatusBadge status={s.status} />
      </div>
      <p className="font-bold">{ltr(fmtMoney(s.cost, s.currency))} · {cycleText[s.billing_cycle]}</p>
      <p className="text-[length:var(--font-size-small)] text-muted">
        {mode === 'cancelled'
          ? <>{t.list.decidedOn}{s.decided_at ? ltr(fmtDate(s.decided_at)) : '-'}</>
          : <>{t.list.renewsOn}{ltr(fmtDate(s.next_renewal_date))} · {daysLeftText(s.next_renewal_date)}</>}
      </p>
      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
        {mode === 'active' ? <DecideButton s={s} /> : <span />}
        <Actions s={s} mode={mode} onDelete={onDelete} compact />
      </div>
    </article>
  )
}
