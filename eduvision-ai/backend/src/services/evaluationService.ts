/**
 * EduVision AI — Semantic AI Answer Evaluation Engine
 * Evaluates student written answers against verified Tamil Nadu State Board rubrics,
 * awarding partial marks, identifying key points, and generating structured feedback.
 */

import crypto from 'crypto'
import db, { memoryStore } from '../db/connection'
import { generateOpenAIEmbedding, computeCosineSimilarity } from './chunkerService'
import { calculateExamRankings } from './rankingService'

export interface EvaluationItemResult {
  questionId: string
  marksAwarded: number
  maxMarks: number
  percentage: number
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  status: 'AUTO_EVALUATED' | 'REVIEW_REQUIRED'
  correctPoints: string[]
  missingPoints: string[]
  incorrectPoints: string[]
  feedback: string
  suggestion: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Semantic Answer Evaluator (Single Question)
// ─────────────────────────────────────────────────────────────────────────────
export function evaluateStudentAnswer(params: {
  question: any
  studentAnswerText: string
  textbookContext?: string
}): EvaluationItemResult {
  const { question, studentAnswerText = '', textbookContext = '' } = params
  const trimmedAns = (studentAnswerText || '').trim()
  const maxMarks = Number(question.marks) || 1
  const keyPoints: string[] = Array.isArray(question.key_points) ? question.key_points : []
  const expectedAnswer = question.expected_answer || ''

  // 1. Handle Empty or Blank Answer
  if (!trimmedAns || trimmedAns.length < 3) {
    return {
      questionId: question.id,
      marksAwarded: 0,
      maxMarks,
      percentage: 0,
      confidence: 'HIGH',
      status: 'AUTO_EVALUATED',
      correctPoints: [],
      missingPoints: keyPoints.length > 0 ? keyPoints : ['Answer was left blank or unanswered.'],
      incorrectPoints: [],
      feedback: 'No answer was provided for this question.',
      suggestion: 'Review this chapter and attempt all questions in your next practice session.',
    }
  }

  // 2. Compute Semantic Vector Similarity
  const studentVec = generateOpenAIEmbedding(trimmedAns)
  const expectedVec = generateOpenAIEmbedding(`${expectedAnswer} ${keyPoints.join(' ')} ${textbookContext}`)
  const cosineSim = computeCosineSimilarity(studentVec, expectedVec)
  const lowerStudent = trimmedAns.toLowerCase()
  const isTamil = /[\u0B80-\u0BFF]/.test(trimmedAns)

  // 3. Keyword / Concept Point & Expected Answer Verification
  const stopWords = new Set(['what', 'where', 'which', 'how', 'when', 'who', 'why', 'explain', 'is', 'are', 'the', 'a', 'an', 'and', 'in', 'of', 'to', 'for', 'from', 'with', 'according', 'state', 'give', 'define', 'this', 'that'])
  const expectedKeywords = expectedAnswer.toLowerCase().split(/[\s,–—().;:]+/).filter((w: string) => w.length > 3 && !stopWords.has(w))
  const matchedExpectedKeywords = expectedKeywords.filter((w: string) => lowerStudent.includes(w))
  const keywordRatio = expectedKeywords.length > 0 ? matchedExpectedKeywords.length / expectedKeywords.length : 0

  const correctPoints: string[] = []
  const missingPoints: string[] = []
  const incorrectPoints: string[] = []

  let matchedPointsCount = 0

  keyPoints.forEach((kp) => {
    const kpWords = kp.toLowerCase().split(/[\s,–—()]+/).filter((w) => w.length > 3 && !stopWords.has(w))
    const matchCount = kpWords.filter((w) => lowerStudent.includes(w)).length
    const matchRatio = kpWords.length > 0 ? matchCount / kpWords.length : 0

    if (matchRatio >= 0.25 || cosineSim >= 0.65 || keywordRatio >= 0.30) {
      matchedPointsCount++
      correctPoints.push(kp)
    } else {
      missingPoints.push(kp)
    }
  })

  // 4. Rubric & Mark Calculation (Supports Fine Partial Marks)
  const coverage = keyPoints.length > 0 ? matchedPointsCount / keyPoints.length : keywordRatio
  const blendedScore = Math.max(cosineSim, keywordRatio * 0.7 + cosineSim * 0.3, coverage * 0.6 + cosineSim * 0.4)

  let marksAwarded = 0
  if (blendedScore >= 0.68) {
    marksAwarded = maxMarks
  } else if (blendedScore >= 0.50) {
    marksAwarded = parseFloat((maxMarks * 0.75).toFixed(1))
  } else if (blendedScore >= 0.30) {
    marksAwarded = parseFloat((maxMarks * 0.50).toFixed(1))
  } else if (blendedScore >= 0.15) {
    marksAwarded = parseFloat((maxMarks * 0.25).toFixed(1))
  } else {
    marksAwarded = 0
  }

  // Ensure marks stay strictly within [0, maxMarks]
  marksAwarded = Math.min(maxMarks, Math.max(0, marksAwarded))
  const percentage = Math.round((marksAwarded / maxMarks) * 100)

  // 5. Determine Confidence & Review Flag
  let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'HIGH'
  let status: 'AUTO_EVALUATED' | 'REVIEW_REQUIRED' = 'AUTO_EVALUATED'

  if (cosineSim > 0.45 && cosineSim < 0.65 && marksAwarded > 0 && marksAwarded < maxMarks) {
    confidence = 'MEDIUM'
  } else if (trimmedAns.length > 200 && marksAwarded === 0) {
    confidence = 'LOW'
    status = 'REVIEW_REQUIRED'
  }

  // 6. Generate Pedagogical Feedback & Actionable Suggestions
  let feedback = ''
  let suggestion = ''

  if (isTamil) {
    if (percentage >= 80) {
      feedback = 'சிறப்பான விடை! முக்கியக் கருத்துக்கள் மற்றும் வரையறைகள் மிகச் சரியாக விளக்கப்பட்டுள்ளன.'
      suggestion = 'தொடர்ந்து இதே போன்ற துல்லியத்துடன் பயிற்சி செய்யுங்கள்.'
    } else if (percentage >= 50) {
      feedback = 'நல்ல முயற்சி. அடிப்படைக் கருத்து புரிந்து கொள்ளப்பட்டுள்ளது; எனினும் மேலும் சில முக்கியக் குறிப்புகள் விடுபட்டுள்ளன.'
      suggestion = 'பாடப்புத்தகத்தின் முக்கிய சமன்பாடுகள் மற்றும் வரையறைகளை எழுதிப் பழகவும்.'
    } else {
      feedback = 'விடை முழுமையடையவில்லை. கேட்கப்பட்ட கேள்விக்கான நேரடி விளக்கம் காணப்படவில்லை.'
      suggestion = 'இப்பாடப்பகுதியை மீண்டும் படித்து, வினா-விடை மாதிரிகளை பயிற்சி செய்யவும்.'
    }
  } else {
    if (percentage >= 85) {
      feedback = 'Excellent answer! You correctly stated the core principles and included required textbook terminology.'
      suggestion = 'Keep up the high standard of precision in your board exam practice.'
    } else if (percentage >= 50) {
      feedback = 'Good effort. You demonstrated foundational understanding, but missed some specific textbook points or formulas.'
      suggestion = 'Revise the key definitions and formulas from this chapter to secure full marks.'
    } else {
      feedback = 'Your answer is incomplete or deviates from the expected syllabus criteria.'
      suggestion = 'Carefully review the model answer and practice structured 2-mark and 5-mark question writing.'
    }
  }

  return {
    questionId: question.id,
    marksAwarded,
    maxMarks,
    percentage,
    confidence,
    status,
    correctPoints: correctPoints.length > 0 ? correctPoints : ['Basic conceptual attempt.'],
    missingPoints,
    incorrectPoints,
    feedback,
    suggestion,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Background Attempt Evaluation Pipeline
// ─────────────────────────────────────────────────────────────────────────────
export async function triggerAIEvaluationForAttempt(attemptId: string) {
  const attempt = memoryStore.studentExamAttempts.find((a) => a.id === attemptId)
  if (!attempt) {
    throw new Error('Attempt not found for AI evaluation.')
  }

  const exam = memoryStore.exams.find((e) => e.id === attempt.exam_id)
  if (!exam) {
    throw new Error('Exam metadata not found.')
  }

  const examQuestions = memoryStore.examQuestions.filter((eq) => eq.exam_id === exam.id)
  const studentAnswers = memoryStore.studentAnswers.filter((a) => a.attempt_id === attemptId)

  let totalAIScore = 0
  let correctCount = 0
  let partialCount = 0
  let incorrectCount = 0
  let hasReviewRequired = false

  // Create Evaluation Job
  const jobId = `job-${Date.now()}`
  memoryStore.evaluationJobs.push({
    id: jobId,
    attempt_id: attemptId,
    status: 'PROCESSING',
    created_at: new Date().toISOString(),
  })

  // Evaluate each question
  for (const eq of examQuestions) {
    const question = memoryStore.questions.find((q) => q.id === eq.question_id)
    if (!question) continue

    const answer = studentAnswers.find((a) => a.question_id === eq.question_id)
    const studentText = answer ? answer.answer_text : ''

    const evalResult = evaluateStudentAnswer({
      question,
      studentAnswerText: studentText,
    })

    totalAIScore += evalResult.marksAwarded

    if (evalResult.percentage === 100) {
      correctCount++
    } else if (evalResult.percentage > 0) {
      partialCount++
    } else {
      incorrectCount++
    }

    if (evalResult.status === 'REVIEW_REQUIRED') {
      hasReviewRequired = true
    }

    // Persist AI Evaluation
    const evalId = `eval-${attemptId}-${question.id}`
    const existingEvalIdx = memoryStore.aiEvaluations.findIndex((e) => e.attempt_id === attemptId && e.question_id === question.id)
    const evalRecord = {
      id: evalId,
      attempt_id: attemptId,
      student_answer_id: answer?.id || null,
      question_id: question.id,
      marks_awarded: evalResult.marksAwarded,
      max_marks: evalResult.maxMarks,
      percentage: evalResult.percentage,
      confidence: evalResult.confidence,
      evaluation_status: evalResult.status,
      correct_points: evalResult.correctPoints,
      missing_points: evalResult.missingPoints,
      incorrect_points: evalResult.incorrectPoints,
      feedback: evalResult.feedback,
      suggestion: evalResult.suggestion,
      evaluated_at: new Date().toISOString(),
    }

    if (existingEvalIdx >= 0) {
      memoryStore.aiEvaluations[existingEvalIdx] = evalRecord
    } else {
      memoryStore.aiEvaluations.push(evalRecord)
    }
  }

  totalAIScore = parseFloat(totalAIScore.toFixed(1))
  const maxMarks = exam.total_marks || 25
  const overallPercentage = Math.round((totalAIScore / maxMarks) * 100)

  let grade = 'F'
  if (overallPercentage >= 90) grade = 'A+'
  else if (overallPercentage >= 80) grade = 'A'
  else if (overallPercentage >= 70) grade = 'B+'
  else if (overallPercentage >= 60) grade = 'B'
  else if (overallPercentage >= 40) grade = 'C'
  else grade = 'F'

  attempt.status = hasReviewRequired ? 'REVIEW_REQUIRED' : 'EVALUATED'
  attempt.total_score = totalAIScore
  attempt.max_marks = maxMarks
  attempt.percentage = overallPercentage
  attempt.grade = grade

  // Persist Final Result Record
  const existingResIdx = memoryStore.finalResults.findIndex((r) => r.attempt_id === attemptId)
  const finalResultRecord = {
    id: `res-${attemptId}`,
    attempt_id: attemptId,
    exam_id: exam.id,
    student_id: attempt.student_id,
    total_ai_score: totalAIScore,
    total_teacher_score: null,
    final_score: totalAIScore,
    max_marks: maxMarks,
    percentage: overallPercentage,
    grade,
    correct_count: correctCount,
    partial_count: partialCount,
    incorrect_count: incorrectCount,
    time_taken_seconds: attempt.time_taken_seconds || 0,
    rank: null,
    is_published: true,
    published_at: new Date().toISOString(),
  }

  if (existingResIdx >= 0) {
    memoryStore.finalResults[existingResIdx] = finalResultRecord
  } else {
    memoryStore.finalResults.push(finalResultRecord)
  }

  // Update evaluation job status
  const job = memoryStore.evaluationJobs.find((j) => j.id === jobId)
  if (job) {
    job.status = 'COMPLETED'
    job.updated_at = new Date().toISOString()
  }

  // Recalculate exam rankings
  await calculateExamRankings(exam.id)

  return {
    success: true,
    attemptId,
    totalAIScore,
    maxMarks,
    percentage: overallPercentage,
    grade,
    correctCount,
    partialCount,
    incorrectCount,
  }
}
