import type { ReactNode } from 'react'
import { Ban, Clock, Flag, Hourglass, Radar, RotateCw } from 'lucide-react'
import type { Status } from '../lib/subscriptions'
import { t } from '../content/he'

// תג סטטוס (StatusBadge ב-Figma): צבע + סמל + מילה, אף פעם לא צבע לבד
const look: Record<Status, { cls: string; icon: ReactNode }> = {
  tracking: { cls: 'bg-[var(--color-status-tracking-bg)] text-[var(--color-status-tracking-text)]', icon: <Radar /> },
  pending_decision: { cls: 'bg-[var(--color-status-pending-bg)] text-[var(--color-status-pending-text)]', icon: <Clock /> },
  renewed_no_decision: { cls: 'bg-[var(--color-status-renewed-bg)] text-[var(--color-status-renewed-text)]', icon: <RotateCw /> },
  marked_cancel: { cls: 'bg-[var(--color-status-marked-bg)] text-[var(--color-status-marked-text)]', icon: <Flag /> },
  cancelled: { cls: 'bg-[var(--color-status-cancelled-bg)] text-[var(--color-status-cancelled-text)]', icon: <Ban /> },
}

export function StatusBadge({ status }: { status: Status }) {
  const l = look[status]
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-[var(--radius-pill)] border-[length:var(--border-small)] border-ink px-3 py-1 text-[length:var(--font-size-label)] font-extrabold [&>svg]:size-4 ${l.cls}`}>
      {l.icon}
      <span>{t.status[status]}</span>
    </span>
  )
}

export function TrialLabel() {
  return (
    <span className="inline-flex items-center gap-1 text-[length:var(--font-size-label)] font-extrabold text-[var(--color-text-trial)]">
      <Hourglass className="size-4" aria-hidden="true" />
      {t.list.trial}
    </span>
  )
}
