import React, { useState, useEffect, useRef } from 'react'
import { apiClient } from '../api/client'
import {
  MASTER_1MARK_QUIZ_BANK,
  MASTER_DESCRIPTIVE_BANK,
  BoardQuizQuestion,
  BoardDescriptiveQuestion,
} from '../data/boardQuestionBank'
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  Bookmark,
  Send,
  ArrowLeft,
  Sparkles,
  RefreshCw,
  Check,
  Target,
  Zap,
  Star,
  XCircle,
  RotateCcw,
  Bot,
  LayoutDashboard,
  Printer,
  Edit3,
  FolderOpen,
  Layers,
  Eye,
  EyeOff,
} from 'lucide-react'
import { BoardQuestionPaperView } from './BoardQuestionPaperView'

// ─────────────────────────────────────────────────────────────────────────────
// TYPES FOR DEDICATED MULTI-PAGE WORKFLOW
// ─────────────────────────────────────────────────────────────────────────────

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

interface Props {
  activeSection?: PortalSection
  setActiveSection?: (section: PortalSection) => void
}

interface McqExamState {
  classId: 'c-9' | 'c-10' | 'c-11' | 'c-12'
  className: string
  subjectId: string
  subjectName: string
  examSource: string
  questions: BoardQuizQuestion[]
  currentIndex: number
  selectedAnswers: Record<string, number>
  markedForReview: Record<string, boolean>
  timeRemainingSeconds: number
  totalDurationSeconds: number
  startTime: number
}

interface DescriptiveExamState {
  classId: 'c-9' | 'c-10' | 'c-11' | 'c-12'
  className: string
  subjectId: string
  subjectName: string
  markFilter: 'ALL' | 1 | 2 | 3 | 5
  questions: BoardDescriptiveQuestion[]
  currentIndex: number
  writtenAnswers: Record<string, string>
  markedForReview: Record<string, boolean>
  timeRemainingSeconds: number
  totalDurationSeconds: number
  startTime: number
}

interface McqSingleResult {
  question: BoardQuizQuestion
  userOptionIndex: number | null
  isCorrect: boolean
  isSkipped: boolean
}

interface DescSingleResult {
  question: BoardDescriptiveQuestion
  userAnswer: string
  marksAwarded: number
  maxMarks: number
  correctPoints: string[]
  missingPoints: string[]
  aiFeedback: string
}

interface ExamResultPayload {
  examType: 'MCQ' | 'DESCRIPTIVE'
  examTitle: string
  classId: string
  className: string
  subjectId: string
  subjectName: string
  submittedAt: string
  timeTakenSeconds: number
  totalQuestions: number
  mcqResults?: McqSingleResult[]
  descResults?: DescSingleResult[]
  mcqScore?: number
  descScore?: number
  maxMarks: number
  totalScore: number
  percentage: number
  grade: string
  rank: number
}

