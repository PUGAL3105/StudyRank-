import { Router } from 'express'
import { handleGenerateDiagram } from '../controllers/diagramController'

const router = Router()

// POST /api/diagrams/generate
router.post('/generate', handleGenerateDiagram)

export default router
