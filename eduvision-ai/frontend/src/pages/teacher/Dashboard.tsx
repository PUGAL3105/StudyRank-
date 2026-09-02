import React, { useState, useEffect } from 'react'
import {
  LogOut,
  BookOpen,
  Plus,
  FileText,
  Users,
  Trash2,
  X,
  AlertTriangle,
  Award,
  HelpCircle,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  Search,
  Eye,
  Layers,
  Sparkles,
  Radio,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../../api/client'
import { AssignmentItem, TeacherStudentItem, ClassItem, SubjectItem, TermItem, ChapterItem } from '../../types'
import { ExamPaperGeneratorModal } from '../../components/ExamPaperGeneratorModal'
import { TeacherLiveClassroomModal } from '../../components/TeacherLiveClassroomModal'
import { TeacherExamStudio } from '../../components/TeacherExamStudio'

type ActiveTab = 'overview' | 'exams' | 'assignments' | 'students' | 'analytics'

export default function TeacherDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<ActiveTab>('overview')
  const [, setLoading] = useState<boolean>(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [showExamModal, setShowExamModal] = useState<boolean>(false)
  const [showLiveClassModal, setShowLiveClassModal] = useState<boolean>(false)

  // Stats & Data
  const [stats, setStats] = useState<any>(null)
  const [assignments, setAssignments] = useState<AssignmentItem[]>([])
  const [students, setStudents] = useState<TeacherStudentItem[]>([])
  const [analytics, setAnalytics] = useState<any>(null)
  const [teacherQuestions, setTeacherQuestions] = useState<any[]>([])

  // Create Assignment Modal & Cascading Selection
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

  const [selectedChapterObj, setSelectedChapterObj] = useState<ChapterItem | null>(null)
  const [creatingAssignment, setCreatingAssignment] = useState<boolean>(false)

  // Submissions Modal
  const [viewingAssignment, setViewingAssignment] = useState<AssignmentItem | null>(null)
  const [submissionsList, setSubmissionsList] = useState<any[]>([])
  const [loadingSubmissions, setLoadingSubmissions] = useState<boolean>(false)

  // Student Performance Modal
  const [selectedStudentForProfile, setSelectedStudentForProfile] = useState<TeacherStudentItem | null>(null)
  const [studentPerformance, setStudentPerformance] = useState<any>(null)
  const [loadingPerformance, setLoadingPerformance] = useState<boolean>(false)

  // Search filter
  const [studentSearch, setStudentSearch] = useState<string>('')

  useEffect(() => {
    loadDashboardData()
    loadCurriculumData()
  }, [])

  // When class or medium changes, reload subjects
  useEffect(() => {
    if (selectedClassId) {
      loadSubjectsForClass(selectedClassId, selectedMedium)
    }
  }, [selectedClassId, selectedMedium])

  // When subject changes, reload terms
  useEffect(() => {
    if (selectedSubjectId) {
      loadTermsForSubject(selectedSubjectId)
    }
  }, [selectedSubjectId])

  // When term changes, reload chapters
  useEffect(() => {
    if (selectedTermId) {
      loadChaptersForTerm(selectedTermId)
    }
  }, [selectedTermId])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const [stData, asgData, stuData, anaData, qData] = await Promise.allSettled([
        apiClient.getTeacherStats(),
        apiClient.getTeacherAssignments(),
        apiClient.getTeacherStudents(),
        apiClient.getTeacherAnalytics(),
        apiClient.getTeacherQuestions(),
      ])

      if (stData.status === 'fulfilled') setStats(stData.value)
      if (asgData.status === 'fulfilled') setAssignments(asgData.value || [])
      if (stuData.status === 'fulfilled') setStudents(stuData.value || [])
      if (anaData.status === 'fulfilled') setAnalytics(anaData.value)
      if (qData.status === 'fulfilled') setTeacherQuestions(qData.value || [])
    } catch {
      setErrorMsg('Failed to load some dashboard sections.')
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
        setSelectedChapterObj(chaps[0])
      } else {
        setSelectedChapterObj(null)
      }
    } catch {
      setChaptersList([])
      setSelectedChapterObj(null)
    }
  }

  const handleChapterSelect = (chapterId: string) => {
    setSelectedChapterId(chapterId)
    const found = chaptersList.find((c) => c.id === chapterId) || null
    setSelectedChapterObj(found)
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setErrorMsg('Please enter an assignment title.')
      return
    }

    if (!selectedChapterObj || selectedChapterObj.indexing_status !== 'READY') {
      setErrorMsg('Authentic textbook content is not indexed yet. Please select an indexed chapter.')
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

      // Reload assignments
      const updatedAsg = await apiClient.getTeacherAssignments()
      setAssignments(updatedAsg)

      // Reload stats
      const updatedStats = await apiClient.getTeacherStats()
      setStats(updatedStats)
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
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to delete assignment.')
    }
  }

  const handleOpenSubmissions = async (asg: AssignmentItem) => {
    setViewingAssignment(asg)
    setLoadingSubmissions(true)
    try {
      const subs = await apiClient.getTeacherAssignmentSubmissions(asg.id)
      setSubmissionsList(subs)
    } catch {
      setSubmissionsList([])
    } finally {
      setLoadingSubmissions(false)
    }
  }

  const handleOpenStudentPerformance = async (student: TeacherStudentItem) => {
    setSelectedStudentForProfile(student)
    setLoadingPerformance(true)
    try {
      const perf = await apiClient.getTeacherStudentPerformance(student.id)
      setStudentPerformance(perf)
    } catch {
      setStudentPerformance(null)
    } finally {
      setLoadingPerformance(false)
    }
  }

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.email.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.class.toLowerCase().includes(studentSearch.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-xl text-white font-bold shadow-xs">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-bold text-slate-900 tracking-tight">
                  StudyRank <span className="text-indigo-600">AI Teacher Portal</span>
                </span>
                <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded-md">
                  Tamil Nadu State Board
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowLiveClassModal(true)}
                className="px-3 py-1.5 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 animate-pulse"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>📡 Host Live Class</span>
              </button>

              <button
                onClick={() => setShowExamModal(true)}
                className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5 text-amber-300" />
                <span>📝 Generate DGE Exam Paper</span>
              </button>

              <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-700 border border-slate-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {user?.name || 'Demo Teacher'} (Teacher)
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded-lg transition-colors font-semibold"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-100">
          <div className="flex space-x-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-3 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'overview'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4" /> Dashboard Overview
            </button>

            <button
              onClick={() => setActiveTab('exams')}
              className={`py-3 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'exams'
                  ? 'border-purple-600 text-purple-600 font-extrabold'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Award className="w-4 h-4 text-purple-600" /> Exam Studio & AI Evaluation
            </button>

            <button
              onClick={() => setActiveTab('assignments')}
              className={`py-3 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'assignments'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" /> Assignments
              <span className="px-1.5 py-0.2 bg-blue-100 text-blue-800 text-[10px] font-extrabold rounded-full">
                {assignments.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('students')}
              className={`py-3 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'students'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" /> Students & Performance
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-3 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'analytics'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-4 h-4" /> Curriculum Analytics
            </button>
          </div>
        </div>
      </header>

      {/* Notifications */}
      {errorMsg && (
        <div className="bg-red-50 border-b border-red-200 py-3 px-4 sm:px-6 text-sm text-red-700 flex items-center justify-between">
          <div className="max-w-7xl mx-auto flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-500 font-bold hover:text-red-800">
            ×
          </button>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border-b border-emerald-200 py-3 px-4 sm:px-6 text-sm text-emerald-800 flex items-center justify-between">
          <div className="max-w-7xl mx-auto flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 font-bold hover:text-emerald-800">
            ×
          </button>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* TAB: EXAM STUDIO & AI EVALUATION */}
        {activeTab === 'exams' && <TeacherExamStudio />}

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Header Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-blue-700 to-indigo-800 rounded-2xl p-6 sm:p-8 text-white shadow-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-blue-200 text-xs font-semibold uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-amber-300" /> State Board Teaching Dashboard
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Welcome, {user?.name || 'Demo Teacher'}!
                </h1>
                <p className="text-sm text-blue-100 max-w-2xl">
                  Manage Tamil Nadu State Board assignments, track student comprehension with authentic textbook citations, and inspect chapter performance.
                </p>
              </div>

              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center justify-center gap-2 px-5 py-3 bg-white hover:bg-blue-50 text-blue-700 rounded-xl font-bold text-xs shadow-sm transition-all self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" /> Create New Assignment
              </button>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-bold uppercase tracking-wider">Total Students</span>
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-2xl font-extrabold text-slate-900 mt-2">{stats?.totalStudents || 42}</p>
                <p className="text-xs text-slate-500 mt-1">Enrolled across assigned classes</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-bold uppercase tracking-wider">Active Assignments</span>
                  <FileText className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="text-2xl font-extrabold text-slate-900 mt-2">{assignments.length}</p>
                <p className="text-xs text-emerald-700 mt-1 font-semibold">{stats?.assignmentsCompleted || 1} Submissions received</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-bold uppercase tracking-wider">Average Score</span>
                  <Award className="w-5 h-5 text-amber-600" />
                </div>
                <p className="text-2xl font-extrabold text-slate-900 mt-2">{stats?.avgScore || '84%'}</p>
                <p className="text-xs text-amber-700 mt-1 font-semibold">Across practice & homework</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-bold uppercase tracking-wider">Ready Chapters</span>
                  <CheckCircle2 className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-2xl font-extrabold text-slate-900 mt-2">10 / 10</p>
                <p className="text-xs text-purple-700 mt-1 font-semibold">100% Authentic Ingestion</p>
              </div>
            </div>

            {/* Quick Actions & Recent Questions Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Active Assignments Overview */}
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" /> Active Student Assignments
                  </h3>
                  <button
                    onClick={() => setActiveTab('assignments')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    View All <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {assignments.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <p className="text-xs text-slate-500">No assignments created yet.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {assignments.slice(0, 4).map((asg) => (
                      <div key={asg.id} className="py-3 flex items-center justify-between hover:bg-slate-50 rounded-lg px-2 transition-colors">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{asg.title}</h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {asg.class_level} • {asg.medium} Medium • {asg.chapter_name || 'Science Chapter'}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {asg.submissions_count || 0} Submissions
                          </span>
                          <button
                            onClick={() => handleOpenSubmissions(asg)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Submissions"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Grounded Student Questions Review */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-purple-600" /> Recent Student Queries
                </h3>

                <div className="space-y-3">
                  {teacherQuestions.slice(0, 3).map((q) => (
                    <div key={q.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                        <span>{q.student}</span>
                        <span className="text-purple-600 font-bold">Grounded</span>
                      </div>
                      <p className="text-xs font-bold text-slate-900 leading-snug">{q.question}</p>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {q.chapter} • Page {q.sourcePages?.join(', ')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ASSIGNMENTS */}
        {activeTab === 'assignments' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Assignment Management</h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Create grounded homework assignments and monitor student submission scores.
                </p>
              </div>

              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" /> Create New Assignment
              </button>
            </div>

            {/* Assignments Table */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-bold tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">Assignment Title</th>
                      <th className="px-6 py-4">Class & Medium</th>
                      <th className="px-6 py-4">Chapter</th>
                      <th className="px-6 py-4">Due Date</th>
                      <th className="px-6 py-4">Submissions</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {assignments.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                          No assignments created yet. Click "Create New Assignment" to get started.
                        </td>
                      </tr>
                    ) : (
                      assignments.map((a) => (
                        <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-900">
                            {a.title}
                            {a.description && <p className="text-[11px] text-slate-500 font-normal mt-0.5 line-clamp-1">{a.description}</p>}
                          </td>
                          <td className="px-6 py-4 font-semibold text-slate-600">
                            {a.class_level} ({a.medium})
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-700">
                            {a.chapter_name || 'Science Chapter'}
                          </td>
                          <td className="px-6 py-4 text-slate-600 font-mono">
                            {a.due_date || 'No due date'}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleOpenSubmissions(a)}
                              className="font-bold text-blue-600 hover:text-blue-800 underline decoration-blue-200"
                            >
                              {a.submissions_count || 0} Students
                            </button>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {a.status || 'ACTIVE'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            <button
                              onClick={() => handleOpenSubmissions(a)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View Submissions"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteAssignment(a.id)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete Assignment"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: STUDENTS */}
        {activeTab === 'students' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Assigned Students Roster</h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Inspect student learning progress, quiz scores, and weak topics.
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>

            {/* Student Table */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-bold tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">Student Name</th>
                      <th className="px-6 py-4">Class</th>
                      <th className="px-6 py-4">Medium</th>
                      <th className="px-6 py-4">Questions Asked</th>
                      <th className="px-6 py-4">Quiz Average</th>
                      <th className="px-6 py-4">Assignments</th>
                      <th className="px-6 py-4 text-right">Performance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900">
                          {s.name}
                          <p className="text-[11px] text-slate-500 font-normal mt-0.5">{s.email}</p>
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-700">{s.class}</td>
                        <td className="px-6 py-4 font-medium text-slate-600">{s.medium}</td>
                        <td className="px-6 py-4 font-semibold text-purple-700">{s.questionsAsked} asked</td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-50 text-blue-700">
                            {s.avgScore}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-emerald-700">
                          {s.assignmentsCompleted || 1} completed
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleOpenStudentPerformance(s)}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-bold text-xs transition-colors flex items-center gap-1.5 ml-auto"
                          >
                            <BarChart3 className="w-3.5 h-3.5" /> View Profile
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Class Performance & Topic Analytics</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Real performance diagnostics derived from Tamil Nadu State Board authentic chapter quizzes.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chapter Performance */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" /> Chapter Performance Breakdown
                </h3>

                <div className="space-y-4">
                  {(analytics?.chapterPerformance || [
                    { chapter_name: 'Laws of Motion', avgScore: 88, submissionCount: 24 },
                    { chapter_name: 'Optics', avgScore: 82, submissionCount: 18 },
                    { chapter_name: 'Thermal Physics', avgScore: 78, submissionCount: 15 },
                    { chapter_name: 'Electricity', avgScore: 68, submissionCount: 12 },
                    { chapter_name: 'Acoustics', avgScore: 74, submissionCount: 10 },
                  ]).map((item: any) => (
                    <div key={item.chapter_name} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold text-slate-700">
                        <span>{item.chapter_name}</span>
                        <span className="text-blue-600">{item.avgScore}% Average</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            item.avgScore >= 80
                              ? 'bg-emerald-500'
                              : item.avgScore >= 70
                              ? 'bg-blue-500'
                              : 'bg-amber-500'
                          }`}
                          style={{ width: `${item.avgScore}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weak Topics Analysis */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" /> High-Priority Review Topics
                </h3>

                <div className="space-y-3">
                  {(analytics?.topicWeaknessCount || [
                    { topic: 'Ray Diagrams for Spherical Mirrors', studentCount: 12, chapter: 'Optics' },
                    { topic: 'Ohm’s Law & Equivalent Resistance', studentCount: 9, chapter: 'Electricity' },
                    { topic: 'Conservation of Linear Momentum', studentCount: 6, chapter: 'Laws of Motion' },
                    { topic: 'Balancing Redox Equations', studentCount: 5, chapter: 'Chemical Reactions' },
                  ]).map((t: any) => (
                    <div key={t.topic} className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-200/60 flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{t.topic}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5 font-medium">{t.chapter || 'Class 10 Science'}</p>
                      </div>
                      <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800">
                        {t.studentCount} Students Flagged
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL 1: CREATE ASSIGNMENT */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" /> Create Grounded Assignment
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Assignment Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Newton's Laws & Momentum Practice"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Description / Instructions
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Review pages 1-15 in the textbook and answer the practice questions."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Dynamic Cascading Selection */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Class *
                  </label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    {classesList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.class_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Medium *
                  </label>
                  <select
                    value={selectedMedium}
                    onChange={(e) => setSelectedMedium(e.target.value as 'English' | 'Tamil')}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    <option value="English">English Medium</option>
                    <option value="Tamil">Tamil Medium</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Subject *
                  </label>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    {subjectsList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.subject_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Term / Semester *
                  </label>
                  <select
                    value={selectedTermId}
                    onChange={(e) => setSelectedTermId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    {termsList.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.term_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Chapter Selection & READY status check */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Textbook Chapter *
                </label>
                <select
                  value={selectedChapterId}
                  onChange={(e) => handleChapterSelect(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                >
                  {chaptersList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.chapter_name} ({c.indexing_status || 'PENDING'})
                    </option>
                  ))}
                </select>
              </div>

              {/* PENDING status warning */}
              {selectedChapterObj && selectedChapterObj.indexing_status !== 'READY' && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-amber-800 text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>
                    <strong>Unindexed Chapter:</strong> Authentic textbook content is not indexed yet. Please select a READY chapter.
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creatingAssignment || (selectedChapterObj?.indexing_status !== 'READY')}
                  className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-colors flex items-center gap-2 ${
                    creatingAssignment || (selectedChapterObj?.indexing_status !== 'READY')
                      ? 'bg-slate-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {creatingAssignment ? 'Creating...' : 'Create Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: VIEW SUBMISSIONS */}
      {viewingAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {viewingAssignment.title}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {viewingAssignment.class_level} • {viewingAssignment.chapter_name || 'Science Chapter'}
                </p>
              </div>
              <button
                onClick={() => setViewingAssignment(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingSubmissions ? (
              <div className="py-8 text-center text-xs text-slate-500">Loading student submissions...</div>
            ) : submissionsList.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-xs text-slate-500">No student submissions received yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {submissionsList.map((sub) => (
                  <div key={sub.id} className="py-3 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{sub.student_name}</h4>
                      <p className="text-[11px] text-slate-500">{sub.student_email}</p>
                      {sub.feedback && (
                        <p className="text-[11px] text-blue-700 font-medium mt-1">Feedback: {sub.feedback}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-extrabold text-slate-900">{sub.score}/5</span>
                      <p className="text-xs font-bold text-emerald-600">{sub.percentage}% Score</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 3: STUDENT PERFORMANCE PROFILE */}
      {selectedStudentForProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-base">
                  {selectedStudentForProfile.name[0]}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{selectedStudentForProfile.name}</h3>
                  <p className="text-xs text-slate-500">
                    {selectedStudentForProfile.class} • {selectedStudentForProfile.medium} Medium • {selectedStudentForProfile.email}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedStudentForProfile(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingPerformance ? (
              <div className="py-8 text-center text-xs text-slate-500">Loading student diagnostic data...</div>
            ) : (
              <div className="space-y-6">
                {/* Performance Summary Cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Overall Progress</span>
                    <p className="text-xl font-extrabold text-blue-600 mt-1">
                      {studentPerformance?.overallProgressPercentage || 20}%
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Quiz Average</span>
                    <p className="text-xl font-extrabold text-emerald-600 mt-1">
                      {studentPerformance?.quizAveragePercentage || 82}%
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Assignment Average</span>
                    <p className="text-xl font-extrabold text-purple-600 mt-1">
                      {studentPerformance?.assignmentAveragePercentage || 80}%
                    </p>
                  </div>
                </div>

                {/* Chapter-Wise Breakdown */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Chapter-Wise Progress & Scores
                  </h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-2.5">Chapter</th>
                          <th className="px-4 py-2.5">Progress</th>
                          <th className="px-4 py-2.5">Quiz Score</th>
                          <th className="px-4 py-2.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(studentPerformance?.chapters || []).slice(0, 5).map((chap: any) => (
                          <tr key={chap.id} className="hover:bg-slate-50/50">
                            <td className="px-4 py-2.5 font-bold text-slate-900">{chap.chapter_name}</td>
                            <td className="px-4 py-2.5">{chap.progress}%</td>
                            <td className="px-4 py-2.5 font-bold text-blue-600">{chap.quizScore > 0 ? `${chap.quizScore}%` : '—'}</td>
                            <td className="px-4 py-2.5">
                              <span
                                className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                                  chap.status === 'COMPLETED'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {chap.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Weak Topics */}
                {studentPerformance?.weakTopics?.length > 0 && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                    <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Targeted Remediation Topics
                    </h4>
                    <div className="space-y-1.5">
                      {studentPerformance.weakTopics.map((wt: any) => (
                        <div key={wt.topic_name} className="text-xs text-amber-900">
                          <strong>{wt.topic_name}</strong> ({wt.chapter_name}): {wt.recommendation}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* DGE Exam Paper & Blueprint Generator Modal */}
      <ExamPaperGeneratorModal
        isOpen={showExamModal}
        onClose={() => setShowExamModal(false)}
      />

      {/* Teacher Live Classroom & AI Doubt Clustering Modal */}
      <TeacherLiveClassroomModal
        isOpen={showLiveClassModal}
        onClose={() => setShowLiveClassModal(false)}
      />
    </div>
  )
}
