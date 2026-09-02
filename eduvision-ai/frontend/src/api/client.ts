import axios, { AxiosInstance } from 'axios'
import { ApiResponse, ClassItem, SubjectItem, ChapterItem, RAGAnswerData, BoardData, TermItem, TopicItem, Medium } from '../types/index'
import { DiagramSpecification } from '../components/DiagramRenderer'

export interface VideoStatusData {
  videoId?: string
  status?: 'QUEUED' | 'PROCESSING' | 'READY' | 'FAILED'
  progress?: number
  videoUrl?: string
  duration?: number
  sourcePages?: number[]
  videoAvailable?: boolean
  reason?: string
  error?: string
  script?: any
}

export interface StudentSafeQuestionData {
  id: string
  questionNumber: number
  question: string
  type: 'mcq'
  options: string[]
  difficulty: string
  sourcePages: number[]
}

export interface StudentSafeQuizData {
  quizId: string
  title: string
  questionCount: number
  difficulty: string
  questions: StudentSafeQuestionData[]
  quizAvailable?: boolean
  reason?: string
}

export interface QuizSubmitResultData {
  attemptId: string
  quizId: string
  score: number
  total: number
  percentage: number
  results: {
    questionId: string
    questionText: string
    selectedAnswer: string
    correctAnswer: string
    correct: boolean
    explanation: string
    sourcePages: number[]
  }[]
  createdAt: string
}

export interface AdminStatsData {
  totalStudents: number
  totalTeachers: number
  totalUsers?: number
  totalClasses: number
  totalSubjects: number
  totalChapters: number
  readyChapters?: number
  pendingChapters?: number
  failedChapters?: number
  coveragePercentage?: number
  totalTextbooks: number
  readyTextbooks: number
  processingTextbooks: number
  failedTextbooks: number
  totalQuestions: number
  totalVideos: number
  totalDiagrams: number
  totalQuizzes: number
  totalAssignments?: number
  totalSubmissions?: number
}

