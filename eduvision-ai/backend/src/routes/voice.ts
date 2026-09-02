import { Router } from 'express'
import {
  handleStartVoiceSession,
  handleVoiceDialogueTurn,
  handleGetVoiceSession,
} from '../controllers/voiceController'
import { optionalAuthMiddleware } from '../middleware/auth'

const router = Router()

// Conversational Voice Tutor Routes
router.post('/session/start', optionalAuthMiddleware, handleStartVoiceSession)
router.post('/session/turn', optionalAuthMiddleware, handleVoiceDialogueTurn)
router.get('/session/:id', handleGetVoiceSession)

export default router
