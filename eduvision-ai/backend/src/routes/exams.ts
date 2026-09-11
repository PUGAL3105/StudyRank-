/**
 * EduVision AI — Examination, AI Evaluation & Ranking Routes
 * Student, Teacher, and Admin RBAC APIs
 */

import { Router, Response } from 'express'
import { authMiddleware, requireRole, optionalAuthMiddleware, AuthenticatedRequest } from '../middleware/auth'
import db, { memoryStore } from '../db/connection'
import {
  generateExamQuestions,
  createExam,
  startStudentExamAttempt,
  autosaveAnswer,
  submitStudentExamAttempt,
} from '../services/examService'
import { getExamLeaderboard } from '../services/rankingService'

const router = Router()

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT EXAMINATION ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

// 1. GET /api/exams/available — Available & Completed Exams for Student
router.get('/available', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.user!.userId
    const student = memoryStore.users.find((u) => u.id === studentId)
    const classId = student?.class_id || 'c-10'

    // Get published exams across all classes (Class 9, 10, 11, 12)
    const publishedExams = memoryStore.exams.filter(
      (e) => e.status === 'PUBLISHED' || e.is_published
    )

    const examsList = publishedExams.map((exam) => {
      const attempt = memoryStore.studentExamAttempts.find(
        (a) => a.exam_id === exam.id && a.student_id === studentId
      )

      const finalRes = attempt ? memoryStore.finalResults.find((r) => r.attempt_id === attempt.id) : null

      return {
        id: exam.id,
        title: exam.title,
        description: exam.description,
        class_id: exam.class_id,
        class_name: exam.class_name,
        subject_id: exam.subject_id,
        subject_name: exam.subject_name,
        duration_minutes: exam.duration_minutes,
        total_marks: exam.total_marks,
        passing_marks: exam.passing_marks,
        difficulty: exam.difficulty,
        question_count: exam.question_count,
        status: attempt ? attempt.status : 'AVAILABLE',
        attempt_id: attempt ? attempt.id : null,
        score: finalRes ? finalRes.final_score : attempt ? attempt.total_score : null,
        percentage: finalRes ? finalRes.percentage : attempt ? attempt.percentage : null,
        grade: finalRes ? finalRes.grade : attempt ? attempt.grade : null,
        rank: finalRes ? finalRes.rank : attempt ? attempt.rank : null,
        submitted_at: attempt ? attempt.submitted_at : null,
      }
    })

    // Compute student stats
    const completedAttempts = memoryStore.studentExamAttempts.filter(
      (a) => a.student_id === studentId && (a.status === 'EVALUATED' || a.status === 'FINALIZED' || a.status === 'TEACHER_REVIEWED')
    )

    let totalScore = 0
    let highestScore = 0
    let totalMaxMarks = 0

    completedAttempts.forEach((a) => {
      const s = a.total_score || 0
      totalScore += s
      if (s > highestScore) highestScore = s
      totalMaxMarks += a.max_marks || 25
    })

    const avgPercentage = completedAttempts.length > 0 ? Math.round((totalScore / totalMaxMarks) * 100) : 0

    res.json({
      success: true,
      data: {
        exams: examsList,
        studentStats: {
          totalExams: publishedExams.length,
          completedExams: completedAttempts.length,
          averagePercentage: avgPercentage,
          highestScore,
          currentRank: 1,
        },
      },
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// 2. GET /api/exams/:id — Exam Details & Overview
router.get('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const exam = memoryStore.exams.find((e) => e.id === req.params.id)
    if (!exam) {
      return res.status(404).json({ success: false, error: 'Exam not found' })
    }

    const eqList = memoryStore.examQuestions.filter((eq) => eq.exam_id === exam.id)
    const attempt = memoryStore.studentExamAttempts.find(
      (a) => a.exam_id === exam.id && a.student_id === req.user!.userId
    )

    res.json({
      success: true,
      data: {
        exam,
        questionCount: eqList.length,
        hasAttempted: !!attempt,
        attemptStatus: attempt ? attempt.status : 'NOT_STARTED',
      },
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// 3. POST /api/exams/:id/start — Start or Resume Exam Attempt
router.post('/:id/start', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const examId = req.params.id
    const studentId = req.user!.userId

    const startResult = await startStudentExamAttempt(examId, studentId)

    // Retrieve questions WITHOUT model answers to prevent cheating
    const eqList = memoryStore.examQuestions
      .filter((eq) => eq.exam_id === examId)
      .sort((a, b) => a.order_index - b.order_index)

    const questions = eqList.map((eq) => {
      const q = memoryStore.questions.find((item) => item.id === eq.question_id)
      return {
        id: q?.id || eq.question_id,
        order_index: eq.order_index,
        marks: eq.marks || q?.marks || 1,
        question_type: q?.question_type || 'SHORT_ANSWER_1',
        question_text: q?.question_text || '',
        difficulty: q?.difficulty || 'Medium',
        chapter_id: q?.chapter_id || '',
        source_textbook: q?.source_textbook || '',
      }
    })

    const exam = memoryStore.exams.find((e) => e.id === examId)

    res.json({
      success: true,
      data: {
        attempt: startResult.attempt,
        timeRemainingMs: startResult.timeRemainingMs,
        isResumed: startResult.isResumed,
        savedAnswers: startResult.savedAnswers,
        exam: {
          id: exam?.id,
          title: exam?.title,
          duration_minutes: exam?.duration_minutes,
          total_marks: exam?.total_marks,
          class_name: exam?.class_name,
          subject_name: exam?.subject_name,
        },
        questions,
      },
    })
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message })
  }
})

// 4. POST /api/exams/:id/autosave — Debounced Answer Autosave
router.post('/:id/autosave', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { attemptId, questionId, answerText } = req.body
    if (!attemptId || !questionId) {
      return res.status(400).json({ success: false, error: 'attemptId and questionId are required' })
    }

    const saveResult = await autosaveAnswer({
      attemptId,
      studentId: req.user!.userId,
      questionId,
      answerText: answerText || '',
    })

    res.json({ success: true, data: saveResult })
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message })
  }
})

