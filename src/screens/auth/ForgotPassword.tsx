import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { supabase } from '../../lib/supabase'
import { appUrl, markSeen } from '../../lib/nav'
import { forgotSchema, isNetworkError, type ForgotValues } from '../../lib/validation'
import { t } from '../../content/he'
import { AuthLayout, LinkRow } from '../../components/AuthLayout'
import { Field } from '../../components/Field'
import { Button } from '../../components/Button'
import { Banner } from '../../components/Banner'
import { TextLink } from '../../components/TextLink'

// איפוס סיסמה (/forgot-password) - אפיון 5.1
// אותה הודעה גם לכתובת שלא רשומה, כדי לא לחשוף מי רשום
export function ForgotPassword() {
  const [state, setState] = useState<'form' | 'sent' | 'error'>('form')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotValues>({
    resolver: zodResolver(forgotSchema),
    mode: 'onTouched',
  })
  useEffect(markSeen, [])

  const onSubmit = async ({ email }: ForgotValues) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: appUrl('reset-password') })
    setState(error && isNetworkError(error) ? 'error' : 'sent')
  }

  if (state === 'sent') {
    return (
      <AuthLayout title={t.forgot.title}>
        <Banner type="success">{t.forgot.sent}</Banner>
        <LinkRow><TextLink to="/login">{t.forgot.back}</TextLink></LinkRow>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title={t.forgot.title} subtitle={t.forgot.subtitle}>
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <Field label={t.fields.email} type="email" autoComplete="email" inputMode="email" ltr error={errors.email?.message} {...register('email')} />
        {state === 'error' && <Banner type="error">{t.common.networkError}</Banner>}
        <Button type="submit" full loading={isSubmitting} loadingText={t.forgot.loading}>{t.forgot.submit}</Button>
      </form>
      <LinkRow><TextLink to="/login">{t.forgot.back}</TextLink></LinkRow>
    </AuthLayout>
  )
}
