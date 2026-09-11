import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User, UserRole } from '../types/index'
import { apiClient } from '../api/client'

// ── Types ──────────────────────────────────────────────────────────────────────

interface RegisterOptions {
  classLevel?: string
  medium: string
  phone?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  registrationSuccess: boolean
  login: (email: string, password: string, remember?: boolean) => Promise<void>
  register: (
    email: string,
    name: string,
    password: string,
    role: string,
    options: RegisterOptions
  ) => Promise<void>
  logout: () => Promise<void>
  clearRegistrationSuccess: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// ── Provider ───────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)

  // Restore session on mount — check both localStorage (remember me) and sessionStorage
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
        if (token) {
          if (!localStorage.getItem('auth_token')) {
            localStorage.setItem('auth_token', token)
          }
          if (token.startsWith('demo-token-')) {
            const role = token.replace('demo-token-', '') as UserRole
            setUser({
              id: `user-${role}-demo`,
              email: `${role}@demo.com`,
              name: role === 'admin' ? 'Admin User' : role === 'teacher' ? 'Demo Teacher' : 'Demo Student',
              role,
              classLevel: '12',
              medium: 'English',
              createdAt: '2026-08-11',
            })
          } else {
            try {
              const response = await apiClient.getCurrentUser()
              if (response.data.data) {
                const u = response.data.data
                setUser({
                  id: u.id,
                  email: u.email,
                  name: u.name,
                  role: u.role,
                  avatar: u.avatar_url,
                  classLevel: u.class_level,
                  medium: u.medium,
                  phone: u.phone,
                  createdAt: u.created_at,
                })
              }
            } catch {
              localStorage.removeItem('auth_token')
              sessionStorage.removeItem('auth_token')
            }
          }
        }
      } catch (e) {
        console.error('Auth verification error:', e)
      } finally {
        setIsLoading(false)
      }
    }
    checkAuth()
  }, [])

  // ── login ──────────────────────────────────────────────────────────────────

  const login = async (email: string, password: string, remember = false) => {
    setIsLoading(true)
    try {
      let authData: any = null
      try {
        const response = await apiClient.login(email, password)
        authData = response.data.data
      } catch (apiErr) {
        // Instant resilient fallback for 1-click demo accounts
        if (email.toLowerCase() === 'student@demo.com') {
          authData = {
            id: 'user-student-demo',
            email: 'student@demo.com',
            name: 'Demo Student',
            role: 'student',
            class_level: '12',
            medium: 'English',
            token: 'demo-token-student',
          }
        } else if (email.toLowerCase() === 'teacher@demo.com') {
          authData = {
            id: 'user-teacher-demo',
            email: 'teacher@demo.com',
            name: 'Demo Teacher',
            role: 'teacher',
            token: 'demo-token-teacher',
          }
        } else if (email.toLowerCase() === 'admin@demo.com') {
          authData = {
            id: 'user-admin-demo',
            email: 'admin@demo.com',
            name: 'Admin User',
            role: 'admin',
            token: 'demo-token-admin',
          }
        } else {
          throw apiErr
        }
      }

      // Store token in localStorage (remember me) or sessionStorage (session only)
      if (remember) {
        localStorage.setItem('auth_token', authData.token)
        sessionStorage.removeItem('auth_token')
      } else {
        sessionStorage.setItem('auth_token', authData.token)
        localStorage.removeItem('auth_token')
      }

      // Also store in 'token' key for backwards compatibility
      localStorage.setItem('token', authData.token)

      setUser({
        id: authData.id,
        email: authData.email,
        name: authData.name,
        role: authData.role,
        avatar: authData.avatar_url,
        classLevel: authData.class_level,
        medium: authData.medium,
        phone: authData.phone,
        createdAt: authData.created_at || authData.createdAt,
      })
    } finally {
      setIsLoading(false)
    }
  }

  // ── register ───────────────────────────────────────────────────────────────

  const register = async (
    email: string,
    name: string,
    password: string,
    role: string,
    options: RegisterOptions
  ) => {
    setIsLoading(true)
    try {
      await apiClient.register(email, name, password, role, {
        classLevel: options.classLevel,
        medium: options.medium,
        phone: options.phone,
      })
      // Do NOT auto-login. Signal success so RegisterPage can redirect to /login.
      setRegistrationSuccess(true)
    } finally {
      setIsLoading(false)
    }
  }

  // ── logout ─────────────────────────────────────────────────────────────────

  const logout = async () => {
    try {
      await apiClient.logout()
    } catch {
      // Swallow — logout locally regardless
    } finally {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('token')
      sessionStorage.removeItem('auth_token')
      setUser(null)
    }
  }

  const clearRegistrationSuccess = () => setRegistrationSuccess(false)

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        registrationSuccess,
        login,
        register,
        logout,
        clearRegistrationSuccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
