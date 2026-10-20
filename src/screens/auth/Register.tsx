import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { supabase } from '../../lib/supabase'
import { appUrl, markSeen } from '../../lib/nav'
import { registerSchema, type RegisterValues } from '../../lib/validation'
import { useAuth } from '../../app/auth'
import { t } from '../../content/he'
import { AuthLayout, LinkRow } from '../../components/AuthLayout'
import { Field } from '../../components/Field'
import { Button } from '../../components/Button'
import { Banner } from '../../components/Banner'
import { TextLink } from '../../components/TextLink'

type Outcome = { kind: 'sent'; email: string } | { kind: 'exists' } | { kind: 'error' } | null

// מסך הרשמה (/register) - אפיון 5.1, Figma: Screens / Auth
export function Register() {
  const { session } = useAuth()
  const [outcome, setOutcome] = useState<Outcome>(null)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onTouched',
  })
  useEffect(markSeen, [])
  if (session) return <Navigate to="/subscriptions" replace />

  const onSubmit = async ({ email, password }: RegisterValues) => {
    setOutcome(null)
    const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: appUrl('login?verified=1') } })
    if (error) return setOutcome(error.code === 'user_already_exists' ? { kind: 'exists' } : { kind: 'error' })
    // מייל שכבר רשום: Supabase מחזיר משתמש בלי זהויות, כדי לא לחשוף לזרים מי רשום
    if (data.user && data.user.identities?.length === 0) return setOutcome({ kind: 'exists' })
    setOutcome({ kind: 'sent', email })
  }

  // אחרי הרשמה: הטופס מתחלף בהודעה (אפיון 5.1)
  if (outcome?.kind === 'sent') {
    return (
      <AuthLayout title={t.register.title}>
        <Banner type="success">
          {t.register.sentBefore}<bdi dir="ltr">{outcome.email}</bdi>{t.register.sentAfter}
        </Banner>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title={t.register.title} subtitle={t.register.subtitle}>
      {outcome?.kind === 'exists' && (
        <Banner type="error">
          {t.register.exists} <TextLink to="/login">{t.register.toLogin}</TextLink>
        </Banner>
      )}
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <Field label={t.fields.email} type="email" autoComplete="email" inputMode="email" ltr error={errors.email?.message} {...register('email')} />
        <Field label={t.fields.password} type="password" autoComplete="new-password" ltr error={errors.password?.message} {...register('password')} />
        {outcome?.kind === 'error' && <Banner type="error">{t.common.networkError}</Banner>}
        <Button type="submit" full loading={isSubmitting} loadingText={t.register.loading}>{t.register.submit}</Button>
      </form>
      <LinkRow lead={t.register.toLoginLead}><TextLink to="/login">{t.register.toLogin}</TextLink></LinkRow>
    </AuthLayout>
  )
}
