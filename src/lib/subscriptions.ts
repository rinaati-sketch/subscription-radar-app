import { supabase } from './supabase'
import type { Currency } from './format'

export type Status = 'tracking' | 'pending_decision' | 'renewed_no_decision' | 'marked_cancel' | 'cancelled'
export type Cycle = 'monthly' | 'yearly'

export type Subscription = {
  id: string
  name: string
  name_key: string
  cost: number
  currency: Currency
  billing_cycle: Cycle
  next_renewal_date: string
  cancel_url: string | null
  is_trial: boolean
  status: Status
  decided_at: string | null
  needs_clarification: boolean
  missed_alert: boolean
  updated_at: string
}

export type SubscriptionInput = {
  name: string
  cost: number
  currency: Currency
  billing_cycle: Cycle
  next_renewal_date: string
  cancel_url: string | null
  is_trial: boolean
}

export type DecisionState = 'open' | 'marked' | 'decided_kept' | 'decided_cancelled' | 'not_found'

// "להחלטה" מוצג רק לסטטוסים האלה (החלטה משלב 2)
export const needsDecision = (s: Status) => s === 'pending_decision' || s === 'marked_cancel' || s === 'renewed_no_decision'

export const nameKey = (name: string) => name.replace(/\s+/g, '').toLowerCase()

const COLS = 'id,name,name_key,cost,currency,billing_cycle,next_renewal_date,cancel_url,is_trial,status,decided_at,needs_clarification,missed_alert,updated_at'

export async function listSubscriptions(): Promise<Subscription[]> {
  const { data, error } = await supabase.from('subscriptions').select(COLS).order('next_renewal_date', { ascending: true })
  if (error) throw error
  return (data ?? []) as Subscription[]
}

export async function getSubscription(id: string): Promise<Subscription | null> {
  const { data, error } = await supabase.from('subscriptions').select(COLS).eq('id', id).maybeSingle()
  if (error) throw error
  return data as Subscription | null
}

// כפילות: שם מנורמל + תאריך חידוש, אצל אותו משתמש (האינדקס במסד חוסם, וכאן מוצאים את הקיים לקישור "מעבר לעריכה")
export async function findDuplicate(input: Pick<SubscriptionInput, 'name' | 'next_renewal_date'>, exceptId?: string): Promise<Subscription | null> {
  let q = supabase.from('subscriptions').select(COLS).eq('name_key', nameKey(input.name)).eq('next_renewal_date', input.next_renewal_date)
  if (exceptId) q = q.neq('id', exceptId)
  const { data, error } = await q.limit(1)
  if (error) throw error
  return (data?.[0] as Subscription) ?? null
}

export class DuplicateError extends Error {
  existing: Subscription | null
  constructor(existing: Subscription | null) { super('duplicate'); this.existing = existing }
}

const isUniqueViolation = (e: { code?: string } | null) => e?.code === '23505'

export async function createSubscription(input: SubscriptionInput): Promise<Subscription> {
  const { data, error } = await supabase.from('subscriptions').insert(input).select(COLS).single()
  if (isUniqueViolation(error)) throw new DuplicateError(await findDuplicate(input))
  if (error) throw error
  return data as Subscription
}

export async function updateSubscription(id: string, input: SubscriptionInput): Promise<Subscription> {
  const { data, error } = await supabase.from('subscriptions').update(input).eq('id', id).select(COLS).single()
  if (isUniqueViolation(error)) throw new DuplicateError(await findDuplicate(input, id))
  if (error) throw error
  return data as Subscription
}

export async function deleteSubscription(id: string): Promise<void> {
  const { error } = await supabase.from('subscriptions').delete().eq('id', id)
  if (error) throw error
}

async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args)
  if (error) throw error
  return data as T
}

export const keepSubscription = (id: string) => rpc<Subscription>('keep_subscription', { sub_id: id })
export const markForCancel = (id: string) => rpc<Subscription>('mark_for_cancel', { sub_id: id })
export const confirmCancelled = (id: string) => rpc<Subscription>('confirm_cancelled', { sub_id: id })
export const answerClarification = (id: string, charged: boolean) => rpc<Subscription>('answer_clarification', { sub_id: id, charged })
export const restoreSubscription = (id: string, newDate: string) => rpc<Subscription>('restore_subscription', { sub_id: id, new_date: newDate })
export const decisionState = (id: string) => rpc<DecisionState>('decision_state', { sub_id: id })
