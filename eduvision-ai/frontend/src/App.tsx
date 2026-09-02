import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/AuthContext'

// Pages
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import StudentDashboard from './pages/student/Dashboard'
import TeacherDashboard from './pages/teacher/Dashboard'
import AdminDashboard from './pages/admin/Dashboard'

// ── Route Guards ───────────────────────────────────────────────────────────────

/** Redirects unauthenticated users to /login, preserving the attempted route. */
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-4">
            <div className="w-7 h-7 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
          <p className="text-sm text-gray-500 font-medium">Loading EduVision AI…</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

/** Blocks access if the authenticated user does not have the required role.
 *  Returns a 403 screen instead of silently redirecting. */
function RoleGate({ roles, children }: { roles: string[]; children: React.ReactNode }) {
  const { user } = useAuth()

  if (!user || !roles.includes(user.role)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center max-w-sm mx-auto px-6">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">403 — Access Denied</h1>
          <p className="text-sm text-gray-500 mb-6">
            You don't have permission to access this page. Please log in with the correct account.
          </p>
          <a
            href="/login"
            className="inline-block px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
          >
            Back to Login
          </a>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

/** Public-only gate: if already authenticated, redirect to role dashboard */
function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-4">
            <div className="w-7 h-7 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
          <p className="text-sm text-gray-500 font-medium">Loading EduVision AI…</p>
        </div>
      </div>
    )
  }

  if (isAuthenticated && user) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />
    if (user.role === 'teacher') return <Navigate to="/teacher" replace />
    return <Navigate to="/student" replace />
  }

  return <>{children}</>
}

// ── App ───────────────────────────────────────────────────────────────────────

function AppRoutes() {
  const { isAuthenticated, isLoading, user } = useAuth()

  return (
    <Routes>
      {/* Root: smart redirect */}
      <Route
        path="/"
        element={
          isLoading ? (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-4">
                  <div className="w-7 h-7 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                </div>
                <p className="text-sm text-gray-500 font-medium">Loading EduVision AI…</p>
              </div>
            </div>
          ) : isAuthenticated && user ? (
            user.role === 'admin' ? <Navigate to="/admin" replace /> :
            user.role === 'teacher' ? <Navigate to="/teacher" replace /> :
            <Navigate to="/student" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Public-only routes (redirect away if logged in) */}
      <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
      <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />

      {/* Legacy /dashboard → role-based redirect */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            {user?.role === 'admin' ? <Navigate to="/admin" replace /> :
             user?.role === 'teacher' ? <Navigate to="/teacher" replace /> :
             <Navigate to="/student" replace />}
          </PrivateRoute>
        }
      />
      <Route
        path="/dashboard/*"
        element={
          <PrivateRoute>
            {user?.role === 'admin' ? <Navigate to="/admin" replace /> :
             user?.role === 'teacher' ? <Navigate to="/teacher" replace /> :
             <Navigate to="/student" replace />}
          </PrivateRoute>
        }
      />

      {/* Protected role-based routes */}
      <Route
        path="/student/*"
        element={
          <PrivateRoute>
            <RoleGate roles={['student']}>
              <StudentDashboard />
            </RoleGate>
          </PrivateRoute>
        }
      />
      <Route
        path="/teacher/*"
        element={
          <PrivateRoute>
            <RoleGate roles={['teacher']}>
              <TeacherDashboard />
            </RoleGate>
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/*"
        element={
          <PrivateRoute>
            <RoleGate roles={['admin']}>
              <AdminDashboard />
            </RoleGate>
          </PrivateRoute>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  )
}

export default App
