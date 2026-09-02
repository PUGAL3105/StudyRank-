/**
 * EduVision AI — Student Portal Shell
 * Dedicated to Tamil Nadu State Board Exam Practice & Preparation
 */

import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { StudentExamPortal } from './StudentExamPortal'
import { Award, LogOut } from 'lucide-react'

export default function StudentApp() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Header Navigation */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-xs">
              S
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-gray-900">
                StudyRank <span className="text-indigo-600">AI</span>
              </span>
              <span className="block text-[11px] text-gray-500 font-semibold tracking-wide">
                State Board Exam Practice, Evaluation & Ranking
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-full text-xs font-bold text-indigo-700 border border-indigo-100">
              <Award className="w-3.5 h-3.5 text-indigo-600" />
              <span>{user?.name || 'Demo Student'}</span>
              <span className="text-indigo-400">({user?.role || 'Student'})</span>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 py-6">
        <StudentExamPortal />
      </main>
    </div>
  )
}
