import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { BookOpen, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isAuthenticated, user, isLoading, registrationSuccess, clearRegistrationSuccess } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Show success toast if redirected from registration
  const [successMsg, setSuccessMsg] = useState(registrationSuccess ? 'Account created successfully. Please log in.' : '')

  useEffect(() => {
    if (registrationSuccess) {
      setSuccessMsg('Account created successfully. Please log in.')
      clearRegistrationSuccess()
    }
  }, [registrationSuccess, clearRegistrationSuccess])

  // Redirect authenticated users to their role-based dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      const from = (location.state as any)?.from?.pathname
      if (from) {
        navigate(from, { replace: true })
      } else {
        redirectByRole(user.role)
      }
    }
  }, [isAuthenticated, isLoading, user])

  function redirectByRole(role: string) {
    if (role === 'admin') navigate('/admin', { replace: true })
    else if (role === 'teacher') navigate('/teacher', { replace: true })
    else navigate('/student', { replace: true })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')

    // Frontend validation
    if (!email.trim()) { setError('Email is required.'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Please enter a valid email address.'); return }
    if (!password) { setError('Password is required.'); return }

    setIsSubmitting(true)
    try {
      await login(email, password, rememberMe)
      // Navigation handled by the useEffect above
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Login failed. Please try again.'
      setError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleQuickLogin = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail)
    setPassword(demoPass)
    setError('')
    setSuccessMsg('')
    setIsSubmitting(true)
    try {
      await login(demoEmail, demoPass, true)
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Login failed. Please try again.'
      setError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const busy = isSubmitting || isLoading

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 shadow-lg mb-4">
            <BookOpen className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            StudyRank <span className="text-indigo-600">AI</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1.5 font-medium tracking-wide">
            State Board Exam Practice, Evaluation & Ranking Platform
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
          <p className="text-sm text-gray-500 mb-6">Sign in to continue learning</p>

          {/* Success Alert */}
          {successMsg && (
            <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-5">
              <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-emerald-800 font-medium">{successMsg}</p>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-5">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="login-email" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 pointer-events-none" style={{ width: '18px', height: '18px' }} />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError('') }}
                  disabled={busy}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-400 transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="block text-sm font-semibold text-gray-700">
                  Password
                </label>
                <button
                  type="button"
                  tabIndex={-1}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  onClick={() => {/* Placeholder for forgot password */}}
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" style={{ width: '18px', height: '18px' }} />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError('') }}
                  disabled={busy}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-400 transition-colors"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff style={{ width: '18px', height: '18px' }} /> : <Eye style={{ width: '18px', height: '18px' }} />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2.5">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={busy}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="remember-me" className="text-sm text-gray-600 cursor-pointer select-none">
                Remember me for 24 hours
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-xl shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {/* Register link */}
          <p className="mt-6 text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 hover:text-blue-700 font-semibold">
              Create account
            </Link>
          </p>
        </div>

        {/* 1-Click Demo Credentials */}
        <div className="mt-6 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Quick Demo Login (1-Click)</p>
            <span className="text-[11px] text-gray-400 font-medium">Click role to sign in</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => handleQuickLogin('student@demo.com', 'password')}
              className="flex flex-col items-center justify-center p-2.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition text-center group disabled:opacity-50"
            >
              <span className="text-xs font-bold text-blue-700 group-hover:scale-105 transition-transform">Student</span>
              <span className="text-[10px] text-blue-500 font-mono mt-0.5">student@demo.com</span>
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={() => handleQuickLogin('teacher@demo.com', 'password')}
              className="flex flex-col items-center justify-center p-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition text-center group disabled:opacity-50"
            >
              <span className="text-xs font-bold text-emerald-700 group-hover:scale-105 transition-transform">Teacher</span>
              <span className="text-[10px] text-emerald-500 font-mono mt-0.5">teacher@demo.com</span>
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={() => handleQuickLogin('admin@demo.com', 'password')}
              className="flex flex-col items-center justify-center p-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition text-center group disabled:opacity-50"
            >
              <span className="text-xs font-bold text-slate-800 group-hover:scale-105 transition-transform">Admin</span>
              <span className="text-[10px] text-slate-500 font-mono mt-0.5">admin@demo.com</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
