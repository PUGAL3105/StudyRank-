import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  BookOpen, User, Mail, Lock, Eye, EyeOff,
  Phone, GraduationCap, Globe, AlertCircle, Loader2,
} from 'lucide-react'

// ── Per-field validation errors ───────────────────────────────────────────────
interface FieldErrors {
  name?: string
  email?: string
  password?: string
  confirmPassword?: string
  role?: string
  classLevel?: string
  medium?: string
  phone?: string
}

function validateForm(data: {
  name: string; email: string; password: string; confirmPassword: string
  role: string; classLevel: string; medium: string; phone: string
}): FieldErrors {
  const errors: FieldErrors = {}

  if (!data.name.trim()) errors.name = 'Full name is required.'
  else if (data.name.trim().length < 2) errors.name = 'Name must be at least 2 characters.'

  if (!data.email.trim()) errors.email = 'Email is required.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'Please enter a valid email address.'

  if (!data.password) errors.password = 'Password is required.'
  else if (data.password.length < 8) errors.password = 'Password must contain at least 8 characters.'

  if (!data.confirmPassword) errors.confirmPassword = 'Please confirm your password.'
  else if (data.password !== data.confirmPassword) errors.confirmPassword = 'Passwords do not match.'

  if (!data.role) errors.role = 'Please select your role.'

  if (data.role === 'student' && !data.classLevel) errors.classLevel = 'Please select your class.'

  if (!data.medium) errors.medium = 'Please select your medium of instruction.'

  if (data.phone && !/^[0-9+\-\s()]{7,20}$/.test(data.phone)) {
    errors.phone = 'Please enter a valid phone number.'
  }

  return errors
}

