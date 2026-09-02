import crypto from 'crypto'
import db, { memoryStore } from '../db/connection'

export interface WhiteboardStroke {
  id: string
  color: string
  width: number
  points: { x: number; y: number }[]
  tool: 'pen' | 'highlighter' | 'eraser' | 'line' | 'rect' | 'circle'
  createdAt: string
}

export interface StudentDoubt {
  id: string
  studentId: string
  studentName: string
  questionText: string
  timestamp: string
  clusterTag?: string
  status: 'PENDING' | 'ANSWERED'
}

export interface DoubtCluster {
  clusterTag: string
  theme: string
  tamilTheme?: string
  doubtCount: number
  studentDoubts: StudentDoubt[]
  aiSuggestedExplanation: string
  aiSuggestedTamil?: string
  keyPageCitation: number
}

export interface LivePulseCheck {
  id: string
  question: string
  tamilQuestion?: string
  options: string[]
  tamilOptions?: string[]
  correctOptionIndex: number
  active: boolean
  responses: { studentId: string; selectedOption: number }[]
  createdAt: string
}

export interface LiveClassroomSession {
  roomId: string
  roomCode: string
  title: string
  teacherId: string
  teacherName: string
  classLevel: string
  subjectName: string
  chapterId: string
  chapterName: string
  isActive: boolean
  participants: { id: string; name: string; role: 'teacher' | 'student'; joinedAt: string }[]
  whiteboardStrokes: WhiteboardStroke[]
  doubts: StudentDoubt[]
  activePulseCheck?: LivePulseCheck
  createdAt: string
}

// In-Memory Live Classroom Store
const classroomStore = new Map<string, LiveClassroomSession>()

export function createClassroomSession(params: {
  title: string
  teacherId: string
  teacherName: string
  classLevel?: string
  subjectName?: string
  chapterId?: string
}): LiveClassroomSession {
  const roomId = `room-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`
  const roomCode = Math.floor(100000 + Math.random() * 900000).toString()
  const chapter = memoryStore.chapters.find((c) => c.id === params.chapterId)

  const session: LiveClassroomSession = {
    roomId,
    roomCode,
    title: params.title,
    teacherId: params.teacherId,
    teacherName: params.teacherName,
    classLevel: params.classLevel || 'Class 10',
    subjectName: params.subjectName || 'Science',
    chapterId: params.chapterId || 'ch-10sci-t1-1',
    chapterName: chapter?.chapter_name || 'Laws of Motion',
    isActive: true,
    participants: [
      {
        id: params.teacherId,
        name: params.teacherName,
        role: 'teacher',
        joinedAt: new Date().toISOString(),
      },
    ],
    whiteboardStrokes: [],
    doubts: [],
    createdAt: new Date().toISOString(),
  }

  classroomStore.set(roomId, session)
  return session
}

export function joinClassroomSession(params: {
  roomCode: string
  studentId: string
  studentName: string
}): LiveClassroomSession {
  const session = Array.from(classroomStore.values()).find(
    (s) => s.roomCode === params.roomCode && s.isActive
  )

  if (!session) {
    throw new Error('Active classroom session not found for this room code.')
  }

  const existing = session.participants.find((p) => p.id === params.studentId)
  if (!existing) {
    session.participants.push({
      id: params.studentId,
      name: params.studentName,
      role: 'student',
      joinedAt: new Date().toISOString(),
    })
  }

  return session
}

export function addWhiteboardStroke(
  roomId: string,
  stroke: Omit<WhiteboardStroke, 'id' | 'createdAt'>
): WhiteboardStroke {
  const session = classroomStore.get(roomId)
  if (!session) {
    throw new Error('Classroom session not found.')
  }

  const fullStroke: WhiteboardStroke = {
    ...stroke,
    id: `stroke-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
    createdAt: new Date().toISOString(),
  }

  session.whiteboardStrokes.push(fullStroke)
  return fullStroke
}

export function addStudentDoubt(params: {
  roomId: string
  studentId: string
  studentName: string
  questionText: string
}): StudentDoubt {
  const session = classroomStore.get(params.roomId)
  if (!session) {
    throw new Error('Classroom session not found.')
  }

  let tag = 'General Concepts'
  const q = params.questionText.toLowerCase()
  if (q.includes('derivation') || q.includes('formula') || q.includes('f = ma') || q.includes('சமன்பாடு')) {
    tag = 'Mathematical Derivations & Formulas'
  } else if (q.includes('inertia') || q.includes('example') || q.includes('உதாரணம்') || q.includes('நிலைமம்')) {
    tag = 'Real-World Inertia & Examples'
  } else if (q.includes('action') || q.includes('reaction') || q.includes('rocket') || q.includes('ராக்கெட்')) {
    tag = "Newton's 3rd Law Applications"
  }

  const doubt: StudentDoubt = {
    id: `doubt-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
    studentId: params.studentId,
    studentName: params.studentName,
    questionText: params.questionText,
    timestamp: new Date().toISOString(),
    clusterTag: tag,
    status: 'PENDING',
  }

  session.doubts.push(doubt)
  return doubt
}