const API_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api')

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.client.interceptors.request.use((config) => {
      const token =
        localStorage.getItem('auth_token') ||
        sessionStorage.getItem('auth_token') ||
        localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    })

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        return Promise.reject(error)
      }
    )
  }

  async register(
    email: string,
    name: string,
    password: string,
    role: string,
    options?: { classLevel?: string; medium?: string; phone?: string }
  ) {
    return this.client.post<ApiResponse<any>>('/auth/register', {
      email,
      name,
      password,
      role,
      class_level: options?.classLevel,
      medium: options?.medium,
      phone: options?.phone,
    })
  }

  async login(email: string, password: string) {
    return this.client.post<ApiResponse<any>>('/auth/login', { email, password })
  }

  async logout() {
    return this.client.post('/auth/logout')
  }

  async getCurrentUser() {
    return this.client.get<ApiResponse<any>>('/auth/me')
  }

  // ── TN State Board Curriculum API ──────────────────────────────────────────

  async getBoard(): Promise<BoardData | null> {
    try {
      const res = await this.client.get<ApiResponse<BoardData>>('/board/board')
      return res.data.data || null
    } catch { return null }
  }

  async getClasses(): Promise<ClassItem[]> {
    const res = await this.client.get<ApiResponse<ClassItem[]>>('/classes')
    return res.data.data || []
  }

  async getSubjectsByClass(classId: string): Promise<SubjectItem[]> {
    const res = await this.client.get<ApiResponse<SubjectItem[]>>(`/classes/${classId}/subjects`)
    return res.data.data || []
  }

  async getSubjectsByClassAndMedium(classId: string, medium: Medium): Promise<SubjectItem[]> {
    const res = await this.client.get<ApiResponse<SubjectItem[]>>(`/classes/${classId}/subjects`, {
      params: { medium },
    })
    return res.data.data || []
  }

  async getTermsBySubject(subjectId: string): Promise<TermItem[]> {
    const res = await this.client.get<ApiResponse<TermItem[]>>(`/subjects/${subjectId}/terms`)
    return res.data.data || []
  }

  async getChaptersByTerm(termId: string): Promise<ChapterItem[]> {
    const res = await this.client.get<ApiResponse<ChapterItem[]>>(`/terms/${termId}/chapters`)
    return res.data.data || []
  }

  async getTopicsByChapter(chapterId: string): Promise<TopicItem[]> {
    const res = await this.client.get<ApiResponse<TopicItem[]>>(`/chapters/${chapterId}/topics`)
    return res.data.data || []
  }

  async getChaptersBySubject(subjectId: string): Promise<ChapterItem[]> {
    const res = await this.client.get<ApiResponse<ChapterItem[]>>(`/subjects/${subjectId}/chapters`)
    return res.data.data || []
  }

  async askQuestion(
    classId: string,
    subjectId: string,
    chapterId: string,
    question: string,
    termId?: string,
    topicId?: string,
  ): Promise<RAGAnswerData> {
    const res = await this.client.post<ApiResponse<RAGAnswerData>>('/questions/ask', {
      classId,
      subjectId,
      termId,
      chapterId,
      topicId,
      question,
    })
    if (!res.data.success || !res.data.data) {
      throw new Error((res.data as any).error?.message || (res.data as any).error || 'Failed to generate answer from textbook.')
    }
    return res.data.data
  }

  async generateDiagram(
    classId: string,
    subjectId: string,
    chapterId: string,
    question: string
  ): Promise<DiagramSpecification> {
    const res = await this.client.post<ApiResponse<DiagramSpecification>>('/diagrams/generate', {
      classId,
      subjectId,
      chapterId,
      question,
    })
    return res.data.data || { diagramAvailable: false }
  }

  async requestVideo(
    classId: string,
    subjectId: string,
    chapterId: string,
    question: string
  ): Promise<VideoStatusData> {
    const res = await this.client.post<ApiResponse<VideoStatusData>>('/videos/generate', {
      classId,
      subjectId,
      chapterId,
      question,
    })
    return res.data.data || (res.data as any)
  }

  async getVideoStatus(videoId: string): Promise<VideoStatusData> {
    const res = await this.client.get<ApiResponse<VideoStatusData>>(`/videos/${videoId}/status`)
    return res.data.data || { status: 'FAILED' }
  }

  async generateQuiz(
    classId: string,
    subjectId: string,
    chapterId: string,
    questionCount: number = 5,
    difficulty: string = 'mixed'
  ): Promise<StudentSafeQuizData> {
    const res = await this.client.post<ApiResponse<StudentSafeQuizData>>('/quizzes/generate', {
      classId,
      subjectId,
      chapterId,
      questionCount,
      difficulty,
    })
    return res.data.data || { quizId: '', title: '', questionCount: 0, difficulty: '', questions: [], quizAvailable: false }
  }

  async submitQuiz(
    quizId: string,
    answers: { questionId: string; selectedAnswer: string }[]
  ): Promise<QuizSubmitResultData> {
    const res = await this.client.post<ApiResponse<QuizSubmitResultData>>(`/quizzes/${quizId}/submit`, {
      answers,
    })
    if (!res.data.success || !res.data.data) {
      throw new Error((res.data as any).error?.message || (res.data as any).error || 'Failed to submit quiz.')
    }
    return res.data.data
  }

  async getQuizHistory(): Promise<QuizSubmitResultData[]> {
    const res = await this.client.get<ApiResponse<QuizSubmitResultData[]>>('/quizzes/history/student')
    return res.data.data || []
  }

  // ── Student Learning & Analytics Endpoints ────────────────────────────────
  async getStudentDashboard(): Promise<any> {
    const res = await this.client.get<ApiResponse<any>>('/student/dashboard')
    return res.data.data
  }

  async getStudentProgress(): Promise<any> {
    const res = await this.client.get<ApiResponse<any>>('/student/progress')
    return res.data.data
  }

  async getStudentRecommendations(): Promise<any> {
    const res = await this.client.get<ApiResponse<any>>('/student/recommendations')
    return res.data.data
  }

  async getStudentWeakTopics(): Promise<any> {
    const res = await this.client.get<ApiResponse<any>>('/student/weak-topics')
    return res.data.data
  }

  async getChapterLesson(chapterId: string): Promise<any> {
    const res = await this.client.get<ApiResponse<any>>(`/student/chapters/${chapterId}/lesson`)
    return res.data.data
  }

  // 11. ADMIN ENDPOINTS
  async getAdminStats(): Promise<AdminStatsData> {
    const res = await this.client.get<ApiResponse<AdminStatsData>>('/admin/dashboard/stats')
    return res.data.data || {
      totalStudents: 1240,
      totalTeachers: 48,
      totalClasses: 7,
      totalSubjects: 72,
      totalChapters: 86,
      totalTextbooks: 72,
      readyTextbooks: 72,
      processingTextbooks: 0,
      failedTextbooks: 0,
      totalQuestions: 8450,
      totalVideos: 89,
      totalDiagrams: 142,
      totalQuizzes: 120,
    }
  }

  async getUsers(role: string = 'all', page: number = 1, limit: number = 20) {
    const res = await this.client.get<ApiResponse<any[]>>(`/admin/users?role=${role}&page=${page}&limit=${limit}`)
    return res.data.data || []
  }

  async updateUserStatus(userId: string, status: string) {
    const res = await this.client.patch<ApiResponse<any>>(`/admin/users/${userId}/status`, { status })
    return res.data
  }

  async getTeachers() {
    const res = await this.client.get<ApiResponse<any[]>>('/admin/teachers')
    return res.data.data || []
  }

  async getStudents() {
    const res = await this.client.get<ApiResponse<any[]>>('/admin/students')
    return res.data.data || []
  }

  async assignTeacher(teacherId: string, classId: string, subjectId: string) {
    const res = await this.client.post<ApiResponse<any>>(`/admin/teachers/${teacherId}/assignments`, { classId, subjectId })
    return res.data
  }

  async removeTeacherAssignment(teacherId: string, assignmentId: string) {
    const res = await this.client.delete<ApiResponse<any>>(`/admin/teachers/${teacherId}/assignments/${assignmentId}`)
    return res.data
  }

  async getSystemHealth() {
    const res = await this.client.get<ApiResponse<any>>('/admin/system-health')
    return res.data.data
  }

  async getAuditLogs(page: number = 1, limit: number = 20) {
    const res = await this.client.get<ApiResponse<any[]>>(`/admin/audit-logs?page=${page}&limit=${limit}`)
    return res.data.data || []
  }

  async getTextbooks() {
    const res = await this.client.get<ApiResponse<any[]>>('/admin/textbooks')
    return res.data.data || []
  }

  async uploadTextbook(data: any) {
    const headers = data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {}
    const res = await this.client.post<ApiResponse<any>>('/books', data, { headers })
    return res.data
  }

  async batchUploadTextbooks(formData: FormData) {
    const res = await this.client.post<ApiResponse<any>>('/books/batch-upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  }

  async retryTextbook(bookId: string) {
    const res = await this.client.post<ApiResponse<any>>(`/books/${bookId}/retry`)
    return res.data
  }

  async getTextbookHealth() {
    const res = await this.client.get<ApiResponse<any>>('/books/health')
    return res.data.data
  }

  async getCurriculum() {
    const res = await this.client.get<ApiResponse<any[]>>('/admin/curriculum')
    return res.data.data || []
  }

  async getContentCoverage() {
    const res = await this.client.get<ApiResponse<any>>('/admin/content-coverage')
    return res.data.data
  }

  async getIngestionHealth() {
    const res = await this.client.get<ApiResponse<any>>('/admin/ingestion')
    return res.data.data
  }

  // 12. TEACHER ENDPOINTS
  async getTeacherStats() {
    const res = await this.client.get<ApiResponse<any>>('/teacher/dashboard')
    return res.data.data
  }

  async getTeacherQuestions() {
    const res = await this.client.get<ApiResponse<any[]>>('/teacher/questions')
    return res.data.data || []
  }

  async getTeacherStudents() {
    const res = await this.client.get<ApiResponse<any[]>>('/teacher/students')
    return res.data.data || []
  }

  async getTeacherStudentById(studentId: string) {
    const res = await this.client.get<ApiResponse<any>>(`/teacher/students/${studentId}`)
    return res.data.data
  }

  async getTeacherStudentPerformance(studentId: string) {
    const res = await this.client.get<ApiResponse<any>>(`/teacher/students/${studentId}/performance`)
    return res.data.data
  }

  async getTeacherAssignments() {
    const res = await this.client.get<ApiResponse<any[]>>('/teacher/assignments')
    return res.data.data || []
  }

  async createTeacherAssignment(data: {
    title: string
    description?: string
    class_level: string
    medium: string
    subject_id: string
    term_id?: string
    chapter_id: string
    due_date?: string
  }) {
    const res = await this.client.post<ApiResponse<any>>('/teacher/assignments', data)
    return res.data
  }

  async getTeacherAssignmentById(assignmentId: string) {
    const res = await this.client.get<ApiResponse<any>>(`/teacher/assignments/${assignmentId}`)
    return res.data.data
  }

  async updateTeacherAssignment(assignmentId: string, data: any) {
    const res = await this.client.put<ApiResponse<any>>(`/teacher/assignments/${assignmentId}`, data)
    return res.data
  }

  async deleteTeacherAssignment(assignmentId: string) {
    const res = await this.client.delete<ApiResponse<any>>(`/teacher/assignments/${assignmentId}`)
    return res.data
  }

  async getTeacherAssignmentSubmissions(assignmentId: string) {
    const res = await this.client.get<ApiResponse<any[]>>(`/teacher/assignments/${assignmentId}/submissions`)
    return res.data.data || []
  }

  async getTeacherAnalytics() {
    const res = await this.client.get<ApiResponse<any>>('/teacher/analytics')
    return res.data.data
  }

  // 13. STUDENT ASSIGNMENT ENDPOINTS
  async getStudentAssignments() {
    const res = await this.client.get<ApiResponse<any[]>>('/student/assignments')
    return res.data.data || []
  }

  async getStudentAssignmentById(assignmentId: string) {
    const res = await this.client.get<ApiResponse<any>>(`/student/assignments/${assignmentId}`)
    return res.data.data
  }

  async submitStudentAssignment(assignmentId: string, answers: { questionId: string; selectedAnswer: string }[]) {
    const res = await this.client.post<ApiResponse<any>>(`/student/assignments/${assignmentId}/submit`, { answers })
    return res.data
  }

  // 14. STUDENT CHAPTER PDF ENDPOINTS
  getChapterPdfUrl(chapterId: string, customToken?: string): string {
    const token =
      customToken ||
      localStorage.getItem('auth_token') ||
      sessionStorage.getItem('auth_token') ||
      localStorage.getItem('token') || ''
    const base = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL
    return `${base}/student/chapters/${encodeURIComponent(chapterId)}/pdf?token=${encodeURIComponent(token)}`
  }

  async getChapterPdfBlob(chapterId: string): Promise<Blob> {
    const res = await this.client.get(`/student/chapters/${encodeURIComponent(chapterId)}/pdf`, {
      responseType: 'blob',
    })
    return res.data
  }

  // 15. SUBJECT AI CHATBOT ENDPOINTS
  async sendChatMessage(data: {
    message: string
    classId?: string
    subjectId?: string
    termId?: string
    chapterId?: string
    history?: Array<{ role: string; content: string }>
    language?: 'en' | 'ta'
  }): Promise<{
    reply: string
    simpleExplanation: string
    keyPoints: string[]
    example: string | null
    followUpQuestions: string[]
    grounding: {
      isGrounded: boolean
      sourceBook: string
      chapterName: string
      sourcePages: number[]
    }
    context: any
    timestamp?: string
  }> {
    const res = await this.client.post<ApiResponse<any>>('/ai/chat', data)
    return res.data.data
  }

  // 16. EXAM PRACTICE, EVALUATION & RANKING ENDPOINTS
  async getAvailableExams(): Promise<any> {
    const res = await this.client.get<ApiResponse<any>>('/exams/available')
    return res.data.data
  }

  async getExamDetails(examId: string): Promise<any> {
    const res = await this.client.get<ApiResponse<any>>(`/exams/${examId}`)
    return res.data.data
  }

  async startExam(examId: string): Promise<any> {
    const res = await this.client.post<ApiResponse<any>>(`/exams/${examId}/start`)
    return res.data.data
  }

  async autosaveExamAnswer(examId: string, payload: { attemptId: string; questionId: string; answerText: string }): Promise<any> {
    const res = await this.client.post<ApiResponse<any>>(`/exams/${examId}/autosave`, payload)
    return res.data.data
  }

  async submitExam(examId: string, payload: { attemptId: string; finalAnswers?: Array<{ questionId: string; answerText: string }> }): Promise<any> {
    const res = await this.client.post<ApiResponse<any>>(`/exams/${examId}/submit`, payload)
    return res.data.data
  }

  async getExamResults(examId: string): Promise<any> {
    const res = await this.client.get<ApiResponse<any>>(`/exams/${examId}/results`)
    return res.data.data
  }

  async getExamLeaderboard(examId: string): Promise<any> {
    const res = await this.client.get<ApiResponse<any>>(`/exams/${examId}/leaderboard`)
    return res.data.data
  }

  async generateExamQuestions(params: {
    classId: string
    subjectId: string
    chapterId?: string
    chapterIds?: string[]
    difficulty?: string
    distribution?: { mark1?: number; mark2?: number; mark3?: number; mark5?: number }
  }): Promise<any> {
    const res = await this.client.post<ApiResponse<any>>('/exams/generate-questions', params)
    return res.data.data
  }

  async createExam(examData: any): Promise<any> {
    const res = await this.client.post<ApiResponse<any>>('/exams', examData)
    return res.data.data
  }

  async getTeacherExams(): Promise<any[]> {
    const res = await this.client.get<ApiResponse<any[]>>('/exams/teacher/list')
    return res.data.data || []
  }

  async getExamSubmissions(examId: string): Promise<any> {
    const res = await this.client.get<ApiResponse<any>>(`/exams/${examId}/submissions`)
    return res.data.data
  }

  async getSubmissionReview(attemptId: string): Promise<any> {
    const res = await this.client.get<ApiResponse<any>>(`/exams/submissions/${attemptId}/review`)
    return res.data.data
  }

  async overrideSubmissionMarks(attemptId: string, payload: {
    questionId: string
    teacherMarks: number
    feedback?: string
    overallFeedback?: string
    suggestion?: string
  }): Promise<any> {
    const res = await this.client.post<ApiResponse<any>>(`/exams/submissions/${attemptId}/override`, payload)
    return res.data
  }

  async publishExam(examId: string): Promise<any> {
    const res = await this.client.post<ApiResponse<any>>(`/exams/${examId}/publish`)
    return res.data
  }
}

export const apiClient = new ApiClient()