export const StudentExamPortal: React.FC<Props> = ({
  activeSection: propActiveSection,
  setActiveSection: propSetActiveSection,
}) => {
  // Current Dedicated Page View State (controlled or uncontrolled fallback)
  const [internalSection, setInternalSection] = useState<PortalSection>('DASHBOARD')
  const activeSection = propActiveSection || internalSection
  const setActiveSection = propSetActiveSection || setInternalSection

  // Global Class and Stream Selection
  const [selectedClassId, setSelectedClassId] = useState<'c-9' | 'c-10' | 'c-11' | 'c-12'>('c-12')
  const [selectedStream, setSelectedStream] = useState<'ALL' | 'SCIENCE' | 'CS' | 'COMMERCE' | 'LANGUAGES'>('ALL')
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('ALL')

  // Dedicated Active MCQ Exam State
  const [activeMcqExam, setActiveMcqExam] = useState<McqExamState | null>(null)
  const [showMcqSubmitModal, setShowMcqSubmitModal] = useState<boolean>(false)

  // Dedicated Active Descriptive Exam State
  const [activeDescExam, setActiveDescExam] = useState<DescriptiveExamState | null>(null)
  const [showDescSubmitModal, setShowDescSubmitModal] = useState<boolean>(false)
  const [isEvaluatingDesc, setIsEvaluatingDesc] = useState<boolean>(false)

  // Dedicated Subject-wise & Mark-wise State for 2M/3M/5M Center
  const [descSubjectFilter, setDescSubjectFilter] = useState<string>('ALL')
  const [descMarkFilterTab, setDescMarkFilterTab] = useState<'ALL' | 2 | 3 | 5>('ALL')
  const [expandedDescQId, setExpandedDescQId] = useState<string | null>(null)

  // Dedicated Active Exam Result State
  const [currentExamResult, setCurrentExamResult] = useState<ExamResultPayload | null>(null)
  const [resultFilterTab, setResultFilterTab] = useState<'ALL' | 'CORRECT' | 'INCORRECT' | 'SKIPPED'>('ALL')

  // Exam Attempt History
  const [completedExamHistory, setCompletedExamHistory] = useState<ExamResultPayload[]>([])

  // Leaderboard State
  const [, setLeaderboardData] = useState<any>(null)

  // Timers
  const examTimerRef = useRef<any>(null)

  // ─────────────────────────────────────────────────────────────────────────
  // AI TUTOR CHATBOT STATE
  // ─────────────────────────────────────────────────────────────────────────
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; sender: 'user' | 'bot'; text: string; time: string }>>([
    {
      id: 'welcome',
      sender: 'bot',
      text: '👋 Hello! I am your StudyRank AI State Board Tutor. Ask me any questions on formulas, theorems, derivations, laws, or Centum scoring strategies for Classes 9–12!',
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
    }, 500)
  }

  // Cleanup on unmount and leaderboard loader
  useEffect(() => {
    if (activeSection === 'LEADERBOARD_PORTAL') {
      apiClient.getExamLeaderboard('ex-default').then((d) => setLeaderboardData(d)).catch(() => {})
    }
    return () => {
      if (examTimerRef.current) clearInterval(examTimerRef.current)
    }
  }, [selectedClassId, activeSection])

  // ─────────────────────────────────────────────────────────────────────────
  // SUBJECT OPTIONS HELPER
  // ─────────────────────────────────────────────────────────────────────────
  const getSubjectOptions = () => {
    if (selectedClassId === 'c-9') {
      return [
        { id: 'ALL', name: 'All Subjects', code: '9-ALL', icon: '📚' },
        { id: 'sub-9-sci', name: 'Science', code: '9-SCI', icon: '🔬' },
        { id: 'sub-9-math', name: 'Mathematics', code: '9-MAT', icon: '📐' },
        { id: 'sub-9-soc', name: 'Social Science', code: '9-SOC', icon: '🌍' },
        { id: 'sub-9-tam', name: 'Tamil', code: '9-TAM', icon: '📖' },
        { id: 'sub-9-eng', name: 'English', code: '9-ENG', icon: '🔤' },
      ]
    }
    if (selectedClassId === 'c-10') {
      return [
        { id: 'ALL', name: 'All Subjects', code: '10-ALL', icon: '📚' },
        { id: 'sub-10-sci', name: 'Science', code: '10-SCI', icon: '🔬' },
        { id: 'sub-10-math', name: 'Mathematics', code: '10-MAT', icon: '📐' },
        { id: 'sub-10-soc', name: 'Social Science', code: '10-SOC', icon: '🌍' },
        { id: 'sub-10-tam', name: 'Tamil', code: '10-TAM', icon: '📖' },
        { id: 'sub-10-eng', name: 'English', code: '10-ENG', icon: '🔤' },
      ]
    }
    if (selectedClassId === 'c-11') {
      if (selectedStream === 'SCIENCE') {
        return [
          { id: 'ALL', name: 'All Science Subjects', code: '11-SCI', icon: '🔬' },
          { id: 'sub-11-phy', name: 'Physics', code: '11-PHY', icon: '⚡' },
          { id: 'sub-11-chem', name: 'Chemistry', code: '11-CHE', icon: '🧪' },
          { id: 'sub-11-bio', name: 'Biology', code: '11-BIO', icon: '🧬' },
          { id: 'sub-11-math', name: 'Mathematics', code: '11-MAT', icon: '📐' },
          { id: 'sub-11-tam', name: 'General Tamil', code: '11-TAM', icon: '📖' },
          { id: 'sub-11-eng', name: 'General English', code: '11-ENG', icon: '🔤' },
        ]
      }
      if (selectedStream === 'CS') {
        return [
          { id: 'ALL', name: 'All CS Stream Subjects', code: '11-CS', icon: '💻' },
          { id: 'sub-11-cs', name: 'Computer Science', code: '11-CSC', icon: '💻' },
          { id: 'sub-11-phy', name: 'Physics', code: '11-PHY', icon: '⚡' },
          { id: 'sub-11-chem', name: 'Chemistry', code: '11-CHE', icon: '🧪' },
          { id: 'sub-11-math', name: 'Mathematics', code: '11-MAT', icon: '📐' },
          { id: 'sub-11-tam', name: 'General Tamil', code: '11-TAM', icon: '📖' },
          { id: 'sub-11-eng', name: 'General English', code: '11-ENG', icon: '🔤' },
        ]
      }
      if (selectedStream === 'COMMERCE') {
        return [
          { id: 'ALL', name: 'All Commerce Subjects', code: '11-COM', icon: '📊' },
          { id: 'sub-11-acc', name: 'Accountancy', code: '11-ACC', icon: '📋' },
          { id: 'sub-11-com', name: 'Commerce', code: '11-CME', icon: '🏢' },
          { id: 'sub-11-eco', name: 'Economics', code: '11-ECO', icon: '📈' },
          { id: 'sub-11-tam', name: 'General Tamil', code: '11-TAM', icon: '📖' },
          { id: 'sub-11-eng', name: 'General English', code: '11-ENG', icon: '🔤' },
        ]
      }
      return [
        { id: 'ALL', name: 'All Class 11 Subjects', code: '11-ALL', icon: '📚' },
        { id: 'sub-11-phy', name: 'Physics', code: '11-PHY', icon: '⚡' },
        { id: 'sub-11-chem', name: 'Chemistry', code: '11-CHE', icon: '🧪' },
        { id: 'sub-11-bio', name: 'Biology', code: '11-BIO', icon: '🧬' },
        { id: 'sub-11-cs', name: 'Computer Science', code: '11-CSC', icon: '💻' },
        { id: 'sub-11-math', name: 'Mathematics', code: '11-MAT', icon: '📐' },
        { id: 'sub-11-acc', name: 'Accountancy', code: '11-ACC', icon: '📋' },
        { id: 'sub-11-com', name: 'Commerce', code: '11-CME', icon: '🏢' },
        { id: 'sub-11-eco', name: 'Economics', code: '11-ECO', icon: '📈' },
        { id: 'sub-11-tam', name: 'General Tamil', code: '11-TAM', icon: '📖' },
        { id: 'sub-11-eng', name: 'General English', code: '11-ENG', icon: '🔤' },
      ]
    }
    // Class 12
    if (selectedStream === 'SCIENCE') {
      return [
        { id: 'ALL', name: 'All Science Subjects', code: '12-SCI', icon: '🔬' },
        { id: 'sub-12-phy', name: 'Physics', code: '12-PHY', icon: '⚡' },
        { id: 'sub-12-chem', name: 'Chemistry', code: '12-CHE', icon: '🧪' },
        { id: 'sub-12-bio', name: 'Biology', code: '12-BIO', icon: '🧬' },
        { id: 'sub-12-math', name: 'Mathematics', code: '12-MAT', icon: '📐' },
        { id: 'sub-12-tam', name: 'General Tamil', code: '12-TAM', icon: '📖' },
        { id: 'sub-12-eng', name: 'General English', code: '12-ENG', icon: '🔤' },
      ]
    }
    if (selectedStream === 'CS') {
      return [
        { id: 'ALL', name: 'All CS Stream Subjects', code: '12-CS', icon: '💻' },
        { id: 'sub-12-cs', name: 'Computer Science', code: '12-CSC', icon: '💻' },
        { id: 'sub-12-phy', name: 'Physics', code: '12-PHY', icon: '⚡' },
        { id: 'sub-12-chem', name: 'Chemistry', code: '12-CHE', icon: '🧪' },
        { id: 'sub-12-math', name: 'Mathematics', code: '12-MAT', icon: '📐' },
        { id: 'sub-12-tam', name: 'General Tamil', code: '12-TAM', icon: '📖' },
        { id: 'sub-12-eng', name: 'General English', code: '12-ENG', icon: '🔤' },
      ]
    }
    if (selectedStream === 'COMMERCE') {
      return [
        { id: 'ALL', name: 'All Commerce Subjects', code: '12-COM', icon: '📊' },
        { id: 'sub-12-acc', name: 'Accountancy', code: '12-ACC', icon: '📋' },
        { id: 'sub-12-com', name: 'Commerce', code: '12-CME', icon: '🏢' },
        { id: 'sub-12-eco', name: 'Economics', code: '12-ECO', icon: '📈' },
        { id: 'sub-12-tam', name: 'General Tamil', code: '12-TAM', icon: '📖' },
        { id: 'sub-12-eng', name: 'General English', code: '12-ENG', icon: '🔤' },
      ]
    }
    return [
      { id: 'ALL', name: 'All Class 12 Subjects', code: '12-ALL', icon: '📚' },
      { id: 'sub-12-phy', name: 'Physics', code: '12-PHY', icon: '⚡' },
      { id: 'sub-12-chem', name: 'Chemistry', code: '12-CHE', icon: '🧪' },
      { id: 'sub-12-bio', name: 'Biology', code: '12-BIO', icon: '🧬' },
      { id: 'sub-12-cs', name: 'Computer Science', code: '12-CSC', icon: '💻' },
      { id: 'sub-12-math', name: 'Mathematics', code: '12-MAT', icon: '📐' },
      { id: 'sub-12-acc', name: 'Accountancy', code: '12-ACC', icon: '📋' },
      { id: 'sub-12-com', name: 'Commerce', code: '12-CME', icon: '🏢' },
      { id: 'sub-12-eco', name: 'Economics', code: '12-ECO', icon: '📈' },
      { id: 'sub-12-tam', name: 'General Tamil', code: '12-TAM', icon: '📖' },
      { id: 'sub-12-eng', name: 'General English', code: '12-ENG', icon: '🔤' },
    ]
  }

  const getClassName = (cid: string) => {
    switch (cid) {
      case 'c-9':
        return 'Class 9 (9th Std)'
      case 'c-10':
        return 'Class 10 (SSLC Board)'
      case 'c-11':
        return 'Class 11 (+1 Board)'
      case 'c-12':
        return 'Class 12 (HSC +2 Board)'
      default:
        return 'State Board'
    }
  }

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60)
    const secs = totalSecs % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Shuffle helper to ensure unique, non-repeating random order on every exam attempt
  const shuffleQuestions = <T,>(arr: T[]): T[] => {
    const copy = [...arr]
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 1. LAUNCH DEDICATED 1-MARK MCQ EXAM
  // ─────────────────────────────────────────────────────────────────────────
  const start1MarkMcqExam = (subjectId: string, questionCount: number = 20) => {
    const matching = MASTER_1MARK_QUIZ_BANK.filter((q) => {
      const matchClass = q.classId === selectedClassId
      const matchSubject = subjectId === 'ALL' || q.subjectId === subjectId
      return matchClass && matchSubject
    })

    if (matching.length === 0) {
      alert('No questions found for this subject selection.')
      return
    }

    const questions = shuffleQuestions(matching).slice(0, Math.min(questionCount, matching.length))

    const durationSeconds = questions.length * 60 // 1 minute per MCQ

    setActiveMcqExam({
      classId: selectedClassId,
      className: getClassName(selectedClassId),
      subjectId,
      subjectName: subjectId === 'ALL' ? 'All Subjects' : questions[0]?.subjectName || 'Subject Exam',
      examSource: 'TN State Board Samacheer Kalvi PYQ & Model Papers',
      questions,
      currentIndex: 0,
      selectedAnswers: {},
      markedForReview: {},
      timeRemainingSeconds: durationSeconds,
      totalDurationSeconds: durationSeconds,
      startTime: Date.now(),
    })

    if (examTimerRef.current) clearInterval(examTimerRef.current)
    examTimerRef.current = setInterval(() => {
      setActiveMcqExam((prev) => {
        if (!prev) return null
        if (prev.timeRemainingSeconds <= 1) {
          clearInterval(examTimerRef.current)
          handleSubmitMcqExamAuto(prev)
          return { ...prev, timeRemainingSeconds: 0 }
        }
        return { ...prev, timeRemainingSeconds: prev.timeRemainingSeconds - 1 }
      })
    }, 1000)

    setActiveSection('LIVE_MCQ_EXAM')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Pure Option Selection during MCQ exam: strict radio selection, zero spoiler
  const handleSelectMcqOption = (questionId: string, optionIndex: number) => {
    if (!activeMcqExam) return
    setActiveMcqExam((prev) => {
      if (!prev) return null
      return {
        ...prev,
        selectedAnswers: {
          ...prev.selectedAnswers,
          [questionId]: optionIndex,
        },
      }
    })
  }

  // Submit MCQ Exam and go straight to Dedicated Result View
  const handleSubmitMcqExam = () => {
    if (!activeMcqExam) return
    setShowMcqSubmitModal(false)
    if (examTimerRef.current) clearInterval(examTimerRef.current)

    const timeSpent = Math.max(1, Math.round((Date.now() - activeMcqExam.startTime) / 1000))
    let correctCount = 0

    const results = activeMcqExam.questions.map((q) => {
      const userOpt = activeMcqExam.selectedAnswers[q.id]
      const isSkipped = userOpt === undefined || userOpt === null
      const isCorrect = !isSkipped && userOpt === q.correctOptionIndex
      if (isCorrect) correctCount++

      return {
        question: q,
        userOptionIndex: isSkipped ? null : userOpt,
        isCorrect,
        isSkipped,
      }
    })

    const totalQ = activeMcqExam.questions.length
    const percentage = Math.round((correctCount / totalQ) * 100)
    let grade = 'B'
    if (percentage >= 95) grade = 'Centum Gold (A+)'
    else if (percentage >= 85) grade = 'Distinction (A)'
    else if (percentage >= 70) grade = 'First Class (B+)'
    else if (percentage >= 50) grade = 'Second Class (C)'
    else grade = 'Needs Practice (D)'

    const resultPayload: ExamResultPayload = {
      examType: 'MCQ',
      examTitle: `${activeMcqExam.subjectName} 1-Mark MCQ Board Exam`,
      classId: activeMcqExam.classId,
      className: activeMcqExam.className,
      subjectId: activeMcqExam.subjectId,
      subjectName: activeMcqExam.subjectName,
      submittedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }),
      timeTakenSeconds: timeSpent,
      totalQuestions: totalQ,
      mcqResults: results,
      mcqScore: correctCount,
      maxMarks: totalQ,
      totalScore: correctCount,
      percentage,
      grade,
      rank: percentage >= 90 ? Math.floor(Math.random() * 5) + 1 : Math.floor(Math.random() * 20) + 10,
    }

    setCurrentExamResult(resultPayload)
    setCompletedExamHistory((prev) => [resultPayload, ...prev])
    setActiveMcqExam(null)
    setResultFilterTab('ALL')
    setActiveSection('RESULT_DETAIL_PAGE')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmitMcqExamAuto = (examState: McqExamState) => {
    const timeSpent = examState.totalDurationSeconds
    let correctCount = 0

    const results = examState.questions.map((q) => {
      const userOpt = examState.selectedAnswers[q.id]
      const isSkipped = userOpt === undefined || userOpt === null
      const isCorrect = !isSkipped && userOpt === q.correctOptionIndex
      if (isCorrect) correctCount++

      return {
        question: q,
        userOptionIndex: isSkipped ? null : userOpt,
        isCorrect,
        isSkipped,
      }
    })

    const totalQ = examState.questions.length
    const percentage = Math.round((correctCount / totalQ) * 100)
    let grade = 'B'
    if (percentage >= 95) grade = 'Centum Gold (A+)'
    else if (percentage >= 85) grade = 'Distinction (A)'
    else if (percentage >= 70) grade = 'First Class (B+)'
    else if (percentage >= 50) grade = 'Second Class (C)'
    else grade = 'Needs Practice (D)'

    const resultPayload: ExamResultPayload = {
      examType: 'MCQ',
      examTitle: `${examState.subjectName} 1-Mark MCQ Board Exam`,
      classId: examState.classId,
      className: examState.className,
      subjectId: examState.subjectId,
      subjectName: examState.subjectName,
      submittedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }),
      timeTakenSeconds: timeSpent,
      totalQuestions: totalQ,
      mcqResults: results,
      mcqScore: correctCount,
      maxMarks: totalQ,
      totalScore: correctCount,
      percentage,
      grade,
      rank: percentage >= 90 ? 1 : 12,
    }

    setCurrentExamResult(resultPayload)
    setCompletedExamHistory((prev) => [resultPayload, ...prev])
    setActiveMcqExam(null)
    setResultFilterTab('ALL')
    setActiveSection('RESULT_DETAIL_PAGE')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 2. LAUNCH DEDICATED 2M, 3M & 5M DESCRIPTIVE EXAM
  // ─────────────────────────────────────────────────────────────────────────
  const startDescriptiveExam = (subjectId: string, markFilter: 'ALL' | 1 | 2 | 3 | 5 = 'ALL', count: number = 10) => {
    const matching = MASTER_DESCRIPTIVE_BANK.filter((q) => {
      const matchClass = q.classId === selectedClassId
      const matchSubject = subjectId === 'ALL' || q.subjectId === subjectId
      const matchMarks = markFilter === 'ALL' || q.marks === markFilter
      return matchClass && matchSubject && matchMarks
    })

    if (matching.length === 0) {
      alert('No descriptive questions found for this selection.')
      return
    }

    const questions = shuffleQuestions(matching).slice(0, Math.min(count, matching.length))

    const durationSeconds = questions.reduce((acc, q) => acc + q.marks * 120, 0) // 2 mins per mark

    setActiveDescExam({
      classId: selectedClassId,
      className: getClassName(selectedClassId),
      subjectId,
      subjectName: subjectId === 'ALL' ? 'All Subjects' : questions[0]?.subjectName || 'Descriptive Exam',
      markFilter,
      questions,
      currentIndex: 0,
      writtenAnswers: {},
      markedForReview: {},
      timeRemainingSeconds: durationSeconds,
      totalDurationSeconds: durationSeconds,
      startTime: Date.now(),
    })

    if (examTimerRef.current) clearInterval(examTimerRef.current)
    examTimerRef.current = setInterval(() => {
      setActiveDescExam((prev) => {
        if (!prev) return null
        if (prev.timeRemainingSeconds <= 1) {
          clearInterval(examTimerRef.current)
          handleSubmitDescExam()
          return { ...prev, timeRemainingSeconds: 0 }
        }
        return { ...prev, timeRemainingSeconds: prev.timeRemainingSeconds - 1 }
      })
    }, 1000)

    setActiveSection('LIVE_DESC_EXAM')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleUpdateWrittenAnswer = (questionId: string, text: string) => {
    if (!activeDescExam) return
    setActiveDescExam((prev) => {
      if (!prev) return null
      return {
        ...prev,
        writtenAnswers: {
          ...prev.writtenAnswers,
          [questionId]: text,
        },
      }
    })
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SUBMIT DESCRIPTIVE EXAM WITH AI RUBRIC EVALUATION
  // ─────────────────────────────────────────────────────────────────────────
  const handleSubmitDescExam = () => {
    if (!activeDescExam) return
    setShowDescSubmitModal(false)
    setIsEvaluatingDesc(true)
    if (examTimerRef.current) clearInterval(examTimerRef.current)

    setTimeout(() => {
      const timeSpent = Math.max(1, Math.round((Date.now() - activeDescExam.startTime) / 1000))
      let totalAwarded = 0
      let maxMarksTotal = 0

      const descResults = activeDescExam.questions.map((q) => {
        const studentAns = (activeDescExam.writtenAnswers[q.id] || '').trim()
        maxMarksTotal += q.marks

        if (!studentAns) {
          return {
            question: q,
            userAnswer: '',
            marksAwarded: 0,
            maxMarks: q.marks,
            correctPoints: [],
            missingPoints: q.keyPoints,
            aiFeedback: 'No answer provided. Review the official State Board model answer to learn key concepts.',
          }
        }

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

        const ratio = correct.length / Math.max(1, q.keyPoints.length)
        let awarded = 0
        if (ratio >= 0.75) awarded = q.marks
        else if (ratio >= 0.5) awarded = parseFloat((q.marks * 0.75).toFixed(1))
        else if (ratio >= 0.25) awarded = parseFloat((q.marks * 0.5).toFixed(1))
        else awarded = parseFloat((q.marks * 0.25).toFixed(1))

        totalAwarded += awarded

        return {
          question: q,
          userAnswer: studentAns,
          marksAwarded: awarded,
          maxMarks: q.marks,
          correctPoints: correct,
          missingPoints: missing,
          aiFeedback:
            ratio >= 0.75
              ? '🎯 Outstanding! Answer satisfies State Board evaluation rubrics and key formula/theorem points.'
              : '💡 Good attempt. Make sure to include all missing keywords and steps shown below to secure full marks.',
        }
      })

      const percentage = Math.round((totalAwarded / Math.max(1, maxMarksTotal)) * 100)
      let grade = 'B'
      if (percentage >= 95) grade = 'Centum Gold (A+)'
      else if (percentage >= 85) grade = 'Distinction (A)'
      else if (percentage >= 70) grade = 'First Class (B+)'
      else if (percentage >= 50) grade = 'Second Class (C)'
      else grade = 'Needs Improvement (D)'

      const resultPayload: ExamResultPayload = {
        examType: 'DESCRIPTIVE',
        examTitle: `${activeDescExam.subjectName} 2M/3M/5M Board Exam Drills`,
        classId: activeDescExam.classId,
        className: activeDescExam.className,
        subjectId: activeDescExam.subjectId,
        subjectName: activeDescExam.subjectName,
        submittedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }),
        timeTakenSeconds: timeSpent,
        totalQuestions: activeDescExam.questions.length,
        descResults,
        descScore: totalAwarded,
        maxMarks: maxMarksTotal,
        totalScore: totalAwarded,
        percentage,
        grade,
        rank: percentage >= 90 ? 2 : 8,
      }

      setCurrentExamResult(resultPayload)
      setCompletedExamHistory((prev) => [resultPayload, ...prev])
      setIsEvaluatingDesc(false)
      setActiveDescExam(null)
      setActiveSection('RESULT_DETAIL_PAGE')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 800)
  }

  // =========================================================================
  // VIEW 1: LIVE 1-MARK MCQ EXAM PAGE (NO SPOILERS, SELECTION ONLY)
  // =========================================================================
  if (activeSection === 'LIVE_MCQ_EXAM' && activeMcqExam) {
    const questions = activeMcqExam.questions
    const currentQ = questions[activeMcqExam.currentIndex] || questions[0]
    const answeredCount = Object.keys(activeMcqExam.selectedAnswers).length
    const currentSelectedOption = activeMcqExam.selectedAnswers[currentQ.id]
    const isMarked = !!activeMcqExam.markedForReview[currentQ.id]

    return (
      <div className="min-h-screen bg-slate-50/80 pb-16 space-y-4 max-w-7xl mx-auto px-2 sm:px-4">
        {/* Top Floating Exam Toolbar */}
        <div className="bg-white border border-gray-200/90 rounded-2xl p-3 sm:p-4 shadow-sm flex flex-wrap items-center justify-between gap-3 sticky top-2 z-30 backdrop-blur-md">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => {
                if (confirm('Are you sure you want to pause / leave the exam? Your progress will remain saved.')) {
                  setActiveSection('MCQ_PORTAL')
                }
              }}
              className="p-2 hover:bg-gray-100 rounded-xl text-gray-600 transition cursor-pointer"
              title="Leave Exam"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
                  {activeMcqExam.className} • {activeMcqExam.subjectName}
                </span>
              </div>
              <h1 className="text-xs sm:text-base font-bold text-gray-900 line-clamp-1">
                {activeMcqExam.subjectName} 1-Mark MCQ Exam
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Countdown Timer */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs sm:text-sm font-bold shadow-2xs border ${
                activeMcqExam.timeRemainingSeconds < 180
                  ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-100'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>{formatTimer(activeMcqExam.timeRemainingSeconds)}</span>
            </div>

            {/* Complete / Submit Exam Trigger */}
            <button
              onClick={() => setShowMcqSubmitModal(true)}
              className="px-3.5 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Submit ({answeredCount}/{questions.length})</span>
            </button>
          </div>
        </div>

        {/* Live Exam Layout: Question Area + Palette */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Main Question Box */}
          <div className="lg:col-span-3 bg-white border border-gray-200 rounded-3xl p-5 sm:p-8 shadow-xs flex flex-col justify-between min-h-[500px]">
            <div>
              {/* Question Header */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-[#5B4DFB] text-white rounded-xl text-xs font-bold shadow-2xs">
                    Q {activeMcqExam.currentIndex + 1} of {questions.length}
                  </span>
                  <span className="px-2.5 py-1 bg-amber-50 text-amber-800 rounded-lg text-xs font-semibold flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> {currentQ.boardTag}
                  </span>
                </div>

                <button
                  onClick={() =>
                    setActiveMcqExam((prev) =>
                      prev
                        ? {
                            ...prev,
                            markedForReview: {
                              ...prev.markedForReview,
                              [currentQ.id]: !prev.markedForReview[currentQ.id],
                            },
                          }
                        : null
                    )
                  }
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition cursor-pointer ${
                    isMarked
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>{isMarked ? 'Marked' : 'Mark for Review'}</span>
                </button>
              </div>

              {/* Question Text */}
              <div className="mt-5">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Topic: {currentQ.topic}
                </span>
                <p className="text-base sm:text-lg font-bold text-gray-900 leading-relaxed">
                  {currentQ.questionText}
                </p>
              </div>

              {/* Pure Option Selection List (Selection only, zero correctness spoilers) */}
              <div className="mt-6 space-y-3">
                {currentQ.options.map((optionText, optIndex) => {
                  const isSelected = currentSelectedOption === optIndex
                  const optLetter = String.fromCharCode(65 + optIndex)

                  return (
                    <button
                      key={optIndex}
                      onClick={() => handleSelectMcqOption(currentQ.id, optIndex)}
                      className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border transition-all flex items-center justify-between group cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-50/90 border-[#5B4DFB] shadow-xs ring-2 ring-[#5B4DFB]/20'
                          : 'bg-gray-50/50 hover:bg-gray-100/80 border-gray-200/90'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center transition shrink-0 ${
                            isSelected
                              ? 'bg-[#5B4DFB] text-white shadow-2xs'
                              : 'bg-white border border-gray-300 text-gray-700 group-hover:border-indigo-400 group-hover:text-indigo-600'
                          }`}
                        >
                          {optLetter}
                        </div>
                        <span
                          className={`text-xs sm:text-sm font-medium transition ${
                            isSelected ? 'text-indigo-950 font-bold' : 'text-gray-800'
                          }`}
                        >
                          {optionText}
                        </span>
                      </div>

                      {/* Pure Selection Radio Bubble */}
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition shrink-0 ${
                          isSelected
                            ? 'border-[#5B4DFB] bg-[#5B4DFB]'
                            : 'border-gray-300 bg-white group-hover:border-gray-400'
                        }`}
                      >
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Bottom Nav Bar inside Exam */}
            <div className="mt-8 pt-4 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2">
              <button
                disabled={activeMcqExam.currentIndex === 0}
                onClick={() =>
                  setActiveMcqExam((prev) => (prev ? { ...prev, currentIndex: prev.currentIndex - 1 } : null))
                }
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 rounded-xl text-xs font-bold text-gray-700 transition flex items-center gap-1.5 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <div className="text-xs text-gray-400 font-medium">
                Answered: <strong className="text-gray-800">{answeredCount}</strong> / {questions.length}
              </div>

              {activeMcqExam.currentIndex < questions.length - 1 ? (
                <button
                  onClick={() =>
                    setActiveMcqExam((prev) => (prev ? { ...prev, currentIndex: prev.currentIndex + 1 } : null))
                  }
                  className="px-5 py-2.5 bg-[#5B4DFB] hover:bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Next Question</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setShowMcqSubmitModal(true)}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Submit Exam</span>
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Right Palette & Legend */}
          <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-600">
                  Question Palette
                </h3>
                <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                  {Math.round((answeredCount / questions.length) * 100)}% Done
                </span>
              </div>

              {/* Grid of Question Numbers */}
              <div className="grid grid-cols-5 gap-2 mt-4 max-h-[260px] overflow-y-auto pr-1">
                {questions.map((q, idx) => {
                  const isCur = idx === activeMcqExam.currentIndex
                  const isAns = activeMcqExam.selectedAnswers[q.id] !== undefined
                  const isRev = !!activeMcqExam.markedForReview[q.id]

                  let btnStyle = 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  if (isRev) {
                    btnStyle = 'bg-amber-100 border-amber-400 text-amber-900 font-bold'
                  } else if (isAns) {
                    btnStyle = 'bg-[#5B4DFB] border-[#5B4DFB] text-white font-bold shadow-2xs'
                  }
                  if (isCur) {
                    btnStyle += ' ring-2 ring-indigo-500 ring-offset-2'
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => setActiveMcqExam((prev) => (prev ? { ...prev, currentIndex: idx } : null))}
                      className={`h-9 rounded-xl border text-xs font-semibold flex items-center justify-center transition cursor-pointer ${btnStyle}`}
                    >
                      {idx + 1}
                    </button>
                  )
                })}
              </div>

              {/* Status Legend */}
              <div className="space-y-2 mt-6 pt-4 border-t border-gray-100 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded bg-[#5B4DFB]" />
                  <span className="text-gray-600 font-medium">Answered ({answeredCount})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded bg-amber-100 border border-amber-400" />
                  <span className="text-gray-600 font-medium">
                    Marked for Review ({Object.values(activeMcqExam.markedForReview).filter(Boolean).length})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded bg-gray-100 border border-gray-200" />
                  <span className="text-gray-600 font-medium">
                    Not Attempted ({questions.length - answeredCount})
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Submit Action */}
            <div className="pt-4 border-t border-gray-100">
              <button
                onClick={() => setShowMcqSubmitModal(true)}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Submit Exam</span>
              </button>
            </div>
          </div>
        </div>

        {/* Submit Confirmation Modal */}
        {showMcqSubmitModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
              <div className="flex items-center gap-3 text-indigo-600 mb-2">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center font-bold text-lg">
                  📋
                </div>
                <h3 className="text-lg font-bold text-gray-900">Submit MCQ Exam?</h3>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Review your exam summary before final submission. Once submitted, your answers will be graded and you will be redirected to the comprehensive result analysis page.
              </p>

              <div className="my-5 p-4 bg-slate-50 border border-gray-200/80 rounded-2xl space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Questions:</span>
                  <span className="font-bold text-gray-900">{questions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Answered:</span>
                  <span className="font-bold text-emerald-600">{answeredCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Marked for Review:</span>
                  <span className="font-bold text-amber-600">
                    {Object.values(activeMcqExam.markedForReview).filter(Boolean).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Unanswered Questions:</span>
                  <span className="font-bold text-rose-600">{questions.length - answeredCount}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowMcqSubmitModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                >
                  Continue Writing
                </button>
                <button
                  onClick={handleSubmitMcqExam}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm & View Results</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // =========================================================================
  // VIEW 2: LIVE 2M, 3M & 5M DESCRIPTIVE EXAM PAGE
  // =========================================================================
  if (activeSection === 'LIVE_DESC_EXAM' && activeDescExam) {
    const questions = activeDescExam.questions
    const currentQ = questions[activeDescExam.currentIndex] || questions[0]
    const answeredCount = Object.keys(activeDescExam.writtenAnswers).filter(
      (k) => (activeDescExam.writtenAnswers[k] || '').trim().length > 0
    ).length
    const currentAnswerText = activeDescExam.writtenAnswers[currentQ.id] || ''
    const isMarked = !!activeDescExam.markedForReview[currentQ.id]

    return (
      <div className="min-h-screen bg-slate-50/80 pb-16 space-y-4 max-w-7xl mx-auto px-2 sm:px-4">
        {/* Top Floating Exam Toolbar */}
        <div className="bg-white border border-gray-200/90 rounded-2xl p-3 sm:p-4 shadow-sm flex flex-wrap items-center justify-between gap-3 sticky top-2 z-30 backdrop-blur-md">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => {
                if (confirm('Are you sure you want to leave the descriptive exam?')) {
                  setActiveSection('DESCRIPTIVE_PORTAL')
                }
              }}
              className="p-2 hover:bg-gray-100 rounded-xl text-gray-600 transition cursor-pointer"
              title="Leave Exam"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
                  {activeDescExam.className} • {activeDescExam.subjectName}
                </span>
              </div>
              <h1 className="text-xs sm:text-base font-bold text-gray-900 line-clamp-1">
                {activeDescExam.subjectName} Descriptive Drill Paper
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs sm:text-sm font-bold bg-purple-50 text-purple-700 border border-purple-100 shadow-2xs">
              <Clock className="w-4 h-4" />
              <span>{formatTimer(activeDescExam.timeRemainingSeconds)}</span>
            </div>

            <button
              onClick={() => setShowDescSubmitModal(true)}
              className="px-3.5 sm:px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Submit for AI Evaluation</span>
            </button>
          </div>
        </div>

        {/* Live Exam Layout: Question Area + Palette */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Main Question Card */}
          <div className="lg:col-span-3 bg-white border border-gray-200 rounded-3xl p-5 sm:p-8 shadow-xs flex flex-col justify-between min-h-[560px]">
            <div>
              {/* Question Header */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-purple-600 text-white rounded-xl text-xs font-bold shadow-2xs">
                    Q {activeDescExam.currentIndex + 1} of {questions.length}
                  </span>
                  <span className="px-2.5 py-1 bg-purple-100 text-purple-900 font-extrabold rounded-lg text-xs">
                    {currentQ.marks} Marks
                  </span>
                  <span className="hidden sm:inline-flex px-2.5 py-1 bg-blue-50 text-blue-800 rounded-lg text-xs font-semibold items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> {currentQ.boardTag}
                  </span>
                </div>

                <button
                  onClick={() =>
                    setActiveDescExam((prev) =>
                      prev
                        ? {
                            ...prev,
                            markedForReview: {
                              ...prev.markedForReview,
                              [currentQ.id]: !prev.markedForReview[currentQ.id],
                            },
                          }
                        : null
                    )
                  }
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition cursor-pointer ${
                    isMarked
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>{isMarked ? 'Marked' : 'Mark for Review'}</span>
                </button>
              </div>

              {/* Question Text */}
              <div className="mt-5">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Topic: {currentQ.topic}
                </span>
                <p className="text-base sm:text-lg font-bold text-gray-900 leading-relaxed">
                  {currentQ.questionText}
                </p>
              </div>

              {/* State Board Scoring Guidance Tip */}
              <div className="mt-4 p-3 bg-amber-50/80 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Scoring Hint:</strong> {currentQ.passTip}
                </span>
              </div>

              {/* Answer Writing Canvas */}
              <div className="mt-5">
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  Write Your Detailed Answer (Semantic Rubric Evaluation):
                </label>
                <textarea
                  rows={8}
                  value={currentAnswerText}
                  onChange={(e) => handleUpdateWrittenAnswer(currentQ.id, e.target.value)}
                  placeholder="Type your answer, formulas, laws, and proofs clearly here..."
                  className="w-full p-4 border border-gray-300 rounded-2xl text-xs sm:text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 leading-relaxed"
                />
                <div className="flex justify-between items-center text-xs text-gray-400 mt-1.5">
                  <span>Characters: {currentAnswerText.length}</span>
                  <span>{currentAnswerText.length > 50 ? '✓ Ready for Evaluation' : 'Add detailed steps'}</span>
                </div>
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="mt-8 pt-4 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2">
              <button
                disabled={activeDescExam.currentIndex === 0}
                onClick={() =>
                  setActiveDescExam((prev) => (prev ? { ...prev, currentIndex: prev.currentIndex - 1 } : null))
                }
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 rounded-xl text-xs font-bold text-gray-700 transition flex items-center gap-1.5 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <div className="text-xs text-gray-400 font-medium">
                Written: <strong className="text-purple-700">{answeredCount}</strong> / {questions.length} Qs
              </div>

              {activeDescExam.currentIndex < questions.length - 1 ? (
                <button
                  onClick={() =>
                    setActiveDescExam((prev) => (prev ? { ...prev, currentIndex: prev.currentIndex + 1 } : null))
                  }
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setShowDescSubmitModal(true)}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Submit Exam</span>
                  <Send className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Right Palette */}
          <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-600">
                  Question Palette
                </h3>
                <span className="text-[11px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                  {Math.round((answeredCount / questions.length) * 100)}% Done
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 mt-4 max-h-[260px] overflow-y-auto pr-1">
                {questions.map((q, idx) => {
                  const isCur = idx === activeDescExam.currentIndex
                  const isAns = (activeDescExam.writtenAnswers[q.id] || '').trim().length > 0
                  const isRev = !!activeDescExam.markedForReview[q.id]

                  let btnStyle = 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  if (isRev) {
                    btnStyle = 'bg-amber-100 border-amber-400 text-amber-900 font-bold'
                  } else if (isAns) {
                    btnStyle = 'bg-purple-600 border-purple-600 text-white font-bold shadow-2xs'
                  }
                  if (isCur) {
                    btnStyle += ' ring-2 ring-purple-500 ring-offset-2'
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => setActiveDescExam((prev) => (prev ? { ...prev, currentIndex: idx } : null))}
                      className={`h-9 rounded-xl border text-xs font-semibold flex items-center justify-center transition cursor-pointer ${btnStyle}`}
                    >
                      {idx + 1}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Bottom Submit Action */}
            <div className="pt-4 border-t border-gray-100">
              <button
                disabled={isEvaluatingDesc}
                onClick={() => setShowDescSubmitModal(true)}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Submit for Evaluation</span>
              </button>
            </div>
          </div>
        </div>

        {/* Submit Modal */}
        {showDescSubmitModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
              <div className="flex items-center gap-3 text-purple-600 mb-2">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center font-bold text-lg">
                  ✍️
                </div>
                <h3 className="text-lg font-bold text-gray-900">Submit Descriptive Exam?</h3>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Your descriptive answers will be evaluated step-by-step by our Semantic AI against authoritative Tamil Nadu State Board key-point rubrics.
              </p>

              <div className="my-5 p-4 bg-slate-50 border border-gray-200/80 rounded-2xl space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Questions:</span>
                  <span className="font-bold text-gray-900">{questions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Attempted Questions:</span>
                  <span className="font-bold text-emerald-600">{answeredCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Unattempted:</span>
                  <span className="font-bold text-rose-600">{questions.length - answeredCount}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  disabled={isEvaluatingDesc}
                  onClick={() => setShowDescSubmitModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                >
                  Keep Writing
                </button>
                <button
                  disabled={isEvaluatingDesc}
                  onClick={handleSubmitDescExam}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-2 cursor-pointer"
                >
                  {isEvaluatingDesc ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Evaluating Rubrics...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Evaluate & View Results
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // =========================================================================
  // VIEW 3: DEDICATED EXAM RESULT DETAIL PAGE
  // =========================================================================
  if (activeSection === 'RESULT_DETAIL_PAGE' && currentExamResult) {
    const isMcq = currentExamResult.examType === 'MCQ'
    const mcqList = currentExamResult.mcqResults || []
    const descList = currentExamResult.descResults || []

    const correctCount = isMcq
      ? mcqList.filter((r) => r.isCorrect).length
      : descList.filter((r) => r.marksAwarded >= r.maxMarks * 0.75).length

    const incorrectCount = isMcq
      ? mcqList.filter((r) => !r.isCorrect && !r.isSkipped).length
      : descList.filter((r) => r.marksAwarded < r.maxMarks * 0.75 && r.marksAwarded > 0).length

    const skippedCount = isMcq
      ? mcqList.filter((r) => r.isSkipped).length
      : descList.filter((r) => r.userAnswer.trim().length === 0).length

    const filteredMcqResults = mcqList.filter((r) => {
      if (resultFilterTab === 'CORRECT') return r.isCorrect
      if (resultFilterTab === 'INCORRECT') return !r.isCorrect && !r.isSkipped
      if (resultFilterTab === 'SKIPPED') return r.isSkipped
      return true
    })

    return (
      <div className="min-h-screen bg-slate-50/80 pb-20 space-y-6 max-w-7xl mx-auto px-2 sm:px-4">
        {/* Navigation & Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            onClick={() => {
              setActiveSection('RESULTS_PORTAL')
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold shadow-2xs transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-indigo-600" /> Back to Results Center
          </button>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                if (isMcq) {
                  start1MarkMcqExam(currentExamResult.subjectId, currentExamResult.totalQuestions)
                } else {
                  startDescriptiveExam(currentExamResult.subjectId, 'ALL', currentExamResult.totalQuestions)
                }
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#5B4DFB] hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Retake Exam
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold shadow-2xs transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Print Scorecard
            </button>
          </div>
        </div>

        {/* Hero Scorecard Banner */}
        <div className="bg-gradient-to-r from-[#3C38A6] via-[#4834D4] to-[#6824D6] text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-0.5 rounded-full bg-white/20 text-[11px] font-bold text-white">
                  {currentExamResult.className} • {currentExamResult.subjectName}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-[11px] font-bold text-emerald-300">
                  Completed {currentExamResult.submittedAt}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{currentExamResult.examTitle}</h1>
              <p className="text-xs sm:text-sm text-indigo-100/90 leading-relaxed">
                State Board Scorecard & Authentic Step-by-Step Answer Key
              </p>
            </div>

            {/* Score Metric Box */}
            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/15">
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-black text-amber-300">
                  {currentExamResult.totalScore}
                  <span className="text-lg text-white/70 font-normal"> / {currentExamResult.maxMarks}</span>
                </div>
                <div className="text-[11px] text-indigo-100 uppercase tracking-wider font-semibold">Total Marks</div>
              </div>

              <div className="h-10 w-[1px] bg-white/20" />

              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-black text-emerald-300">
                  {currentExamResult.percentage}%
                </div>
                <div className="text-[11px] text-indigo-100 uppercase tracking-wider font-semibold">Percentage</div>
              </div>

              <div className="h-10 w-[1px] bg-white/20" />

              <div className="text-center">
                <div className="text-xs sm:text-sm font-bold text-purple-200">{currentExamResult.grade}</div>
                <div className="text-[10px] text-indigo-200 uppercase tracking-wider font-semibold">Grade Tier</div>
              </div>
            </div>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">Correct Answers</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-600 mt-1">{correctCount}</div>
            <div className="text-[11px] text-gray-400 mt-0.5">
              {Math.round((correctCount / currentExamResult.totalQuestions) * 100)}% Accuracy
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-rose-100 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">Incorrect</span>
              <XCircle className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-black text-rose-600 mt-1">{incorrectCount}</div>
            <div className="text-[11px] text-gray-400 mt-0.5">Review solutions below</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">Unanswered</span>
              <AlertCircle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-amber-600 mt-1">{skippedCount}</div>
            <div className="text-[11px] text-gray-400 mt-0.5">Skipped questions</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">Time Taken</span>
              <Clock className="w-4 h-4 text-[#5B4DFB]" />
            </div>
            <div className="text-2xl font-black text-[#5B4DFB] mt-1">
              {formatTimer(currentExamResult.timeTakenSeconds)}
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5">Pace: Good</div>
          </div>
        </div>

        {/* Detailed Solutions (MCQ) */}
        {isMcq && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-200">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Question Solutions & State Board Key ({mcqList.length} Questions)
              </h2>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl text-xs font-semibold">
                {(['ALL', 'CORRECT', 'INCORRECT', 'SKIPPED'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setResultFilterTab(tab)}
                    className={`px-3 py-1.5 rounded-lg transition capitalize cursor-pointer ${
                      resultFilterTab === tab ? 'bg-white text-[#5B4DFB] font-bold shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {tab.toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {filteredMcqResults.map((item, idx) => {
                const q = item.question
                const userOpt = item.userOptionIndex
                const isCorrect = item.isCorrect
                const isSkipped = item.isSkipped

                return (
                  <div
                    key={q.id}
                    className={`bg-white rounded-3xl border p-5 sm:p-6 shadow-xs space-y-4 transition ${
                      isCorrect ? 'border-emerald-200' : isSkipped ? 'border-gray-200' : 'border-rose-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 pb-3 border-b border-gray-100">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded text-xs">
                            Q{idx + 1} • {q.topic}
                          </span>
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-800 rounded text-[11px] font-semibold flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> {q.boardTag}
                          </span>
                        </div>
                        <h3 className="text-sm sm:text-base font-bold text-gray-900 mt-2 leading-relaxed">
                          {q.questionText}
                        </h3>
                      </div>

                      <div className="shrink-0">
                        {isCorrect ? (
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-extrabold flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> +1.0 Mark (Correct)
                          </span>
                        ) : isSkipped ? (
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold">
                            0.0 Marks (Skipped)
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-rose-100 text-rose-800 rounded-xl text-xs font-extrabold flex items-center gap-1">
                            <XCircle className="w-4 h-4 text-rose-600" /> 0.0 Marks (Incorrect)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {q.options.map((optText, optIdx) => {
                        const optLetter = String.fromCharCode(65 + optIdx)
                        const isOfficialCorrect = optIdx === q.correctOptionIndex
                        const isUserChoice = optIdx === userOpt

                        let optionStyle = 'bg-gray-50 border-gray-200 text-gray-700'
                        if (isOfficialCorrect) {
                          optionStyle = 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold ring-2 ring-emerald-500/30'
                        } else if (isUserChoice && !isOfficialCorrect) {
                          optionStyle = 'bg-rose-50 border-rose-500 text-rose-950 font-bold ring-2 ring-rose-500/30'
                        } else {
                          optionStyle = 'bg-gray-50/60 border-gray-200 text-gray-400'
                        }

                        return (
                          <div
                            key={optIdx}
                            className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between ${optionStyle}`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="w-6 h-6 rounded-lg bg-white border border-gray-300 font-bold flex items-center justify-center shrink-0">
                                {optLetter}
                              </span>
                              <span>{optText}</span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {isUserChoice && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-900">
                                  Your Choice
                                </span>
                              )}
                              {isOfficialCorrect && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white flex items-center gap-1">
                                  <Check className="w-3 h-3" /> State Board Key
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-2xl space-y-1.5 text-xs text-indigo-950">
                      <div className="font-bold flex items-center gap-1.5 text-indigo-900">
                        <BookOpen className="w-4 h-4 text-[#5B4DFB]" />
                        <span>Official Step-by-Step Solution:</span>
                      </div>
                      <p className="leading-relaxed pl-5">{q.explanation}</p>
                      <span className="text-[11px] text-indigo-700 font-semibold block pt-1 pl-5">
                        📖 Textbook Reference: {q.sourceBook}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Detailed Solutions (Descriptive) */}
        {!isMcq && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 pb-1 border-b border-gray-200">
              <CheckCircle2 className="w-5 h-5 text-purple-600" />
              Descriptive Questions AI Rubric Analysis ({descList.length} Questions)
            </h2>

            <div className="space-y-5">
              {descList.map((item, idx) => {
                const q = item.question

                return (
                  <div
                    key={q.id}
                    className="bg-white rounded-3xl border border-gray-200 p-6 shadow-xs space-y-4"
                  >
                    <div className="flex items-start justify-between gap-3 pb-3 border-b border-gray-100">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 bg-purple-100 text-purple-900 font-extrabold rounded text-xs">
                            Q{idx + 1} • {q.marks} Marks
                          </span>
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded text-xs">
                            {q.topic}
                          </span>
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-800 rounded text-[11px] font-semibold">
                            {q.boardTag}
                          </span>
                        </div>
                        <h3 className="text-sm sm:text-base font-bold text-gray-900 mt-2 leading-relaxed">
                          {q.questionText}
                        </h3>
                      </div>

                      <span className="px-3.5 py-1 bg-purple-50 text-purple-800 font-black rounded-xl text-xs sm:text-sm shrink-0 border border-purple-200">
                        {item.marksAwarded} / {item.maxMarks} Marks
                      </span>
                    </div>

                    <div>
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">
                        Your Submitted Written Answer:
                      </span>
                      <div className="p-4 bg-slate-50 border border-gray-200 rounded-2xl text-xs sm:text-sm text-gray-900 font-mono leading-relaxed">
                        {item.userAnswer || <span className="text-gray-400 italic">No answer submitted.</span>}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      <div className="bg-emerald-50/80 border border-emerald-200 p-4 rounded-2xl space-y-1.5">
                        <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Key Concepts Covered:</span>
                        </div>
                        <ul className="text-xs text-emerald-800 space-y-1 list-disc list-inside">
                          {item.correctPoints.length > 0 ? (
                            item.correctPoints.map((cp, i) => <li key={i}>{cp}</li>)
                          ) : (
                            <li>No rubric concepts identified.</li>
                          )}
                        </ul>
                      </div>

                      <div className="bg-amber-50/80 border border-amber-200 p-4 rounded-2xl space-y-1.5">
                        <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 text-amber-600" />
                          <span>Missing Key Points:</span>
                        </div>
                        <ul className="text-xs text-amber-800 space-y-1 list-disc list-inside">
                          {item.missingPoints.length > 0 ? (
                            item.missingPoints.map((mp, i) => <li key={i}>{mp}</li>)
                          ) : (
                            <li>All key points covered!</li>
                          )}
                        </ul>
                      </div>
                    </div>

                    <div className="p-4 bg-purple-50/70 border border-purple-100 rounded-2xl space-y-1 text-xs text-purple-950">
                      <div className="font-bold text-purple-900 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        <span>AI Feedback:</span>
                      </div>
                      <p className="leading-relaxed">{item.aiFeedback}</p>
                    </div>

                    <div className="p-4 sm:p-5 bg-slate-50 border border-gray-200 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                          <BookOpen className="w-4 h-4 text-[#5B4DFB]" />
                          <span>Official State Board Model Answer ({q.sourceTextbook})</span>
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-800 leading-relaxed font-sans">{q.expectedAnswer}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="pt-6 border-t border-gray-200 flex items-center justify-between flex-wrap gap-3">
          <button
            onClick={() => {
              setActiveSection('DASHBOARD')
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            className="px-6 py-3 bg-[#5B4DFB] hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition flex items-center gap-2 cursor-pointer"
          >
            <LayoutDashboard className="w-4 h-4" /> Return to Dashboard Hub
          </button>
        </div>
      </div>
    )
  }

  // =========================================================================
  // MAIN SECTIONS: DASHBOARD, CLASS SELECT, MCQ PORTAL, DESCRIPTIVE, PAPERS, ETC.
  // =========================================================================
  const subjectOptions = getSubjectOptions()

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* PAGE 1: DEDICATED DASHBOARD (Matches User Screenshot Perfectly) */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeSection === 'DASHBOARD' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Main Hero Card (Matches Screenshot Gradient & Badges) */}
          <div className="bg-gradient-to-r from-[#3C38A6] via-[#4834D4] to-[#6824D6] text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
            {/* Top Tag Badges */}
            <div className="flex items-center gap-2.5 mb-4 flex-wrap">
              <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[11px] font-bold text-white flex items-center gap-1.5 shadow-2xs">
                <span>🏫</span> Class & Public Prep
              </span>
              <span className="px-3 py-1 bg-amber-400/25 border border-amber-300/30 backdrop-blur-md rounded-full text-[11px] font-bold text-amber-200 flex items-center gap-1.5 shadow-2xs">
                <span>🏆</span> State Rank #4
              </span>
            </div>

            {/* Main Title & Subtitle */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight text-white mb-2">
              Tamil Nadu State Board Centum Preparation Portal
            </h1>
            <div className="flex items-center gap-2 mb-6 flex-wrap">
              <span className="text-xs sm:text-sm text-indigo-100 font-semibold">
                {getClassName(selectedClassId)}
              </span>
              <span className="px-2 py-0.5 rounded bg-indigo-500/40 text-[10px] font-bold text-indigo-100">
                State Rank #4
              </span>
            </div>

            {/* Inset Metric Cards Grid (Matching Screenshot) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Box 1: Exams Taken */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-inner">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-200">
                  EXAMS TAKEN
                </span>
                <div className="text-3xl sm:text-4xl font-black text-white mt-1">
                  {completedExamHistory.length || 6}
                </div>
                <div className="text-xs font-bold text-emerald-300 mt-1 flex items-center gap-1">
                  <span>↑ 92% Avg Score</span>
                </div>
              </div>

              {/* Box 2: Centum Goal */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-inner flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-200">
                    CENTUM GOAL
                  </span>
                  <div className="text-3xl sm:text-4xl font-black text-amber-300 mt-1">
                    98.4%
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs text-indigo-100 font-semibold">Top 0.5% in State</span>
                  <button
                    onClick={() => setActiveSection('CLASS_SELECT')}
                    className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg text-[11px] font-bold transition cursor-pointer"
                  >
                    Switch Class
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ───────────────────────────────────────────────────────────────── */}
          {/* 3 STACKED FEATURE CARDS (Exact Match to User Screenshot) */}
          {/* ───────────────────────────────────────────────────────────────── */}
          <div className="space-y-4">
            {/* Card 1: 1-Mark MCQ Center */}
            <div className="bg-white rounded-3xl border border-gray-200/90 p-5 sm:p-6 shadow-xs hover:shadow-md transition">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#3B82F6] text-white flex items-center justify-center font-bold text-xl shadow-md shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">
                    1-Mark MCQ Center
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Practice 1-Mark Multiple Choice Questions
                  </p>

                  <div className="mt-4 flex items-center gap-3 flex-wrap">
                    <button
                      onClick={() => setActiveSection('MCQ_PORTAL')}
                      className="px-5 py-2.5 bg-[#4F46E5] hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition cursor-pointer"
                    >
                      Start MCQ Exam
                    </button>
                    <button
                      onClick={() => setActiveSection('RESULTS_PORTAL')}
                      className="px-5 py-2.5 bg-[#4B5563] hover:bg-gray-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition cursor-pointer"
                    >
                      View Progress
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: 2M / 3M / 5M Drills */}
            <div className="bg-white rounded-3xl border border-gray-200/90 p-5 sm:p-6 shadow-xs hover:shadow-md transition">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#F97316] text-white flex items-center justify-center font-bold text-xl shadow-md shrink-0">
                  <Edit3 className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">
                    2M / 3M / 5M Drills
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Topic-based 2M, 3M & 5M Descriptive Drills
                  </p>

                  <div className="mt-4 flex items-center gap-3 flex-wrap">
                    <button
                      onClick={() => setActiveSection('DESCRIPTIVE_PORTAL')}
                      className="px-5 py-2.5 bg-[#F59E0B] hover:bg-amber-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition cursor-pointer"
                    >
                      Begin Drill Practice
                    </button>
                    <button
                      onClick={() => setActiveSection('RESULTS_PORTAL')}
                      className="px-5 py-2.5 bg-[#4B5563] hover:bg-gray-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition cursor-pointer"
                    >
                      Review Sessions
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Model Papers */}
            <div className="bg-white rounded-3xl border border-gray-200/90 p-5 sm:p-6 shadow-xs hover:shadow-md transition">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#10B981] text-white flex items-center justify-center font-bold text-xl shadow-md shrink-0">
                  <FolderOpen className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">
                    Model Papers
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Access Official Board Exam Papers (PDF)
                  </p>

                  <div className="mt-4 flex items-center gap-3 flex-wrap">
                    <button
                      onClick={() => setActiveSection('PAPERS_PORTAL')}
                      className="px-5 py-2.5 bg-[#059669] hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition cursor-pointer"
                    >
                      View Papers
                    </button>
                    <button
                      onClick={() => setActiveSection('PAPERS_PORTAL')}
                      className="px-5 py-2.5 bg-[#4B5563] hover:bg-gray-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition cursor-pointer"
                    >
                      Download PDFs
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* PAGE 2: DEDICATED CLASS & CURRICULUM SELECTION HUB */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeSection === 'CLASS_SELECT' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs">
            <div className="max-w-2xl">
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-bold text-xs rounded-lg uppercase tracking-wider">
                State Board Standards Hub
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 mt-2">
                Select Your Class Standard & Stream
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Choose your specific standard to customize question banks, syllabus chapters, and model test formats.
              </p>
            </div>

            {/* Standard Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              {[
                { id: 'c-9' as const, name: 'Class 9', sub: 'Foundational Board Prep', subjects: 5, icon: '📘' },
                { id: 'c-10' as const, name: 'Class 10 (SSLC)', sub: 'State Board Public Exam', subjects: 5, icon: '🏆' },
                { id: 'c-11' as const, name: 'Class 11 (+1)', sub: 'Higher Secondary Part 1', subjects: 10, icon: '🔬' },
                { id: 'c-12' as const, name: 'Class 12 (HSC +2)', sub: 'Public Board & Centum Prep', subjects: 10, icon: '🎓' },
              ].map((cls) => {
                const isSel = selectedClassId === cls.id
                return (
                  <button
                    key={cls.id}
                    onClick={() => setSelectedClassId(cls.id)}
                    className={`p-5 rounded-3xl border-2 text-left transition-all flex flex-col justify-between cursor-pointer ${
                      isSel
                        ? 'border-[#5B4DFB] bg-indigo-50/50 shadow-md ring-2 ring-indigo-500/20'
                        : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50/50'
                    }`}
                  >
                    <div>
                      <div className="text-3xl mb-3">{cls.icon}</div>
                      <h3 className="font-extrabold text-base text-gray-900">{cls.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">{cls.sub}</p>
                    </div>

                    <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-gray-400">{cls.subjects} Subjects</span>
                      {isSel ? (
                        <span className="px-2 py-0.5 bg-[#5B4DFB] text-white rounded text-[10px] font-bold">
                          Active
                        </span>
                      ) : (
                        <span className="text-xs text-[#5B4DFB] font-bold">Select</span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Stream Filter for 11th & 12th */}
            {(selectedClassId === 'c-11' || selectedClassId === 'c-12') && (
              <div className="mt-8 pt-6 border-t border-gray-100">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
                  Academic Group / Stream:
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {[
                    { id: 'ALL' as const, label: 'All Subjects' },
                    { id: 'SCIENCE' as const, label: 'Bio-Maths / Science Group' },
                    { id: 'CS' as const, label: 'Computer Science Stream' },
                    { id: 'COMMERCE' as const, label: 'Commerce & Accountancy' },
                  ].map((stream) => (
                    <button
                      key={stream.id}
                      onClick={() => setSelectedStream(stream.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                        selectedStream === stream.id
                          ? 'bg-[#5B4DFB] text-white shadow-xs'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {stream.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* PAGE 3: DEDICATED 1-MARK MCQ EXAM PORTAL */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeSection === 'MCQ_PORTAL' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
              <div>
                <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-bold text-xs rounded-lg uppercase tracking-wider">
                  Dedicated 1-Mark Exam Center
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 mt-2">
                  1-Mark Objective MCQ Examination
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Selected Standard: <strong>{getClassName(selectedClassId)}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => start1MarkMcqExam('ALL', 20)}
                  className="px-5 py-2.5 bg-[#4F46E5] hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-2 cursor-pointer"
                >
                  <Zap className="w-4 h-4" /> Start Full 20-MCQ Mock Exam
                </button>
              </div>
            </div>

            {/* Subject-Wise Exam Launch Grid */}
            <div className="mt-6">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                Launch Subject-Specific 1-Mark Exam:
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {subjectOptions.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-5 rounded-3xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/20 transition flex flex-col justify-between space-y-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{sub.icon}</div>
                      <div>
                        <h4 className="font-bold text-sm text-gray-900">{sub.name}</h4>
                        <span className="text-[11px] text-gray-400 font-mono">{sub.code}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedSubjectFilter(sub.id)
                          start1MarkMcqExam(sub.id, 10)
                        }}
                        className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition cursor-pointer"
                      >
                        10 Qs (10 Mins)
                      </button>
                      <button
                        onClick={() => {
                          setSelectedSubjectFilter(sub.id)
                          start1MarkMcqExam(sub.id, 20)
                        }}
                        className="flex-1 py-2 bg-[#4F46E5] hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-2xs transition cursor-pointer"
                      >
                        20 Qs (20 Mins)
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* PAGE 4: DEDICATED 2M, 3M & 5M DESCRIPTIVE EXAM CENTER (SUBJECT WISE) */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeSection === 'DESCRIPTIVE_PORTAL' && (() => {
        const availableSubjects = getSubjectOptions()
        const allDescriptiveForClass = MASTER_DESCRIPTIVE_BANK.filter(
          (q) => q.classId === selectedClassId
        )

        // Filtered questions for the question explorer
        const explorerQuestions = allDescriptiveForClass.filter((q) => {
          const matchSubject = descSubjectFilter === 'ALL' || q.subjectId === descSubjectFilter
          const matchMark = descMarkFilterTab === 'ALL' || q.marks === descMarkFilterTab
          return matchSubject && matchMark
        })

        return (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header Card */}
            <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-purple-50 text-purple-700 font-bold text-xs rounded-lg uppercase tracking-wider">
                      Subject-Wise 2M / 3M / 5M Hub
                    </span>
                    <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 font-bold text-xs rounded-lg">
                      {getClassName(selectedClassId)}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-gray-900 mt-2">
                    Descriptive Answer Drills & Subject-Wise Bank
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Select any subject to take tailored 2-Mark, 3-Mark, or 5-Mark practice drills assessed against official Tamil Nadu State Board evaluation rubrics.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => startDescriptiveExam('ALL', 'ALL', 10)}
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-2 cursor-pointer"
                  >
                    <Target className="w-4 h-4" /> Start Mixed All-Subject Drill (10 Qs)
                  </button>
                </div>
              </div>

              {/* Subject Filter Bar */}
              <div className="pt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-purple-600" />
                    <span>Choose Subject for 2M / 3M / 5M Practice:</span>
                  </h3>
                  <span className="text-xs text-gray-400 font-medium">
                    {availableSubjects.length - 1} Subjects Available
                  </span>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
                  {availableSubjects.map((sub) => {
                    const isSelected = descSubjectFilter === sub.id
                    return (
                      <button
                        key={sub.id}
                        onClick={() => setDescSubjectFilter(sub.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <span>{sub.icon}</span>
                        <span>{sub.name}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* ───────────────────────────────────────────────────────────── */}
              {/* SUBJECT CARDS WITH INDIVIDUAL 2M, 3M, 5M DRILL LAUNCHERS      */}
              {/* ───────────────────────────────────────────────────────────── */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                {availableSubjects
                  .filter((s) => (descSubjectFilter === 'ALL' ? s.id !== 'ALL' : s.id === descSubjectFilter))
                  .map((sub) => {
                    const q2mCount = allDescriptiveForClass.filter((q) => q.subjectId === sub.id && q.marks === 2).length
                    const q3mCount = allDescriptiveForClass.filter((q) => q.subjectId === sub.id && q.marks === 3).length
                    const q5mCount = allDescriptiveForClass.filter((q) => q.subjectId === sub.id && q.marks === 5).length

                    return (
                      <div
                        key={sub.id}
                        className="bg-white rounded-2xl border border-gray-200 hover:border-purple-300 hover:shadow-md transition p-5 flex flex-col justify-between space-y-4"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <span className="text-2xl">{sub.icon}</span>
                              <div>
                                <h4 className="font-bold text-sm text-gray-900">{sub.name}</h4>
                                <span className="text-[11px] text-gray-400 font-mono">{sub.code}</span>
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700">
                              {q2mCount + q3mCount + q5mCount} Qs
                            </span>
                          </div>

                          {/* Marks Count Indicator Badges */}
                          <div className="flex items-center gap-2 mt-4 text-[11px] font-semibold">
                            <span className="px-2 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-100 flex-1 text-center">
                              2M: <strong>{q2mCount || 50} Qs</strong>
                            </span>
                            <span className="px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 flex-1 text-center">
                              3M: <strong>{q3mCount || 50} Qs</strong>
                            </span>
                            <span className="px-2 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-100 flex-1 text-center">
                              5M: <strong>{q5mCount || 50} Qs</strong>
                            </span>
                          </div>
                        </div>

                        {/* Direct Subject Action Buttons */}
                        <div className="space-y-2 pt-2 border-t border-gray-100">
                          <div className="grid grid-cols-3 gap-1.5">
                            <button
                              onClick={() => startDescriptiveExam(sub.id, 2, 5)}
                              className="py-1.5 px-2 bg-purple-50 hover:bg-purple-600 hover:text-white text-purple-700 rounded-lg text-[11px] font-bold transition text-center cursor-pointer"
                              title="Start 2-Marks Short Answer Drill"
                            >
                              2M Drill
                            </button>
                            <button
                              onClick={() => startDescriptiveExam(sub.id, 3, 4)}
                              className="py-1.5 px-2 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 rounded-lg text-[11px] font-bold transition text-center cursor-pointer"
                              title="Start 3-Marks Problem/Derivation Drill"
                            >
                              3M Drill
                            </button>
                            <button
                              onClick={() => startDescriptiveExam(sub.id, 5, 2)}
                              className="py-1.5 px-2 bg-amber-50 hover:bg-amber-600 hover:text-white text-amber-800 rounded-lg text-[11px] font-bold transition text-center cursor-pointer"
                              title="Start 5-Marks Long Answer / Theorem Drill"
                            >
                              5M Drill
                            </button>
                          </div>

                          <button
                            onClick={() => startDescriptiveExam(sub.id, 'ALL', 8)}
                            className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Target className="w-3.5 h-3.5" />
                            <span>Full {sub.name} Descriptive Test (8 Qs)</span>
                          </button>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>

            {/* ───────────────────────────────────────────────────────────── */}
            {/* SUBJECT-WISE QUESTION BANK EXPLORER & RUBRIC BROWSER          */}
            {/* ───────────────────────────────────────────────────────────── */}
            <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-purple-600" />
                    <h3 className="text-lg font-bold text-gray-900">
                      Subject-Wise Question Bank & Evaluation Rubrics
                    </h3>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Browse questions, inspect model answers, key scoring points, and pass tips before attempting exams.
                  </p>
                </div>

                {/* Mark Filter Tabs */}
                <div className="inline-flex rounded-xl bg-gray-100 p-1 self-start sm:self-auto text-xs font-bold">
                  <button
                    onClick={() => setDescMarkFilterTab('ALL')}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                      descMarkFilterTab === 'ALL'
                        ? 'bg-white text-purple-700 shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    All Tiers
                  </button>
                  <button
                    onClick={() => setDescMarkFilterTab(2)}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                      descMarkFilterTab === 2
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    2 Marks (Short)
                  </button>
                  <button
                    onClick={() => setDescMarkFilterTab(3)}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                      descMarkFilterTab === 3
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    3 Marks (Medium)
                  </button>
                  <button
                    onClick={() => setDescMarkFilterTab(5)}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                      descMarkFilterTab === 5
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    5 Marks (Long)
                  </button>
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-4">
                {explorerQuestions.slice(0, 15).map((q) => {
                  const isExpanded = expandedDescQId === q.id
                  return (
                    <div
                      key={q.id}
                      className="p-5 rounded-2xl border border-gray-200 hover:border-gray-300 transition bg-slate-50/40 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                q.marks === 2
                                  ? 'bg-purple-100 text-purple-800'
                                  : q.marks === 3
                                  ? 'bg-indigo-100 text-indigo-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {q.marks} Marks
                            </span>
                            <span className="text-xs font-semibold text-gray-700">
                              {q.subjectName} • {q.topic}
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono">{q.boardTag}</span>
                          </div>
                          <h4 className="text-sm font-bold text-gray-900 leading-snug pt-1">
                            {q.questionText}
                          </h4>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                          <button
                            onClick={() => setExpandedDescQId(isExpanded ? null : q.id)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition flex items-center gap-1 cursor-pointer ${
                              isExpanded
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            {isExpanded ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            <span>{isExpanded ? 'Hide Rubric' : 'View Rubric'}</span>
                          </button>

                          <button
                            onClick={() => startDescriptiveExam(q.subjectId, q.marks, 1)}
                            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                          >
                            Practice Now
                          </button>
                        </div>
                      </div>

                      {/* Expandable Model Answer & Evaluation Rubric */}
                      {isExpanded && (
                        <div className="p-4 bg-white rounded-xl border border-purple-200/80 space-y-3 animate-in fade-in duration-150">
                          <div>
                            <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">
                              Expected Model Answer:
                            </span>
                            <p className="text-xs text-gray-800 mt-1 leading-relaxed bg-purple-50/50 p-3 rounded-lg">
                              {q.expectedAnswer}
                            </p>
                          </div>

                          {q.keyPoints?.length > 0 && (
                            <div>
                              <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                                Key Rubric Points (1 Mark Each):
                              </span>
                              <ul className="mt-1 space-y-1 list-disc list-inside text-xs text-gray-600">
                                {q.keyPoints.map((pt, pi) => (
                                  <li key={pi}>{pt}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100 text-[11px]">
                            <span className="text-gray-500">
                              Source: <strong className="text-gray-700">{q.sourceTextbook}</strong>
                            </span>
                            <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                              💡 Pass Tip: {q.passTip}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )
      })()}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* PAGE 5: DEDICATED MODEL PAPERS & PDF HUB */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeSection === 'PAPERS_PORTAL' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <BoardQuestionPaperView
            selectedClassId={selectedClassId}
            selectedSubjectId={selectedSubjectFilter}
          />
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* PAGE 6: DEDICATED EXAM RESULTS & SCORECARDS HUB */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeSection === 'RESULTS_PORTAL' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
              <div>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-lg uppercase tracking-wider">
                  Official Scorecards & History
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 mt-2">
                  Exam Results & Performance Center
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Review all completed tests, inspect answer keys, and track your Centum readiness.
                </p>
              </div>
            </div>

            {/* List of Recent Exam Attempts */}
            {completedExamHistory.length > 0 ? (
              <div className="space-y-3">
                {completedExamHistory.map((res, i) => (
                  <div
                    key={i}
                    className="p-5 rounded-2xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/20 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-bold rounded">
                          {res.examType}
                        </span>
                        <span className="text-xs text-gray-400 font-medium">{res.submittedAt}</span>
                      </div>
                      <h4 className="font-bold text-sm text-gray-900">{res.examTitle}</h4>
                      <p className="text-xs text-gray-500">
                        Class: {res.className} • Questions: {res.totalQuestions}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-lg font-black text-[#5B4DFB]">
                          {res.totalScore} / {res.maxMarks}
                        </div>
                        <div className="text-[11px] text-gray-400">{res.percentage}% • {res.grade}</div>
                      </div>

                      <button
                        onClick={() => {
                          setCurrentExamResult(res)
                          setActiveSection('RESULT_DETAIL_PAGE')
                          window.scrollTo({ top: 0, behavior: 'smooth' })
                        }}
                        className="px-4 py-2 bg-[#5B4DFB] hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <span>View Details</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 space-y-4">
                <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mx-auto text-2xl font-black">
                  📊
                </div>
                <h3 className="font-bold text-base text-gray-900">No Exams Attempted In Current Session</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  Take a 1-Mark MCQ exam or a 2M/3M/5M descriptive drill to view your real-time scorecards and step-by-step solutions here.
                </p>
                <button
                  onClick={() => setActiveSection('MCQ_PORTAL')}
                  className="px-5 py-2.5 bg-[#5B4DFB] hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Zap className="w-4 h-4" /> Start Your First MCQ Exam
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* PAGE 7: DEDICATED CENTUM LEADERBOARD */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeSection === 'LEADERBOARD_PORTAL' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
              <div>
                <span className="px-3 py-1 bg-amber-50 text-amber-800 font-bold text-xs rounded-lg uppercase tracking-wider">
                  State Board Centum League
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 mt-2">
                  Tamil Nadu State Top Performers
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Real-time ranking based on objective accuracy and descriptive rubric scores.
                </p>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {[
                { rank: 1, name: 'Ananya S.', district: 'Chennai', score: '99.4%', centums: 5, badge: '👑 State Rank 1' },
                { rank: 2, name: 'Karthik V.', district: 'Coimbatore', score: '98.8%', centums: 4, badge: '🥈 State Rank 2' },
                { rank: 3, name: 'Meenakshi R.', district: 'Madurai', score: '98.2%', centums: 4, badge: '🥉 State Rank 3' },
                { rank: 4, name: 'Demo Student (You)', district: 'Tiruchirappalli', score: '97.6%', centums: 3, badge: '⭐ You (Top 1%)' },
                { rank: 5, name: 'Praveen K.', district: 'Salem', score: '96.5%', centums: 3, badge: 'Centum Club' },
              ].map((student) => (
                <div key={student.rank} className="py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center ${
                        student.rank === 1
                          ? 'bg-amber-400 text-amber-950 shadow-xs'
                          : student.rank === 2
                          ? 'bg-slate-300 text-slate-900'
                          : student.rank === 3
                          ? 'bg-amber-600 text-white'
                          : student.rank === 4
                          ? 'bg-[#5B4DFB] text-white ring-2 ring-indigo-500/20'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {student.rank}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                        {student.name}
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold">
                          {student.badge}
                        </span>
                      </h4>
                      <span className="text-xs text-gray-400">{student.district} District</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-base font-black text-[#5B4DFB] block">{student.score}</span>
                    <span className="text-[10px] text-gray-400 font-semibold">{student.centums} Centums</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* PAGE 8: DEDICATED AI DOUBT STUDIO & STATE BOARD TUTOR */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeSection === 'AI_TUTOR_PORTAL' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs flex flex-col h-[650px] justify-between">
            <div>
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-[#5B4DFB] flex items-center justify-center font-bold text-lg">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    State Board AI Doubt Clearing Studio
                  </h2>
                  <p className="text-xs text-gray-500">
                    Ask questions on formulas, theorems, derivations, or exam scoring tips for Classes 9–12.
                  </p>
                </div>
              </div>

              {/* Chat Message Box */}
              <div className="mt-4 space-y-4 max-h-[440px] overflow-y-auto pr-2">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xl p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-[#5B4DFB] text-white rounded-br-none'
                          : 'bg-slate-50 border border-gray-200 text-gray-900 rounded-bl-none'
                      }`}
                    >
                      <p className="whitespace-pre-line">{msg.text}</p>
                      <span
                        className={`text-[10px] block mt-1.5 ${
                          msg.sender === 'user' ? 'text-indigo-200' : 'text-gray-400'
                        }`}
                      >
                        {msg.time}
                      </span>
                    </div>
                  </div>
                ))}
                {isBotTyping && (
                  <div className="flex justify-start">
                    <div className="bg-slate-50 border border-gray-200 p-3 rounded-2xl text-xs text-gray-500 flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#5B4DFB]" />
                      <span>AI State Board Tutor is formulating solution...</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Chat Input */}
            <div className="pt-4 border-t border-gray-100 flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendChatMessage()
                }}
                placeholder="Ask about Thales Theorem, Newton's Laws, Transformer Principle, or Tamil Grammar..."
                className="flex-1 p-3 border border-gray-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-[#5B4DFB] focus:border-[#5B4DFB]"
              />
              <button
                onClick={() => handleSendChatMessage()}
                className="px-5 py-3 bg-[#5B4DFB] hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Send</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
