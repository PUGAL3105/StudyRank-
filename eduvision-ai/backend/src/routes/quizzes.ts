import { Router } from 'express'
import { handleGenerateQuiz, handleSubmitQuiz, handleGetQuizHistory } from '../controllers/quizController'

const router = Router()

// Quiz Routes
router.post('/generate', handleGenerateQuiz)
router.post('/:quizId/submit', handleSubmitQuiz)
router.get('/history/student', handleGetQuizHistory)

export default router
