import { Router } from 'express'
import { authMiddleware, requireRole } from '../middleware/auth'
import {
  getDashboardStats,
  getUsers,
  getUserById,
  updateUserStatus,
  updateUser,
  getTeachers,
  assignTeacherSubject,
  removeTeacherAssignment,
  getStudents,
  getCurriculum,
  getQuestionsMonitor,
  getDiagramsMonitor,
  getVideosMonitor,
  getQuizzesMonitor,
  getAnalytics,
  getSystemHealth,
  getAuditLogsList,
  getContentCoverage,
  getContentStatus,
  getTextbooksList,
  uploadTextbook,
  retryTextbookIngestion,
  getChaptersStatus,
  getIngestionHealth,
  getContentExpansion,
  getPrincipalSchoolSummary,
  getStudentReportCard,
  getStudentParentSummary,
} from '../controllers/adminController'

const router = Router()

// All Admin routes require Authentication & Admin Role
router.use(authMiddleware)
router.use(requireRole('admin'))

// Admin API Endpoints
router.get('/dashboard/stats', getDashboardStats)
router.get('/content-coverage', getContentCoverage)
router.get('/content-status', getContentStatus)
router.get('/textbooks', getTextbooksList)
router.post('/textbooks', uploadTextbook)
router.post('/textbooks/:id/retry', retryTextbookIngestion)
router.get('/chapters/status', getChaptersStatus)
router.get('/ingestion', getIngestionHealth)
router.get('/ingestion-health', getIngestionHealth)
router.get('/content-expansion', getContentExpansion)
router.get('/principal/school-summary', getPrincipalSchoolSummary)
router.get('/students/:id/report-card', getStudentReportCard)
router.get('/students/:id/parent-summary', getStudentParentSummary)
router.get('/users', getUsers)

router.get('/users/:id', getUserById)
router.put('/users/:id/status', updateUserStatus)
router.patch('/users/:id/status', updateUserStatus)
router.patch('/users/:id', updateUser)

router.get('/teachers', getTeachers)
router.post('/teachers/:id/assignments', assignTeacherSubject)
router.delete('/teachers/:id/assignments/:assignmentId', removeTeacherAssignment)

router.get('/students', getStudents)
router.get('/curriculum', getCurriculum)

router.get('/questions', getQuestionsMonitor)
router.get('/diagrams', getDiagramsMonitor)
router.get('/videos', getVideosMonitor)
router.get('/quizzes', getQuizzesMonitor)

router.get('/analytics', getAnalytics)
router.get('/system-health', getSystemHealth)
router.get('/audit-logs', getAuditLogsList)

export default router

