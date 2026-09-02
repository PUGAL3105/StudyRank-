import { Router } from 'express'
import { handleGenerateVideo, handleGetVideoStatus, handleGetVideoDetails } from '../controllers/videoController'

const router = Router()

// Video Processing Routes
router.post('/generate', handleGenerateVideo)
router.post('/request', handleGenerateVideo)
router.get('/:id/status', handleGetVideoStatus)
router.get('/:id', handleGetVideoDetails)

export default router
