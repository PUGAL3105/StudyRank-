export interface UserData {
  email: string
  name: string
  password: string
  role: 'student' | 'teacher' | 'admin'
  class_level?: string
  medium?: string
  phone?: string
}

export interface LoginData {
  email: string
  password: string
}

export interface User {
  id: string
  email: string
  name: string
  role: 'student' | 'teacher' | 'admin'
  avatar_url?: string
  class_level?: string
  medium?: string
  phone?: string
  created_at: string
}

export interface Book {
  id: string
  title: string
  author?: string
  class: string
  subject: string
  uploaded_by: string
  created_at: string
}

export interface Chapter {
  id: string
  book_id: string
  title: string
  chapter_order: number
  created_at: string
}

export interface Question {
  id: string
  student_id: string
  book_id: string
  chapter_id: string
  question_text: string
  question_image_url?: string
  asked_at: string
}

export interface Answer {
  id: string
  question_id: string
  explanation: string
  key_points: string[]
  source_page?: number
  diagram_url?: string
  video_url?: string
  created_at: string
}

export interface Assignment {
  id: string
  teacher_id: string
  title: string
  description?: string
  class_level: string
  medium: string
  subject_id: string
  term_id?: string
  chapter_id: string
  due_date?: string
  status?: 'ACTIVE' | 'DRAFT' | 'ARCHIVED' | 'CLOSED'
  created_at?: string
  updated_at?: string
}

export interface AssignmentSubmission {
  id: string
  assignment_id: string
  student_id: string
  status: 'SUBMITTED' | 'GRADED' | 'LATE'
  score: number
  percentage: number
  submitted_at: string
  answers?: { questionId: string; selectedAnswer: string }[]
  feedback?: string
  created_at?: string
  updated_at?: string
}

