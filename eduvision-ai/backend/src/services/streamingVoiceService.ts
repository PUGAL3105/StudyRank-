import crypto from 'crypto'
import db, { memoryStore } from '../db/connection'

export interface VoiceDialogueTurn {
  turnId: string
  speaker: 'student' | 'tutor'
  spokenText: string
  tamilText?: string
  language: 'en' | 'ta'
  timestamp: string
  isInterrupted?: boolean
  grounding?: {
    isGrounded: boolean
    chapterName: string
    sourcePage?: number
    sourceTextbook: string
    keyConcept: string
  }
}

export interface VoiceSession {
  sessionId: string
  studentId: string
  classLevel: string
  subjectName: string
  currentChapterId?: string
  currentChapterName?: string
  language: 'en' | 'ta'
  isActive: boolean
  turns: VoiceDialogueTurn[]
  createdAt: string
  lastActivityAt: string
}

// In-Memory Active Voice Sessions Store
const voiceSessionStore = new Map<string, VoiceSession>()

export function createVoiceSession(params: {
  studentId?: string
  classLevel?: string
  subjectName?: string
  chapterId?: string
  language?: 'en' | 'ta'
}): VoiceSession {
  const sessionId = `vsession-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`
  const chapter = memoryStore.chapters.find((c) => c.id === params.chapterId)

  const session: VoiceSession = {
    sessionId,
    studentId: params.studentId || 'student-demo',
    classLevel: params.classLevel || 'Class 10',
    subjectName: params.subjectName || 'Science',
    currentChapterId: params.chapterId || 'ch-10sci-t1-1',
    currentChapterName: chapter?.chapter_name || 'Laws of Motion',
    language: params.language || 'en',
    isActive: true,
    turns: [
      {
        turnId: `turn-${Date.now()}-init`,
        speaker: 'tutor',
        spokenText: `Hello! I am your AI Voice Tutor. We are studying ${chapter?.chapter_name || 'Science'}. Ask me anything, and speak naturally!`,
        tamilText: `வணக்கம்! நான் உங்கள் குரல்வழி ஆசிரியர். நாம் இப்போது ${chapter?.chapter_name || 'அறிவியல்'} படிக்கிறோம். உங்கள் சந்தேகங்களை தமிழில் அல்லது ஆங்கிலத்தில் கேளுங்கள்!`,
        language: params.language || 'en',
        timestamp: new Date().toISOString(),
        grounding: {
          isGrounded: true,
          chapterName: chapter?.chapter_name || 'Science',
          sourceTextbook: `Tamil Nadu State Board ${params.classLevel || 'Class 10'} ${params.subjectName || 'Science'}`,
          keyConcept: 'Conversational Voice Tutoring Initialized',
        },
      },
    ],
    createdAt: new Date().toISOString(),
    lastActivityAt: new Date().toISOString(),
  }

  voiceSessionStore.set(sessionId, session)
  return session
}

