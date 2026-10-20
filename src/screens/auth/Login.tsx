import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { supabase } from '../../lib/supabase'
import { appUrl, markSeen, safeNext } from '../../lib/nav'
import { loginSchema, type LoginValues } from '../../lib/validation'
import { useAuth } from '../../app/auth'
import { t } from '../../content/he'
import { AuthLayout, LinkRow } from '../../components/AuthLayout'
import { Field } from '../../components/Field'
import { Button } from '../../components/Button'
import { Banner } from '../../components/Banner'
import { TextLink } from '../../components/TextLink'

type Problem = 'wrong' | 'notVerified' | 'network' | null

// מסך התחברות (/login) - אפיון 5.1, Figma: Screens / Auth
export function Login() {
  const { session, ready } = useAuth()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const next = safeNext(params.get('next'))
  const verified = params.get('verified') === '1'
  const [problem, setProblem] = useState<Problem>(null)
  const [resentTo, setResentTo] = useState<string | null>(null)
  const [resending, setResending] = useState(false)
  const { register, handleSubmit, getValues, formState: { errors, isSubmitting } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
  })
  useEffect(markSeen, [])

  // הגעה מקישור האימות: Supabase כבר אימת את המייל. מציגים "המייל אומת" ומבקשים להתחבר (אפיון 5.1)
  useEffect(() => {
    if (verified && session) supabase.auth.signOut({ scope: 'local' })
  }, [verified, session])

  if (ready && session && !verified) return <Navigate to={next} replace />

  const onSubmit = async ({ email, password }: LoginValues) => {
    setProblem(null)
    setResentTo(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error) return navigate(next, { replace: true })
    if (error.code === 'email_not_confirmed') return setProblem('notVerified')
    if (error.code === 'invalid_credentials' || error.status === 400) return setProblem('wrong')
    setProblem('network')
  }

  const resend = async () => {
    const email = getValues('email')
    setResending(true)
    const { error } = await supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: appUrl('login?verified=1') } })
    setResending(false)
    if (error) return setProblem('network')
    setProblem(null)
    setResentTo(email)
  }

  return (
    <AuthLayout title={t.login.title} subtitle={t.login.subtitle}>
      {verified && <Banner type="success">{t.login.verified}</Banner>}
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <Field label={t.fields.email} type="email" autoComplete="email" inputMode="email" ltr error={errors.email?.message} {...register('email')} />
        <Field label={t.fields.password} type="password" autoComplete="current-password" ltr error={errors.password?.message} {...register('password')} />
        {problem === 'wrong' && <Banner type="error">{t.login.wrong}</Banner>}
        {problem === 'network' && <Banner type="error">{t.common.networkError}</Banner>}
        {problem === 'notVerified' && (
          <>
            <Banner type="error">{t.login.notVerified}</Banner>
            <Button type="button" variant="ghost" className="self-start" onClick={resend} loading={resending}>{t.login.resend}</Button>
          </>
        )}
        {resentTo && (
          <Banner type="success">
            {t.login.resentBefore}<bdi dir="ltr">{resentTo}</bdi>.
          </Banner>
        )}
        <Button type="submit" full loading={isSubmitting} loadingText={t.login.loading}>{t.login.submit}</Button>
      </form>
      <LinkRow><TextLink to="/forgot-password">{t.login.forgot}</TextLink></LinkRow>
      <LinkRow lead={t.login.toRegisterLead}><TextLink to="/register">{t.login.toRegister}</TextLink></LinkRow>
    </AuthLayout>
  )
}
