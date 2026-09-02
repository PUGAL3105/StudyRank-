import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * LandingPage: smart redirect.
 * Authenticated → role-based dashboard.
 * Unauthenticated → /login.
 */
export default function LandingPage() {
  const { isAuthenticated, isLoading, user } = useAuth()

  if (isLoading) return null

  if (isAuthenticated && user) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />
    if (user.role === 'teacher') return <Navigate to="/teacher" replace />
    return <Navigate to="/student" replace />
  }

  return <Navigate to="/login" replace />
}
