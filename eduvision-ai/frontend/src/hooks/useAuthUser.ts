import { useAuth } from '../context/AuthContext'

export function useAuthUser() {
  const { user, isAuthenticated } = useAuth()
  return { user, isAuthenticated }
}
