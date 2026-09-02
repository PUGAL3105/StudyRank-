import { Router } from 'express'
import { authMiddleware, requireRole } from '../middleware/auth'
import {
  getStudentDashboard,
  getStudentProgress,
  updateStudentProgress,
  getStudentActivity,
  recordStudentActivity,
  getStudentAnalytics,
  getStudentRecommendations,
  getStudentWeakTopics,
  getStudentSubjectProgress,
  getChapterLessonContent,
  getStudentAssignments,
  getStudentAssignmentById,
  submitStudentAssignment,
} from '../controllers/studentController'
import { handleStreamBookPDF } from '../controllers/bookController'

const router = Router()

// Public PDF streaming for Chapter / Book Viewer (Supports iframes & PDF.js)
router.get('/chapters/:chapterId/pdf', handleStreamBookPDF)

// All Student protected routes require Authentication & Student or Admin Role
router.use(authMiddleware)

// Student API Endpoints
router.get('/dashboard', getStudentDashboard)
router.get('/progress', getStudentProgress)
router.get('/progress/subjects', getStudentSubjectProgress)
router.post('/progress', updateStudentProgress)
router.get('/activity', getStudentActivity)
router.post('/activity', recordStudentActivity)
router.get('/analytics', getStudentAnalytics)
router.get('/recommendations', getStudentRecommendations)
router.get('/weak-topics', getStudentWeakTopics)
router.get('/chapters/:chapterId/lesson', getChapterLessonContent)

// Student Assignment Endpoints
router.get('/assignments', getStudentAssignments)
router.get('/assignments/:assignmentId', getStudentAssignmentById)
router.post('/assignments/:assignmentId/submit', submitStudentAssignment)

export default router



