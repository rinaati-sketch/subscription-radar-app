// בדיקות לסכמת רדאר מנויים על Postgres אמיתי (PGlite)
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';

const schemaPath = process.argv[2];
const db = new PGlite();
const results = [];
const ok = (name, cond, extra = '') => results.push({ name, pass: !!cond, extra });

// --- סביבת Supabase מדומה: auth.users, auth.uid(), תפקיד authenticated ---
await db.exec(`
  create schema auth;
  create table auth.users (id uuid primary key, email text);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create role authenticated;
  grant usage on schema auth to authenticated;
  grant execute on function auth.uid() to authenticated;
  insert into auth.users values ('11111111-1111-1111-1111-111111111111','a@x.com'), ('22222222-2222-2222-2222-222222222222','b@x.com');
`);
await db.exec(readFileSync(schemaPath, 'utf8'));
await db.exec(`grant usage on schema public to authenticated; grant select, insert, update, delete on public.subscriptions to authenticated;`);
ok('הסכמה נטענת בלי שגיאות', true);

const A = '11111111-1111-1111-1111-111111111111', B = '22222222-2222-2222-2222-222222222222';
async function as(user, sql, params = []) {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${user}', false); set role authenticated;`);
  try { return await db.query(sql, params); } finally { await db.exec('reset role;'); }
}
async function fails(user, sql, params = []) { try { await as(user, sql, params); return null; } catch (e) { return e.message; } }
const one = async (user, sql, params) => (await as(user, sql, params)).rows[0];

// הוספה
const ins = `insert into subscriptions (name, cost, currency, billing_cycle, next_renewal_date, is_trial, cancel_url) values ($1,$2,$3,$4,$5,$6,$7) returning *`;
const canva = await one(A, ins, ['Canva Pro', 45, 'ILS', 'monthly', '2027-01-31', true, 'https://canva.com/account']);
ok('הוספה: user_id ממולא אוטומטית מהמשתמש המחובר', canva.user_id === A);
ok('הוספה: סטטוס ברירת מחדל "במעקב"', canva.status === 'tracking');

// כפילות
ok('כפילות נחסמת (רישיות ורווחים שונים, אותו תאריך)', await fails(A, ins, ['canva  PRO', 45, 'ILS', 'monthly', '2027-01-31', false, null]));
ok('אותו שם בתאריך אחר - מותר', !(await fails(A, ins, ['Canva Pro', 45, 'ILS', 'monthly', '2027-03-31', false, null])));
ok('אותו מנוי אצל משתמש אחר - מותר', !(await fails(B, ins, ['Canva Pro', 45, 'ILS', 'monthly', '2027-01-31', false, null])));

// ולידציה במסד הנתונים
ok('עלות 0 נחסמת', await fails(A, ins, ['X', 0, 'ILS', 'monthly', '2027-01-01', false, null]));
ok('שם ריק (רווחים) נחסם', await fails(A, ins, ['   ', 10, 'ILS', 'monthly', '2027-01-01', false, null]));
ok('קישור ביטול לא תקין נחסם', await fails(A, ins, ['Y', 10, 'ILS', 'monthly', '2027-01-01', false, 'canva']));
ok('מטבע לא מוכר נחסם', await fails(A, ins, ['Z', 10, 'EUR', 'monthly', '2027-01-01', false, null]));

// הפרדה בין משתמשים (RLS)
ok('משתמש B לא רואה את המנויים של A', (await as(B, `select count(*)::int c from subscriptions where user_id = $1`, [A])).rows[0].c === 0);
ok('משתמש B לא יכול לעדכן מנוי של A', (await as(B, `update subscriptions set cost = 1 where id = $1`, [canva.id])).affectedRows === 0);
ok('משתמש B לא יכול למחוק מנוי של A', (await as(B, `delete from subscriptions where id = $1`, [canva.id])).affectedRows === 0);
ok('משתמש B לא יכול להוסיף מנוי בשם A', await fails(B, `insert into subscriptions (user_id, name, cost, billing_cycle, next_renewal_date) values ($1,'Q',1,'monthly','2027-01-01')`, [A]));
ok('פורטל: מנוי של משתמש אחר מחזיר "לא נמצא"', (await one(B, `select decision_state($1) s`, [canva.id])).s === 'not_found');