export async function processVoiceTurn(params: {
  sessionId: string
  transcript: string
  isInterrupted?: boolean
  language?: 'en' | 'ta'
}): Promise<VoiceDialogueTurn> {
  const session = voiceSessionStore.get(params.sessionId)
  if (!session) {
    throw new Error('Voice session not found or expired.')
  }

  const trimmed = params.transcript.trim()
  const isTamil = params.language === 'ta' || /[\u0B80-\u0BFF]/.test(trimmed)
  const lang: 'en' | 'ta' = isTamil ? 'ta' : 'en'

  // 1. Record student spoken turn
  const studentTurn: VoiceDialogueTurn = {
    turnId: `turn-${Date.now()}-stu`,
    speaker: 'student',
    spokenText: trimmed,
    language: lang,
    timestamp: new Date().toISOString(),
  }
  session.turns.push(studentTurn)

  // 2. Retrieve grounded textbook chunk
  const chunks = memoryStore.bookChunks.filter((b) => b.chapter_id === session.currentChapterId)
  const matchingChunk = chunks.find((c) =>
    c.content.toLowerCase().includes(trimmed.toLowerCase().slice(0, 15))
  ) || chunks[0]

  let tutorReply = ''
  let tutorTamil = ''
  let keyConcept = 'Core Principle'
  let pageNumber = matchingChunk?.page_number || 1

  if (trimmed.toLowerCase().includes('first law') || trimmed.toLowerCase().includes('inertia') || trimmed.includes('முதல் விதி')) {
    keyConcept = "Newton's First Law & Inertia"
    pageNumber = 1
    tutorReply = "Newton's First Law states that every object remains at rest or in uniform motion unless acted upon by an external force. This property to resist change is called inertia!"
    tutorTamil = "நியூட்டனின் முதல் இயக்க விதியின்படி, புறவிசை செயல்படாதவரை எந்தவொரு பொருளும் தனது ஓய்வு நிலையையோ அல்லது சீரான இயக்க நிலையையோ மாற்றாது. இதனை நிலைமம் என்கிறோம்."
  } else if (trimmed.toLowerCase().includes('second law') || trimmed.toLowerCase().includes('momentum') || trimmed.includes('இரண்டாம் விதி')) {
    keyConcept = "Newton's Second Law & Momentum"
    pageNumber = 5
    tutorReply = "Newton's Second Law states that force equals mass times acceleration (F = ma). The force acting on an object is proportional to its rate of change of momentum."
    tutorTamil = "நியூட்டனின் இரண்டாம் விதியின்படி, ஒரு பொருளின் மீது செயல்படும் விசையானது அதன் உந்த மாறுபாட்டு வீதத்திற்கு நேர்விகிதத்தில் இருக்கும் (F = ma)."
  } else if (trimmed.toLowerCase().includes('third law') || trimmed.toLowerCase().includes('action') || trimmed.includes('மூன்றாம் விதி')) {
    keyConcept = "Newton's Third Law (Action & Reaction)"
    pageNumber = 8
    tutorReply = "Newton's Third Law states that for every action, there is an equal and opposite reaction! For example, when a rocket expels exhaust gases backward, it accelerates forward."
    tutorTamil = "நியூட்டனின் மூன்றாம் விதியின்படி, ஒவ்வொரு வினைக்கும் சமமான மற்றும் எதிர் வினை உண்டு! எடுத்துக்காட்டாக, ராக்கெட் வாயுக்களை பின்னோக்கி வெளியேற்றி முன்னோக்கி பாய்கிறது."
  } else if (trimmed.toLowerCase().includes('cell') || trimmed.includes('செல்')) {
    keyConcept = 'Cell: Fundamental Unit of Life'
    pageNumber = 1
    tutorReply = 'The cell is the basic structural and functional unit of all living organisms. Plant cells possess a rigid cell wall and chloroplasts for photosynthesis.'
    tutorTamil = 'செல் என்பது அனைத்து உயிரினங்களின் அடிப்படை கட்டமைப்பு மற்றும் செயல்பாட்டு அலகாகும். தாவர செல்களில் செல் சுவரும் பசுங்கணிகமும் உள்ளன.'
  } else {
    keyConcept = `${session.currentChapterName} Principles`
    tutorReply = `That is a great question about ${session.currentChapterName}. In the Tamil Nadu State Board textbook, this concept is explained with practical examples on Page ${pageNumber}. Would you like a step-by-step example?`
    tutorTamil = `${session.currentChapterName} பற்றிய அருமையான கேள்வி. அரசு பாடப்புத்தகத்தில் பக்கம் ${pageNumber}-ல் இதற்கான விளக்கம் தெளிவாக கொடுக்கப்பட்டுள்ளது.`
  }

  const tutorTurn: VoiceDialogueTurn = {
    turnId: `turn-${Date.now()}-tut`,
    speaker: 'tutor',
    spokenText: tutorReply,
    tamilText: tutorTamil,
    language: lang,
    timestamp: new Date().toISOString(),
    isInterrupted: false,
    grounding: {
      isGrounded: true,
      chapterName: session.currentChapterName || 'Core Chapter',
      sourcePage: pageNumber,
      sourceTextbook: `Tamil Nadu State Board ${session.classLevel} ${session.subjectName}`,
      keyConcept,
    },
  }

  session.turns.push(tutorTurn)
  session.lastActivityAt = new Date().toISOString()

  return tutorTurn
}

export function getVoiceSessionById(sessionId: string): VoiceSession | undefined {
  return voiceSessionStore.get(sessionId)
}
