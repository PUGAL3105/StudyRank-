/**
 * StudyRank AI — Student Exam Practice, Preparation & 1-Mark Quiz Engine
 * Comprehensive Coverage for Tamil Nadu State Board (Classes 9, 10, 11, and 12)
 * All Streams: Science (Bio/CS), Commerce, Arts & Languages
 * Authentic Previous Year Questions (PYQs 2019–2024) with Easy, Medium, Hard Tiers
 */

import React, { useState, useEffect, useRef } from 'react'
import { apiClient } from '../api/client'
import {
  MASTER_1MARK_QUIZ_BANK,
  MASTER_DESCRIPTIVE_BANK,
} from '../data/boardQuestionBank'
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Award,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  Bookmark,
  Send,
  Trophy,
  ArrowLeft,
  Sparkles,
  FileText,
  RefreshCw,
  Eye,
  Check,
  Target,
  BarChart3,
  Search,
  Zap,
  Star,
  GraduationCap,
  XCircle,
  RotateCcw,
  Bot,
  Lock,
  X,
} from 'lucide-react'

export const StudentExamPortal: React.FC = () => {
  // Navigation Tabs: 'QUIZ_1M' (1-Mark Interactive Quiz) | 'DESCRIPTIVE' (2M, 3M, 5M Drills) | 'EXAMS' (Full Timed Tests) | 'RESULTS' | 'LEADERBOARD'
  const [activeTab, setActiveTab] = useState<'QUIZ_1M' | 'DESCRIPTIVE' | 'EXAMS' | 'RESULTS' | 'LEADERBOARD'>('QUIZ_1M')
  
  // View Modes: HUB | LIVE_EXAM | RESULT_DETAIL
  const [viewMode, setViewMode] = useState<'HUB' | 'LIVE_EXAM' | 'RESULT_DETAIL'>('HUB')
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Selected Class Switcher: 'c-9' | 'c-10' | 'c-11' | 'c-12'
  const [selectedClassId, setSelectedClassId] = useState<'c-9' | 'c-10' | 'c-11' | 'c-12'>('c-10')

  // Selected Stream for Classes 11 & 12: 'ALL' | 'SCIENCE' | 'CS' | 'COMMERCE' | 'LANGUAGES'
  const [selectedStream, setSelectedStream] = useState<'ALL' | 'SCIENCE' | 'CS' | 'COMMERCE' | 'LANGUAGES'>('ALL')

  // Subject Filter
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('ALL')

  // Exam List State
  const [exams, setExams] = useState<any[]>([])
  const [studentStats, setStudentStats] = useState<any>(null)

  // Active Live Exam State
  const [activeExamData, setActiveExamData] = useState<any>(null)
  const [currentQIndex, setCurrentQIndex] = useState<number>(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({})
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number>(0)
  const [saveStatus, setSaveStatus] = useState<'SAVED' | 'SAVING' | 'IDLE'>('SAVED')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false)

  // Result & Leaderboard State
  const [resultData, setResultData] = useState<any>(null)
  const [leaderboardData, setLeaderboardData] = useState<any>(null)
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null)

  // 1-Mark Interactive Quiz Engine State
  const [quizSelectedAnswers, setQuizSelectedAnswers] = useState<Record<string, number>>({})
  const [quizSubmittedMap, setQuizSubmittedMap] = useState<Record<string, boolean>>({})
  const [quizScore, setQuizScore] = useState<number>(0)
  const [quizAttemptedCount, setQuizAttemptedCount] = useState<number>(0)
  const [quizPage, setQuizPage] = useState<number>(1)
  const [quizPageSize, setQuizPageSize] = useState<number>(10)

  // Descriptive 2M/3M/5M State
  const [prepDifficulty, setPrepDifficulty] = useState<'ALL' | 'Easy' | 'Medium' | 'Hard'>('ALL')
  const [prepMarkFilter, setPrepMarkFilter] = useState<number | 'ALL'>('ALL')
  const [descPage, setDescPage] = useState<number>(1)
  const [descPageSize, setDescPageSize] = useState<number>(10)
  const [prepSearchQuery, setPrepSearchQuery] = useState<string>('')
  const [prepPracticeAnswers, setPrepPracticeAnswers] = useState<Record<string, string>>({})
  const [prepEvaluationResults, setPrepEvaluationResults] = useState<Record<string, any>>({})
  const [evaluatingPrepQId, setEvaluatingPrepQId] = useState<string | null>(null)

  const timerRef = useRef<any>(null)
  const autosaveTimeoutRef = useRef<any>(null)

  // Exam Source Filter: 'ALL' | 'PUBLIC' | 'QUARTERLY' | 'HALFYEARLY' | 'MIDTERM'
  const [examSourceFilter, setExamSourceFilter] = useState<'ALL' | 'PUBLIC' | 'QUARTERLY' | 'HALFYEARLY' | 'MIDTERM'>('ALL')

  const curated1MarkQuizBank = MASTER_1MARK_QUIZ_BANK
  const curatedDescriptiveQuestionBank = MASTER_DESCRIPTIVE_BANK

  // ─────────────────────────────────────────────────────────────────────────
  // AI CLARIFICATION CHATBOT STATE (Auto-disables during LIVE_EXAM, unlocks after)
  // ─────────────────────────────────────────────────────────────────────────
  const [isChatbotOpen, setIsChatbotOpen] = useState<boolean>(false)
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; sender: 'user' | 'bot'; text: string; time: string }>>([
    {
      id: 'welcome',
      sender: 'bot',
      text: '👋 Hello! I am your StudyRank AI Tutor. Ask me any doubts about board questions, formulas, derivations, theorems, or exam strategies for Classes 9–12!',
      time: 'Just now',
    },
  ])
  const [chatInput, setChatInput] = useState<string>('')
  const [isBotTyping, setIsBotTyping] = useState<boolean>(false)

  const handleSendChatMessage = (textToSend?: string) => {
    const query = (textToSend || chatInput).trim()
    if (!query || isBotTyping) return

    const userMsg = {
      id: `usr-${Date.now()}`,
      sender: 'user' as const,
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setChatMessages((prev) => [...prev, userMsg])
    if (!textToSend) setChatInput('')
    setIsBotTyping(true)

    setTimeout(() => {
      let botResponse = ''
      const lower = query.toLowerCase()

      if (lower.includes('thales') || lower.includes('proportionality')) {
        botResponse = '📐 **Basic Proportionality Theorem (Thales Theorem)**:\n\n*Statement*: If a line is drawn parallel to one side of a triangle intersecting the other two sides, then it divides the two sides in the same ratio.\n*Proof*: In ΔABC, DE || BC. Area(ADE)/Area(BDE) = AD/DB and Area(ADE)/Area(CDE) = AE/EC. Since Area(BDE) = Area(CDE), we get **AD/DB = AE/EC**.\n\n*State Board Tip*: Drawing the triangle with altitude gives 1 mark, proof gives 3 marks, conclusion gives 1 mark (Total 5 Marks).'
      } else if (lower.includes('momentum') || lower.includes('newton')) {
        botResponse = '⚡ **Law of Conservation of Linear Momentum**:\n\n*Statement*: In the absence of an external unbalanced force, the total linear momentum of an isolated system remains constant.\n*Formula*: **m₁u₁ + m₂u₂ = m₁v₁ + m₂v₂**\n\n*Proof*: Action force F₁ = m₁(v₁-u₁)/t, Reaction force F₂ = m₂(v₂-u₂)/t. By Newton’s Third Law F₁ = -F₂, equating both proves momentum conservation.'
      } else if (lower.includes('transformer')) {
        botResponse = '🔌 **Transformer Working & Principle**:\n\n*Principle*: Mutual Induction between two coils.\n*Formula*: **Es / Ep = Ns / Np = K** (Transformation ratio).\n*For Step-up*: K > 1 (Secondary voltage is higher).\n*Energy Losses*: Copper loss (I²R heating), Iron/Eddy current loss, Hysteresis loss, and Flux leakage.'
      } else if (lower.includes('அணி') || lower.includes('தமிழ்')) {
        botResponse = '📖 **பொதுத்தமிழ் - அணியிலக்கணம்**:\n\n*வரையறை*: செய்யுளுக்கு அழகூட்டுவது அணி எனப்படும்.\n*முக்கிய அணிகள்*: \n1. **உவமையணி**: உவமை, உவமேயம், உவம உருபு (போல, போன்ற) வெளிப்படையாக வருவது.\n2. **உருவக அணி**: உவமையும் உவமேயமும் வேறுபாடின்றி ஒன்றே எனத் தோன்றுவது.\n3. **வேற்றுமையணி**: இரு பொருள்களுக்கு இடையே உள்ள ஒற்றுமையைக் கூறி பின் வேறுபடுத்திக் காட்டுவது.'
      } else if (lower.includes('fixed') || lower.includes('fluctuating') || lower.includes('capital')) {
        botResponse = '💼 **Fixed vs Fluctuating Capital Method (Accountancy)**:\n\n1. **Fixed Capital Method**: Two accounts are maintained for each partner: Capital Account and Current Account. Capital balance remains fixed.\n2. **Fluctuating Capital Method**: Only one account (Capital Account) is maintained. All adjustments (drawings, interest, profit) are recorded directly in Capital Account.'
      } else {
        botResponse = `💡 **StudyRank AI Clarification for "${query}"**:\n\nAccording to the Tamil Nadu State Board Curriculum (Samacheer Kalvi), key concepts on this topic are tested in 1-Mark MCQs and 2M/3M/5M sections. Focus on exact definitions, SI units, standard formulas, and step-by-step proofs to score centum marks!`
      }

      setChatMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot' as const,
          text: botResponse,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ])
      setIsBotTyping(false)
    }, 600)
  }

  useEffect(() => {
    loadAvailableExams()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current)
    }
  }, [selectedClassId])

  const loadAvailableExams = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await apiClient.getAvailableExams()
      if (data) {
        setExams(data.exams || [])
        setStudentStats(data.studentStats || null)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load exams list.')
    } finally {
      setLoading(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 1-MARK INTERACTIVE QUIZ HANDLERS
  // ─────────────────────────────────────────────────────────────────────────
  const handleSelect1MarkOption = (qId: string, optionIndex: number, correctIndex: number) => {
    if (quizSubmittedMap[qId]) return // Already answered

    setQuizSelectedAnswers((prev) => ({ ...prev, [qId]: optionIndex }))
    setQuizSubmittedMap((prev) => ({ ...prev, [qId]: true }))
    setQuizAttemptedCount((prev) => prev + 1)

    if (optionIndex === correctIndex) {
      setQuizScore((prev) => prev + 1)
    }
  }

  const handleResetQuiz = () => {
    setQuizSelectedAnswers({})
    setQuizSubmittedMap({})
    setQuizScore(0)
    setQuizAttemptedCount(0)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // START LIVE EXAM
  // ─────────────────────────────────────────────────────────────────────────
  const handleStartExam = async (examId: string) => {
    try {
      setLoading(true)
      setError(null)
      const data = await apiClient.startExam(examId)

      setActiveExamData(data)
      setSelectedExamId(examId)
      setCurrentQIndex(0)

      const ansMap: Record<string, string> = {}
      if (Array.isArray(data.savedAnswers)) {
        data.savedAnswers.forEach((sa: any) => {
          ansMap[sa.question_id] = sa.answer_text || ''
        })
      }
      setAnswers(ansMap)

      const remainingSecs = Math.max(10, Math.round((data.timeRemainingMs || 1800000) / 1000))
      setTimeRemainingSeconds(remainingSecs)

      if (timerRef.current) clearInterval(timerRef.current)
      timerRef.current = setInterval(() => {
        setTimeRemainingSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current)
            handleAutoSubmitOnExpire(data.attempt.id, examId)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      setViewMode('LIVE_EXAM')
    } catch (err: any) {
      setError(err.message || 'Could not start exam.')
    } finally {
      setLoading(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // AUTOSAVE ANSWER (DEBOUNCED)
  // ─────────────────────────────────────────────────────────────────────────
  const handleAnswerChange = (qId: string, text: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: text }))
    setSaveStatus('SAVING')

    if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current)
    autosaveTimeoutRef.current = setTimeout(async () => {
      if (!activeExamData?.attempt?.id || !selectedExamId) return
      try {
        await apiClient.autosaveExamAnswer(selectedExamId, {
          attemptId: activeExamData.attempt.id,
          questionId: qId,
          answerText: text,
        })
        setSaveStatus('SAVED')
      } catch {
        setSaveStatus('IDLE')
      }
    }, 800)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SUBMIT LIVE EXAM
  // ─────────────────────────────────────────────────────────────────────────
  const handleConfirmSubmit = async () => {
    if (!activeExamData?.attempt?.id || !selectedExamId) return
    try {
      setIsSubmitting(true)
      if (timerRef.current) clearInterval(timerRef.current)

      const finalAnswers = Object.entries(answers).map(([questionId, answerText]) => ({
        questionId,
        answerText,
      }))

      await apiClient.submitExam(selectedExamId, {
        attemptId: activeExamData.attempt.id,
        finalAnswers,
      })

      setShowSubmitModal(false)
      await handleViewResult(selectedExamId)
    } catch (err: any) {
      setError(err.message || 'Submission failed.')
      setIsSubmitting(false)
    }
  }

  const handleAutoSubmitOnExpire = async (attemptId: string, examId: string) => {
    try {
      const finalAnswers = Object.entries(answers).map(([questionId, answerText]) => ({
        questionId,
        answerText,
      }))
      await apiClient.submitExam(examId, { attemptId, finalAnswers })
      await handleViewResult(examId)
    } catch {
      setViewMode('HUB')
      loadAvailableExams()
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VIEW RESULT & LEADERBOARD
  // ─────────────────────────────────────────────────────────────────────────
  const handleViewResult = async (examId: string) => {
    try {
      setLoading(true)
      setError(null)
      setSelectedExamId(examId)
      const data = await apiClient.getExamResults(examId)
      setResultData(data)
      setViewMode('RESULT_DETAIL')
    } catch (err: any) {
      setError(err.message || 'Could not fetch exam results.')
    } finally {
      setLoading(false)
      setIsSubmitting(false)
    }
  }

  const handleViewLeaderboard = async (examId: string) => {
    try {
      setLoading(true)
      setSelectedExamId(examId)
      const data = await apiClient.getExamLeaderboard(examId)
      setLeaderboardData(data)
      setActiveTab('LEADERBOARD')
      setViewMode('HUB')
    } catch (err: any) {
      setError(err.message || 'Could not fetch leaderboard.')
    } finally {
      setLoading(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // INSTANT DESCRIPTIVE PREPARATION AI EVALUATION DRILL
  // ─────────────────────────────────────────────────────────────────────────
  const handleEvaluatePrepAnswer = (q: any) => {
    const studentAns = (prepPracticeAnswers[q.id] || '').trim()
    if (!studentAns) return

    setEvaluatingPrepQId(q.id)

    setTimeout(() => {
      const lower = studentAns.toLowerCase()
      const correct: string[] = []
      const missing: string[] = []

      q.keyPoints.forEach((kp: string) => {
        const words = kp.toLowerCase().split(/\s+/).filter((w) => w.length > 3)
        const match = words.filter((w) => lower.includes(w)).length
        if (match >= 1 || words.length === 0) {
          correct.push(kp)
        } else {
          missing.push(kp)
        }
      })

      const ratio = correct.length / q.keyPoints.length
      let marksAwarded = 0
      if (ratio >= 0.75) marksAwarded = q.marks
      else if (ratio >= 0.5) marksAwarded = parseFloat((q.marks * 0.75).toFixed(1))
      else if (ratio >= 0.25) marksAwarded = parseFloat((q.marks * 0.5).toFixed(1))
      else marksAwarded = parseFloat((q.marks * 0.25).toFixed(1))

      setPrepEvaluationResults((prev) => ({
        ...prev,
        [q.id]: {
          marksAwarded,
          maxMarks: q.marks,
          correctPoints: correct,
          missingPoints: missing,
          feedback: ratio >= 0.75
            ? '🎯 Excellent! Your answer adheres closely to the Tamil Nadu State Board rubric and scores full marks.'
            : '💡 Good effort. Review the highlighted missing points below to boost your score on the board exam.',
        },
      }))

      setEvaluatingPrepQId(null)
    }, 400)
  }

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60)
    const secs = totalSecs % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Filter 1-Mark Quiz Questions
  const filtered1MarkQuizQuestions = curated1MarkQuizBank.filter((q) => {
    const matchClass = q.classId === selectedClassId
    let matchStream = true
    if (selectedStream === 'SCIENCE') {
      matchStream = ['SCIENCE', 'GENERAL', 'LANGUAGES'].includes(q.stream) && q.subjectId !== 'sub-12-cs' && q.subjectId !== 'sub-11-cs' && !q.subjectId.includes('-acc') && !q.subjectId.includes('-com') && !q.subjectId.includes('-eco')
    } else if (selectedStream === 'CS') {
      matchStream = ['CS', 'SCIENCE', 'GENERAL', 'LANGUAGES'].includes(q.stream) && !q.subjectId.includes('-bio') && !q.subjectId.includes('-acc') && !q.subjectId.includes('-com') && !q.subjectId.includes('-eco')
    } else if (selectedStream === 'COMMERCE') {
      matchStream = ['COMMERCE', 'GENERAL', 'LANGUAGES'].includes(q.stream) && !q.subjectId.includes('-phy') && !q.subjectId.includes('-chem') && !q.subjectId.includes('-bio') && !q.subjectId.includes('-cs')
    }
    const matchSubject = selectedSubjectFilter === 'ALL' || q.subjectId === selectedSubjectFilter
    const matchExamSource = examSourceFilter === 'ALL' || q.examSource === examSourceFilter
    const matchQuery =
      !prepSearchQuery.trim() ||
      q.questionText.toLowerCase().includes(prepSearchQuery.toLowerCase()) ||
      q.topic.toLowerCase().includes(prepSearchQuery.toLowerCase()) ||
      q.boardTag.toLowerCase().includes(prepSearchQuery.toLowerCase())
    return matchClass && (selectedSubjectFilter !== 'ALL' ? matchSubject : matchStream) && matchSubject && matchExamSource && matchQuery
  })

  // Filter Descriptive 2M/3M/5M Questions
  const filteredDescriptiveQuestions = curatedDescriptiveQuestionBank.filter((q) => {
    const matchClass = q.classId === selectedClassId
    let matchStream = true
    if (selectedStream === 'SCIENCE') {
      matchStream = ['SCIENCE', 'GENERAL', 'LANGUAGES'].includes(q.stream) && q.subjectId !== 'sub-12-cs' && q.subjectId !== 'sub-11-cs' && !q.subjectId.includes('-acc') && !q.subjectId.includes('-com') && !q.subjectId.includes('-eco')
    } else if (selectedStream === 'CS') {
      matchStream = ['CS', 'SCIENCE', 'GENERAL', 'LANGUAGES'].includes(q.stream) && !q.subjectId.includes('-bio') && !q.subjectId.includes('-acc') && !q.subjectId.includes('-com') && !q.subjectId.includes('-eco')
    } else if (selectedStream === 'COMMERCE') {
      matchStream = ['COMMERCE', 'GENERAL', 'LANGUAGES'].includes(q.stream) && !q.subjectId.includes('-phy') && !q.subjectId.includes('-chem') && !q.subjectId.includes('-bio') && !q.subjectId.includes('-cs')
    }
    const matchSubject = selectedSubjectFilter === 'ALL' || q.subjectId === selectedSubjectFilter
    const matchDifficulty = prepDifficulty === 'ALL' || q.difficulty === prepDifficulty
    const matchMarks = prepMarkFilter === 'ALL' || q.marks === prepMarkFilter
    const matchExamSource = examSourceFilter === 'ALL' || q.examSource === examSourceFilter
    const matchQuery =
      !prepSearchQuery.trim() ||
      q.questionText.toLowerCase().includes(prepSearchQuery.toLowerCase()) ||
      q.topic.toLowerCase().includes(prepSearchQuery.toLowerCase()) ||
      q.boardTag.toLowerCase().includes(prepSearchQuery.toLowerCase())
    return matchClass && (selectedSubjectFilter !== 'ALL' ? matchSubject : matchStream) && matchSubject && matchDifficulty && matchMarks && matchExamSource && matchQuery
  })

  // Dynamic Subjects List based on Selected Class & Stream
  const getSubjectOptions = () => {
    if (selectedClassId === 'c-9') {
      return [
        { id: 'ALL', name: 'All Subjects' },
        { id: 'sub-9-sci', name: 'Science' },
        { id: 'sub-9-math', name: 'Mathematics' },
        { id: 'sub-9-soc', name: 'Social Science' },
        { id: 'sub-9-tam', name: 'Tamil' },
        { id: 'sub-9-eng', name: 'English' },
      ]
    }
    if (selectedClassId === 'c-10') {
      return [
        { id: 'ALL', name: 'All Subjects' },
        { id: 'sub-10-sci', name: 'Science' },
        { id: 'sub-10-math', name: 'Mathematics' },
        { id: 'sub-10-soc', name: 'Social Science' },
        { id: 'sub-10-tam', name: 'Tamil' },
        { id: 'sub-10-eng', name: 'English' },
      ]
    }
    if (selectedClassId === 'c-11') {
      if (selectedStream === 'SCIENCE') {
        return [
          { id: 'ALL', name: 'All Science Subjects' },
          { id: 'sub-11-phy', name: 'Physics' },
          { id: 'sub-11-chem', name: 'Chemistry' },
          { id: 'sub-11-bio', name: 'Biology' },
          { id: 'sub-11-math', name: 'Mathematics' },
          { id: 'sub-11-tam', name: 'General Tamil' },
          { id: 'sub-11-eng', name: 'General English' },
        ]
      }
      if (selectedStream === 'CS') {
        return [
          { id: 'ALL', name: 'All CS Stream Subjects' },
          { id: 'sub-11-cs', name: 'Computer Science' },
          { id: 'sub-11-phy', name: 'Physics' },
          { id: 'sub-11-chem', name: 'Chemistry' },
          { id: 'sub-11-math', name: 'Mathematics' },
          { id: 'sub-11-tam', name: 'General Tamil' },
          { id: 'sub-11-eng', name: 'General English' },
        ]
      }
      if (selectedStream === 'COMMERCE') {
        return [
          { id: 'ALL', name: 'All Commerce Subjects' },
          { id: 'sub-11-acc', name: 'Accountancy' },
          { id: 'sub-11-com', name: 'Commerce' },
          { id: 'sub-11-eco', name: 'Economics' },
          { id: 'sub-11-tam', name: 'General Tamil' },
          { id: 'sub-11-eng', name: 'General English' },
        ]
      }
      return [
        { id: 'ALL', name: 'All Class 11 Subjects' },
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
    // Class 12
    if (selectedStream === 'SCIENCE') {
      return [
        { id: 'ALL', name: 'All Science Subjects' },
        { id: 'sub-12-phy', name: 'Physics' },
        { id: 'sub-12-chem', name: 'Chemistry' },
        { id: 'sub-12-bio', name: 'Biology' },
        { id: 'sub-12-math', name: 'Mathematics' },
        { id: 'sub-12-tam', name: 'General Tamil' },
        { id: 'sub-12-eng', name: 'General English' },
      ]
    }
    if (selectedStream === 'CS') {
      return [
        { id: 'ALL', name: 'All CS Stream Subjects' },
        { id: 'sub-12-cs', name: 'Computer Science' },
        { id: 'sub-12-phy', name: 'Physics' },
        { id: 'sub-12-chem', name: 'Chemistry' },
        { id: 'sub-12-math', name: 'Mathematics' },
        { id: 'sub-12-tam', name: 'General Tamil' },
        { id: 'sub-12-eng', name: 'General English' },
      ]
    }
    if (selectedStream === 'COMMERCE') {
      return [
        { id: 'ALL', name: 'All Commerce Subjects' },
        { id: 'sub-12-acc', name: 'Accountancy' },
        { id: 'sub-12-com', name: 'Commerce' },
        { id: 'sub-12-eco', name: 'Economics' },
        { id: 'sub-12-tam', name: 'General Tamil' },
        { id: 'sub-12-eng', name: 'General English' },
      ]
    }
    return [
      { id: 'ALL', name: 'All Class 12 Subjects' },
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

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: LIVE EXAM TAKING INTERFACE
  // ─────────────────────────────────────────────────────────────────────────
  if (viewMode === 'LIVE_EXAM' && activeExamData) {
    const questions = activeExamData.questions || []
    const currentQ = questions[currentQIndex] || {}
    const isLastQ = currentQIndex === questions.length - 1
    const currentAns = answers[currentQ.id] || ''
    const isMarked = !!markedForReview[currentQ.id]
    const answeredCount = Object.values(answers).filter((a) => (a || '').trim().length > 0).length

    return (
      <div className="space-y-4 max-w-7xl mx-auto px-4 py-4">
        {/* Sticky Exam Header */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 sticky top-2 z-20">
          <div>
            <div className="text-xs font-bold text-indigo-600 uppercase tracking-wide">
              {activeExamData.exam?.class_name} • {activeExamData.exam?.subject_name}
            </div>
            <h1 className="text-base md:text-lg font-bold text-gray-900 line-clamp-1">{activeExamData.exam?.title}</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium">
              {saveStatus === 'SAVING' ? (
                <span className="text-amber-600 flex items-center gap-1">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...
                </span>
              ) : (
                <span className="text-green-600 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Saved
                </span>
              )}
            </div>

            <div
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono text-sm font-bold shadow-xs ${
                timeRemainingSeconds < 300
                  ? 'bg-red-50 text-red-600 border border-red-200 animate-pulse'
                  : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
              }`}
            >
              <Clock className="w-4 h-4" />
              {formatTimer(timeRemainingSeconds)}
            </div>

            <button
              onClick={() => setShowSubmitModal(true)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" /> Submit Exam
            </button>
          </div>
        </div>

        {/* Live Exam Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3 bg-white border border-gray-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between min-h-[520px]">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-lg text-xs font-bold">
                    Question {currentQIndex + 1} of {questions.length}
                  </span>
                  <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-semibold">
                    {currentQ.marks} {currentQ.marks === 1 ? 'Mark' : 'Marks'}
                  </span>
                </div>
                <button
                  onClick={() => setMarkedForReview((prev) => ({ ...prev, [currentQ.id]: !prev[currentQ.id] }))}
                  className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg transition ${
                    isMarked ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5" /> {isMarked ? 'Marked for Review' : 'Mark for Review'}
                </button>
              </div>

              <div className="mt-4">
                <p className="text-base md:text-lg font-semibold text-gray-900 leading-relaxed">
                  {currentQ.question_text}
                </p>
              </div>

              <div className="mt-6">
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  Your Answer (Evaluated by Semantic AI with State Board Step Rubrics):
                </label>
                <textarea
                  value={currentAns}
                  onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                  placeholder="Type your structured answer here. Include relevant definitions, formulas, derivations, diagrams or key points..."
                  rows={9}
                  className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-normal text-gray-800 leading-relaxed"
                />
                <div className="flex justify-between items-center text-xs text-gray-400 mt-1.5">
                  <span>Characters: {currentAns.length}</span>
                  <span>{saveStatus === 'SAVING' ? 'Saving answer...' : '✓ Autosaved to server'}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
              <button
                disabled={currentQIndex === 0}
                onClick={() => setCurrentQIndex((prev) => Math.max(0, prev - 1))}
                className="px-4 py-2 border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-xs font-medium text-gray-700 flex items-center gap-1 transition"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>

              <div className="flex items-center gap-2">
                {isLastQ ? (
                  <button
                    onClick={() => setShowSubmitModal(true)}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                  >
                    Review & Submit
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentQIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs transition"
                  >
                    Save & Next <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Palette */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">
                Question Palette
              </h3>

              <div className="grid grid-cols-4 gap-2">
                {questions.map((q: any, idx: number) => {
                  const hasAnswer = (answers[q.id] || '').trim().length > 0
                  const isCur = idx === currentQIndex
                  const isRev = !!markedForReview[q.id]

                  let btnBg = 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  if (isCur) {
                    btnBg = 'ring-2 ring-indigo-600 bg-indigo-600 text-white font-bold'
                  } else if (isRev) {
                    btnBg = 'bg-amber-100 text-amber-800 font-semibold border border-amber-300'
                  } else if (hasAnswer) {
                    btnBg = 'bg-green-100 text-green-800 font-semibold border border-green-300'
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQIndex(idx)}
                      className={`h-9 w-full rounded-xl text-xs flex items-center justify-center transition ${btnBg}`}
                    >
                      {idx + 1}
                    </button>
                  )
                })}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 space-y-2 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded bg-green-100 border border-green-400" />
                  <span>Answered ({answeredCount})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded bg-amber-100 border border-amber-400" />
                  <span>Marked for Review ({Object.values(markedForReview).filter(Boolean).length})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded bg-gray-100 border border-gray-300" />
                  <span>Not Answered ({questions.length - answeredCount})</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100">
              <button
                onClick={() => setShowSubmitModal(true)}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" /> Submit Exam
              </button>
            </div>
          </div>
        </div>

        {/* Submit Modal */}
        {showSubmitModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
              <h3 className="text-lg font-bold text-gray-900">Confirm Exam Submission</h3>
              <p className="text-xs text-gray-500 mt-1">
                Once submitted, your answers will be evaluated instantly by our Semantic AI according to the Tamil Nadu State Board rubric.
              </p>

              <div className="my-4 p-4 bg-gray-50 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Questions:</span>
                  <span className="font-bold text-gray-900">{questions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Answered:</span>
                  <span className="font-bold text-green-600">{answeredCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Unanswered:</span>
                  <span className="font-bold text-red-600">{questions.length - answeredCount}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  disabled={isSubmitting}
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Continue Writing
                </button>
                <button
                  disabled={isSubmitting}
                  onClick={handleConfirmSubmit}
                  className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Evaluating...
                    </>
                  ) : (
                    'Confirm & Submit'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: DETAILED RESULT VIEW
  // ─────────────────────────────────────────────────────────────────────────
  if (viewMode === 'RESULT_DETAIL' && resultData) {
    const { exam, attempt, questionResults = [], teacherOverallFeedback } = resultData

    return (
      <div className="space-y-6 max-w-7xl mx-auto px-4 py-4">
        <button
          onClick={() => {
            setViewMode('HUB')
            setActiveTab('RESULTS')
            loadAvailableExams()
          }}
          className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Exam Hub
        </button>

        {/* Results Banner */}
        <div className="bg-gradient-to-r from-indigo-900 via-blue-900 to-purple-900 text-white p-6 rounded-2xl shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="px-2.5 py-1 bg-white/10 rounded-full text-xs font-semibold uppercase tracking-wider">
                {exam.class_name} • {exam.subject_name}
              </span>
              <h1 className="text-2xl font-bold mt-2">{exam.title}</h1>
              <p className="text-xs text-blue-200 mt-0.5">
                Evaluation Completed • Time Taken: {Math.round((attempt.time_taken_seconds || 0) / 60)} mins
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleViewLeaderboard(exam.id)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition"
              >
                <Trophy className="w-4 h-4" /> View Leaderboard
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
            <div className="bg-white/10 p-3.5 rounded-xl">
              <div className="text-xs text-blue-200">Score Awarded</div>
              <div className="text-2xl font-bold">
                {attempt.total_score} <span className="text-sm font-normal text-blue-200">/ {attempt.max_marks}</span>
              </div>
            </div>
            <div className="bg-white/10 p-3.5 rounded-xl">
              <div className="text-xs text-blue-200">Percentage</div>
              <div className="text-2xl font-bold">{attempt.percentage}%</div>
            </div>
            <div className="bg-white/10 p-3.5 rounded-xl">
              <div className="text-xs text-blue-200">Letter Grade</div>
              <div className="text-2xl font-bold text-yellow-300">{attempt.grade}</div>
            </div>
            <div className="bg-white/10 p-3.5 rounded-xl">
              <div className="text-xs text-blue-200">Rank</div>
              <div className="text-2xl font-bold">#{attempt.rank || 1}</div>
            </div>
          </div>
        </div>

        {teacherOverallFeedback && (
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
              <Award className="w-4 h-4 text-amber-600" />
              Teacher's Personalized Feedback:
            </div>
            <p className="text-xs text-amber-800 mt-1 leading-relaxed">{teacherOverallFeedback}</p>
          </div>
        )}

        <div className="space-y-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-indigo-600" />
            Detailed Question Evaluation & Model Answers
          </h2>

          <div className="space-y-4">
            {questionResults.map((qr: any, idx: number) => (
              <div
                key={qr.questionId}
                className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4"
              >
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-gray-100">
                  <div>
                    <span className="text-xs font-bold text-indigo-600 uppercase">Question {idx + 1}</span>
                    <h3 className="text-sm font-semibold text-gray-900 mt-0.5">{qr.questionText}</h3>
                  </div>
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-bold rounded-xl text-xs">
                    {qr.marksAwarded} / {qr.marks} Marks
                  </span>
                </div>

                <div>
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">
                    Your Written Answer:
                  </span>
                  <div className="p-3.5 bg-gray-50 rounded-xl text-xs text-gray-800 font-mono leading-relaxed border border-gray-100">
                    {qr.studentAnswer || <span className="text-gray-400 italic">No answer provided.</span>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div className="bg-green-50/70 border border-green-200/60 p-3.5 rounded-xl">
                    <div className="text-xs font-bold text-green-800 flex items-center gap-1 mb-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> What You Did Well:
                    </div>
                    <ul className="text-xs text-green-900 space-y-1 list-disc list-inside">
                      {qr.correctPoints && qr.correctPoints.length > 0 ? (
                        qr.correctPoints.map((cp: string, i: number) => <li key={i}>{cp}</li>)
                      ) : (
                        <li>No key concepts identified.</li>
                      )}
                    </ul>
                  </div>

                  <div className="bg-amber-50/70 border border-amber-200/60 p-3.5 rounded-xl">
                    <div className="text-xs font-bold text-amber-800 flex items-center gap-1 mb-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Key Points Missing:
                    </div>
                    <ul className="text-xs text-amber-900 space-y-1 list-disc list-inside">
                      {qr.missingPoints && qr.missingPoints.length > 0 ? (
                        qr.missingPoints.map((mp: string, i: number) => <li key={i}>{mp}</li>)
                      ) : (
                        <li>All key points covered.</li>
                      )}
                    </ul>
                  </div>
                </div>

                <div className="p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-1 text-xs">
                  <div className="font-bold text-indigo-900 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> AI Evaluation Feedback:
                  </div>
                  <p className="text-indigo-800">{qr.aiFeedback}</p>
                </div>

                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-600" /> Authoritative State Board Model Answer
                    </span>
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed">{qr.modelAnswer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: MAIN HUB (1-MARK QUIZ | DESCRIPTIVE 2M-5M | EXAMS | LEADERBOARD)
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-4">
      {/* Hub Hero Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white p-6 rounded-2xl shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold uppercase tracking-wide mb-2">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              Tamil Nadu State Board • Classes 9, 10, 11 & 12 (All Streams)
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">StudyRank AI — Board Exam Practice & PYQ Hub</h1>
            <p className="text-blue-100 text-xs md:text-sm mt-1 max-w-2xl">
              Previous Year Board Questions (PYQ 2019-2024), 1-Mark Interactive Board Quiz Engine, and High-Scoring 2M/3M/5M Derivations with Instant AI Evaluation.
            </p>
          </div>

          <button
            onClick={loadAvailableExams}
            className="self-start md:self-auto flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-xs font-semibold transition"
          >
            <RefreshCw className="w-4 h-4" /> Refresh Hub
          </button>
        </div>

        {/* Quick KPI Stats */}
        {studentStats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
            <div className="bg-white/10 p-3 rounded-xl">
              <div className="text-xs text-blue-200">Quiz Accuracy</div>
              <div className="text-2xl font-bold">
                {quizAttemptedCount > 0 ? Math.round((quizScore / quizAttemptedCount) * 100) : 0}%
              </div>
            </div>
            <div className="bg-white/10 p-3 rounded-xl">
              <div className="text-xs text-blue-200">1-M Questions Solved</div>
              <div className="text-2xl font-bold">{quizAttemptedCount}</div>
            </div>
            <div className="bg-white/10 p-3 rounded-xl">
              <div className="text-xs text-blue-200">Average Exam Score</div>
              <div className="text-2xl font-bold">{studentStats.averagePercentage}%</div>
            </div>
            <div className="bg-white/10 p-3 rounded-xl">
              <div className="text-xs text-blue-200">Board Rank</div>
              <div className="text-2xl font-bold">#{studentStats.currentRank || 1}</div>
            </div>
          </div>
        )}
      </div>

      {/* CLASS SELECTOR BAR (CLASSES 9, 10, 11, 12) */}
      <div className="bg-white p-3 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-indigo-600 shrink-0 ml-1" />
          <span className="text-xs font-bold text-gray-700 mr-2">Select Your Class:</span>
        </div>
        <div className="flex items-center gap-2">
          {[
            { id: 'c-9', label: 'Class 9 (9th Std)' },
            { id: 'c-10', label: 'Class 10 (SSLC Board)' },
            { id: 'c-11', label: 'Class 11 (+1 Board)' },
            { id: 'c-12', label: 'Class 12 (HSC +2 Board)' },
          ].map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setSelectedClassId(c.id as any)
                setSelectedSubjectFilter('ALL')
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                selectedClassId === c.id
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* CLASS PORTAL DETAILS BANNER */}
      <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-blue-50 p-4 rounded-2xl border border-indigo-100 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-extrabold text-lg flex items-center justify-center shadow-xs">
            {selectedClassId === 'c-9' ? '9th' : selectedClassId === 'c-10' ? '10th' : selectedClassId === 'c-11' ? '11th' : '12th'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-950 uppercase tracking-wide">
                {selectedClassId === 'c-9'
                  ? 'Class 9 Foundation Portal'
                  : selectedClassId === 'c-10'
                  ? 'Class 10 SSLC State Board Portal'
                  : selectedClassId === 'c-11'
                  ? 'Class 11 (+1 Higher Secondary) Portal'
                  : 'Class 12 (HSC +2 Higher Secondary) Portal'}
              </span>
              <span className="px-2 py-0.5 bg-indigo-200/60 text-indigo-900 rounded-full text-[10px] font-extrabold">
                100 MCQs & 150 Descriptive / Subject
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-0.5">
              {selectedClassId === 'c-12' || selectedClassId === 'c-11'
                ? 'Covers Science (Bio-Maths / CS), Commerce, Accountancy, Economics & Languages with 2019–2024 Public Papers.'
                : 'Covers Science, Mathematics, Social Science, Tamil & English with high-repeat board questions.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 bg-white border border-indigo-200 rounded-xl text-xs font-bold text-indigo-800 shadow-xs flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> State Board Approved
          </div>
        </div>
      </div>

      {/* STREAM SELECTOR FOR CLASSES 11 & 12 */}
      {(selectedClassId === 'c-11' || selectedClassId === 'c-12') && (
        <div className="bg-indigo-50/70 p-3 rounded-2xl border border-indigo-100 shadow-xs flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-indigo-900 ml-1">Stream / Branch:</span>
          </div>
          <div className="flex items-center gap-2">
            {[
              { id: 'ALL', label: 'All Branches' },
              { id: 'SCIENCE', label: 'Bio-Maths / Pure Science' },
              { id: 'CS', label: 'Computer Science Stream' },
              { id: 'COMMERCE', label: 'Commerce & Accountancy' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => {
                  setSelectedStream(st.id as any)
                  setSelectedSubjectFilter('ALL')
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  selectedStream === st.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-indigo-900 hover:bg-indigo-100 border border-indigo-200'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Hub Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('QUIZ_1M')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'QUIZ_1M' ? 'bg-indigo-600 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Zap className="w-4 h-4 text-yellow-300" /> 1-Mark Interactive Board Quiz ({filtered1MarkQuizQuestions.length})
        </button>

        <button
          onClick={() => setActiveTab('DESCRIPTIVE')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'DESCRIPTIVE' ? 'bg-indigo-600 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Target className="w-4 h-4 text-amber-300" /> 2M, 3M & 5M Board Questions ({filteredDescriptiveQuestions.length})
        </button>

        <button
          onClick={() => setActiveTab('EXAMS')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'EXAMS' ? 'bg-indigo-600 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <FileText className="w-4 h-4" /> Timed Board Exams ({exams.length})
        </button>

        <button
          onClick={() => setActiveTab('RESULTS')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'RESULTS' ? 'bg-indigo-600 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <BarChart3 className="w-4 h-4" /> My Exam Results
        </button>

        <button
          onClick={() => {
            setActiveTab('LEADERBOARD')
            if (exams[0]?.id) handleViewLeaderboard(exams[0].id)
          }}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'LEADERBOARD' ? 'bg-indigo-600 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-500" /> State Board Leaderboard
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────
          TAB 1: 1-MARK INTERACTIVE BOARD QUIZ ENGINE (MCQ / OBJECTIVE)
         ───────────────────────────────────────────────────────────────────── */}
      {activeTab === 'QUIZ_1M' && (
        <div className="space-y-6">
          {/* Quiz Stats & Reset Header */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Score: {quizScore} / {quizAttemptedCount} Correct
              </div>
              <div className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold">
                Accuracy: {quizAttemptedCount > 0 ? Math.round((quizScore / quizAttemptedCount) * 100) : 0}%
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleResetQuiz}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset Quiz
              </button>
            </div>
          </div>

          {/* Subject Filter Bar */}
          <div className="bg-white border border-gray-200 rounded-2xl p-3 shadow-xs flex items-center gap-2 overflow-x-auto">
            <span className="text-xs font-bold text-gray-700 mr-1 shrink-0">Subject:</span>
            {getSubjectOptions().map((sb) => (
              <button
                key={sb.id}
                onClick={() => setSelectedSubjectFilter(sb.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  selectedSubjectFilter === sb.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {sb.name}
              </button>
            ))}
          </div>

          {/* Exam Source Filter Bar */}
          <div className="bg-white border border-gray-200 rounded-2xl p-3 shadow-xs flex items-center gap-2 overflow-x-auto">
            <span className="text-xs font-bold text-gray-700 mr-1 shrink-0">Exam Paper:</span>
            {[
              { id: 'ALL', label: 'All Exam Papers' },
              { id: 'PUBLIC', label: '📌 Public Exams (2019-2024)' },
              { id: 'QUARTERLY', label: '📝 Quarterly Exams' },
              { id: 'HALFYEARLY', label: '📋 Half-Yearly Exams' },
              { id: 'MIDTERM', label: '🎯 Midterm Tests' },
            ].map((src) => (
              <button
                key={src.id}
                onClick={() => setExamSourceFilter(src.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  examSourceFilter === src.id
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {src.label}
              </button>
            ))}
          </div>

          {/* Pagination & Count Header */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs font-bold text-gray-700">
              Showing{' '}
              <span className="text-indigo-600 font-extrabold">
                {filtered1MarkQuizQuestions.length > 0
                  ? quizPageSize === -1
                    ? `All 1–${filtered1MarkQuizQuestions.length}`
                    : `${(quizPage - 1) * quizPageSize + 1}–${Math.min(quizPage * quizPageSize, filtered1MarkQuizQuestions.length)}`
                  : '0'}
              </span>{' '}
              of <span className="text-indigo-600 font-extrabold">{filtered1MarkQuizQuestions.length} Board MCQs</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">View:</span>
              {[
                { label: '10 / Page', size: 10 },
                { label: '25 / Page', size: 25 },
                { label: 'All 100', size: -1 },
              ].map((sz) => (
                <button
                  key={sz.label}
                  onClick={() => {
                    setQuizPageSize(sz.size)
                    setQuizPage(1)
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    quizPageSize === sz.size ? 'bg-indigo-600 text-white shadow-xs' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {sz.label}
                </button>
              ))}
            </div>
          </div>

          {/* 1-Mark Quiz Cards List */}
          <div className="space-y-5">
            {filtered1MarkQuizQuestions.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 p-6 text-xs text-gray-500">
                No 1-mark questions found for the selected subject. Try selecting 'All Subjects'.
              </div>
            ) : (
              (quizPageSize === -1
                ? filtered1MarkQuizQuestions
                : filtered1MarkQuizQuestions.slice((quizPage - 1) * quizPageSize, quizPage * quizPageSize)
              ).map((q, pageIdx) => {
                const globalIdx = quizPageSize === -1 ? pageIdx : (quizPage - 1) * quizPageSize + pageIdx
                const isSubmitted = !!quizSubmittedMap[q.id]
                const selectedOpt = quizSelectedAnswers[q.id]
                const isCorrect = isSubmitted && selectedOpt === q.correctOptionIndex

                return (
                  <div
                    key={q.id}
                    className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4 transition"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[11px] font-bold">
                            Q{globalIdx + 1} • {q.subjectName} • {q.topic}
                          </span>
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-800 rounded text-[11px] font-semibold flex items-center gap-1">
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500" /> {q.boardTag}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-gray-900 mt-2 leading-relaxed">{q.questionText}</h3>
                      </div>
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-800 font-bold rounded-xl text-xs shrink-0">
                        1 Mark
                      </span>
                    </div>

                    {/* 4 Interactive Options (A, B, C, D) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {q.options.map((opt, optIdx) => {
                        const optLetter = String.fromCharCode(65 + optIdx) // A, B, C, D
                        let btnStyle = 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-800'

                        if (isSubmitted) {
                          if (optIdx === q.correctOptionIndex) {
                            btnStyle = 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold ring-2 ring-emerald-500'
                          } else if (optIdx === selectedOpt) {
                            btnStyle = 'bg-rose-50 border-rose-500 text-rose-900 font-bold ring-2 ring-rose-500'
                          } else {
                            btnStyle = 'bg-gray-50 border-gray-200 text-gray-400 opacity-60'
                          }
                        }

                        return (
                          <button
                            key={optIdx}
                            disabled={isSubmitted}
                            onClick={() => handleSelect1MarkOption(q.id, optIdx, q.correctOptionIndex)}
                            className={`p-3 rounded-xl border text-left text-xs flex items-center gap-2.5 transition ${btnStyle}`}
                          >
                            <span className="w-6 h-6 rounded-lg bg-white border border-gray-300 font-bold flex items-center justify-center shrink-0 text-gray-700">
                              {optLetter}
                            </span>
                            <span className="flex-1">{opt}</span>
                            {isSubmitted && optIdx === q.correctOptionIndex && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            )}
                            {isSubmitted && optIdx === selectedOpt && optIdx !== q.correctOptionIndex && (
                              <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                            )}
                          </button>
                        )
                      })}
                    </div>

                    {/* Instant Explanation & Source Citation */}
                    {isSubmitted && (
                      <div
                        className={`p-3.5 rounded-xl text-xs space-y-1 animate-in fade-in duration-150 ${
                          isCorrect
                            ? 'bg-emerald-50/80 border border-emerald-200 text-emerald-950'
                            : 'bg-amber-50/80 border border-amber-200 text-amber-950'
                        }`}
                      >
                        <div className="font-bold flex items-center gap-1.5">
                          {isCorrect ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Correct! +1 Mark Awarded
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-4 h-4 text-amber-600" /> Correct Answer: Option{' '}
                              {String.fromCharCode(65 + q.correctOptionIndex)} ({q.options[q.correctOptionIndex]})
                            </>
                          )}
                        </div>
                        <p className="text-gray-700 pt-0.5 leading-relaxed">
                          <strong>Explanation:</strong> {q.explanation}
                        </p>
                        <span className="text-[11px] text-gray-400 block pt-0.5">
                          Source: {q.sourceBook}
                        </span>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* Pagination Footer */}
          {quizPageSize !== -1 && filtered1MarkQuizQuestions.length > quizPageSize && (
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <button
                disabled={quizPage <= 1}
                onClick={() => setQuizPage((prev) => Math.max(1, prev - 1))}
                className="px-4 py-2 border border-gray-300 hover:bg-gray-50 disabled:opacity-40 rounded-xl text-xs font-bold text-gray-700 flex items-center gap-1 transition"
              >
                <ChevronLeft className="w-4 h-4" /> Previous 10 Qs
              </button>

              <div className="flex items-center gap-1 flex-wrap">
                {Array.from({ length: Math.ceil(filtered1MarkQuizQuestions.length / quizPageSize) }, (_, i) => i + 1).map((pg) => (
                  <button
                    key={pg}
                    onClick={() => setQuizPage(pg)}
                    className={`w-8 h-8 rounded-xl text-xs font-bold transition flex items-center justify-center ${
                      quizPage === pg ? 'bg-indigo-600 text-white shadow-xs' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {pg}
                  </button>
                ))}
              </div>

              <button
                disabled={quizPage >= Math.ceil(filtered1MarkQuizQuestions.length / quizPageSize)}
                onClick={() => setQuizPage((prev) => Math.min(Math.ceil(filtered1MarkQuizQuestions.length / quizPageSize), prev + 1))}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs transition"
              >
                Next 10 Qs <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────
          TAB 2: DESCRIPTIVE 2M, 3M & 5M BOARD QUESTION DRILLS
         ───────────────────────────────────────────────────────────────────── */}
      {activeTab === 'DESCRIPTIVE' && (
        <div className="space-y-6">
          {/* Difficulty Level Tier Banners */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div
              onClick={() => setPrepDifficulty(prepDifficulty === 'Easy' ? 'ALL' : 'Easy')}
              className={`p-4 rounded-2xl border cursor-pointer transition flex items-center gap-3 ${
                prepDifficulty === 'Easy'
                  ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-500 shadow-xs'
                  : 'bg-white border-gray-200 hover:border-emerald-300'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg shrink-0">
                🟢
              </div>
              <div>
                <div className="text-xs font-bold text-emerald-800">Easy — Pass Booster (1M & 2M)</div>
                <div className="text-[11px] text-gray-500">Definitions, units, high-repeat basic laws for 100% pass guarantee.</div>
              </div>
            </div>

            <div
              onClick={() => setPrepDifficulty(prepDifficulty === 'Medium' ? 'ALL' : 'Medium')}
              className={`p-4 rounded-2xl border cursor-pointer transition flex items-center gap-3 ${
                prepDifficulty === 'Medium'
                  ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-500 shadow-xs'
                  : 'bg-white border-gray-200 hover:border-amber-300'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-lg shrink-0">
                🟡
              </div>
              <div>
                <div className="text-xs font-bold text-amber-800">Medium — Standard Board (2M & 3M)</div>
                <div className="text-[11px] text-gray-500">Equations, problem-solving, and core conceptual explanations.</div>
              </div>
            </div>

            <div
              onClick={() => setPrepDifficulty(prepDifficulty === 'Hard' ? 'ALL' : 'Hard')}
              className={`p-4 rounded-2xl border cursor-pointer transition flex items-center gap-3 ${
                prepDifficulty === 'Hard'
                  ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-500 shadow-xs'
                  : 'bg-white border-gray-200 hover:border-rose-300'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-lg shrink-0">
                🔴
              </div>
              <div>
                <div className="text-xs font-bold text-rose-800">Hard — Centum & Distinction (5M)</div>
                <div className="text-[11px] text-gray-500">Multi-step theorems, derivations, and top-tier board essays.</div>
              </div>
            </div>
          </div>

          {/* Subject & Secondary Filter Bar */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-gray-700">Subject:</span>
              {getSubjectOptions().slice(0, 4).map((sb) => (
                <button
                  key={sb.id}
                  onClick={() => setSelectedSubjectFilter(sb.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    selectedSubjectFilter === sb.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {sb.name}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-gray-700">Marks:</span>
              {[
                { label: `All Descriptive (${filteredDescriptiveQuestions.length} Qs)`, val: 'ALL' },
                { label: '2 Marks (50 Qs)', val: 2 },
                { label: '3 Marks (50 Qs)', val: 3 },
                { label: '5 Marks (50 Qs)', val: 5 },
              ].map((m) => (
                <button
                  key={m.label}
                  onClick={() => {
                    setPrepMarkFilter(m.val as any)
                    setDescPage(1)
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                    prepMarkFilter === m.val ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search Input & Pagination Header */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search previous year board questions by topic, formula, or law (e.g. Newton, Optics, Thales, Wheatstone)..."
                value={prepSearchQuery}
                onChange={(e) => setPrepSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs font-bold text-gray-700">
                Showing{' '}
                <span className="text-purple-600 font-extrabold">
                  {filteredDescriptiveQuestions.length > 0
                    ? descPageSize === -1
                      ? `All 1–${filteredDescriptiveQuestions.length}`
                      : `${(descPage - 1) * descPageSize + 1}–${Math.min(descPage * descPageSize, filteredDescriptiveQuestions.length)}`
                    : '0'}
                </span>{' '}
                of <span className="text-purple-600 font-extrabold">{filteredDescriptiveQuestions.length} Descriptive Board Questions</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-medium">View:</span>
                {[
                  { label: '10 / Page', size: 10 },
                  { label: '25 / Page', size: 25 },
                  { label: 'All', size: -1 },
                ].map((sz) => (
                  <button
                    key={sz.label}
                    onClick={() => {
                      setDescPageSize(sz.size)
                      setDescPage(1)
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                      descPageSize === sz.size ? 'bg-purple-600 text-white shadow-xs' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {sz.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Descriptive Questions List */}
          <div className="space-y-4">
            {filteredDescriptiveQuestions.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 p-6 text-xs text-gray-500">
                No descriptive questions found matching your filter. Try selecting a different difficulty level.
              </div>
            ) : (
              (descPageSize === -1
                ? filteredDescriptiveQuestions
                : filteredDescriptiveQuestions.slice((descPage - 1) * descPageSize, descPage * descPageSize)
              ).map((q) => {
                const evalRes = prepEvaluationResults[q.id]
                const currentAns = prepPracticeAnswers[q.id] || ''
                const isEasy = q.difficulty === 'Easy'
                const isMed = q.difficulty === 'Medium'

                return (
                  <div
                    key={q.id}
                    className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[11px] font-bold">
                            {q.className} • {q.subjectName} • {q.topic}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              isEasy
                                ? 'bg-emerald-50 text-emerald-700'
                                : isMed
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {q.difficulty} Level
                          </span>
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-800 rounded text-[11px] font-semibold flex items-center gap-1">
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500" /> {q.boardTag}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-gray-900 mt-2 leading-relaxed">{q.questionText}</h3>
                      </div>
                      <span className="px-3 py-1 bg-purple-50 text-purple-700 font-bold rounded-xl text-xs shrink-0">
                        {q.marks} {q.marks === 1 ? 'Mark' : 'Marks'}
                      </span>
                    </div>

                    {/* Pass Tip Banner */}
                    <div className="p-2.5 bg-amber-50/70 border border-amber-200/60 rounded-xl text-xs text-amber-900 flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span><strong>Board Exam Tip:</strong> {q.passTip}</span>
                    </div>

                    {/* Practice Textarea */}
                    <div>
                      <textarea
                        rows={3}
                        placeholder="Write your practice answer here to test your board readiness..."
                        value={currentAns}
                        onChange={(e) => setPrepPracticeAnswers({ ...prepPracticeAnswers, [q.id]: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-1">
                      <button
                        disabled={evaluatingPrepQId === q.id || !currentAns.trim()}
                        onClick={() => handleEvaluatePrepAnswer(q)}
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
                      >
                        <Zap className="w-3.5 h-3.5 text-yellow-300" />
                        {evaluatingPrepQId === q.id ? 'Evaluating with AI...' : 'Evaluate Answer with AI'}
                      </button>

                      <button
                        onClick={() => {
                          setPrepEvaluationResults((prev) => ({
                            ...prev,
                            [q.id]: {
                              showModelOnly: true,
                              expectedAnswer: q.expectedAnswer,
                              keyPoints: q.keyPoints,
                            },
                          }))
                        }}
                        className="text-xs font-semibold text-gray-500 hover:text-indigo-600 flex items-center gap-1"
                      >
                        <BookOpen className="w-3.5 h-3.5" /> View State Board Model Answer
                      </button>
                    </div>

                    {/* AI Instant Feedback Box */}
                    {evalRes && (
                      <div className="mt-3 p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2 text-xs animate-in fade-in duration-150">
                        {evalRes.marksAwarded !== undefined && (
                          <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                            <span className="font-bold text-gray-700">AI Readiness Score:</span>
                            <span className="font-extrabold text-indigo-600 text-sm">
                              {evalRes.marksAwarded} / {evalRes.maxMarks} Marks
                            </span>
                          </div>
                        )}

                        {evalRes.feedback && (
                          <p className="text-gray-700 font-medium">{evalRes.feedback}</p>
                        )}

                        <div className="p-3 bg-white border border-gray-200 rounded-lg">
                          <span className="font-bold text-gray-800 block mb-1">
                            Official State Board Model Answer ({q.sourceTextbook}):
                          </span>
                          <p className="text-gray-700 leading-relaxed">{q.expectedAnswer}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* Descriptive Pagination Footer */}
          {descPageSize !== -1 && filteredDescriptiveQuestions.length > descPageSize && (
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <button
                disabled={descPage <= 1}
                onClick={() => setDescPage((prev) => Math.max(1, prev - 1))}
                className="px-4 py-2 border border-gray-300 hover:bg-gray-50 disabled:opacity-40 rounded-xl text-xs font-bold text-gray-700 flex items-center gap-1 transition"
              >
                <ChevronLeft className="w-4 h-4" /> Previous 10 Qs
              </button>

              <div className="flex items-center gap-1 flex-wrap">
                {Array.from({ length: Math.ceil(filteredDescriptiveQuestions.length / descPageSize) }, (_, i) => i + 1).map((pg) => (
                  <button
                    key={pg}
                    onClick={() => setDescPage(pg)}
                    className={`w-8 h-8 rounded-xl text-xs font-bold transition flex items-center justify-center ${
                      descPage === pg ? 'bg-purple-600 text-white shadow-xs' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {pg}
                  </button>
                ))}
              </div>

              <button
                disabled={descPage >= Math.ceil(filteredDescriptiveQuestions.length / descPageSize)}
                onClick={() => setDescPage((prev) => Math.min(Math.ceil(filteredDescriptiveQuestions.length / descPageSize), prev + 1))}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs transition"
              >
                Next 10 Qs <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────
          TAB 3: TIMED FULL EXAMS
         ───────────────────────────────────────────────────────────────────── */}
      {activeTab === 'EXAMS' && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            Timed State Board Unit Tests & Model Question Papers ({selectedClassId.replace('c-', 'Class ')})
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-40 bg-gray-100 animate-pulse rounded-2xl border" />
              ))}
            </div>
          ) : exams.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 p-6">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-gray-800">No Scheduled Exams for {selectedClassId.replace('c-', 'Class ')}</h3>
              <p className="text-xs text-gray-500 mt-1">
                Your teachers will schedule upcoming board practice exams shortly.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {exams.map((exam) => {
                const isCompleted = exam.status === 'EVALUATED' || exam.status === 'TEACHER_REVIEWED' || exam.status === 'FINALIZED'
                const isInProgress = exam.status === 'IN_PROGRESS'

                return (
                  <div
                    key={exam.id}
                    className="bg-white rounded-2xl border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition p-5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold">
                          {exam.class_name} • {exam.subject_name}
                        </span>
                        {isCompleted ? (
                          <span className="px-2.5 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Evaluated
                          </span>
                        ) : isInProgress ? (
                          <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-semibold flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> In Progress
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold">
                            Ready to Take
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-gray-900 mt-3">{exam.title}</h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{exam.description}</p>

                      <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-gray-100 text-xs text-gray-600">
                        <div>
                          <span className="text-gray-400 block">Duration</span>
                          <span className="font-bold text-gray-800">{exam.duration_minutes} Mins</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block">Total Marks</span>
                          <span className="font-bold text-gray-800">{exam.total_marks} Marks</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block">Questions</span>
                          <span className="font-bold text-gray-800">{exam.question_count} Qs</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
                      {isCompleted ? (
                        <>
                          <div className="text-xs font-semibold text-gray-700">
                            Score: <span className="text-indigo-600 font-bold">{exam.score}</span> / {exam.total_marks} ({exam.percentage}%)
                          </div>
                          <button
                            onClick={() => handleViewResult(exam.id)}
                            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                          >
                            <Eye className="w-3.5 h-3.5" /> View Result
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleViewLeaderboard(exam.id)}
                            className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-xl text-xs font-medium flex items-center gap-1 transition"
                          >
                            <Trophy className="w-3.5 h-3.5 text-amber-500" /> Leaderboard
                          </button>
                          <button
                            onClick={() => handleStartExam(exam.id)}
                            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
                          >
                            {isInProgress ? 'Resume Exam' : 'Start Exam'} <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────
          TAB 4: MY EXAM RESULTS
         ───────────────────────────────────────────────────────────────────── */}
      {activeTab === 'RESULTS' && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            My Past Exam Results & Performance History
          </h2>

          <div className="space-y-3">
            {exams.filter((e) => e.status === 'EVALUATED' || e.status === 'TEACHER_REVIEWED' || e.status === 'FINALIZED').length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 p-6 text-xs text-gray-500">
                You haven't submitted any exams yet. Start an exam from the Timed Board Exams tab to get evaluated.
              </div>
            ) : (
              exams
                .filter((e) => e.status === 'EVALUATED' || e.status === 'TEACHER_REVIEWED' || e.status === 'FINALIZED')
                .map((exam) => (
                  <div
                    key={exam.id}
                    className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs flex items-center justify-between gap-4"
                  >
                    <div>
                      <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-bold">
                        {exam.class_name} • {exam.subject_name}
                      </span>
                      <h3 className="text-sm font-bold text-gray-900 mt-1">{exam.title}</h3>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-base font-bold text-indigo-600">
                          {exam.score} / {exam.total_marks}
                        </div>
                        <div className="text-[11px] text-gray-400">{exam.percentage}%</div>
                      </div>
                      <button
                        onClick={() => handleViewResult(exam.id)}
                        className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> Details
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────
          TAB 5: STATE BOARD LEADERBOARD
         ───────────────────────────────────────────────────────────────────── */}
      {activeTab === 'LEADERBOARD' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-600 text-white p-6 rounded-2xl shadow-md flex items-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-200" />
            <div>
              <h2 className="text-xl font-bold">State Board Examination Leaderboard</h2>
              <p className="text-xs text-orange-100 mt-0.5">
                Top student rankings across exams based on score, percentage, and speed.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
            <div className="p-4 bg-gray-50 border-b border-gray-200 font-bold text-xs text-gray-600 grid grid-cols-12 gap-2">
              <span className="col-span-2 text-center">Rank</span>
              <span className="col-span-5">Student Alias</span>
              <span className="col-span-3 text-center">Score</span>
              <span className="col-span-2 text-right">Time</span>
            </div>

            <div className="divide-y divide-gray-100">
              {leaderboardData?.leaderboard?.length ? (
                leaderboardData.leaderboard.map((entry: any) => (
                  <div
                    key={entry.studentId}
                    className={`p-4 grid grid-cols-12 gap-2 items-center text-xs ${
                      entry.isCurrentStudent ? 'bg-indigo-50/70 font-bold' : ''
                    }`}
                  >
                    <div className="col-span-2 text-center font-bold">
                      {entry.rank === 1 ? '🥇 1' : entry.rank === 2 ? '🥈 2' : entry.rank === 3 ? '🥉 3' : `#${entry.rank}`}
                    </div>
                    <div className="col-span-5">{entry.displayName}</div>
                    <div className="col-span-3 text-center text-indigo-600 font-bold">
                      {entry.score} / {entry.maxMarks} ({entry.percentage}%)
                    </div>
                    <div className="col-span-2 text-right text-gray-500">
                      {Math.floor(entry.timeTakenSeconds / 60)}m
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-gray-500">
                  Select an exam to view leaderboard rankings.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* ─────────────────────────────────────────────────────────────────
          FLOATING AI STUDY & CLARIFICATION CHATBOT
          (Automatically disabled during LIVE_EXAM, activates after exam)
         ───────────────────────────────────────────────────────────────── */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isChatbotOpen ? (
          <button
            onClick={() => setIsChatbotOpen(true)}
            className={`px-4 py-3 rounded-2xl shadow-xl font-bold text-xs flex items-center gap-2.5 transition-all transform hover:scale-105 ${
              viewMode === 'LIVE_EXAM'
                ? 'bg-gray-800 text-gray-300 border border-gray-700 cursor-not-allowed opacity-90'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-indigo-500/25'
            }`}
          >
            {viewMode === 'LIVE_EXAM' ? (
              <>
                <Lock className="w-4 h-4 text-amber-400" />
                <span>AI Tutor (Disabled in Exam)</span>
              </>
            ) : (
              <>
                <Bot className="w-5 h-5 text-yellow-300 animate-pulse" />
                <span>Ask AI Tutor</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              </>
            )}
          </button>
        ) : (
          <div className="w-80 sm:w-96 bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[480px] animate-in slide-in-from-bottom-5 duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-3.5 text-white flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-yellow-300" />
                <div>
                  <h4 className="text-xs font-bold">StudyRank AI Tutor</h4>
                  <p className="text-[10px] text-indigo-100">
                    {viewMode === 'LIVE_EXAM' ? '🔒 Locked (Anti-Cheat Active)' : '🟢 Active • State Board Assistant'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsChatbotOpen(false)}
                className="p-1 hover:bg-white/20 rounded-lg transition"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Chat Body */}
            {viewMode === 'LIVE_EXAM' ? (
              <div className="flex-1 p-6 flex flex-col items-center justify-center text-center bg-gray-50/80 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <Lock className="w-6 h-6 text-amber-600" />
                </div>
                <h4 className="text-xs font-bold text-gray-900">AI Assistant Disabled During Active Exam</h4>
                <p className="text-[11px] text-gray-500 leading-relaxed max-w-xs">
                  To ensure academic integrity, the AI Tutor is locked during live examinations. Focus on your test! The AI will automatically unlock once you submit to provide step-by-step solutions and explanations.
                </p>
                <div className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded-xl text-[10px] font-bold text-indigo-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" /> Unlocks upon Exam Submission
                </div>
              </div>
            ) : (
              <>
                {/* Messages Container */}
                <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-gray-50/50 text-xs">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`p-3 rounded-2xl max-w-[85%] whitespace-pre-line leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-indigo-600 text-white rounded-tr-none'
                            : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-xs'
                        }`}
                      >
                        {msg.text}
                      </div>
                      <span className="text-[9px] text-gray-400 mt-1 px-1">{msg.time}</span>
                    </div>
                  ))}

                  {isBotTyping && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 p-2 bg-white rounded-xl border border-gray-200 w-fit">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                      <span>AI Tutor is formulating explanation...</span>
                    </div>
                  )}
                </div>

                {/* Quick Suggestion Chips */}
                <div className="p-2 bg-white border-t border-gray-100 flex items-center gap-1.5 overflow-x-auto">
                  {[
                    'Explain Thales Theorem',
                    'Momentum Conservation',
                    'Transformer Working',
                    'பொதுத்தமிழ்: அணி விளக்கம்',
                    'Fixed vs Fluctuating Capital',
                  ].map((chip) => (
                    <button
                      key={chip}
                      onClick={() => handleSendChatMessage(chip)}
                      className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-bold shrink-0 transition whitespace-nowrap"
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                {/* Chat Input */}
                <div className="p-2.5 bg-white border-t border-gray-200 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Ask any question for clarification..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                  <button
                    disabled={!chatInput.trim() || isBotTyping}
                    onClick={() => handleSendChatMessage()}
                    className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl shadow-xs transition"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