export function clusterLiveDoubts(roomId: string): DoubtCluster[] {
  const session = classroomStore.get(roomId)
  if (!session) {
    throw new Error('Classroom session not found.')
  }

  const clusterMap = new Map<string, StudentDoubt[]>()
  for (const d of session.doubts) {
    const tag = d.clusterTag || 'General Concepts'
    const list = clusterMap.get(tag) || []
    list.push(d)
    clusterMap.set(tag, list)
  }

  const result: DoubtCluster[] = []
  clusterMap.forEach((doubtsList, tag) => {
    let explanation = ''
    let tamExplanation = ''
    let pageNum = 1

    if (tag.includes('Derivations')) {
      explanation = 'Emphasize the step where momentum p = mv is differentiated with respect to time to yield F = ma.'
      tamExplanation = 'உந்த மாறுபாட்டு வீதம் (dp/dt) விசையினை (F = ma) உருவாக்குகிறது என்பதை படிகளுடன் விளக்குக.'
      pageNum = 5
    } else if (tag.includes('Inertia')) {
      explanation = 'Clarify inertia of rest vs motion using the bus passenger and coin on card experiment.'
      tamExplanation = 'ஓய்வில் நிலைமம் மற்றும் இயக்கத்தில் நிலைமம் ஆகியவற்றை பேருந்து உதாரணம் மூலம் தெளிவுபடுத்துக.'
      pageNum = 2
    } else if (tag.includes('3rd Law')) {
      explanation = 'Remind students that action and reaction act on two different bodies simultaneously.'
      tamExplanation = 'செயல் மற்றும் எதிர்செயல் எப்போதும் இரு வெவ்வேறு பொருட்களின் மீது ஒரே நேரத்தில் செயல்படுகின்றன.'
      pageNum = 8
    } else {
      explanation = 'Reiterate fundamental textbook definitions and highlight key diagram annotations.'
      tamExplanation = 'அரசுப் பாடப்புத்தகத்தில் உள்ள முதன்மைக் கருத்துக்கள் மற்றும் படங்களை மீண்டும் சுட்டிக்காட்டவும்.'
      pageNum = 1
    }

    result.push({
      clusterTag: tag,
      theme: tag,
      doubtCount: doubtsList.length,
      studentDoubts: doubtsList,
      aiSuggestedExplanation: explanation,
      aiSuggestedTamil: tamExplanation,
      keyPageCitation: pageNum,
    })
  })

  return result
}

export function launchLivePulseCheck(params: {
  roomId: string
  question: string
  tamilQuestion?: string
  options: string[]
  tamilOptions?: string[]
  correctOptionIndex: number
}): LivePulseCheck {
  const session = classroomStore.get(params.roomId)
  if (!session) {
    throw new Error('Classroom session not found.')
  }

  const pulse: LivePulseCheck = {
    id: `pulse-${Date.now()}`,
    question: params.question,
    tamilQuestion: params.tamilQuestion,
    options: params.options,
    tamilOptions: params.tamilOptions,
    correctOptionIndex: params.correctOptionIndex,
    active: true,
    responses: [],
    createdAt: new Date().toISOString(),
  }

  session.activePulseCheck = pulse
  return pulse
}

export function recordPulseResponse(params: {
  roomId: string
  studentId: string
  selectedOption: number
}): { success: boolean; totalResponses: number; accuracyPercentage: number } {
  const session = classroomStore.get(params.roomId)
  if (!session || !session.activePulseCheck) {
    throw new Error('Active pulse check not found.')
  }

  const pulse = session.activePulseCheck
  const existing = pulse.responses.find((r) => r.studentId === params.studentId)
  if (!existing) {
    pulse.responses.push({
      studentId: params.studentId,
      selectedOption: params.selectedOption,
    })
  } else {
    existing.selectedOption = params.selectedOption
  }

  const correctCount = pulse.responses.filter((r) => r.selectedOption === pulse.correctOptionIndex).length
  const accuracyPercentage = Math.round((correctCount / pulse.responses.length) * 100)

  return {
    success: true,
    totalResponses: pulse.responses.length,
    accuracyPercentage,
  }
}

export function getClassroomSessionById(roomId: string): LiveClassroomSession | undefined {
  return classroomStore.get(roomId)
}
