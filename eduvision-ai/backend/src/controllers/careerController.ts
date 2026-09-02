import { Request, Response, NextFunction } from 'express'
import {
  recommendHigherSecondaryStream,
  listCareerPathways,
  listScholarships,
  evaluateQuotaEligibility,
} from '../services/careerGuidanceService'

// 1. POST /api/career/stream-recommendation
export async function handleStreamRecommendation(req: Request, res: Response, next: NextFunction) {
  try {
    const { mathScore, scienceScore, socialScore, careerInterest } = req.body

    const recommendations = recommendHigherSecondaryStream({
      mathScore: mathScore !== undefined ? Number(mathScore) : 85,
      scienceScore: scienceScore !== undefined ? Number(scienceScore) : 88,
      socialScore: socialScore !== undefined ? Number(socialScore) : 80,
      careerInterest,
    })

    res.json({
      success: true,
      data: recommendations,
      message: 'Higher Secondary stream recommendations generated successfully.',
    })
  } catch (err) {
    next(err)
  }
}

// 2. GET /api/career/pathways
export async function handleGetCareerPathways(req: Request, res: Response, next: NextFunction) {
  try {
    const pathways = listCareerPathways()
    res.json({
      success: true,
      data: pathways,
    })
  } catch (err) {
    next(err)
  }
}

// 3. GET /api/career/scholarships
export async function handleGetScholarships(req: Request, res: Response, next: NextFunction) {
  try {
    const scholarships = listScholarships()
    res.json({
      success: true,
      data: scholarships,
    })
  } catch (err) {
    next(err)
  }
}

// 4. POST /api/career/quota-eligibility
export async function handleQuotaEligibility(req: Request, res: Response, next: NextFunction) {
  try {
    const { schoolType, studiedFromClass6To12InGovt, gender } = req.body

    const eligibility = evaluateQuotaEligibility({
      schoolType: schoolType || 'government',
      studiedFromClass6To12InGovt: studiedFromClass6To12InGovt !== undefined ? Boolean(studiedFromClass6To12InGovt) : true,
      gender: gender || 'female',
    })

    res.json({
      success: true,
      data: eligibility,
    })
  } catch (err) {
    next(err)
  }
}
