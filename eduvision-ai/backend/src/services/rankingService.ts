/**
 * EduVision AI — Exam Ranking & Leaderboard Service
 * Calculates student ranks based on score, time efficiency, and question accuracy
 * with full privacy protection for State Board practice leagues.
 */

import db, { memoryStore } from '../db/connection'

export interface LeaderboardEntry {
  rank: number
  studentId: string
  displayName: string
  score: number
  maxMarks: number
  percentage: number
  timeTakenSeconds: number
  isCurrentStudent: boolean
  badge?: 'GOLD' | 'SILVER' | 'BRONZE' | 'TOP_10'
}

export async function calculateExamRankings(examId: string) {
  // Retrieve all submitted and evaluated attempts for this exam
  const attempts = memoryStore.studentExamAttempts.filter(
    (a) => a.exam_id === examId && (a.status === 'EVALUATED' || a.status === 'TEACHER_REVIEWED' || a.status === 'FINALIZED' || a.status === 'REVIEW_REQUIRED')
  )

  if (attempts.length === 0) return []

  // Combine with finalResults to get final_score (respecting teacher overrides)
  const candidateScores = attempts.map((att) => {
    const finalRes = memoryStore.finalResults.find((r) => r.attempt_id === att.id)
    const score = finalRes ? finalRes.final_score : att.total_score || 0
    const timeTaken = att.time_taken_seconds || 9999
    const correctCount = finalRes ? finalRes.correct_count : 0

    return {
      attemptId: att.id,
      studentId: att.student_id,
      score,
      maxMarks: att.max_marks || 25,
      percentage: att.percentage || 0,
      timeTaken,
      correctCount,
    }
  })

  // Sort by Total Score (DESC) -> Percentage (DESC) -> Time Taken (ASC) -> Correct Count (DESC)
  candidateScores.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    if (b.percentage !== a.percentage) return b.percentage - a.percentage
    if (a.timeTaken !== b.timeTaken) return a.timeTaken - b.timeTaken
    return b.correctCount - a.correctCount
  })

  // Assign Ranks and update records
  memoryStore.rankings = memoryStore.rankings.filter((r) => r.exam_id !== examId)

  candidateScores.forEach((cand, idx) => {
    const rank = idx + 1
    const user = memoryStore.users.find((u) => u.id === cand.studentId)
    const displayName = user ? user.name : `Student ${rank}`

    // Update attempt
    const att = memoryStore.studentExamAttempts.find((a) => a.id === cand.attemptId)
    if (att) att.rank = rank

    // Update finalResult
    const finalRes = memoryStore.finalResults.find((r) => r.attempt_id === cand.attemptId)
    if (finalRes) finalRes.rank = rank

    // Push into rankings table
    memoryStore.rankings.push({
      id: `rank-${examId}-${cand.studentId}`,
      exam_id: examId,
      student_id: cand.studentId,
      student_name: displayName,
      score: cand.score,
      max_marks: cand.maxMarks,
      percentage: cand.percentage,
      rank,
      time_taken_seconds: cand.timeTaken,
      updated_at: new Date().toISOString(),
    })
  })

  return memoryStore.rankings.filter((r) => r.exam_id === examId)
}

export async function getExamLeaderboard(examId: string, requestingStudentId?: string): Promise<LeaderboardEntry[]> {
  await calculateExamRankings(examId)

  const examRanks = memoryStore.rankings.filter((r) => r.exam_id === examId)
  examRanks.sort((a, b) => a.rank - b.rank)

  return examRanks.map((r) => {
    let badge: 'GOLD' | 'SILVER' | 'BRONZE' | 'TOP_10' | undefined = undefined
    if (r.rank === 1) badge = 'GOLD'
    else if (r.rank === 2) badge = 'SILVER'
    else if (r.rank === 3) badge = 'BRONZE'
    else if (r.rank <= 10) badge = 'TOP_10'

    const isCurrent = requestingStudentId ? r.student_id === requestingStudentId : false

    // Privacy formatting: "First Name + Initial" or Display Name
    const parts = (r.student_name || 'Student').trim().split(/\s+/)
    const anonymizedName = parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0]

    return {
      rank: r.rank,
      studentId: r.student_id,
      displayName: isCurrent ? `${anonymizedName} (You)` : anonymizedName,
      score: r.score,
      maxMarks: r.max_marks,
      percentage: r.percentage,
      timeTakenSeconds: r.time_taken_seconds,
      isCurrentStudent: isCurrent,
      badge,
    }
  })
}
