import { Request, Response, NextFunction } from 'express'
import {
  createVoiceSession,
  processVoiceTurn,
  getVoiceSessionById,
} from '../services/streamingVoiceService'
import { AuthenticatedRequest } from '../middleware/auth'

// 1. POST /api/voice/session/start — Start conversational voice tutor session
export async function handleStartVoiceSession(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const studentId = req.user?.userId || 'student-demo'
    const { classLevel, subjectName, chapterId, language } = req.body

    const session = createVoiceSession({
      studentId,
      classLevel,
      subjectName,
      chapterId,
      language,
    })

    res.status(201).json({
      success: true,
      data: session,
      message: 'Live Conversational Voice Session started successfully.',
    })
  } catch (err) {
    next(err)
  }
}

// 2. POST /api/voice/session/turn — Send spoken transcript & receive grounded voice response
export async function handleVoiceDialogueTurn(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { sessionId, transcript, isInterrupted, language } = req.body

    if (!sessionId || !transcript) {
      return res.status(400).json({ success: false, error: 'sessionId and transcript are required.' })
    }

    const tutorTurn = await processVoiceTurn({
      sessionId,
      transcript,
      isInterrupted,
      language,
    })

    res.json({
      success: true,
      data: tutorTurn,
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to process voice turn.' })
  }
}

// 3. GET /api/voice/session/:id — Get session status and history
export async function handleGetVoiceSession(req: Request, res: Response, next: NextFunction) {
  try {
    const session = getVoiceSessionById(req.params.id)
    if (!session) {
      return res.status(404).json({ success: false, error: 'Voice session not found.' })
    }
    res.json({
      success: true,
      data: session,
    })
  } catch (err) {
    next(err)
  }
}
