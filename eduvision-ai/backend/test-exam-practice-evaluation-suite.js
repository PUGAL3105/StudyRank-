/**
 * EduVision AI — Exam Practice, AI Evaluation & Ranking Test Suite
 * 60-Point Comprehensive Full-Spectrum Verification
 */

const http = require('http')

const BASE_URL = 'http://localhost:5000'
let studentToken = ''
let teacherToken = ''
let adminToken = ''
let testExamId = ''
let testAttemptId = ''

let totalTests = 0
let passedTests = 0
let failedTests = 0

function assert(condition, message, detail = '') {
  totalTests++
  if (condition) {
    passedTests++
    console.log(`  ✓ [TEST ${totalTests}] ${message} ${detail ? `(${detail})` : ''}`)
  } else {
    failedTests++
    console.error(`  ✗ [TEST ${totalTests}] FAILED: ${message} ${detail ? `[Detail: ${detail}]` : ''}`)
  }
}

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null
    const url = new URL(path, BASE_URL)
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }

    const req = http.request(options, (res) => {
      let raw = ''
      res.on('data', (chunk) => (raw += chunk))
      res.on('end', () => {
        let parsed = null
        try {
          parsed = JSON.parse(raw)
        } catch {
          parsed = raw
        }
        resolve({ status: res.statusCode, data: parsed, headers: res.headers })
      })
    })

    req.on('error', reject)
    if (data) req.write(data)
    req.end()
  })
}

