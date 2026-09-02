import { Response, NextFunction } from 'express'
import Joi from 'joi'
import db from '../db/connection'
import { AuthenticatedRequest } from '../middleware/auth'
import { processRAGPipeline } from '../services/ragService'

const askQuestionSchema = Joi.object({
  classId: Joi.string().allow('', null),
  bookId: Joi.string().allow('', null),
  subjectId: Joi.string().required(),
  termId: Joi.string().allow('', null),     // TN SB term
  chapterId: Joi.string().required(),
  topicId: Joi.string().allow('', null),    // TN SB topic (optional)
  question: Joi.string().allow('', null),
  imageUrl: Joi.string().allow('', null),
})

export async function handleAskQuestion(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { error, value } = askQuestionSchema.validate(req.body)
    if (error) {
      return res.status(400).json({ success: false, error: error.details[0].message })
    }

    const ragResult = await processRAGPipeline({
      classId: value.classId,
      subjectId: value.subjectId,
      termId: value.termId,
      chapterId: value.chapterId,
      topicId: value.topicId,
      question: value.question,
    })

    return res.status(ragResult.status).json(ragResult.body)
  } catch (err) {
    next(err)
  }
}

export async function handleGetQuestionHistory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const questions = await db.manyOrNone(
      `SELECT id, student_id, book_id, chapter_id, question_text, question_image_url, asked_at
       FROM questions
       WHERE student_id = $1
       ORDER BY asked_at DESC
       LIMIT 50`,
      [req.user!.userId]
    )
    res.json({ success: true, data: questions || [] })
  } catch (err) {
    next(err)
  }
}

export async function handleGetAnswer(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const answer = await db.oneOrNone(
      `SELECT a.id, a.question_id, a.explanation, a.key_points, a.source_page, 
              a.diagram_url, a.video_url, a.created_at,
              q.question_text, b.title as book_title, c.title as chapter_title, 
              b.class, b.subject
       FROM answers a
       JOIN questions q ON a.question_id = q.id
       JOIN books b ON q.book_id = b.id
       JOIN chapters c ON q.chapter_id = c.id
       WHERE a.question_id = $1`,
      [req.params.id]
    )

    if (!answer) {
      return res.status(404).json({ success: false, error: 'Answer not found' })
    }

    res.json({ success: true, data: answer })
  } catch (err) {
    next(err)
  }
}
