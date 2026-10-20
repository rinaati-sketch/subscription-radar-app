import { Navigate, Route, Routes } from 'react-router-dom'
import { RequireAuth, RootRedirect } from './app/auth'
import { AppShell } from './app/AppShell'
import { Register } from './screens/auth/Register'
import { Login } from './screens/auth/Login'
import { ForgotPassword } from './screens/auth/ForgotPassword'
import { ResetPassword } from './screens/auth/ResetPassword'
import { SubscriptionList } from './screens/subscriptions/SubscriptionList'
import { SubscriptionForm } from './screens/subscriptions/SubscriptionForm'
import { Decide } from './screens/subscriptions/Decide'
import { NotFound } from './screens/NotFound'

// הכתובות לפי ה-App map (שלב 3). המסכים המוגנים יושבים בתוך מסגרת עם ניווט
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<RequireAuth><AppShell /></RequireAuth>}>
        <Route path="/subscriptions" element={<SubscriptionList mode="active" />} />
        <Route path="/subscriptions/cancelled" element={<SubscriptionList mode="cancelled" />} />
        <Route path="/subscriptions/new" element={<SubscriptionForm key="new" mode="add" />} />
        <Route path="/subscriptions/:id/edit" element={<SubscriptionForm key="edit" mode="edit" />} />
        <Route path="/subscriptions/:id/restore" element={<SubscriptionForm key="restore" mode="restore" />} />
        <Route path="/decide/:id" element={<Decide />} />
      </Route>
      <Route path="/index.html" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