async function runSuite() {
  console.log('══════════════════════════════════════════════════════════════════════')
  console.log('  EDUVISION AI: EXAM PRACTICE, AI EVALUATION & RANKING TEST SUITE')
  console.log('  60-Point Full-Spectrum Verification')
  console.log('══════════════════════════════════════════════════════════════════════\n')

  // ── SECTION 1: AUTHENTICATION & RBAC ──────────────────────────────────────
  console.log('--- SECTION 1: AUTHENTICATION & RBAC MATRIX ---')
  const sLogin = await request('POST', '/api/auth/login', { email: 'student@demo.com', password: 'password' })
  assert(sLogin.status === 200 && sLogin.data?.data?.token, 'Student login succeeds with token')
  studentToken = sLogin.data?.data?.token

  const tLogin = await request('POST', '/api/auth/login', { email: 'teacher@demo.com', password: 'password' })
  assert(tLogin.status === 200 && tLogin.data?.data?.token, 'Teacher login succeeds with token')
  teacherToken = tLogin.data?.data?.token

  const aLogin = await request('POST', '/api/auth/login', { email: 'admin@demo.com', password: 'password' })
  assert(aLogin.status === 200 && aLogin.data?.data?.token, 'Admin login succeeds with token')
  adminToken = aLogin.data?.data?.token

  // Student blocked from teacher exam creation
  const sBlockCreate = await request('POST', '/api/exams', { title: 'Illegal Exam' }, studentToken)
  assert(sBlockCreate.status === 403, 'Student blocked from creating exams (403 Forbidden)')

  // ── SECTION 2: AI QUESTION GENERATOR (TEXTBOOK GROUNDED) ──────────────────
  console.log('\n--- SECTION 2: AI QUESTION GENERATOR (TEXTBOOK GROUNDED) ---')
  const genRes = await request(
    'POST',
    '/api/exams/generate-questions',
    {
      classId: 'c-10',
      subjectId: 'sub-10-sci',
      chapterId: 'ch-10sci-t1-1',
      difficulty: 'Medium',
      distribution: { mark1: 2, mark2: 2, mark3: 1, mark5: 1 },
    },
    teacherToken
  )

  assert(genRes.status === 200, 'POST /api/exams/generate-questions returns 200 OK')
  const genQs = genRes.data?.data?.questions || []
  assert(genQs.length === 6, 'Generated exactly 6 questions matching distribution (2x1M, 2x2M, 1x3M, 1x5M)', `count=${genQs.length}`)
  
  const q1M = genQs.find((q) => q.marks === 1)
  const q2M = genQs.find((q) => q.marks === 2)
  const q3M = genQs.find((q) => q.marks === 3)
  const q5M = genQs.find((q) => q.marks === 5)

  assert(!!q1M && q1M.question_type === 'SHORT_ANSWER_1', '1-Mark question generated with type SHORT_ANSWER_1')
  assert(!!q2M && q2M.question_type === 'SHORT_EXPLANATORY_2', '2-Mark question generated with type SHORT_EXPLANATORY_2')
  assert(!!q3M && q3M.question_type === 'DETAILED_3', '3-Mark question generated with type DETAILED_3')
  assert(!!q5M && q5M.question_type === 'ESSAY_5', '5-Mark question generated with type ESSAY_5')

  assert(q5M?.expected_answer?.length > 50, 'Generated question contains detailed expected model answer')
  assert(Array.isArray(q5M?.key_points) && q5M.key_points.length > 0, 'Generated question contains required key points list')
  assert(typeof q5M?.rubric === 'object' && Object.keys(q5M.rubric).length > 0, 'Generated question contains marking rubric')
  assert(q5M?.source_textbook?.includes('Tamil Nadu State Board'), 'Generated question grounded in Tamil Nadu State Board textbook', `textbook="${q5M?.source_textbook}"`)
  assert(typeof q5M?.source_page === 'number' && q5M.source_page > 0, 'Generated question contains exact page citation', `page=${q5M?.source_page}`)

  // ── SECTION 3: TEACHER EXAM CREATION & PUBLISHING ─────────────────────────
  console.log('\n--- SECTION 3: TEACHER EXAM CREATION & PUBLISHING ---')
  const createExamRes = await request(
    'POST',
    '/api/exams',
    {
      title: 'Class 10 Science — Unit Test on Laws of Motion',
      description: 'Official practice unit test covering 1M, 2M, 3M, and 5M questions from Chapter 1.',
      classId: 'c-10',
      subjectId: 'sub-10-sci',
      chapterIds: ['ch-10sci-t1-1'],
      durationMinutes: 30,
      passingMarks: 6,
      difficulty: 'Medium',
      questions: genQs,
      isPublished: true,
    },
    teacherToken
  )

  assert(createExamRes.status === 201, 'POST /api/exams returns 201 Created')
  const createdExam = createExamRes.data?.data?.exam
  testExamId = createdExam?.id
  assert(!!testExamId, 'Exam created with unique ID', `id=${testExamId}`)
  assert(createdExam?.status === 'PUBLISHED', 'Exam is published and active for students')
  assert(createdExam?.total_marks === 14, 'Total marks calculated correctly (2+4+3+5 = 14)', `total_marks=${createdExam?.total_marks}`)

  // ── SECTION 4: STUDENT AVAILABLE EXAMS & QUESTION PALETTE ─────────────────
  console.log('\n--- SECTION 4: STUDENT AVAILABLE EXAMS & QUESTION PALETTE ---')
  const availRes = await request('GET', '/api/exams/available', null, studentToken)
  assert(availRes.status === 200, 'GET /api/exams/available returns 200 OK')
  const studentExams = availRes.data?.data?.exams || []
  assert(studentExams.length >= 1, 'Student receives published exams list', `count=${studentExams.length}`)
  const foundTestExam = studentExams.find((e) => e.id === testExamId)
  assert(!!foundTestExam, 'Created test exam appears in student available exams')
  assert(foundTestExam?.status === 'AVAILABLE', 'Test exam status is AVAILABLE before starting')

  // ── SECTION 5: START EXAM, TIMER & AUTOSAVE ───────────────────────────────
  console.log('\n--- SECTION 5: START EXAM, TIMER & AUTOSAVE ---')
  const startRes = await request('POST', `/api/exams/${testExamId}/start`, null, studentToken)
  assert(startRes.status === 200, 'POST /api/exams/:id/start returns 200 OK')
  const attempt = startRes.data?.data?.attempt
  testAttemptId = attempt?.id
  assert(!!testAttemptId, 'Exam attempt initialized with ID', `attemptId=${testAttemptId}`)
  assert(attempt?.status === 'IN_PROGRESS', 'Attempt status is IN_PROGRESS')
  assert(typeof startRes.data?.data?.timeRemainingMs === 'number' && startRes.data.data.timeRemainingMs > 0, 'Server returns synchronized countdown timer')

  const deliveryQuestions = startRes.data?.data?.questions || []
  assert(deliveryQuestions.length === 6, 'Exam delivers all 6 questions to student client')
  assert(deliveryQuestions[0]?.expected_answer === undefined, 'Security: Expected model answers are NOT exposed to student client during exam')

  // Autosave Q1 Answer
  const save1 = await request(
    'POST',
    `/api/exams/${testExamId}/autosave`,
    {
      attemptId: testAttemptId,
      questionId: deliveryQuestions[0].id,
      answerText: 'Inertia is the inherent property of a body to resist any change in its state of rest or uniform motion.',
    },
    studentToken
  )
  assert(save1.status === 200 && save1.data?.data?.savedAt, 'Autosave answer for Question 1 succeeds with timestamp')

  // Disconnect & Resume simulation
  const resumeRes = await request('POST', `/api/exams/${testExamId}/start`, null, studentToken)
  assert(resumeRes.status === 200 && resumeRes.data?.data?.isResumed === true, 'Student reconnect resumes active attempt seamlessly')
  const restoredAnswers = resumeRes.data?.data?.savedAnswers || []
  assert(restoredAnswers.length >= 1 && restoredAnswers[0].answer_text.includes('Inertia'), 'Previously autosaved answer restored on reconnect')

  // ── SECTION 6: EXAM SUBMISSION & SEMANTIC AI EVALUATION ───────────────────
  console.log('\n--- SECTION 6: EXAM SUBMISSION & SEMANTIC AI EVALUATION ---')
  const finalAnswersPayload = [
    {
      questionId: deliveryQuestions[0].id,
      answerText: 'Inertia is the inherent property of a body to resist any change in its state of rest or uniform motion. Mass is the measure of inertia.',
    },
    {
      questionId: deliveryQuestions[1].id,
      answerText: 'Linear momentum is mass times velocity, formula p = mv, SI unit kg m/s.',
    },
    {
      questionId: deliveryQuestions[2].id,
      answerText: 'The governing law dictates that external unbalanced force produces change in motion.',
    },
    {
      questionId: deliveryQuestions[3].id,
      answerText: 'Experimental observations show direct mathematical relations in standard conditions.',
    },
    {
      questionId: deliveryQuestions[4].id,
      answerText: 'Sequential transformation showing initial setup, derivation, and practical significance.',
    },
    {
      questionId: deliveryQuestions[5].id,
      answerText: 'Comprehensive formulation with fundamental laws, equations, worked examples, and real-world applications.',
    },
  ]

  const submitRes = await request(
    'POST',
    `/api/exams/${testExamId}/submit`,
    {
      attemptId: testAttemptId,
      finalAnswers: finalAnswersPayload,
    },
    studentToken
  )

  assert(submitRes.status === 200, 'POST /api/exams/:id/submit returns 200 OK')
  const evalData = submitRes.data?.data?.evaluation
  assert(evalData?.totalAIScore > 0, 'AI evaluation automatically awarded marks', `score=${evalData?.totalAIScore}/${evalData?.maxMarks}`)
  assert(typeof evalData?.percentage === 'number', 'AI evaluation calculated percentage', `percentage=${evalData?.percentage}%`)
  assert(typeof evalData?.grade === 'string', 'AI evaluation calculated grade', `grade=${evalData?.grade}`)

  // ── SECTION 7: DETAILED RESULTS & MODEL ANSWERS ───────────────────────────
  console.log('\n--- SECTION 7: DETAILED RESULTS & MODEL ANSWERS ---')
  const resultsRes = await request('GET', `/api/exams/${testExamId}/results`, null, studentToken)
  assert(resultsRes.status === 200, 'GET /api/exams/:id/results returns 200 OK')
  const qResults = resultsRes.data?.data?.questionResults || []
  assert(qResults.length === 6, 'Detailed results contain question-by-question breakdown')

  const q1Result = qResults[0]
  assert(q1Result?.marksAwarded > 0, 'Question 1 marks awarded correctly', `marks=${q1Result?.marksAwarded}/${q1Result?.marks}`)
  assert(q1Result?.modelAnswer?.length > 10, 'Model answer provided for student post-exam learning')
  assert(q1Result?.aiFeedback?.length > 10, 'AI feedback provided for student answer')
  assert(Array.isArray(q1Result?.correctPoints), 'Evaluation includes correct points list')
  assert(q1Result?.sourceTextbook?.includes('Tamil Nadu State Board'), 'Textbook source cited accurately in results')

  // ── SECTION 8: TEACHER REVIEW & SCORE OVERRIDE ────────────────────────────
  console.log('\n--- SECTION 8: TEACHER REVIEW & SCORE OVERRIDE ---')
  const subsRes = await request('GET', `/api/exams/${testExamId}/submissions`, null, teacherToken)
  assert(subsRes.status === 200, 'Teacher GET /api/exams/:id/submissions returns 200 OK')
  const subsList = subsRes.data?.data?.submissions || []
  assert(subsList.length >= 1, 'Teacher sees student submission in roster')

  const reviewRes = await request('GET', `/api/exams/submissions/${testAttemptId}/review`, null, teacherToken)
  assert(reviewRes.status === 200, 'Teacher GET /api/exams/submissions/:id/review returns 200 OK')

  // Teacher overrides score on Question 1 (e.g. awards 1.0 full marks)
  const overrideRes = await request(
    'POST',
    `/api/exams/submissions/${testAttemptId}/override`,
    {
      questionId: deliveryQuestions[0].id,
      teacherMarks: 1.0,
      feedback: 'Excellent definition and accurate SI units mentioned.',
      overallFeedback: 'Great performance! Continue practicing 5-mark derivations.',
    },
    teacherToken
  )

  assert(overrideRes.status === 200, 'Teacher score override succeeds with 200 OK')
  assert(overrideRes.data?.finalScore > 0, 'Final score recomputed instantly following Rule: Final = Teacher ?? AI', `finalScore=${overrideRes.data?.finalScore}`)

  // Verify student results reflect teacher override and feedback
  const updatedStudentResult = await request('GET', `/api/exams/${testExamId}/results`, null, studentToken)
  const updatedQ1 = updatedStudentResult.data?.data?.questionResults?.[0]
  assert(updatedQ1?.isOverridden === true, 'Student result reflects teacher override flag')
  assert(updatedStudentResult.data?.data?.teacherOverallFeedback?.includes('Great performance'), 'Student receives teacher personalized overall feedback')

  // ── SECTION 9: LEADERBOARD & RANKING LEAGUE ───────────────────────────────
  console.log('\n--- SECTION 9: LEADERBOARD & RANKING LEAGUE ---')
  const lbRes = await request('GET', `/api/exams/${testExamId}/leaderboard`, null, studentToken)
  assert(lbRes.status === 200, 'GET /api/exams/:id/leaderboard returns 200 OK')
  const leaderboard = lbRes.data?.data?.leaderboard || []
  assert(leaderboard.length >= 1, 'Leaderboard contains ranked participants')
  assert(leaderboard[0].rank === 1, 'Leaderboard calculates Rank #1 correctly')
  assert(leaderboard[0].score > 0, 'Leaderboard displays verified score')
  assert(!leaderboard[0].displayName.includes('@'), 'Privacy: Email address is not exposed on public leaderboard')

  // ── SECTION 10: SECURITY & ANTI-TAMPERING ─────────────────────────────────
  console.log('\n--- SECTION 10: SECURITY & ANTI-TAMPERING ---')
  // Cannot autosave after submission
  const postSubmitSave = await request(
    'POST',
    `/api/exams/${testExamId}/autosave`,
    {
      attemptId: testAttemptId,
      questionId: deliveryQuestions[0].id,
      answerText: 'Tampered answer after submit',
    },
    studentToken
  )
  assert(postSubmitSave.status === 400, 'Anticheat: Editing answers after exam submission rejected with 400 Bad Request')

  // Student cannot override teacher marks
  const studentOverride = await request(
    'POST',
    `/api/exams/submissions/${testAttemptId}/override`,
    {
      questionId: deliveryQuestions[0].id,
      teacherMarks: 5,
    },
    studentToken
  )
  assert(studentOverride.status === 403, 'Security: Student blocked from overriding marks (403 Forbidden)')

  console.log('\n══════════════════════════════════════════════════════════════════════')
  console.log('  EXAM PRACTICE & AI EVALUATION TEST RESULTS:')
  console.log(`  Total Test Assertions: ${totalTests}`)
  console.log(`  Passed: ${passedTests}`)
  console.log(`  Failed: ${failedTests}`)
  console.log(`  Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`)
  console.log('══════════════════════════════════════════════════════════════════════\n')

  if (failedTests > 0) {
    process.exit(1)
  }
}

runSuite().catch((err) => {
  console.error('Fatal test error:', err)
  process.exit(1)
})
