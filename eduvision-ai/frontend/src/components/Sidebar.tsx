import { Home, HelpCircle, BookOpen, BarChart3, Bookmark, Users, FileText, Settings, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

interface SidebarProps {
  activeTab?: string
  onSelectTab?: (tab: string) => void
}

export default function Sidebar({ activeTab = 'dashboard', onSelectTab }: SidebarProps) {
  const { user } = useAuth()
  const role = user?.role || 'student'

  const studentLinks = [
    { id: 'dashboard', label: 'Ask Question', icon: HelpCircle },
    { id: 'recent', label: 'Recent Lessons', icon: Home },
    { id: 'quizzes', label: 'Practice Quizzes', icon: BarChart3 },
    { id: 'saved', label: 'Saved Materials', icon: Bookmark },
  ]

  const teacherLinks = [
    { id: 'dashboard', label: 'Textbooks Catalog', icon: BookOpen },
    { id: 'upload', label: 'Upload Textbook', icon: FileText },
    { id: 'reviews', label: 'Student Questions', icon: HelpCircle },
  ]

  const adminLinks = [
    { id: 'dashboard', label: 'Platform Overview', icon: BarChart3 },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'books', label: 'Textbooks & RAG Index', icon: BookOpen },
    { id: 'security', label: 'Security & Access', icon: ShieldCheck },
    { id: 'settings', label: 'System Settings', icon: Settings },
  ]

  const navLinks = role === 'admin' ? adminLinks : role === 'teacher' ? teacherLinks : studentLinks

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between hidden lg:flex">
      <div className="space-y-1">
        <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
          {role.toUpperCase()} NAVIGATION
        </div>
        {navLinks.map((item) => {
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab && onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary-50 text-primary-700 font-semibold shadow-xs'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <item.icon className={`w-4 h-4 ${isActive ? 'text-primary-600' : 'text-gray-500'}`} />
              {item.label}
            </button>
          )
        })}
      </div>

      <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
        <p className="text-xs font-bold text-gray-800">EduVision AI v1.0</p>
        <p className="text-[11px] text-gray-500 mt-0.5">NCERT Grounded Curriculum</p>
      </div>
    </aside>
  )
}
