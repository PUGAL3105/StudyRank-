import { Router } from 'express'
import {
  handleCreateClassroom,
  handleJoinClassroom,
  handleAddStroke,
  handlePostDoubt,
  handleGetClusteredDoubts,
  handleLaunchPulseCheck,
  handleRespondPulseCheck,
  handleGetClassroom,
} from '../controllers/classroomController'
import { optionalAuthMiddleware } from '../middleware/auth'

const router = Router()

// Teacher Live Classroom & Synchronized Whiteboard Routes
router.post('/create', optionalAuthMiddleware, handleCreateClassroom)
router.post('/join', optionalAuthMiddleware, handleJoinClassroom)
router.post('/draw', handleAddStroke)
router.post('/doubt', optionalAuthMiddleware, handlePostDoubt)
router.get('/:id/doubts/clustered', handleGetClusteredDoubts)
router.post('/pulse-check/launch', handleLaunchPulseCheck)
router.post('/pulse-check/respond', optionalAuthMiddleware, handleRespondPulseCheck)
router.get('/:id', handleGetClassroom)

export default router
