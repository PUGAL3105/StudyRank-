/**
 * StudyRank AI — Professional Student Portal Shell
 * Matches the Dark Sidebar Layout & Mobile-Responsive Design
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { StudentExamPortal } from './StudentExamPortal'
import {
  LayoutDashboard,
  GraduationCap,
  CheckCircle2,
  Edit3,
  FileText,
  Trophy,
  Award,
  Settings,
  LogOut,
  Flame,
  Target,
  Menu,
  X,
  BookOpen,
  Bot,
} from 'lucide-react'

export type PortalSection =
  | 'DASHBOARD'
  | 'CLASS_SELECT'
  | 'MCQ_PORTAL'
  | 'DESCRIPTIVE_PORTAL'
  | 'PAPERS_PORTAL'
  | 'RESULTS_PORTAL'
  | 'LEADERBOARD_PORTAL'
  | 'AI_TUTOR_PORTAL'
  | 'LIVE_MCQ_EXAM'
  | 'LIVE_DESC_EXAM'
  | 'RESULT_DETAIL_PAGE'

export default function StudentApp() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [activeSection, setActiveSection] = useState<PortalSection>('DASHBOARD')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navItems = [
    { id: 'DASHBOARD' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'CLASS_SELECT' as const, label: 'Class & Curriculum', icon: GraduationCap },
    { id: 'MCQ_PORTAL' as const, label: '1-Mark MCQ Exam', icon: CheckCircle2 },
    { id: 'DESCRIPTIVE_PORTAL' as const, label: '2M / 3M / 5M Drills', icon: Edit3 },
    { id: 'PAPERS_PORTAL' as const, label: 'Model Papers', icon: FileText },
    { id: 'RESULTS_PORTAL' as const, label: 'Exam Results', icon: Trophy },
    { id: 'LEADERBOARD_PORTAL' as const, label: 'Leaderboard', icon: Award },
    { id: 'AI_TUTOR_PORTAL' as const, label: 'AI Doubt Studio', icon: Bot },
  ]

  const handleNavClick = (section: PortalSection) => {
    setActiveSection(section)
    setIsMobileMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-slate-900 flex font-sans selection:bg-indigo-500 selection:text-white">
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* DESKTOP DARK SIDEBAR (Matching Mockup Screenshot) */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-64 xl:w-72 bg-[#191735] text-white shrink-0 sticky top-0 h-screen z-30 shadow-2xl border-r border-indigo-950/50 justify-between">
        <div className="p-5 flex flex-col h-full overflow-y-auto scrollbar-none">
          {/* Brand Header */}
          <div className="flex items-center gap-3 px-2 py-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#5B4DFB] flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 font-black text-lg">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                StudyRank <span className="text-[#818CF8]">AI</span>
              </h1>
              <span className="text-[10px] text-indigo-300/70 font-semibold tracking-wider uppercase block">
                Centum Exam Portal
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5 flex-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive =
                activeSection === item.id ||
                (item.id === 'MCQ_PORTAL' && activeSection === 'LIVE_MCQ_EXAM') ||
                (item.id === 'DESCRIPTIVE_PORTAL' && activeSection === 'LIVE_DESC_EXAM') ||
                (item.id === 'RESULTS_PORTAL' && activeSection === 'RESULT_DETAIL_PAGE')

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all text-left cursor-pointer ${
                    isActive
                      ? 'bg-[#5B4DFB] text-white shadow-lg shadow-indigo-600/30'
                      : 'text-indigo-200/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-indigo-300/60'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              )
            })}
          </nav>

          {/* User Profile Card & Settings Footer */}
          <div className="pt-4 border-t border-indigo-900/60 space-y-3 mt-4">
            {/* Student Profile Pill */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-orange-500 text-amber-950 font-black flex items-center justify-center text-sm shadow-md shrink-0">
                🏆
              </div>
              <div className="overflow-hidden">
                <h4 className="text-xs font-bold text-white truncate">
                  {user?.name || 'Demo Student'}
                </h4>
                <span className="text-[10px] text-indigo-300/70 block truncate">Class 12 • Centum Rank #4</span>
              </div>
            </div>

            {/* Settings & Logout Actions */}
            <div className="flex items-center justify-between px-2 pt-1 text-xs">
              <button
                onClick={() => handleNavClick('CLASS_SELECT')}
                className="flex items-center gap-2 text-indigo-300/70 hover:text-white transition font-medium cursor-pointer"
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-rose-400 hover:text-rose-300 transition font-medium cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MOBILE DRAWER SIDEBAR */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex animate-in fade-in duration-150">
          <div className="w-72 max-w-[80vw] bg-[#191735] text-white h-full flex flex-col justify-between p-5 shadow-2xl animate-in slide-in-from-left duration-200">
            <div>
              {/* Header with Close Button */}
              <div className="flex items-center justify-between pb-4 border-b border-indigo-900/60 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#5B4DFB] flex items-center justify-center text-white font-bold">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <span className="font-black text-white text-base">
                    StudyRank <span className="text-[#818CF8]">AI</span>
                  </span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation */}
              <nav className="space-y-1.5 overflow-y-auto max-h-[65vh]">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = activeSection === item.id

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition text-left cursor-pointer ${
                        isActive
                          ? 'bg-[#5B4DFB] text-white shadow-md'
                          : 'text-indigo-200/70 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  )
                })}
              </nav>
            </div>

            {/* Mobile Footer */}
            <div className="pt-4 border-t border-indigo-900/60 space-y-3">
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5">
                <div className="w-8 h-8 rounded-lg bg-amber-400 text-amber-950 font-bold flex items-center justify-center text-xs">
                  🏆
                </div>
                <div className="truncate text-xs">
                  <span className="font-bold text-white block">{user?.name || 'Demo Student'}</span>
                  <span className="text-[10px] text-indigo-300">Class 12 Centum</span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full py-2 bg-rose-600/20 text-rose-300 hover:bg-rose-600 hover:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>

          <div className="flex-1" onClick={() => setIsMobileMenuOpen(false)} />
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MAIN VIEWPORT (Top Header + Dedicated Section Pages) */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-8">
        {/* Top Floating App Bar */}
        <header className="bg-white/95 backdrop-blur-md border-b border-gray-200/80 sticky top-0 z-20 px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 shadow-2xs">
          {/* Left: Mobile Hamburger & Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl text-gray-700 hover:bg-gray-100 transition cursor-pointer"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="lg:hidden flex items-center gap-1.5">
              <span className="font-black text-sm sm:text-base text-gray-900">
                StudyRank <span className="text-[#5B4DFB]">AI</span>
              </span>
            </div>
          </div>

          {/* Right: Activity Stats Pills (Matches Screenshot) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Streak Counter Pill */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FFF7ED] border border-[#FFEDD5] text-[#C2410C] text-xs font-bold shadow-2xs">
              <Flame className="w-4 h-4 text-[#F97316] fill-[#F97316]" />
              <span className="whitespace-nowrap">5 Day Streak</span>
            </div>

            {/* Daily Goal Pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EEF2FF] border border-[#E0E7FF] text-[#4338CA] text-xs font-bold shadow-2xs">
              <Target className="w-4 h-4 text-[#4F46E5]" />
              <span className="whitespace-nowrap">Goal: 14/20 MCQs</span>
            </div>

            {/* Profile Avatar Pill */}
            <div
              onClick={() => handleNavClick('CLASS_SELECT')}
              className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-gray-100 hover:bg-gray-200 border border-gray-200 text-xs font-bold text-gray-800 transition cursor-pointer"
            >
              <div className="w-6 h-6 rounded-full bg-[#5B4DFB] text-white flex items-center justify-center text-[10px] font-bold">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
              </div>
              <span className="hidden md:inline max-w-[100px] truncate">{user?.name || 'Demo Student'}</span>
            </div>
          </div>
        </header>

        {/* Content Container */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8">
          <StudentExamPortal
            activeSection={activeSection}
            setActiveSection={setActiveSection}
          />
        </main>

        {/* ───────────────────────────────────────────────────────────────── */}
        {/* MOBILE BOTTOM NAVIGATION BAR (Instant 1-Tap Switching on Phones) */}
        {/* ───────────────────────────────────────────────────────────────── */}
        <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-gray-200 px-2 py-1.5 z-40 flex items-center justify-around shadow-lg">
          <button
            onClick={() => handleNavClick('DASHBOARD')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] font-bold transition ${
              activeSection === 'DASHBOARD' ? 'text-[#5B4DFB]' : 'text-gray-500'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Home</span>
          </button>

          <button
            onClick={() => handleNavClick('MCQ_PORTAL')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] font-bold transition ${
              activeSection === 'MCQ_PORTAL' || activeSection === 'LIVE_MCQ_EXAM'
                ? 'text-[#5B4DFB]'
                : 'text-gray-500'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>1-Mark</span>
          </button>

          <button
            onClick={() => handleNavClick('DESCRIPTIVE_PORTAL')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] font-bold transition ${
              activeSection === 'DESCRIPTIVE_PORTAL' || activeSection === 'LIVE_DESC_EXAM'
                ? 'text-[#5B4DFB]'
                : 'text-gray-500'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>2/3/5M</span>
          </button>

          <button
            onClick={() => handleNavClick('PAPERS_PORTAL')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] font-bold transition ${
              activeSection === 'PAPERS_PORTAL' ? 'text-[#5B4DFB]' : 'text-gray-500'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Papers</span>
          </button>

          <button
            onClick={() => handleNavClick('RESULTS_PORTAL')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] font-bold transition ${
              activeSection === 'RESULTS_PORTAL' || activeSection === 'RESULT_DETAIL_PAGE'
                ? 'text-[#5B4DFB]'
                : 'text-gray-500'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Results</span>
          </button>
        </div>
      </div>
    </div>
  )
}