// "להשאיר": קידום חודשי מ-31/01 -> 28/02
await as(A, `update subscriptions set status='pending_decision', alert_14_sent_at=now() where id=$1`, [canva.id]);
ok('פורטל: ממתין להחלטה = פתוח', (await one(A, `select decision_state($1) s`, [canva.id])).s === 'open');
const kept = await one(A, `select * from keep_subscription($1)`, [canva.id]);
ok('להשאיר: 31/01/2027 -> 28/02/2027', String(kept.next_renewal_date.toISOString()).startsWith('2027-02-28'), kept.next_renewal_date.toISOString());
ok('להשאיר: חוזר ל"במעקב", תחנות מתאפסות, הניסיון מוסר', kept.status === 'tracking' && kept.alert_14_sent_at === null && kept.is_trial === false && kept.decided_at);
ok('פורטל אחרי "להשאיר": כבר הוחלט - נשאר', (await one(A, `select decision_state($1) s`, [canva.id])).s === 'decided_kept');

// קידום שנתי מ-29/02/2028
const leap = await one(A, ins, ['Notion', 96, 'USD', 'yearly', '2028-02-29', false, null]);
const leapKept = await one(A, `select * from keep_subscription($1)`, [leap.id]);
ok('להשאיר שנתי: 29/02/2028 -> 28/02/2029', leapKept.next_renewal_date.toISOString().startsWith('2029-02-28'), leapKept.next_renewal_date.toISOString());

// עריכה מאפסת תחנות
await as(A, `update subscriptions set status='pending_decision', alert_14_sent_at=now(), alert_5_sent_at=now() where id=$1`, [leap.id]);
const edited = await one(A, `update subscriptions set next_renewal_date='2029-03-15' where id=$1 returning *`, [leap.id]);
ok('עריכת תאריך: תחנות מתאפסות וסטטוס חוזר ל"במעקב"', edited.alert_14_sent_at === null && edited.alert_5_sent_at === null && edited.status === 'tracking');
const edited2 = await one(A, `update subscriptions set alert_14_sent_at=now() where id=$1 returning *`, [leap.id]);
const edited3 = await one(A, `update subscriptions set cost=100 where id=$1 returning *`, [leap.id]);
ok('עריכת עלות בלבד: התחנות לא מתאפסות', edited3.alert_14_sent_at !== null);

// סימון לביטול -> ביטלתי
const fig = await one(A, ins, ['Figma', 60, 'ILS', 'monthly', '2027-01-07', false, null]);
await as(A, `select mark_for_cancel($1)`, [fig.id]);
ok('סימון לביטול: פורטל מציג "כבר ביטלת?"', (await one(A, `select decision_state($1) s`, [fig.id])).s === 'marked');
await as(A, `select confirm_cancelled($1)`, [fig.id]);
ok('ביטלתי באתר השירות: סטטוס "בוטל", פורטל "כבר הוחלט - בוטל"', (await one(A, `select status from subscriptions where id=$1`, [fig.id])).status === 'cancelled' && (await one(A, `select decision_state($1) s`, [fig.id])).s === 'decided_cancelled');
ok('אחרי ביטול: אי אפשר "להשאיר" שוב', await fails(A, `select keep_subscription($1)`, [fig.id]));

// החזרה למעקב
ok('החזרה למעקב עם תאריך עבר - נחסם', await fails(A, `select restore_subscription($1, '2020-01-01')`, [fig.id]));
const restored = await one(A, `select * from restore_subscription($1, (current_date + 30))`, [fig.id]);
ok('החזרה למעקב עם תאריך עתידי: "במעקב"', restored.status === 'tracking');

// שאלת בירור
const ad = await one(A, ins, ['Adobe', 220, 'ILS', 'monthly', '2027-01-20', false, null]);
await as(A, `update subscriptions set status='renewed_no_decision', needs_clarification=true where id=$1`, [ad.id]);
await as(A, `select answer_clarification($1, true)`, [ad.id]);
const charged = await one(A, `select status, needs_clarification from subscriptions where id=$1`, [ad.id]);
ok('בירור "כן, חויבתי": נשאר במעקב, השאלה נסגרת', charged.status === 'renewed_no_decision' && charged.needs_clarification === false);
await as(A, `update subscriptions set needs_clarification=true where id=$1`, [ad.id]);
await as(A, `select answer_clarification($1, false)`, [ad.id]);
ok('בירור "לא, בוטל בזמן": עובר ל"בוטל"', (await one(A, `select status from subscriptions where id=$1`, [ad.id])).status === 'cancelled');

// פורטל למנוי שנמחק
const mj = await one(A, ins, ['Midjourney', 10, 'USD', 'monthly', '2027-02-02', false, null]);
await as(A, `delete from subscriptions where id=$1`, [mj.id]);
ok('פורטל למנוי שנמחק: "לא נמצא"', (await one(A, `select decision_state($1) s`, [mj.id])).s === 'not_found');

const passed = results.filter(r => r.pass).length;
for (const r of results) console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name}${r.extra && !r.pass ? '  [' + r.extra + ']' : ''}`);
console.log(`\n${passed}/${results.length} passed`);
process.exit(passed === results.length ? 0 : 1);
