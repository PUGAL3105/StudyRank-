import { Router } from 'express'
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth'
import db from '../db/connection'

const router = Router()

// GET /api/progress
router.get('/', authMiddleware, async (req: AuthenticatedRequest, res, next) => {
  try {
    const studentId = req.user!.userId
    let progress = await db.oneOrNone('SELECT * FROM progress WHERE student_id = $1', [studentId])

    if (!progress) {
      progress = {
        student_id: studentId,
        questions_asked: 0,
        lessons_completed: 0,
        videos_watched: 0,
        quiz_attempts: 0,
        average_quiz_score: 0,
        last_activity_at: new Date().toISOString(),
      }
    }

    res.json({
      success: true,
      data: {
        id: progress.id || 'prog-1',
        studentId: progress.student_id,
        questionsAsked: parseInt(progress.questions_asked || 0),
        lessonsCompleted: parseInt(progress.lessons_completed || 0),
        videosWatched: parseInt(progress.videos_watched || 0),
        quizAttempts: parseInt(progress.quiz_attempts || 0),
        averageQuizScore: parseFloat(progress.average_quiz_score || 0),
        lastActivityAt: progress.last_activity_at,
      },
    })
  } catch (err) {
    next(err)
  }
})

export default router
