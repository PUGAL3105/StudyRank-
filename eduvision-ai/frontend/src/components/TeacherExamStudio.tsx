/**
 * EduVision AI — Teacher Exam Studio & Evaluation Review Center
 * Authoring, AI Question Generation & Score Override System
 */

import React, { useState, useEffect } from 'react'
import { apiClient } from '../api/client'
import {
  FileText,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Users,
  RefreshCw,
  Save,
} from 'lucide-react'

export const TeacherExamStudio: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'EXAMS' | 'CREATE' | 'SUBMISSIONS' | 'REVIEW'>('EXAMS')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Teacher Exams List
  const [teacherExams, setTeacherExams] = useState<any[]>([])

  // Exam Creator Form State
  const [examTitle, setExamTitle] = useState<string>('')
  const [examDesc, setExamDesc] = useState<string>('')
  const [selectedClass, setSelectedClass] = useState<string>('c-10')
  const [selectedSubject, setSelectedSubject] = useState<string>('sub-10-sci')
  const [selectedChapter, setSelectedChapter] = useState<string>('ch-10sci-t1-1')
  const [durationMinutes, setDurationMinutes] = useState<number>(30)
  const [passingMarks, setPassingMarks] = useState<number>(10)
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium')

  // Question Distribution for AI Generator
  const [m1Count, setM1Count] = useState<number>(2)
  const [m2Count, setM2Count] = useState<number>(2)
  const [m3Count, setM3Count] = useState<number>(1)
  const [m5Count, setM5Count] = useState<number>(1)
  const [questions, setQuestions] = useState<any[]>([])
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState<boolean>(false)

  // Submissions & Review State
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null)
  const [submissionsData, setSubmissionsData] = useState<any>(null)
  const [reviewData, setReviewData] = useState<any>(null)
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null)

  // Teacher Override Form State
  const [overrideScores, setOverrideScores] = useState<Record<string, number>>({})
  const [overrideFeedbacks, setOverrideFeedbacks] = useState<Record<string, string>>({})
  const [overallFeedback, setOverallFeedback] = useState<string>('')

  const getTeacherSubjectOptions = () => {
    if (selectedClass === 'c-9') {
      return [
        { id: 'sub-9-sci', name: 'Science' },
        { id: 'sub-9-math', name: 'Mathematics' },
        { id: 'sub-9-soc', name: 'Social Science' },
        { id: 'sub-9-tam', name: 'Tamil' },
        { id: 'sub-9-eng', name: 'English' },
      ]
    }
    if (selectedClass === 'c-10') {
      return [
        { id: 'sub-10-sci', name: 'Science' },
        { id: 'sub-10-math', name: 'Mathematics' },
        { id: 'sub-10-soc', name: 'Social Science' },
        { id: 'sub-10-tam', name: 'Tamil' },
        { id: 'sub-10-eng', name: 'English' },
      ]
    }
    if (selectedClass === 'c-11') {
      return [
        { id: 'sub-11-phy', name: 'Physics' },
        { id: 'sub-11-chem', name: 'Chemistry' },
        { id: 'sub-11-bio', name: 'Biology' },
        { id: 'sub-11-cs', name: 'Computer Science' },
        { id: 'sub-11-math', name: 'Mathematics' },
        { id: 'sub-11-acc', name: 'Accountancy' },
        { id: 'sub-11-com', name: 'Commerce' },
        { id: 'sub-11-eco', name: 'Economics' },
        { id: 'sub-11-tam', name: 'General Tamil' },
        { id: 'sub-11-eng', name: 'General English' },
      ]
    }
    return [
      { id: 'sub-12-phy', name: 'Physics' },
      { id: 'sub-12-chem', name: 'Chemistry' },
      { id: 'sub-12-bio', name: 'Biology' },
      { id: 'sub-12-cs', name: 'Computer Science' },
      { id: 'sub-12-math', name: 'Mathematics' },
      { id: 'sub-12-acc', name: 'Accountancy' },
      { id: 'sub-12-com', name: 'Commerce' },
      { id: 'sub-12-eco', name: 'Economics' },
      { id: 'sub-12-tam', name: 'General Tamil' },
      { id: 'sub-12-eng', name: 'General English' },
    ]
  }

  const handleClassChange = (newClass: string) => {
    setSelectedClass(newClass)
    if (newClass === 'c-9') setSelectedSubject('sub-9-sci')
    else if (newClass === 'c-10') setSelectedSubject('sub-10-sci')
    else if (newClass === 'c-11') setSelectedSubject('sub-11-phy')
    else if (newClass === 'c-12') setSelectedSubject('sub-12-phy')
  }

  const loadTeacherExams = async () => {
    try {
      setLoading(true)
      const data = await apiClient.getTeacherExams()
      setTeacherExams(data || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load teacher exams.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTeacherExams()
  }, [])

  // ─────────────────────────────────────────────────────────────────────────
  // AI QUESTION GENERATOR (TEXTBOOK GROUNDED)
  // ─────────────────────────────────────────────────────────────────────────
  const handleGenerateQuestions = async () => {
    try {
      setIsGeneratingQuestions(true)
      setError(null)
      const res = await apiClient.generateExamQuestions({
        classId: selectedClass,
        subjectId: selectedSubject,
        chapterId: selectedChapter,
        difficulty,
        distribution: {
          mark1: m1Count,
          mark2: m2Count,
          mark3: m3Count,
          mark5: m5Count,
        },
      })
      if (res?.questions) {
        setQuestions(res.questions)
        setSuccessMsg(`Generated ${res.questions.length} questions grounded in the official Tamil Nadu textbook!`)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate questions.')
    } finally {
      setIsGeneratingQuestions(false)
    }
  }

  const handleCreateExamSubmit = async () => {
    if (!examTitle.trim()) {
      setError('Exam title is required.')
      return
    }
    if (questions.length === 0) {
      setError('Please add or generate at least one question.')
      return
    }

    try {
      setLoading(true)
      setError(null)
      await apiClient.createExam({
        title: examTitle,
        description: examDesc,
        classId: selectedClass,
        subjectId: selectedSubject,
        chapterIds: [selectedChapter],
        durationMinutes,
        passingMarks,
        difficulty,
        questions,
        isPublished: true,
      })

      setSuccessMsg('Exam created and published successfully!')
      setActiveTab('EXAMS')
      loadTeacherExams()
    } catch (err: any) {
      setError(err.message || 'Failed to create exam.')
    } finally {
      setLoading(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SUBMISSIONS & REVIEW
  // ─────────────────────────────────────────────────────────────────────────
  const handleOpenSubmissions = async (examId: string) => {
    try {
      setLoading(true)
      setSelectedExamId(examId)
      const data = await apiClient.getExamSubmissions(examId)
      setSubmissionsData(data)
      setActiveTab('SUBMISSIONS')
    } catch (err: any) {
      setError(err.message || 'Failed to load submissions.')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenReview = async (attemptId: string) => {
    try {
      setLoading(true)
      setSelectedAttemptId(attemptId)
      const data = await apiClient.getSubmissionReview(attemptId)
      setReviewData(data)

      // Initialize override form states
      const scoresMap: Record<string, number> = {}
      const fbMap: Record<string, string> = {}
      if (Array.isArray(data.questionsReview)) {
        data.questionsReview.forEach((qr: any) => {
          scoresMap[qr.questionId] = qr.currentMarks
          fbMap[qr.questionId] = qr.teacherEvaluation?.feedback || ''
        })
      }
      setOverrideScores(scoresMap)
      setOverrideFeedbacks(fbMap)
      setOverallFeedback(data.attempt?.teacher_feedback || '')

      setActiveTab('REVIEW')
    } catch (err: any) {
      setError(err.message || 'Failed to open submission review.')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveScoreOverride = async (questionId: string) => {
    if (!selectedAttemptId) return
    try {
      const marks = overrideScores[questionId]
      const fb = overrideFeedbacks[questionId]

      const res = await apiClient.overrideSubmissionMarks(selectedAttemptId, {
        questionId,
        teacherMarks: marks,
        feedback: fb,
        overallFeedback,
      })

      setSuccessMsg(`Score updated! New Total: ${res.finalScore} (${res.grade})`)
      // Refresh review data
      const data = await apiClient.getSubmissionReview(selectedAttemptId)
      setReviewData(data)
    } catch (err: any) {
      setError(err.message || 'Failed to save score override.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-800 via-indigo-800 to-blue-800 text-white p-6 rounded-2xl shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="px-2.5 py-1 bg-white/10 rounded-full text-xs font-semibold uppercase tracking-wider">
              Teacher Examination Studio
            </span>
            <h1 className="text-2xl font-bold mt-2">Exam Creation, AI Question Generator & Evaluation Review</h1>
            <p className="text-xs text-purple-100 mt-1">
              Create curriculum exams with textbook-grounded 1M, 2M, 3M and 5M questions. Review student AI evaluations and adjust marks.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveTab('CREATE')
                setExamTitle('Class 10 Science — Practice Exam')
                handleGenerateQuestions()
              }}
              className="px-4 py-2 bg-white text-indigo-900 hover:bg-purple-50 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition"
            >
              <Plus className="w-4 h-4" /> Create New Exam
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveTab('EXAMS')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'EXAMS' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          My Exams ({teacherExams.length})
        </button>
        <button
          onClick={() => setActiveTab('CREATE')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'CREATE' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Exam Builder & AI Question Generator
        </button>
        {selectedExamId && (
          <button
            onClick={() => setActiveTab('SUBMISSIONS')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'SUBMISSIONS' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Submissions Review
          </button>
        )}
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl flex items-center gap-3 text-xs">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────
          TAB 1: EXAMS LIST
         ───────────────────────────────────────────────────────────────────── */}
      {activeTab === 'EXAMS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teacherExams.map((exam) => (
            <div
              key={exam.id}
              className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:border-indigo-300 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-semibold">
                    {exam.class_name} • {exam.subject_name}
                  </span>
                  <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs font-semibold">
                    {exam.status}
                  </span>
                </div>
                <h3 className="text-base font-bold text-gray-900 mt-2">{exam.title}</h3>
                <p className="text-xs text-gray-500 mt-1">{exam.description}</p>

                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-gray-100 text-xs">
                  <div>
                    <span className="text-gray-400 block">Total Marks</span>
                    <span className="font-bold text-gray-800">{exam.total_marks}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Questions</span>
                    <span className="font-bold text-gray-800">{exam.question_count}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Submissions</span>
                    <span className="font-bold text-indigo-600">{exam.submissionsCount || 0}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => handleOpenSubmissions(exam.id)}
                  className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Users className="w-3.5 h-3.5" /> View Submissions ({exam.submissionsCount || 0})
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────
          TAB 2: CREATE EXAM & AI QUESTION GENERATOR
         ───────────────────────────────────────────────────────────────────── */}
      {activeTab === 'CREATE' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" /> Exam Configuration & Syllabus Alignment
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Select class and chapter to generate authentic questions directly from the state board textbook.
            </p>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Class Level</label>
              <select
                value={selectedClass}
                onChange={(e) => handleClassChange(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-xl text-xs font-medium"
              >
                <option value="c-9">Class 9 (9th Std)</option>
                <option value="c-10">Class 10 (SSLC Board)</option>
                <option value="c-11">Class 11 (+1 Higher Secondary)</option>
                <option value="c-12">Class 12 (HSC +2 Board)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Subject</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-xl text-xs font-medium"
              >
                {getTeacherSubjectOptions().map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Chapter</label>
              <select
                value={selectedChapter}
                onChange={(e) => setSelectedChapter(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-xl text-xs font-medium"
              >
                <option value="ch-10sci-t1-1">Laws of Motion</option>
                <option value="ch-10sci-t1-2">Optics</option>
                <option value="ch-10sci-t1-3">Thermal Physics</option>
                <option value="ch-10sci-t1-4">Electricity</option>
                <option value="ch-10sci-t1-5">Acoustics</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Exam Title</label>
              <input
                type="text"
                value={examTitle}
                onChange={(e) => setExamTitle(e.target.value)}
                placeholder="e.g. Class 10 Science — Unit Test 1"
                className="w-full p-2.5 border border-gray-300 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Duration (Minutes)</label>
              <input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full p-2.5 border border-gray-300 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Passing Marks</label>
              <input
                type="number"
                value={passingMarks}
                onChange={(e) => setPassingMarks(Number(e.target.value))}
                className="w-full p-2.5 border border-gray-300 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Difficulty Level</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full p-2.5 border border-gray-300 rounded-xl text-xs font-medium"
              >
                <option value="Easy">🟢 Easy (Pass Booster — 1M & 2M)</option>
                <option value="Medium">🟡 Medium (Standard Board Exam)</option>
                <option value="Hard">🔴 Hard (Centum & Distinction Target)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Exam Instructions / Description</label>
            <input
              type="text"
              value={examDesc}
              onChange={(e) => setExamDesc(e.target.value)}
              placeholder="e.g. State Board Unit Test covering authentic chapter definitions, laws, and derivations."
              className="w-full p-2.5 border border-gray-300 rounded-xl text-xs"
            />
          </div>

          {/* Question Distribution Box */}
          <div className="bg-indigo-50/70 border border-indigo-100 p-4 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" /> AI Question Generator Configuration
              </span>
              <button
                disabled={isGeneratingQuestions}
                onClick={handleGenerateQuestions}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 transition"
              >
                {isGeneratingQuestions ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                Generate Questions from Textbook
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-gray-600 mb-1 font-medium">1-Mark Questions</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={m1Count}
                  onChange={(e) => setM1Count(Number(e.target.value))}
                  className="w-full p-2 border border-indigo-200 rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="block text-gray-600 mb-1 font-medium">2-Mark Questions</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={m2Count}
                  onChange={(e) => setM2Count(Number(e.target.value))}
                  className="w-full p-2 border border-indigo-200 rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="block text-gray-600 mb-1 font-medium">3-Mark Questions</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={m3Count}
                  onChange={(e) => setM3Count(Number(e.target.value))}
                  className="w-full p-2 border border-indigo-200 rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="block text-gray-600 mb-1 font-medium">5-Mark Essay Questions</label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  value={m5Count}
                  onChange={(e) => setM5Count(Number(e.target.value))}
                  className="w-full p-2 border border-indigo-200 rounded-lg bg-white"
                />
              </div>
            </div>
          </div>

          {/* Generated Questions List */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900">
              Exam Questions ({questions.length} Questions • Total Marks: {questions.reduce((a, b) => a + (Number(b.marks) || 1), 0)})
            </h3>

            {questions.map((q, idx) => (
              <div key={idx} className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-600">Question {idx + 1} ({q.marks} Marks)</span>
                  <button
                    onClick={() => setQuestions(questions.filter((_, i) => i !== idx))}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <input
                  type="text"
                  value={q.question_text}
                  onChange={(e) => {
                    const newQs = [...questions]
                    newQs[idx].question_text = e.target.value
                    setQuestions(newQs)
                  }}
                  className="w-full p-2 bg-white border border-gray-300 rounded-lg text-xs font-medium"
                />
                <div className="text-[11px] text-gray-500">
                  <span className="font-semibold text-gray-700">Expected Model Answer:</span> {q.expected_answer}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
            <button
              onClick={() => setActiveTab('EXAMS')}
              className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              disabled={loading || questions.length === 0}
              onClick={handleCreateExamSubmit}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
            >
              Publish Exam
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────
          TAB 3: EXAM SUBMISSIONS LIST
         ───────────────────────────────────────────────────────────────────── */}
      {activeTab === 'SUBMISSIONS' && submissionsData && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setActiveTab('EXAMS')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              ← Back to Exams
            </button>
            <h2 className="text-sm font-bold text-gray-900">{submissionsData.exam?.title} — Submissions</h2>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 grid grid-cols-12 gap-2">
              <span className="col-span-4">Student</span>
              <span className="col-span-3 text-center">Status</span>
              <span className="col-span-3 text-center">Score</span>
              <span className="col-span-2 text-right">Actions</span>
            </div>

            <div className="divide-y divide-gray-100">
              {submissionsData.submissions?.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-500">No submissions received yet.</div>
              ) : (
                submissionsData.submissions.map((sub: any) => (
                  <div key={sub.attemptId} className="p-4 grid grid-cols-12 gap-2 items-center text-xs">
                    <div className="col-span-4">
                      <div className="font-bold text-gray-900">{sub.studentName}</div>
                      <div className="text-[11px] text-gray-400">{sub.studentEmail}</div>
                    </div>
                    <div className="col-span-3 text-center">
                      <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded font-semibold text-[11px]">
                        {sub.status}
                      </span>
                    </div>
                    <div className="col-span-3 text-center font-bold text-indigo-600">
                      {sub.finalScore} / {sub.maxMarks} ({sub.percentage}%)
                    </div>
                    <div className="col-span-2 text-right">
                      <button
                        onClick={() => handleOpenReview(sub.attemptId)}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-semibold text-xs transition"
                      >
                        Review AI
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────
          TAB 4: STUDENT SUBMISSION AI EVALUATION REVIEW & OVERRIDE
         ───────────────────────────────────────────────────────────────────── */}
      {activeTab === 'REVIEW' && reviewData && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setActiveTab('SUBMISSIONS')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              ← Back to Submissions
            </button>
            <div className="text-xs font-bold text-gray-700">
              Reviewing: {reviewData.student?.name} • Score: {reviewData.attempt?.total_score} / {reviewData.attempt?.max_marks}
            </div>
          </div>

          {/* Question by Question Review */}
          <div className="space-y-5">
            {reviewData.questionsReview?.map((qr: any, idx: number) => (
              <div key={qr.questionId} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
                <div className="flex items-start justify-between pb-3 border-b border-gray-100">
                  <div>
                    <span className="text-xs font-bold text-indigo-600">Question {idx + 1} ({qr.marks} Marks)</span>
                    <h3 className="text-sm font-semibold text-gray-900 mt-0.5">{qr.questionText}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">AI Score: <strong>{qr.aiEvaluation?.marks_awarded}</strong></span>
                    <div className="flex items-center gap-1">
                      <label className="text-xs font-bold text-purple-700">Teacher Marks:</label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max={qr.marks}
                        value={overrideScores[qr.questionId] ?? qr.currentMarks}
                        onChange={(e) => setOverrideScores({ ...overrideScores, [qr.questionId]: Number(e.target.value) })}
                        className="w-16 p-1.5 border border-purple-300 rounded-lg text-xs font-bold text-purple-900 text-center"
                      />
                    </div>
                  </div>
                </div>

                {/* Student Answer vs Model Answer */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <span className="text-xs font-bold text-gray-600 block mb-1">Student Answer:</span>
                    <p className="text-xs text-gray-800 font-mono leading-relaxed">{qr.studentAnswer || 'No answer submitted.'}</p>
                  </div>
                  <div className="p-3 bg-blue-50/60 rounded-xl">
                    <span className="text-xs font-bold text-blue-900 block mb-1">Model Answer ({qr.sourceTextbook}):</span>
                    <p className="text-xs text-blue-800 leading-relaxed">{qr.expectedAnswer}</p>
                  </div>
                </div>

                {/* AI Feedback & Teacher Override Box */}
                <div className="p-3 bg-indigo-50/50 rounded-xl text-xs space-y-2">
                  <div className="text-indigo-900 font-semibold">AI Feedback: {qr.aiEvaluation?.feedback}</div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Teacher Feedback for this question:</label>
                    <input
                      type="text"
                      placeholder="Add specific notes or correction advice for the student..."
                      value={overrideFeedbacks[qr.questionId] || ''}
                      onChange={(e) => setOverrideFeedbacks({ ...overrideFeedbacks, [qr.questionId]: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => handleSaveScoreOverride(qr.questionId)}
                    className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
                  >
                    <Save className="w-3.5 h-3.5" /> Save Question Score Override
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
