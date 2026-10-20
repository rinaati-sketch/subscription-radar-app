import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { supabase } from '../../lib/supabase'
import { resetSchema, type ResetValues } from '../../lib/validation'
import { useAuth } from '../../app/auth'
import { t } from '../../content/he'
import { AuthLayout, LinkRow } from '../../components/AuthLayout'
import { Field } from '../../components/Field'
import { Button } from '../../components/Button'
import { Banner } from '../../components/Banner'
import { TextLink } from '../../components/TextLink'

// בחירת סיסמה חדשה (/reset-password) - נפתח מהקישור במייל (אפיון 5.1)
// Supabase מחליף את ?code= בהתחברות זמנית. בלי התחברות כזו - הקישור לא בתוקף
export function ResetPassword() {
  const { session, ready } = useAuth()
  const [params] = useSearchParams()
  const [state, setState] = useState<'form' | 'done' | 'error'>('form')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    mode: 'onTouched',
  })
  const linkError = params.has('error') || params.has('error_code') || window.location.hash.includes('error')

  const onSubmit = async ({ password }: ResetValues) => {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) return setState('error')
    await supabase.auth.signOut({ scope: 'local' })
    setState('done')
  }

  if (state === 'done') {
    return (
      <AuthLayout title={t.reset.title}>
        <Banner type="success">{t.reset.success} <TextLink to="/login">{t.reset.toLogin}</TextLink></Banner>
      </AuthLayout>
    )
  }

  if (!ready) return <AuthLayout title={t.reset.title}><div aria-busy="true" className="h-24" /></AuthLayout>

  if (linkError || !session) {
    return (
      <AuthLayout title={t.reset.title}>
        <Banner type="error">{t.reset.expired} <TextLink to="/forgot-password">{t.reset.toForgot}</TextLink></Banner>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title={t.reset.title}>
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <Field label={t.fields.newPassword} type="password" autoComplete="new-password" ltr error={errors.password?.message} {...register('password')} />
        {state === 'error' && <Banner type="error">{t.common.networkError}</Banner>}
        <Button type="submit" full loading={isSubmitting} loadingText={t.reset.loading}>{t.reset.submit}</Button>
      </form>
      <LinkRow><TextLink to="/login">{t.reset.back}</TextLink></LinkRow>
    </AuthLayout>
  )
}
