import { Router } from 'express'
import { authMiddleware, requireRole } from '../middleware/auth'
import {
  getTeacherStats,
  getTeacherStudents,
  getTeacherStudentById,
  getTeacherStudentPerformance,
  getTeacherAssignments,
  createTeacherAssignment,
  getTeacherAssignmentById,
  updateTeacherAssignment,
  deleteTeacherAssignment,
  getTeacherAssignmentSubmissions,
  getTeacherQuestions,
  getTeacherAnalytics,
  getTeacherClassPerformance,
} from '../controllers/teacherController'

const router = Router()

// All Teacher routes require Authentication & Teacher or Admin Role
router.use(authMiddleware)
router.use(requireRole('teacher', 'admin'))

// Teacher Dashboard
router.get('/dashboard', getTeacherStats)
router.get('/dashboard/stats', getTeacherStats)

// Students & Performance
router.get('/students', getTeacherStudents)
router.get('/students/:studentId', getTeacherStudentById)
router.get('/students/:studentId/performance', getTeacherStudentPerformance)

// Assignments Management
router.get('/assignments', getTeacherAssignments)
router.post('/assignments', createTeacherAssignment)
router.get('/assignments/:assignmentId', getTeacherAssignmentById)
router.put('/assignments/:assignmentId', updateTeacherAssignment)
router.delete('/assignments/:assignmentId', deleteTeacherAssignment)
router.get('/assignments/:assignmentId/submissions', getTeacherAssignmentSubmissions)

// Teacher Analytics & Questions
router.get('/analytics', getTeacherAnalytics)
router.get('/questions', getTeacherQuestions)
router.get('/classes/:classId/performance', getTeacherClassPerformance)

export default router