// ── Field wrapper ─────────────────────────────────────────────────────────────
function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return (
    <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
      <AlertCircle style={{ width: '12px', height: '12px', flexShrink: 0 }} />
      {msg}
    </p>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function RegisterPage() {
  const navigate = useNavigate()
  const { register, isLoading, registrationSuccess } = useAuth()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    classLevel: '',
    medium: '',
    phone: '',
  })
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [serverError, setServerError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Redirect to /login once registration succeeds
  useEffect(() => {
    if (registrationSuccess) {
      navigate('/login', { replace: true })
    }
  }, [registrationSuccess, navigate])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear per-field error on change
    if (fieldErrors[name as keyof FieldErrors]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }))
    }
    setServerError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError('')

    const errors = validateForm(formData)
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})
    setIsSubmitting(true)

    try {
      await register(formData.email, formData.name, formData.password, formData.role, {
        classLevel: formData.role === 'student' ? formData.classLevel : undefined,
        medium: formData.medium,
        phone: formData.phone || undefined,
      })
      // Navigation handled by useEffect watching registrationSuccess
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Registration failed. Please try again.'
      setServerError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const busy = isSubmitting || isLoading

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">

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
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Create your account</h2>
          <p className="text-sm text-gray-500 mb-6">Join thousands of Tamil Nadu students &amp; teachers</p>

          {/* Server Error */}
          {serverError && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{serverError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">

            {/* Full Name */}
            <div>
              <label htmlFor="reg-name" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" style={{ width: '18px', height: '18px' }} />
                <input
                  id="reg-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={busy}
                  placeholder="e.g. Pugal Arasan"
                  className={`w-full pl-10 pr-4 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 transition-colors ${fieldErrors.name ? 'border-red-400' : 'border-gray-300'}`}
                />
              </div>
              <FieldError msg={fieldErrors.name} />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="reg-email" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" style={{ width: '18px', height: '18px' }} />
                <input
                  id="reg-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={busy}
                  placeholder="you@example.com"
                  className={`w-full pl-10 pr-4 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 transition-colors ${fieldErrors.email ? 'border-red-400' : 'border-gray-300'}`}
                />
              </div>
              <FieldError msg={fieldErrors.email} />
            </div>

            {/* Role */}
            <div>
              <label htmlFor="reg-role" className="block text-sm font-semibold text-gray-700 mb-1.5">
                I am a <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(['student', 'teacher'] as const).map((r) => (
                  <label
                    key={r}
                    className={`flex items-center gap-3 px-4 py-3 border-2 rounded-xl cursor-pointer transition-all ${
                      formData.role === r
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    } ${busy ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={r}
                      checked={formData.role === r}
                      onChange={handleChange}
                      disabled={busy}
                      className="sr-only"
                    />
                    <GraduationCap style={{ width: '18px', height: '18px', flexShrink: 0 }} />
                    <span className="text-sm font-semibold capitalize">{r}</span>
                  </label>
                ))}
              </div>
              <FieldError msg={fieldErrors.role} />
            </div>

            {/* Class — Student only */}
            {formData.role === 'student' && (
              <div>
                <label htmlFor="reg-class" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Class <span className="text-red-500">*</span>
                </label>
                <select
                  id="reg-class"
                  name="classLevel"
                  value={formData.classLevel}
                  onChange={handleChange}
                  disabled={busy}
                  className={`w-full px-4 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 bg-white transition-colors ${fieldErrors.classLevel ? 'border-red-400' : 'border-gray-300'}`}
                >
                  <option value="">Select class</option>
                  {[6, 7, 8, 9, 10, 11, 12].map((n) => (
                    <option key={n} value={String(n)}>Class {n}</option>
                  ))}
                </select>
                <FieldError msg={fieldErrors.classLevel} />
              </div>
            )}

            {/* Medium */}
            <div>
              <label htmlFor="reg-medium" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Medium of Instruction <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" style={{ width: '18px', height: '18px' }} />
                <select
                  id="reg-medium"
                  name="medium"
                  value={formData.medium}
                  onChange={handleChange}
                  disabled={busy}
                  className={`w-full pl-10 pr-4 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 bg-white transition-colors ${fieldErrors.medium ? 'border-red-400' : 'border-gray-300'}`}
                >
                  <option value="">Select medium</option>
                  <option value="English">English Medium</option>
                  <option value="Tamil">Tamil Medium</option>
                </select>
              </div>
              <FieldError msg={fieldErrors.medium} />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="reg-password" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" style={{ width: '18px', height: '18px' }} />
                <input
                  id="reg-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={busy}
                  placeholder="Minimum 8 characters"
                  className={`w-full pl-10 pr-11 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 transition-colors ${fieldErrors.password ? 'border-red-400' : 'border-gray-300'}`}
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
              {/* Password strength hint */}
              {formData.password && (
                <div className="mt-1.5 flex gap-1">
                  {[...Array(4)].map((_, i) => {
                    const strength = Math.min(
                      Math.floor(formData.password.length / 3) +
                      (/[A-Z]/.test(formData.password) ? 1 : 0) +
                      (/[0-9]/.test(formData.password) ? 1 : 0) +
                      (/[^A-Za-z0-9]/.test(formData.password) ? 1 : 0),
                      4
                    )
                    const colors = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-emerald-400']
                    return (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${i < strength ? colors[strength - 1] : 'bg-gray-200'}`}
                      />
                    )
                  })}
                </div>
              )}
              <FieldError msg={fieldErrors.password} />
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="reg-confirm-password" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" style={{ width: '18px', height: '18px' }} />
                <input
                  id="reg-confirm-password"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={busy}
                  placeholder="Re-enter your password"
                  className={`w-full pl-10 pr-11 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 transition-colors ${fieldErrors.confirmPassword ? 'border-red-400' : 'border-gray-300'}`}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? <EyeOff style={{ width: '18px', height: '18px' }} /> : <Eye style={{ width: '18px', height: '18px' }} />}
                </button>
              </div>
              <FieldError msg={fieldErrors.confirmPassword} />
            </div>

            {/* Phone (Optional) */}
            <div>
              <label htmlFor="reg-phone" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Phone Number <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" style={{ width: '18px', height: '18px' }} />
                <input
                  id="reg-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={busy}
                  placeholder="+91 98765 43210"
                  className={`w-full pl-10 pr-4 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 transition-colors ${fieldErrors.phone ? 'border-red-400' : 'border-gray-300'}`}
                />
              </div>
              <FieldError msg={fieldErrors.phone} />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-xl shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 mt-2"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              {busy ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          {/* Login link */}
          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
              Sign in
            </Link>
          </p>
        </div>

      </div>
    </div>
  )
}
