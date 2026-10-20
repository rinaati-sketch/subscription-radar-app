import { Navigate, Route, Routes } from 'react-router-dom'
import { UnderConstruction } from './screens/UnderConstruction'
import { NotFound } from './screens/NotFound'

// הכתובות לפי ה-App map (שלב 3). המסכים יתמלאו בצעדים הבאים של שלב 11.
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<UnderConstruction />} />
      <Route path="/register" element={<UnderConstruction />} />
      <Route path="/login" element={<UnderConstruction />} />
      <Route path="/forgot-password" element={<UnderConstruction />} />
      <Route path="/reset-password" element={<UnderConstruction />} />
      <Route path="/subscriptions" element={<UnderConstruction />} />
      <Route path="/subscriptions/cancelled" element={<UnderConstruction />} />
      <Route path="/subscriptions/new" element={<UnderConstruction />} />
      <Route path="/subscriptions/:id/edit" element={<UnderConstruction />} />
      <Route path="/subscriptions/:id/restore" element={<UnderConstruction />} />
      <Route path="/decide/:id" element={<UnderConstruction />} />
      <Route path="/index.html" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