// 5. POST /api/exams/:id/submit — Submit Exam & Trigger AI Evaluation
router.post('/:id/submit', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { attemptId, finalAnswers } = req.body
    if (!attemptId) {
      return res.status(400).json({ success: false, error: 'attemptId is required for submission' })
    }

    const submitResult = await submitStudentExamAttempt(
      attemptId,
      req.user!.userId,
      finalAnswers
    )

    res.json({ success: true, data: submitResult })
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message })
  }
})

// 6. GET /api/exams/:id/results — Detailed Result with Model Answers & AI/Teacher Feedback
router.get('/:id/results', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const examId = req.params.id
    const studentId = req.user!.userId

    const exam = memoryStore.exams.find((e) => e.id === examId)
    if (!exam) {
      return res.status(404).json({ success: false, error: 'Exam not found' })
    }

    const attempt = memoryStore.studentExamAttempts.find(
      (a) => a.exam_id === examId && a.student_id === studentId
    )
    if (!attempt) {
      return res.status(404).json({ success: false, error: 'No attempt found for this student on this exam' })
    }

    const finalResult = memoryStore.finalResults.find((r) => r.attempt_id === attempt.id)
    const eqList = memoryStore.examQuestions.filter((eq) => eq.exam_id === examId).sort((a, b) => a.order_index - b.order_index)

    // Construct detailed question-by-question breakdown
    const questionResults = eqList.map((eq) => {
      const q = memoryStore.questions.find((item) => item.id === eq.question_id)
      const studentAns = memoryStore.studentAnswers.find((a) => a.attempt_id === attempt.id && a.question_id === eq.question_id)
      const aiEval = memoryStore.aiEvaluations.find((e) => e.attempt_id === attempt.id && e.question_id === eq.question_id)
      const teacherEval = memoryStore.teacherEvaluations.find((e) => e.attempt_id === attempt.id && e.question_id === eq.question_id)

      const finalMarks = teacherEval ? teacherEval.marks_awarded : (aiEval ? aiEval.marks_awarded : 0)

      return {
        questionId: q?.id || eq.question_id,
        orderIndex: eq.order_index,
        marks: eq.marks || q?.marks || 1,
        questionType: q?.question_type || 'SHORT_ANSWER_1',
        questionText: q?.question_text || '',
        studentAnswer: studentAns ? studentAns.answer_text : '',
        marksAwarded: finalMarks,
        aiScore: aiEval ? aiEval.marks_awarded : 0,
        teacherScore: teacherEval ? teacherEval.marks_awarded : null,
        isOverridden: !!teacherEval,
        confidence: aiEval ? aiEval.confidence : 'HIGH',
        modelAnswer: q?.expected_answer || '',
        keyPoints: q?.key_points || [],
        correctPoints: aiEval ? aiEval.correct_points : [],
        missingPoints: aiEval ? aiEval.missing_points : [],
        incorrectPoints: aiEval ? aiEval.incorrect_points : [],
        aiFeedback: aiEval ? aiEval.feedback : 'No feedback available.',
        aiSuggestion: aiEval ? aiEval.suggestion : '',
        teacherFeedback: teacherEval ? teacherEval.feedback : null,
        sourceTextbook: q?.source_textbook || `Tamil Nadu State Board ${exam.class_name} ${exam.subject_name}`,
        sourcePage: q?.source_page || 1,
      }
    })

    const teacherFb = memoryStore.teacherFeedback.find((tf) => tf.attempt_id === attempt.id)

    res.json({
      success: true,
      data: {
        exam: {
          id: exam.id,
          title: exam.title,
          class_name: exam.class_name,
          subject_name: exam.subject_name,
          duration_minutes: exam.duration_minutes,
          total_marks: exam.total_marks,
          passing_marks: exam.passing_marks,
        },
        attempt: {
          id: attempt.id,
          status: attempt.status,
          started_at: attempt.started_at,
          submitted_at: attempt.submitted_at,
          time_taken_seconds: attempt.time_taken_seconds,
          total_score: finalResult ? finalResult.final_score : attempt.total_score,
          max_marks: attempt.max_marks,
          percentage: finalResult ? finalResult.percentage : attempt.percentage,
          grade: finalResult ? finalResult.grade : attempt.grade,
          rank: finalResult ? finalResult.rank : attempt.rank,
          isPassed: (finalResult ? finalResult.final_score : attempt.total_score) >= (exam.passing_marks || 10),
        },
        questionResults,
        teacherOverallFeedback: teacherFb ? teacherFb.feedback_text : null,
      },
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// 7. GET /api/exams/:id/leaderboard — Privacy-Preserving Leaderboard
router.get('/:id/leaderboard', optionalAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const examId = req.params.id
    const studentId = req.user?.userId

    const leaderboard = await getExamLeaderboard(examId, studentId)
    const exam = memoryStore.exams.find((e) => e.id === examId)

    res.json({
      success: true,
      data: {
        examTitle: exam?.title || 'Exam Leaderboard',
        totalParticipants: leaderboard.length,
        leaderboard,
      },
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// TEACHER & ADMIN EXAMINATION ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

// 8. POST /api/exams/generate-questions — AI Question Generator (Verified Textbook Grounded)
router.post('/generate-questions', authMiddleware, requireRole('teacher', 'admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { classId, subjectId, chapterId, chapterIds, difficulty, distribution } = req.body
    if (!classId || !subjectId) {
      return res.status(400).json({ success: false, error: 'classId and subjectId are required' })
    }

    const generated = await generateExamQuestions({
      classId,
      subjectId,
      chapterId,
      chapterIds,
      difficulty,
      distribution,
    })

    res.json({
      success: true,
      data: {
        questions: generated,
        count: generated.length,
        totalMarks: generated.reduce((acc, q) => acc + q.marks, 0),
      },
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// 9. POST /api/exams — Teacher Create Exam
router.post('/', authMiddleware, requireRole('teacher', 'admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, classId, subjectId, questions } = req.body
    if (!title || !classId || !subjectId || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ success: false, error: 'title, classId, subjectId, and questions array are required' })
    }

    const result = await createExam(req.body, req.user!.userId)
    res.status(201).json({ success: true, data: result })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// 10. GET /api/exams/teacher — List Teacher's Created Exams & Stats
router.get('/teacher/list', authMiddleware, requireRole('teacher', 'admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const exams = memoryStore.exams.map((e) => {
      const submissions = memoryStore.studentExamAttempts.filter((a) => a.exam_id === e.id && a.status !== 'IN_PROGRESS')
      const avgScore = submissions.length > 0 ? Math.round(submissions.reduce((acc, s) => acc + (s.total_score || 0), 0) / submissions.length) : 0

      return {
        ...e,
        submissionsCount: submissions.length,
        averageScore: avgScore,
      }
    })

    res.json({ success: true, data: exams })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// 11. GET /api/exams/:id/submissions — View Student Submissions for an Exam
router.get('/:id/submissions', authMiddleware, requireRole('teacher', 'admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const examId = req.params.id
    const exam = memoryStore.exams.find((e) => e.id === examId)
    if (!exam) {
      return res.status(404).json({ success: false, error: 'Exam not found' })
    }

    const attempts = memoryStore.studentExamAttempts.filter((a) => a.exam_id === examId)

    const submissionsList = attempts.map((att) => {
      const student = memoryStore.users.find((u) => u.id === att.student_id)
      const finalRes = memoryStore.finalResults.find((r) => r.attempt_id === att.id)

      return {
        attemptId: att.id,
        studentId: att.student_id,
        studentName: student ? student.name : 'Demo Student',
        studentEmail: student ? student.email : '',
        startedAt: att.started_at,
        submittedAt: att.submitted_at,
        timeTakenSeconds: att.time_taken_seconds,
        status: att.status,
        totalAIScore: finalRes ? finalRes.total_ai_score : att.total_score,
        teacherScore: finalRes ? finalRes.total_teacher_score : null,
        finalScore: finalRes ? finalRes.final_score : att.total_score,
        maxMarks: att.max_marks,
        percentage: finalRes ? finalRes.percentage : att.percentage,
        grade: finalRes ? finalRes.grade : att.grade,
        rank: finalRes ? finalRes.rank : att.rank,
      }
    })

    res.json({
      success: true,
      data: {
        exam,
        submissions: submissionsList,
        totalSubmissions: submissionsList.length,
      },
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// 12. GET /api/exams/submissions/:attemptId/review — Detailed Submission Review
router.get('/submissions/:attemptId/review', authMiddleware, requireRole('teacher', 'admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const attemptId = req.params.attemptId
    const attempt = memoryStore.studentExamAttempts.find((a) => a.id === attemptId)
    if (!attempt) {
      return res.status(404).json({ success: false, error: 'Attempt not found' })
    }

    const exam = memoryStore.exams.find((e) => e.id === attempt.exam_id)
    const student = memoryStore.users.find((u) => u.id === attempt.student_id)
    const finalRes = memoryStore.finalResults.find((r) => r.attempt_id === attemptId)

    const eqList = memoryStore.examQuestions.filter((eq) => eq.exam_id === attempt.exam_id).sort((a, b) => a.order_index - b.order_index)

    const questionsReview = eqList.map((eq) => {
      const q = memoryStore.questions.find((item) => item.id === eq.question_id)
      const ans = memoryStore.studentAnswers.find((a) => a.attempt_id === attemptId && a.question_id === eq.question_id)
      const aiEval = memoryStore.aiEvaluations.find((e) => e.attempt_id === attemptId && e.question_id === eq.question_id)
      const teacherEval = memoryStore.teacherEvaluations.find((e) => e.attempt_id === attemptId && e.question_id === eq.question_id)

      return {
        questionId: q?.id || eq.question_id,
        orderIndex: eq.order_index,
        marks: eq.marks || q?.marks || 1,
        questionType: q?.question_type || 'SHORT_ANSWER_1',
        questionText: q?.question_text || '',
        studentAnswer: ans ? ans.answer_text : '',
        expectedAnswer: q?.expected_answer || '',
        keyPoints: q?.key_points || [],
        aiEvaluation: aiEval || null,
        teacherEvaluation: teacherEval || null,
        currentMarks: teacherEval ? teacherEval.marks_awarded : (aiEval ? aiEval.marks_awarded : 0),
        sourceTextbook: q?.source_textbook || '',
        sourcePage: q?.source_page || 1,
      }
    })

    res.json({
      success: true,
      data: {
        attempt,
        student: { id: student?.id, name: student?.name, email: student?.email },
        exam,
        finalResult: finalRes || null,
        questionsReview,
      },
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// 13. POST /api/exams/submissions/:attemptId/override — Teacher Review & Override Marks
router.post('/submissions/:attemptId/override', authMiddleware, requireRole('teacher', 'admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const attemptId = req.params.attemptId
    const { questionId, teacherMarks, feedback, overallFeedback, suggestion } = req.body

    const attempt = memoryStore.studentExamAttempts.find((a) => a.id === attemptId)
    if (!attempt) {
      return res.status(404).json({ success: false, error: 'Attempt not found' })
    }

    const teacherId = req.user!.userId
    const ans = memoryStore.studentAnswers.find((a) => a.attempt_id === attemptId && a.question_id === questionId)

    // Save/Update teacher evaluation for question
    const existingTEvalIdx = memoryStore.teacherEvaluations.findIndex((t) => t.attempt_id === attemptId && t.question_id === questionId)
    const tEvalRecord = {
      id: `teval-${attemptId}-${questionId}`,
      attempt_id: attemptId,
      student_answer_id: ans?.id || null,
      question_id: questionId,
      teacher_id: teacherId,
      marks_awarded: Number(teacherMarks),
      feedback: feedback || 'Reviewed and adjusted by teacher.',
      suggestion: suggestion || null,
      overridden: true,
      reviewed_at: new Date().toISOString(),
    }

    if (existingTEvalIdx >= 0) {
      memoryStore.teacherEvaluations[existingTEvalIdx] = tEvalRecord
    } else {
      memoryStore.teacherEvaluations.push(tEvalRecord)
    }

    // Save Overall Teacher Feedback
    if (overallFeedback) {
      const existingFbIdx = memoryStore.teacherFeedback.findIndex((tf) => tf.attempt_id === attemptId)
      const fbRecord = {
        id: `tfb-${attemptId}`,
        attempt_id: attemptId,
        exam_id: attempt.exam_id,
        student_id: attempt.student_id,
        teacher_id: teacherId,
        feedback_text: overallFeedback,
        created_at: new Date().toISOString(),
      }
      if (existingFbIdx >= 0) {
        memoryStore.teacherFeedback[existingFbIdx] = fbRecord
      } else {
        memoryStore.teacherFeedback.push(fbRecord)
      }
    }

    // Recompute Final Score (Rule: Final Score = Teacher Score ?? AI Score)
    const eqList = memoryStore.examQuestions.filter((eq) => eq.exam_id === attempt.exam_id)
    let recomputedFinalScore = 0
    let recomputedTeacherScore = 0

    for (const eq of eqList) {
      const tEval = memoryStore.teacherEvaluations.find((t) => t.attempt_id === attemptId && t.question_id === eq.question_id)
      const aiEval = memoryStore.aiEvaluations.find((e) => e.attempt_id === attemptId && e.question_id === eq.question_id)

      if (tEval) {
        recomputedFinalScore += tEval.marks_awarded
        recomputedTeacherScore += tEval.marks_awarded
      } else if (aiEval) {
        recomputedFinalScore += aiEval.marks_awarded
      }
    }

    recomputedFinalScore = parseFloat(recomputedFinalScore.toFixed(1))
    const maxMarks = attempt.max_marks || 25
    const recomputedPercentage = Math.round((recomputedFinalScore / maxMarks) * 100)

    let recomputedGrade = 'F'
    if (recomputedPercentage >= 90) recomputedGrade = 'A+'
    else if (recomputedPercentage >= 80) recomputedGrade = 'A'
    else if (recomputedPercentage >= 70) recomputedGrade = 'B+'
    else if (recomputedPercentage >= 60) recomputedGrade = 'B'
    else if (recomputedPercentage >= 40) recomputedGrade = 'C'

    attempt.status = 'TEACHER_REVIEWED'
    attempt.total_score = recomputedFinalScore
    attempt.percentage = recomputedPercentage
    attempt.grade = recomputedGrade

    // Update finalResults record
    const finalRes = memoryStore.finalResults.find((r) => r.attempt_id === attemptId)
    if (finalRes) {
      finalRes.total_teacher_score = recomputedTeacherScore
      finalRes.final_score = recomputedFinalScore
      finalRes.percentage = recomputedPercentage
      finalRes.grade = recomputedGrade
    }

    // Log Audit event
    memoryStore.auditLogs.push({
      id: `audit-${Date.now()}`,
      user_id: teacherId,
      action: 'TEACHER_SCORE_OVERRIDE',
      details: `Teacher ${teacherId} adjusted score on question ${questionId} for attempt ${attemptId} to ${teacherMarks}`,
      timestamp: new Date().toISOString(),
    })

    res.json({
      success: true,
      message: 'Teacher evaluation and score override saved successfully.',
      finalScore: recomputedFinalScore,
      percentage: recomputedPercentage,
      grade: recomputedGrade,
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// 14. POST /api/exams/:id/publish — Publish Exam
router.post('/:id/publish', authMiddleware, requireRole('teacher', 'admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const exam = memoryStore.exams.find((e) => e.id === req.params.id)
    if (!exam) {
      return res.status(404).json({ success: false, error: 'Exam not found' })
    }

    exam.status = 'PUBLISHED'
    exam.is_published = true
    exam.published_at = new Date().toISOString()

    res.json({ success: true, message: 'Exam published successfully.', exam })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
