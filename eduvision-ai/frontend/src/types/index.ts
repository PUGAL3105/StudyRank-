// User roles
export type UserRole = 'student' | 'teacher' | 'admin'

// User types
export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  avatar?: string
  classLevel?: string
  medium?: string
  phone?: string
  createdAt: string
}

export interface AuthUser extends User {
  token: string
}

// ── Tamil Nadu State Board Types ─────────────────────────────────────────────

export interface BoardData {
  id: string
  board_name: string
  short_name: string
  state: string
  country: string
}

export type Medium = 'English' | 'Tamil'

export interface MediumOption {
  id: Medium
  label: string
  description: string
}

export interface TermItem {
  id: string
  subject_id: string
  class_id: string
  term_number: number
  term_name: string
}

export interface TopicItem {
  id: string
  chapter_id: string
  topic_number: number
  topic_name: string
  indexing_status: 'READY' | 'PENDING' | 'FAILED'
}

// ── Curriculum Data Types ────────────────────────────────────────────────────

export interface ClassItem {
  id: string
  class_name: string
  display_order: number
  description?: string
  stream_supported?: boolean
  board_id?: string
}

export interface SubjectItem {
  id: string
  class_id: string
  stream_id?: string | null
  subject_code?: string
  subject_name: string
  description?: string
  chapter_count?: number
  medium?: 'English' | 'Tamil' | 'Both'
  term_type?: '3-term' | '2-semester'
}

export interface ChapterItem {
  id: string
  subject_id: string
  term_id?: string
  chapter_number: number
  chapter_name: string
  curriculum_status?: 'VERIFIED' | 'NOT_VERIFIED' | 'NOT_CONFIGURED'
  textbook_status?: 'AVAILABLE' | 'PENDING' | 'REJECTED'
  indexing_status: 'READY' | 'PROCESSING' | 'INDEXING' | 'PENDING' | 'FAILED' | 'REJECTED' | 'PARTIAL'
  chunk_count?: number
  processed_at?: string
}

export interface RetrievedChunk {
  chunk_id: string
  section_name: string
  page_number: number
  similarity_score: number
  content: string
}

export interface RAGAnswerData {
  question: string
  answer: string
  simple_explanation: string
  important_points: string[]
  step_by_step: string[]
  example: string | null
  source?: {
    book: string
    chapter: string
    pages: number[]
    sections: string[]
  } | null
  grounding?: {
    sourceBook?: string
    sourcePages?: number[]
  }
  chapter?: string
  page_numbers?: number[]
  confidence?: number
  retrieved_chunks?: RetrievedChunk[]
}

// API Responses
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string | { code?: string; message?: string }
  message?: string
}

export interface AssignmentItem {
  id: string
  teacher_id: string
  teacher_name?: string
  title: string
  description?: string
  class_level: string
  medium: string
  subject_id: string
  subject_name?: string
  term_id?: string
  chapter_id: string
  chapter_name?: string
  due_date?: string
  status?: string
  score?: number | null
  percentage?: number | null
  submitted_at?: string | null
  submissions_count?: number
  average_score?: number
  created_at?: string
}

export interface TeacherStudentItem {
  id: string
  name: string
  email: string
  class: string
  medium: string
  subject: string
  questionsAsked: number
  quizAttempts: number
  avgScore: string
  avgScoreNumber?: number
  assignmentsCompleted?: number
  weakChapters: string[]
  strongChapters: string[]
}


