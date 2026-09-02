import { Router } from 'express'
import { handleAskQuestion, handleGetQuestionHistory, handleGetAnswer } from '../controllers/questionController'
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth'

const router = Router()

// Question Routes
router.post('/', optionalAuthMiddleware, handleAskQuestion)
router.post('/ask', optionalAuthMiddleware, handleAskQuestion)
router.get('/history', authMiddleware, handleGetQuestionHistory)
router.get('/:id/answer', handleGetAnswer)

export default router
