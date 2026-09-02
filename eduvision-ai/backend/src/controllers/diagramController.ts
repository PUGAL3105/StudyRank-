import { Request, Response, NextFunction } from 'express'
import { generateTextbookDiagram } from '../services/diagramService'

export async function handleGenerateDiagram(req: Request, res: Response, next: NextFunction) {
  try {
    const { classId, subjectId, chapterId, question } = req.body

    const result = await generateTextbookDiagram({
      classId,
      subjectId,
      chapterId,
      question,
    })

    res.status(result.status).json(result.body)
  } catch (err) {
    next(err)
  }
}
