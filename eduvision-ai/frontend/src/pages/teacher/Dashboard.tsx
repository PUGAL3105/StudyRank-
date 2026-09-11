/**
 * StudyRank AI — Professional Teacher Portal Shell
 * Matches the Dark Sidebar Layout & StudentApp Theme
 */

import React, { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  Award,
  CheckCircle2,
  FileText,
  Users,
  BarChart3,
  BookOpen,
  LogOut,
  Menu,
  X,
  Plus,
  Radio,
  Search,
  ChevronRight,
  TrendingUp,
  Sparkles,
  AlertTriangle,
  Clock,
  Trash2,
  Trophy,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../../api/client'
import { AssignmentItem, TeacherStudentItem, ClassItem, SubjectItem, TermItem, ChapterItem } from '../../types'
import { TeacherStudentEvaluationView } from '../../components/TeacherStudentEvaluationView'
import { TeacherExamStudio } from '../../components/TeacherExamStudio'
import { ExamPaperGeneratorModal } from '../../components/ExamPaperGeneratorModal'
import { TeacherLiveClassroomModal } from '../../components/TeacherLiveClassroomModal'

export type TeacherSection =
  | 'OVERVIEW'
  | 'EVALUATION'
  | 'EXAM_STUDIO'
  | 'ASSIGNMENTS'
  | 'STUDENTS'
  | 'ANALYTICS'

export default function TeacherDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [activeSection, setActiveSection] = useState<TeacherSection>('OVERVIEW')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false)

  const [, setLoading] = useState<boolean>(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [showExamModal, setShowExamModal] = useState<boolean>(false)
  const [showLiveClassModal, setShowLiveClassModal] = useState<boolean>(false)

  // Stats & Data
  const [stats, setStats] = useState<any>(null)
  const [assignments, setAssignments] = useState<AssignmentItem[]>([])
  const [students, setStudents] = useState<TeacherStudentItem[]>([])

  // Create Assignment Modal State
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false)
  const [title, setTitle] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [dueDate, setDueDate] = useState<string>('')

  const [classesList, setClassesList] = useState<ClassItem[]>([])
  const [subjectsList, setSubjectsList] = useState<SubjectItem[]>([])
  const [termsList, setTermsList] = useState<TermItem[]>([])
  const [chaptersList, setChaptersList] = useState<ChapterItem[]>([])

  const [selectedClassId, setSelectedClassId] = useState<string>('c-10')
  const [selectedMedium, setSelectedMedium] = useState<'English' | 'Tamil'>('English')
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('sub-10-sci')
  const [selectedTermId, setSelectedTermId] = useState<string>('trm-10sci-1')
  const [selectedChapterId, setSelectedChapterId] = useState<string>('ch-10sci-t1-1')
  const [creatingAssignment, setCreatingAssignment] = useState<boolean>(false)

  // Student Search
  const [studentSearch, setStudentSearch] = useState<string>('')

  const navItems = [
    { id: 'OVERVIEW' as const, label: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'EVALUATION' as const, label: 'Student Results & Evaluation', icon: Award, badge: 'New' },
    { id: 'EXAM_STUDIO' as const, label: 'Exam Authoring Studio', icon: FileText },
    { id: 'ASSIGNMENTS' as const, label: 'Homework & Assignments', icon: CheckCircle2 },
    { id: 'STUDENTS' as const, label: 'Class Students Roster', icon: Users },
    { id: 'ANALYTICS' as const, label: 'Class Centum Analytics', icon: BarChart3 },
  ]

  useEffect(() => {
    loadDashboardData()
    loadCurriculumData()
  }, [])

  useEffect(() => {
    if (selectedClassId) {
      loadSubjectsForClass(selectedClassId, selectedMedium)
    }
  }, [selectedClassId, selectedMedium])

  useEffect(() => {
    if (selectedSubjectId) {
      loadTermsForSubject(selectedSubjectId)
    }
  }, [selectedSubjectId])

  useEffect(() => {
    if (selectedTermId) {
      loadChaptersForTerm(selectedTermId)
    }
  }, [selectedTermId])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const [stData, asgData, stuData] = await Promise.allSettled([
        apiClient.getTeacherStats(),
        apiClient.getTeacherAssignments(),
        apiClient.getTeacherStudents(),
      ])

      if (stData.status === 'fulfilled') setStats(stData.value)
      if (asgData.status === 'fulfilled') setAssignments(asgData.value || [])
      if (stuData.status === 'fulfilled') setStudents(stuData.value || [])
    } catch {
      setErrorMsg('Failed to load dashboard data.')
    } finally {
      setLoading(false)
    }
  }

  const loadCurriculumData = async () => {
    try {
      const classes = await apiClient.getClasses()
      setClassesList(classes)
      if (classes.length > 0) {
        const defaultClass = classes.find((c) => c.id === 'c-10') || classes[0]
        setSelectedClassId(defaultClass.id)
      }
    } catch {
      // fallback
    }
  }

  const loadSubjectsForClass = async (classId: string, medium: 'English' | 'Tamil') => {
    try {
      const subs = await apiClient.getSubjectsByClassAndMedium(classId, medium)
      setSubjectsList(subs)
      if (subs.length > 0) {
        const defSub = subs.find((s) => s.id === 'sub-10-sci') || subs[0]
        setSelectedSubjectId(defSub.id)
      }
    } catch {
      setSubjectsList([])
    }
  }

  const loadTermsForSubject = async (subjectId: string) => {
    try {
      const terms = await apiClient.getTermsBySubject(subjectId)
      setTermsList(terms)
      if (terms.length > 0) {
        setSelectedTermId(terms[0].id)
      }
    } catch {
      setTermsList([])
    }
  }

  const loadChaptersForTerm = async (termId: string) => {
    try {
      const chaps = await apiClient.getChaptersByTerm(termId)
      setChaptersList(chaps)
      if (chaps.length > 0) {
        setSelectedChapterId(chaps[0].id)
      }
    } catch {
      setChaptersList([])
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleNavClick = (section: TeacherSection) => {
    setActiveSection(section)
    setIsMobileMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setErrorMsg('Please enter an assignment title.')
      return
    }

    setCreatingAssignment(true)
    setErrorMsg(null)

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        class_level: selectedClassId === 'c-10' ? 'Class 10' : selectedClassId,
        medium: selectedMedium,
        subject_id: selectedSubjectId,
        term_id: selectedTermId,
        chapter_id: selectedChapterId,
        due_date: dueDate || '2026-08-30',
      }

      await apiClient.createTeacherAssignment(payload)
      setSuccessMsg(`Assignment "${title}" created successfully!`)
      setShowCreateModal(false)
      setTitle('')
      setDescription('')
      setDueDate('')

      const updatedAsg = await apiClient.getTeacherAssignments()
      setAssignments(updatedAsg)
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || err.response?.data?.error || 'Failed to create assignment.')
    } finally {
      setCreatingAssignment(false)
    }
  }

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return
    try {
      await apiClient.deleteTeacherAssignment(assignmentId)
      setAssignments(assignments.filter((a) => a.id !== assignmentId))
      setSuccessMsg('Assignment deleted successfully.')
    } catch {
      setErrorMsg('Failed to delete assignment.')
    }
  }

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.email.toLowerCase().includes(studentSearch.toLowerCase()) ||
      (s.class && s.class.toLowerCase().includes(studentSearch.toLowerCase()))
  )

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-slate-900 flex font-sans selection:bg-indigo-500 selection:text-white">
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* DESKTOP DARK SIDEBAR (Matches StudentApp Aesthetic) */}
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
                Teacher Command Studio
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5 flex-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeSection === item.id

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all text-left cursor-pointer ${
                    isActive
                      ? 'bg-[#5B4DFB] text-white shadow-lg shadow-indigo-600/30'
                      : 'text-indigo-200/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3.5 truncate">
                    <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-indigo-300/60'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 text-[9px] font-black uppercase rounded-md bg-amber-400 text-amber-950">
                      {item.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          {/* Teacher Profile Card & Logout Footer */}
          <div className="pt-4 border-t border-indigo-900/60 space-y-3 mt-4">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white font-black flex items-center justify-center text-sm shadow-md shrink-0">
                👨‍🏫
              </div>
              <div className="overflow-hidden">
                <h4 className="text-xs font-bold text-white truncate">{user?.name || 'Demo Teacher'}</h4>
                <span className="text-[10px] text-indigo-300/70 block truncate">State Board Senior Faculty</span>
              </div>
            </div>

            <div className="flex items-center justify-between px-2 pt-1 text-xs">
              <button
                onClick={() => handleNavClick('OVERVIEW')}
                className="text-indigo-300/70 hover:text-white transition font-medium cursor-pointer"
              >
                Teacher Portal v2.0
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

              <nav className="space-y-1.5 overflow-y-auto max-h-[65vh]">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = activeSection === item.id

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition text-left cursor-pointer ${
                        isActive ? 'bg-[#5B4DFB] text-white shadow-md' : 'text-indigo-200/70 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="px-1.5 py-0.5 text-[8px] font-black uppercase rounded bg-amber-400 text-amber-950">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  )
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-indigo-900/60 space-y-3">
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500 text-white font-bold flex items-center justify-center text-xs">
                  👨‍🏫
                </div>
                <div className="truncate text-xs">
                  <span className="font-bold text-white block">{user?.name || 'Demo Teacher'}</span>
                  <span className="text-[10px] text-indigo-300">Teacher Studio</span>
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
      {/* MAIN VIEWPORT */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-8">
        {/* Top App Bar */}
        <header className="bg-white/95 backdrop-blur-md border-b border-gray-200/80 sticky top-0 z-20 px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl text-gray-700 hover:bg-gray-100 transition cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="lg:hidden flex items-center gap-1.5">
              <span className="font-black text-sm sm:text-base text-gray-900">
                StudyRank <span className="text-[#5B4DFB]">Teacher Studio</span>
              </span>
            </div>
            <div className="hidden lg:flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-[#5B4DFB] text-xs font-bold">
                Tamil Nadu State Board Curriculum Evaluation Hub
              </span>
            </div>
          </div>

          {/* Quick Header Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setShowExamModal(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#EEF2FF] border border-[#E0E7FF] text-[#4338CA] hover:bg-[#E0E7FF] text-xs font-bold transition cursor-pointer shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#5B4DFB]" />
              <span>Generate Board Paper</span>
            </button>

            <button
              onClick={() => setShowLiveClassModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 text-xs font-bold transition cursor-pointer shadow-2xs"
            >
              <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              <span>Live Class</span>
            </button>

            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-gray-100 border border-gray-200 text-xs font-bold text-gray-800">
              <div className="w-6 h-6 rounded-full bg-[#5B4DFB] text-white flex items-center justify-center text-[10px] font-bold">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'T'}
              </div>
              <span className="hidden md:inline max-w-[100px] truncate">{user?.name || 'Demo Teacher'}</span>
            </div>
          </div>
        </header>

        {/* Content Container */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 space-y-6">
          {/* Notifications */}
          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-rose-800 text-xs font-bold">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
              <button onClick={() => setErrorMsg(null)} className="text-rose-600 hover:text-rose-800">
                Dismiss
              </button>
            </div>
          )}

          {successMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-800 text-xs font-bold">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
              <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-800">
                Dismiss
              </button>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* SECTION 1: OVERVIEW */}
          {/* ───────────────────────────────────────────────────────────── */}
          {activeSection === 'OVERVIEW' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Hero Banner */}
              <div className="bg-gradient-to-r from-[#191735] via-[#221D4E] to-[#393184] rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-900/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-bold">
                    <span>Tamil Nadu State Board Academic Studio • 2024–2025</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                    Welcome back, {user?.name || 'Faculty'}! 🎓
                  </h2>
                  <p className="text-xs sm:text-sm text-indigo-200/80 max-w-2xl">
                    Manage your curriculum assessments, inspect student answers against official state board rubrics, and deliver Centum-grade results.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => handleNavClick('EVALUATION')}
                    className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#5B4DFB] hover:bg-[#4939f8] text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition cursor-pointer"
                  >
                    <Award className="w-4 h-4" />
                    <span>Evaluate Submissions</span>
                  </button>
                  <button
                    onClick={() => handleNavClick('EXAM_STUDIO')}
                    className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition cursor-pointer border border-white/10"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Author Exams</span>
                  </button>
                </div>
              </div>

              {/* Key Metrics Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
                <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Students Enrolled</span>
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-gray-900">{stats?.totalStudents || 28}</div>
                  <div className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> 100% Active Attendance
                  </div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Papers Evaluated</span>
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 text-[#5B4DFB] flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-gray-900">{stats?.totalSubmissions || 42}</div>
                  <div className="text-[11px] text-indigo-600 font-bold">AI Evaluated with Rubrics</div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Assignments</span>
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                      <BookOpen className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-gray-900">{assignments.length || 6}</div>
                  <div className="text-[11px] text-amber-700 font-bold">Class 9 to 12 Active</div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Average Centum Score</span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Trophy className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-700">84.2%</div>
                  <div className="text-[11px] text-emerald-700 font-bold">Top Quartile State Level</div>
                </div>
              </div>

              {/* Quick Actions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div
                  onClick={() => handleNavClick('EVALUATION')}
                  className="bg-white p-6 rounded-3xl border border-gray-200 hover:border-indigo-300 transition shadow-2xs cursor-pointer group space-y-3"
                >
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-[#5B4DFB] flex items-center justify-center group-hover:scale-110 transition">
                    <Award className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900">Student Results & Answer Review</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Check question-by-question student answers, verify AI marks against state board rubrics, and override marks.
                  </p>
                  <div className="flex items-center gap-1 text-xs font-bold text-[#5B4DFB] pt-1">
                    <span>Inspect submissions</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                <div
                  onClick={() => handleNavClick('EXAM_STUDIO')}
                  className="bg-white p-6 rounded-3xl border border-gray-200 hover:border-indigo-300 transition shadow-2xs cursor-pointer group space-y-3"
                >
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900">AI Exam Paper Authoring</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Generate balanced state board test papers with 1M, 2M, 3M, and 5M questions and publish directly.
                  </p>
                  <div className="flex items-center gap-1 text-xs font-bold text-blue-600 pt-1">
                    <span>Open Exam Studio</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                <div
                  onClick={() => setShowLiveClassModal(true)}
                  className="bg-white p-6 rounded-3xl border border-gray-200 hover:border-indigo-300 transition shadow-2xs cursor-pointer group space-y-3"
                >
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition">
                    <Radio className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900">Live Virtual Classroom</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Launch interactive whiteboard sessions, broadcast formulas, theorems, and live question solving.
                  </p>
                  <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 pt-1">
                    <span>Start Live Stream</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* SECTION 2: STUDENT EVALUATION & ANSWER CHECKING */}
          {/* ───────────────────────────────────────────────────────────── */}
          {activeSection === 'EVALUATION' && (
            <div className="animate-in fade-in duration-200">
              <TeacherStudentEvaluationView />
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* SECTION 3: EXAM AUTHORING STUDIO */}
          {/* ───────────────────────────────────────────────────────────── */}
          {activeSection === 'EXAM_STUDIO' && (
            <div className="animate-in fade-in duration-200">
              <TeacherExamStudio />
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* SECTION 4: HOMEWORK & ASSIGNMENTS */}
          {/* ───────────────────────────────────────────────────────────── */}
          {activeSection === 'ASSIGNMENTS' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-gray-900">Class Assignments & Homework</h3>
                  <p className="text-xs text-gray-500">
                    Create textbook-grounded homework and track student completion.
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#5B4DFB] hover:bg-[#4939f8] text-white rounded-2xl text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Assignment</span>
                </button>
              </div>

              {/* Create Assignment Modal */}
              {showCreateModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                      <h4 className="text-base font-bold text-gray-900">Create New Assignment</h4>
                      <button onClick={() => setShowCreateModal(false)} className="p-1 rounded-lg hover:bg-gray-100">
                        <X className="w-5 h-5 text-gray-500" />
                      </button>
                    </div>

                    <form onSubmit={handleCreateAssignment} className="space-y-4 text-xs">
                      <div>
                        <label className="font-bold text-gray-700 block mb-1">Title</label>
                        <input
                          type="text"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="e.g. Unit 2 Botany Key Derivations"
                          className="w-full p-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="font-bold text-gray-700 block mb-1">Description & Instructions</label>
                        <textarea
                          rows={3}
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Instructions for students..."
                          className="w-full p-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="font-bold text-gray-700 block mb-1">Class</label>
                          <select
                            value={selectedClassId}
                            onChange={(e) => setSelectedClassId(e.target.value)}
                            className="w-full p-2.5 border border-gray-300 rounded-xl outline-none"
                          >
                            {classesList.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.class_name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="font-bold text-gray-700 block mb-1">Medium</label>
                          <select
                            value={selectedMedium}
                            onChange={(e) => setSelectedMedium(e.target.value as any)}
                            className="w-full p-2.5 border border-gray-300 rounded-xl outline-none"
                          >
                            <option value="English">English</option>
                            <option value="Tamil">Tamil (தமிழ்)</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="font-bold text-gray-700 block mb-1">Subject</label>
                          <select
                            value={selectedSubjectId}
                            onChange={(e) => setSelectedSubjectId(e.target.value)}
                            className="w-full p-2.5 border border-gray-300 rounded-xl outline-none"
                          >
                            {subjectsList.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.subject_name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="font-bold text-gray-700 block mb-1">Due Date</label>
                          <input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="w-full p-2.5 border border-gray-300 rounded-xl outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="font-bold text-gray-700 block mb-1">Term</label>
                          <select
                            value={selectedTermId}
                            onChange={(e) => setSelectedTermId(e.target.value)}
                            className="w-full p-2.5 border border-gray-300 rounded-xl outline-none"
                          >
                            {termsList.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.term_name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="font-bold text-gray-700 block mb-1">Chapter</label>
                          <select
                            value={selectedChapterId}
                            onChange={(e) => setSelectedChapterId(e.target.value)}
                            className="w-full p-2.5 border border-gray-300 rounded-xl outline-none"
                          >
                            {chaptersList.map((ch) => (
                              <option key={ch.id} value={ch.id}>
                                {ch.chapter_name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                        <button
                          type="button"
                          onClick={() => setShowCreateModal(false)}
                          className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-bold"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={creatingAssignment}
                          className="px-5 py-2 bg-[#5B4DFB] hover:bg-[#4939f8] text-white rounded-xl font-bold shadow-md transition disabled:opacity-50"
                        >
                          {creatingAssignment ? 'Creating...' : 'Create Assignment'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Assignment Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {assignments.map((asg) => (
                  <div key={asg.id} className="bg-white p-5 rounded-3xl border border-gray-200 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-[#5B4DFB]">
                        {asg.class_level} • {asg.medium}
                      </span>
                      <button
                        onClick={() => handleDeleteAssignment(asg.id)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 transition"
                        title="Delete Assignment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <h4 className="text-sm font-bold text-gray-900">{asg.title}</h4>
                    <p className="text-xs text-gray-500 line-clamp-2">{asg.description}</p>
                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Due: {asg.due_date || 'N/A'}
                      </span>
                      <span className="font-bold text-emerald-600">Active</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* SECTION 5: STUDENTS ROSTER */}
          {/* ───────────────────────────────────────────────────────────── */}
          {activeSection === 'STUDENTS' && (
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-gray-900">Enrolled Students Roster</h3>
                  <p className="text-xs text-gray-500">Class 9 to 12 student list with scores and progress.</p>
                </div>
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Search students..."
                    className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none w-60"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      <th className="pb-3 px-3">Student Name</th>
                      <th className="pb-3 px-3">Class</th>
                      <th className="pb-3 px-3">Medium</th>
                      <th className="pb-3 px-3">Completed Quizzes</th>
                      <th className="pb-3 px-3">Avg Score</th>
                      <th className="pb-3 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs sm:text-sm">
                    {filteredStudents.map((stu) => (
                      <tr key={stu.id} className="hover:bg-gray-50/80 transition">
                        <td className="py-3 px-3 font-bold text-gray-900 flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                            {stu.name.charAt(0)}
                          </div>
                          <span>{stu.name}</span>
                        </td>
                        <td className="py-3 px-3 text-gray-700">{stu.class}</td>
                        <td className="py-3 px-3 text-gray-700">{stu.medium}</td>
                        <td className="py-3 px-3 text-gray-700">{stu.quizAttempts || 0} Quizzes</td>
                        <td className="py-3 px-3 font-bold text-emerald-600">{stu.avgScore || '88%'}</td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => handleNavClick('EVALUATION')}
                            className="text-xs font-bold text-[#5B4DFB] hover:underline"
                          >
                            View Submissions
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* SECTION 6: ANALYTICS */}
          {/* ───────────────────────────────────────────────────────────── */}
          {activeSection === 'ANALYTICS' && (
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-6 animate-in fade-in duration-200">
              <h3 className="text-lg font-black text-gray-900">Class Performance & Centum Analytics</h3>
              <p className="text-xs text-gray-500">
                Detailed insights on question bank coverage, accuracy rates, and difficult topics.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div className="p-5 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-3">
                  <h4 className="text-sm font-bold text-indigo-950">Subject-wise Mastery Rate</h4>
                  <div className="space-y-2">
                    {[
                      { name: 'Biology', rate: 92 },
                      { name: 'Physics', rate: 84 },
                      { name: 'Chemistry', rate: 86 },
                      { name: 'Mathematics', rate: 88 },
                      { name: 'General Tamil (பொதுத்தமிழ்)', rate: 94 },
                      { name: 'Computer Science', rate: 90 },
                    ].map((item) => (
                      <div key={item.name} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold text-gray-700">
                          <span>{item.name}</span>
                          <span>{item.rate}%</span>
                        </div>
                        <div className="w-full h-2 bg-indigo-200/60 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#5B4DFB] rounded-full transition-all duration-500"
                            style={{ width: `${item.rate}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-3">
                  <h4 className="text-sm font-bold text-emerald-950">Question Tier Accuracy</h4>
                  <div className="space-y-3 pt-2">
                    <div className="p-3 bg-white rounded-xl border border-emerald-200 flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-800">1-Mark MCQ Arena</span>
                      <span className="text-xs font-black text-emerald-700">89.4% Accuracy</span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-emerald-200 flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-800">2-Mark Definitions & Laws</span>
                      <span className="text-xs font-black text-emerald-700">86.2% Accuracy</span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-emerald-200 flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-800">3-Mark Problem Solving</span>
                      <span className="text-xs font-black text-emerald-700">81.5% Accuracy</span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-emerald-200 flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-800">5-Mark Essays & Either-Or</span>
                      <span className="text-xs font-black text-emerald-700">85.0% Accuracy</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* ───────────────────────────────────────────────────────────────── */}
        {/* MOBILE BOTTOM NAVIGATION BAR */}
        {/* ───────────────────────────────────────────────────────────────── */}
        <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-gray-200 px-2 py-1.5 z-40 flex items-center justify-around shadow-lg">
          <button
            onClick={() => handleNavClick('OVERVIEW')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] font-bold transition ${
              activeSection === 'OVERVIEW' ? 'text-[#5B4DFB]' : 'text-gray-500'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Home</span>
          </button>

          <button
            onClick={() => handleNavClick('EVALUATION')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] font-bold transition ${
              activeSection === 'EVALUATION' ? 'text-[#5B4DFB]' : 'text-gray-500'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Results</span>
          </button>

          <button
            onClick={() => handleNavClick('EXAM_STUDIO')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] font-bold transition ${
              activeSection === 'EXAM_STUDIO' ? 'text-[#5B4DFB]' : 'text-gray-500'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Exams</span>
          </button>

          <button
            onClick={() => handleNavClick('ASSIGNMENTS')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] font-bold transition ${
              activeSection === 'ASSIGNMENTS' ? 'text-[#5B4DFB]' : 'text-gray-500'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Tasks</span>
          </button>

          <button
            onClick={() => handleNavClick('STUDENTS')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] font-bold transition ${
              activeSection === 'STUDENTS' ? 'text-[#5B4DFB]' : 'text-gray-500'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Students</span>
          </button>
        </div>
      </div>

      {/* Modals */}
      <ExamPaperGeneratorModal isOpen={showExamModal} onClose={() => setShowExamModal(false)} />
      <TeacherLiveClassroomModal isOpen={showLiveClassModal} onClose={() => setShowLiveClassModal(false)} />
    </div>
  )
}
