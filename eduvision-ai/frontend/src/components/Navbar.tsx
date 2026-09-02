import { BookOpen, LogOut, Menu, X, ShieldCheck, User as UserIcon } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

interface NavbarProps {
  onToggleSidebar?: () => void
}

export default function Navbar({ onToggleSidebar }: NavbarProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const getRoleBadge = () => {
    if (user?.role === 'admin') {
      return { label: 'Admin Portal', color: 'bg-gray-900 text-white border-gray-800' }
    }
    if (user?.role === 'teacher') {
      return { label: 'Teacher Portal', color: 'bg-secondary-50 text-secondary-800 border-secondary-200' }
    }
    return { label: 'Student Workspace', color: 'bg-primary-50 text-primary-800 border-primary-200' }
  }

  const roleBadge = getRoleBadge()

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Brand Logo & Mobile Toggle */}
          <div className="flex items-center gap-3">
            {onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
                title="Toggle Sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            <div
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2.5 cursor-pointer"
            >
              <div className="p-2 bg-primary-600 rounded-lg text-white shadow-sm">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-gray-900 tracking-tight">
                EduVision <span className="text-primary-600">AI</span>
              </span>
            </div>
          </div>

          {/* Desktop Right: Profile Info & Actions */}
          <div className="hidden sm:flex items-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${roleBadge.color}`}>
              {user?.role === 'admin' ? (
                <ShieldCheck className="w-3.5 h-3.5 text-accent-400" />
              ) : (
                <UserIcon className="w-3.5 h-3.5" />
              )}
              {user?.name || 'User'} ({roleBadge.label})
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3.5 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="sm:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-gray-200 bg-white px-4 pt-3 pb-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-900">{user?.name}</span>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${roleBadge.color}`}>
              {roleBadge.label}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 bg-red-50 rounded-lg font-medium"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      )}
    </nav>
  )
}
