-- רדאר מנויים - סכמת מסד הנתונים (Supabase / Postgres)
-- טיוטה לשלב 10. תורץ בשלב 11 ב-SQL Editor של Supabase.
-- מקור: אפיון מתוקן 5, חלקים 4, 5, 8.

-- ---------- טבלה ----------
create table if not exists public.subscriptions (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name                 text not null check (length(btrim(name)) > 0),
  name_key             text generated always as (lower(regexp_replace(name, '\s+', '', 'g'))) stored,
  cost                 numeric(10, 2) not null check (cost > 0),
  currency             text not null default 'ILS' check (currency in ('ILS', 'USD')),
  billing_cycle        text not null check (billing_cycle in ('monthly', 'yearly')),
  next_renewal_date    date not null,
  cancel_url           text check (cancel_url is null or cancel_url ~* '^https?://'),
  is_trial             boolean not null default false,
  status               text not null default 'tracking'
                       check (status in ('tracking', 'pending_decision', 'renewed_no_decision', 'marked_cancel', 'cancelled')),
  alert_14_sent_at     timestamptz,
  alert_5_sent_at      timestamptz,
  alert_last_sent_at   timestamptz,
  decided_at           timestamptz,
  needs_clarification  boolean not null default false,
  missed_alert         boolean not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- כפילות: אותו משתמש, אותו שם מנורמל, אותו תאריך חידוש
create unique index if not exists subscriptions_no_duplicates
  on public.subscriptions (user_id, name_key, next_renewal_date);

create index if not exists subscriptions_user_renewal
  on public.subscriptions (user_id, next_renewal_date);

-- ---------- אבטחה: כל משתמש רואה רק את שלו ----------
alter table public.subscriptions enable row level security;

create policy "own rows - select" on public.subscriptions for select using (user_id = auth.uid());
create policy "own rows - insert" on public.subscriptions for insert with check (user_id = auth.uid());
create policy "own rows - update" on public.subscriptions for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own rows - delete" on public.subscriptions for delete using (user_id = auth.uid());

-- ---------- טריגר: updated_at, ואיפוס תחנות כשתאריך או מחזור משתנים ----------
create or replace function public.subscriptions_before_update()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  if new.next_renewal_date is distinct from old.next_renewal_date
     or new.billing_cycle is distinct from old.billing_cycle then
    new.alert_14_sent_at := null;
    new.alert_5_sent_at := null;
    new.alert_last_sent_at := null;
    new.missed_alert := false;
    if new.status <> 'cancelled' then new.status := 'tracking'; end if;
  end if;
  return new;
end $$;

drop trigger if exists subscriptions_before_update on public.subscriptions;
create trigger subscriptions_before_update
  before update on public.subscriptions
  for each row execute function public.subscriptions_before_update();

-- ---------- עזר: קידום תאריך במחזור אחד ----------
-- Postgres מקצר אוטומטית לסוף החודש: 31/01 + חודש = 28 או 29/02
create or replace function public.advance_cycle(d date, cycle text)
returns date language sql immutable as $$
  select case when cycle = 'yearly' then (d + interval '1 year')::date
              else (d + interval '1 month')::date end
$$;

-- ---------- פעולות הפורטל (security invoker: RLS חל גם כאן) ----------
create or replace function public.keep_subscription(sub_id uuid)
returns public.subscriptions language plpgsql security invoker as $$
declare s public.subscriptions;
begin
  update public.subscriptions
     set next_renewal_date   = public.advance_cycle(next_renewal_date, billing_cycle),
         status              = 'tracking',
         alert_14_sent_at    = null,
         alert_5_sent_at     = null,
         alert_last_sent_at  = null,
         is_trial            = false,
         needs_clarification = false,
         missed_alert        = false,
         decided_at          = now()
   where id = sub_id and status <> 'cancelled'
   returning * into s;
  if not found then raise exception 'not_found_or_decided'; end if;
  return s;
end $$;

create or replace function public.mark_for_cancel(sub_id uuid)
returns public.subscriptions language plpgsql security invoker as $$
declare s public.subscriptions;
begin
  update public.subscriptions set status = 'marked_cancel', decided_at = now()
   where id = sub_id and status <> 'cancelled' returning * into s;
  if not found then raise exception 'not_found_or_decided'; end if;
  return s;
end $$;

create or replace function public.confirm_cancelled(sub_id uuid)
returns public.subscriptions language plpgsql security invoker as $$
declare s public.subscriptions;
begin
  update public.subscriptions set status = 'cancelled', needs_clarification = false, decided_at = now()
   where id = sub_id and status <> 'cancelled' returning * into s;
  if not found then raise exception 'not_found_or_decided'; end if;
  return s;
end $$;

-- שאלת הבירור: "לא, בוטל בזמן" (charged=false) או "כן, חויבתי" (charged=true)
create or replace function public.answer_clarification(sub_id uuid, charged boolean)
returns public.subscriptions language plpgsql security invoker as $$
declare s public.subscriptions;
begin
  update public.subscriptions
     set status = case when charged then status else 'cancelled' end,
         needs_clarification = false,
         decided_at = case when charged then decided_at else now() end
   where id = sub_id and needs_clarification returning * into s;
  if not found then raise exception 'not_found'; end if;
  return s;
end $$;

create or replace function public.restore_subscription(sub_id uuid, new_date date)
returns public.subscriptions language plpgsql security invoker as $$
declare s public.subscriptions;
begin
  if new_date <= current_date then raise exception 'date_not_future'; end if;
  update public.subscriptions
     set status = 'tracking', next_renewal_date = new_date,
         alert_14_sent_at = null, alert_5_sent_at = null, alert_last_sent_at = null,
         needs_clarification = false, missed_alert = false
   where id = sub_id and status = 'cancelled' returning * into s;
  if not found then raise exception 'not_found'; end if;
  return s;
end $$;

-- מה הפורטל מציג: open / marked / decided_kept / decided_cancelled / not_found
create or replace function public.decision_state(sub_id uuid)
returns text language sql stable security invoker as $$
  select coalesce((
    select case
      when status = 'cancelled' then 'decided_cancelled'
      when status = 'marked_cancel' then 'marked'
      when status = 'tracking' and decided_at is not null
           and alert_14_sent_at is null and alert_5_sent_at is null and alert_last_sent_at is null
        then 'decided_kept'
      else 'open'
    end
    from public.subscriptions where id = sub_id
  ), 'not_found')
$$;

grant execute on function public.keep_subscription(uuid), public.mark_for_cancel(uuid), public.confirm_cancelled(uuid),
  public.answer_clarification(uuid, boolean), public.restore_subscription(uuid, date), public.decision_state(uuid)
  to authenticated;
