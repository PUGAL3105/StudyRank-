import { Request, Response, NextFunction } from 'express'
import { requestEducationalVideo, getVideoStatus } from '../services/videoService'

export async function handleGenerateVideo(req: Request, res: Response, next: NextFunction) {
  try {
    const { classId, subjectId, chapterId, question } = req.body

    const result = await requestEducationalVideo({
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

export async function handleGetVideoStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const videoId = req.params.id
    const status = getVideoStatus(videoId)

    if (!status) {
      return res.status(404).json({ success: false, error: 'Video generation job not found' })
    }

    res.json({ success: true, data: status })
  } catch (err) {
    next(err)
  }
}

export async function handleGetVideoDetails(req: Request, res: Response, next: NextFunction) {
  try {
    const videoId = req.params.id
    const status = getVideoStatus(videoId)

    if (!status) {
      return res.status(404).json({ success: false, error: 'Video not found' })
    }

    res.json({ success: true, data: status })
  } catch (err) {
    next(err)
  }
}
