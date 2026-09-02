import { Request, Response, NextFunction } from 'express'
import {
  generateDGEExamPaper,
  getDGEBlueprint,
  getExamPaperById,
  listAllGeneratedExamPapers,
} from '../services/examPaperService'
import { AuthenticatedRequest } from '../middleware/auth'

// 1. POST /api/exams/generate — Generate full blueprint-based exam paper
export async function handleGenerateExamPaper(req: Request, res: Response, next: NextFunction) {
  try {
    const { classId, subjectId, examType, academicYear, medium } = req.body

    if (!classId || !subjectId) {
      return res.status(400).json({ success: false, error: 'classId and subjectId are required.' })
    }

    const paper = await generateDGEExamPaper({
      classId,
      subjectId,
      examType,
      academicYear,
      medium,
    })

    res.status(201).json({
      success: true,
      data: paper,
      message: 'Official Tamil Nadu DGE Exam Paper generated successfully.',
    })
  } catch (err) {
    next(err)
  }
}

// 2. GET /api/exams/blueprints — Get DGE blueprints for class/subject
export async function handleGetBlueprint(req: Request, res: Response, next: NextFunction) {
  try {
    const classLevel = (req.query.class as string) || 'Class 10'
    const subject = (req.query.subject as string) || 'Science'
    const examType = (req.query.examType as string) || 'Board'

    const blueprint = getDGEBlueprint(classLevel, subject, examType)
    res.json({
      success: true,
      data: blueprint,
    })
  } catch (err) {
    next(err)
  }
}

// 3. GET /api/exams/:id — Get generated exam paper details
export async function handleGetExamPaper(req: Request, res: Response, next: NextFunction) {
  try {
    const paper = getExamPaperById(req.params.id)
    if (!paper) {
      return res.status(404).json({ success: false, error: 'Exam paper not found.' })
    }
    res.json({
      success: true,
      data: paper,
    })
  } catch (err) {
    next(err)
  }
}

// 4. GET /api/exams/:id/marking-scheme — Get step-by-step marking scheme
export async function handleGetMarkingScheme(req: Request, res: Response, next: NextFunction) {
  try {
    const paper = getExamPaperById(req.params.id)
    if (!paper) {
      return res.status(404).json({ success: false, error: 'Exam paper not found.' })
    }

    const markingScheme = {
      examPaperId: paper.id,
      title: `${paper.title} — OFFICIAL MARKING SCHEME & ANSWER KEY`,
      tamilTitle: `${paper.tamilTitle} — அதிகாரப்பூர்வ விடைக்குறிப்பு மற்றும் மதிப்பெண் பங்கீடு`,
      standard: paper.standard,
      subject: paper.subject,
      academicYear: paper.academicYear,
      maxMarks: paper.maxMarks,
      parts: paper.parts.map((p) => ({
        partNumber: p.partNumber,
        title: p.title,
        tamilTitle: p.tamilTitle,
        marks: p.marks,
        questions: p.questions.map((q) => ({
          questionNumber: q.questionNumber,
          questionText: q.questionText,
          marks: q.marks,
          chapterName: q.chapterName,
          sourcePage: q.sourcePage,
          sourceTextbook: q.sourceTextbook,
          steps: q.markingSchemeSteps,
        })),
      })),
    }

    res.json({
      success: true,
      data: markingScheme,
    })
  } catch (err) {
    next(err)
  }
}

// 5. GET /api/exams — List all generated papers
export async function handleListExamPapers(req: Request, res: Response, next: NextFunction) {
  try {
    const papers = listAllGeneratedExamPapers()
    res.json({
      success: true,
      data: papers,
    })
  } catch (err) {
    next(err)
  }
}
