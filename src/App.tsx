import { Navigate, Route, Routes } from 'react-router-dom'
import { RequireAuth, RootRedirect } from './app/auth'
import { Register } from './screens/auth/Register'
import { Login } from './screens/auth/Login'
import { ForgotPassword } from './screens/auth/ForgotPassword'
import { ResetPassword } from './screens/auth/ResetPassword'
import { UnderConstruction } from './screens/UnderConstruction'
import { NotFound } from './screens/NotFound'

// הכתובות לפי ה-App map (שלב 3)
const protectedScreen = <RequireAuth><UnderConstruction /></RequireAuth>

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/subscriptions" element={protectedScreen} />
      <Route path="/subscriptions/cancelled" element={protectedScreen} />
      <Route path="/subscriptions/new" element={protectedScreen} />
      <Route path="/subscriptions/:id/edit" element={protectedScreen} />
      <Route path="/subscriptions/:id/restore" element={protectedScreen} />
      <Route path="/decide/:id" element={protectedScreen} />
      <Route path="/index.html" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
