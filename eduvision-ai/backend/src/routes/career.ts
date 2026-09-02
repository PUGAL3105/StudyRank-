import { Router } from 'express'
import {
  handleStreamRecommendation,
  handleGetCareerPathways,
  handleGetScholarships,
  handleQuotaEligibility,
} from '../controllers/careerController'

const router = Router()

// Career & Higher Education Guidance Routes
router.post('/stream-recommendation', handleStreamRecommendation)
router.get('/pathways', handleGetCareerPathways)
router.get('/scholarships', handleGetScholarships)
router.post('/quota-eligibility', handleQuotaEligibility)

export default router
