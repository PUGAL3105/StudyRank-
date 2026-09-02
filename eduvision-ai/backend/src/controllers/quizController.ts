import { Request, Response, NextFunction } from 'express'
import { generateTextbookQuiz, submitQuizAttempt, getStudentQuizHistory } from '../services/quizService'
import { AuthenticatedRequest } from '../middleware/auth'

export async function handleGenerateQuiz(req: Request, res: Response, next: NextFunction) {
  try {
    const { classId, subjectId, chapterId, questionCount, difficulty } = req.body

    const result = await generateTextbookQuiz({
      classId,
      subjectId,
      chapterId,
      questionCount,
      difficulty,
    })

    res.status(result.status).json(result.body)
  } catch (err) {
    next(err)
  }
}

export async function handleSubmitQuiz(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const quizId = req.params.quizId
    const { answers } = req.body
    const studentId = req.user?.userId || 'student-demo'

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ success: false, error: 'Invalid payload. Array of answers required.' })
    }

    const result = await submitQuizAttempt(quizId, studentId, answers)
    if (!result) {
      return res.status(404).json({ success: false, error: 'Quiz not found' })
    }

    res.json({
      success: true,
      data: result,
      message: 'Quiz attempt evaluated and stored successfully.',
    })
  } catch (err) {
    next(err)
  }
}

export async function handleGetQuizHistory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const studentId = req.user?.userId || 'student-demo'
    const history = getStudentQuizHistory(studentId)
    res.json({ success: true, data: history })
  } catch (err) {
    next(err)
  }
}
