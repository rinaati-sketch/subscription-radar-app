import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { hasSeen } from '../lib/nav'

type AuthState = { session: Session | null; ready: boolean }
const AuthContext = createContext<AuthState>({ session: null, ready: false })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ session: null, ready: false })
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setState({ session: data.session, ready: true }))
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setState({ session, ready: true }))
    return () => data.subscription.unsubscribe()
  }, [])
  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)

function Loading() {
  return <div className="min-h-dvh" aria-busy="true" />
}

// מסך מוגן: בלי התחברות -> /login?next=<הכתובת הנוכחית>
export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, ready } = useAuth()
  const loc = useLocation()
  if (!ready) return <Loading />
  if (!session) return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname + loc.search)}`} replace />
  return <>{children}</>
}

// הכתובת הראשית: מחובר -> רשימה; כניסה ראשונה -> הרשמה; חוזרת -> התחברות
export function RootRedirect() {
  const { session, ready } = useAuth()
  if (!ready) return <Loading />
  if (session) return <Navigate to="/subscriptions" replace />
  return <Navigate to={hasSeen() ? '/login' : '/register'} replace />
}
