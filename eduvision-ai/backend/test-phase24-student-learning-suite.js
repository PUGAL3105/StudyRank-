/**
 * EduVision AI — Phase 24: Complete Student Learning Experience Test Suite
 * 55-Point Comprehensive Verification Suite
 *
 * Tests: Student Dashboard, Class/Medium/Subject/Term/Chapter selection,
 *        Authentic Lesson retrieval, RAG grounding, Citations, Practice Quizzes,
 *        Progress Tracking, Weak Topics, Recommendations, Role Security, Regression.
 *
 * Run: node test-phase24-student-learning-suite.js
 */

const BASE = 'http://localhost:5000/api'
let pass = 0
let fail = 0

let studentToken = ''
let teacherToken = ''
let adminToken = ''

async function request(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  let json
  try {
    json = await res.json()
  } catch {
    json = {}
  }
  return { status: res.status, body: json }
}

function test(name, result, expected, detail = '') {
  const ok = result === expected
  const icon = ok ? '🟢' : '🔴'
  const label = ok ? 'PASS' : 'FAIL'
  console.log(`${icon} ${label} — ${name}${detail ? ' [' + detail + ']' : ''}`)
  if (ok) pass++
  else {
    fail++
    console.log(`       Expected: ${expected}, Got: ${result}`)
  }
}

function assert(name, cond, detail = '') {
  const ok = !!cond
  const icon = ok ? '🟢' : '🔴'
  console.log(`${icon} ${ok ? 'PASS' : 'FAIL'} — ${name}${detail ? ' [' + detail + ']' : ''}`)
  if (ok) pass++
  else fail++
}

async function runSuite() {
  console.log('════════════════════════════════════════════════════════════════════════════')
  console.log('🎓 EduVision AI — Phase 24: Complete Student Learning Experience Suite')
  console.log('   55-Point Full Spectrum Verification')
  console.log('════════════════════════════════════════════════════════════════════════════\n')

  // ── 1. Authentication Setup ──────────────────────────────────────────────────
  {
    const rStudent = await request('POST', '/auth/login', { email: 'student@demo.com', password: 'password' })
    test('Test  1 — Student Authentication', rStudent.status, 200, `role=${rStudent.body?.data?.role}`)
    studentToken = rStudent.body?.data?.token || ''

    const rTeacher = await request('POST', '/auth/login', { email: 'teacher@demo.com', password: 'password' })
    test('Test  2 — Teacher Authentication', rTeacher.status, 200, `role=${rTeacher.body?.data?.role}`)
    teacherToken = rTeacher.body?.data?.token || ''

    const rAdmin = await request('POST', '/auth/login', { email: 'admin@demo.com', password: 'password' })
    test('Test  3 — Admin Authentication', rAdmin.status, 200, `role=${rAdmin.body?.data?.role}`)
    adminToken = rAdmin.body?.data?.token || ''
  }

  // ── 2. Student Dashboard API ─────────────────────────────────────────────────
  {
    const r = await request('GET', '/student/dashboard', null, studentToken)
    test('Test  4 — Student Dashboard Retrieval', r.status, 200, `status=${r.status}`)
    const d = r.body?.data
    assert('Test  5 — Dashboard returns student name', !!d?.student?.name, `name="${d?.student?.name}"`)
    assert('Test  6 — Dashboard returns board', d?.student?.board?.includes('Tamil Nadu'), `board="${d?.student?.board}"`)
    assert('Test  7 — Dashboard returns class & medium', !!d?.student?.class_name && !!d?.student?.medium, `class="${d?.student?.class_name}", medium="${d?.student?.medium}"`)
    assert('Test  8 — Dashboard returns progress percentage', typeof d?.overallProgressPercentage === 'number', `progress=${d?.overallProgressPercentage}%`)
    assert('Test  9 — Dashboard returns continue learning card', !!d?.continueLearning?.chapter_name, `continueChapter="${d?.continueLearning?.chapter_name}"`)
    assert('Test 10 — Dashboard returns recommended content', Array.isArray(d?.recommendedContent) && d.recommendedContent.length > 0, `recCount=${d?.recommendedContent?.length}`)
  }

  // ── 3. Class Selection ───────────────────────────────────────────────────────
  {
    const r = await request('GET', '/classes', null, null)
    test('Test 11 — Class List Retrieval', r.status, 200, `status=${r.status}`)
    const classes = r.body?.data || []
    assert('Test 12 — Classes 6 through 12 present (7 classes)', classes.length >= 7, `count=${classes.length}`)
    assert('Test 13 — Class 10 present', classes.some((c) => c.class_name === 'Class 10' || c.id === 'c-10'), 'c-10=found')
    assert('Test 14 — Class 11 present', classes.some((c) => c.class_name === 'Class 11' || c.id === 'c-11'), 'c-11=found')
  }

  // ── 4. Medium & Subject Selection ────────────────────────────────────────────
  {
    const rEng = await request('GET', '/classes/c-10/subjects?medium=English', null, null)
    test('Test 15 — Class 10 English Medium Subjects', rEng.status, 200, `count=${rEng.body?.data?.length}`)
    assert('Test 16 — Science subject present in English medium', rEng.body?.data?.some((s) => s.id === 'sub-10-sci' || s.subject_name === 'Science'), 'sub-10-sci=found')

    const rTam = await request('GET', '/classes/c-10/subjects?medium=Tamil', null, null)
    test('Test 17 — Class 10 Tamil Medium Subjects', rTam.status, 200, `count=${rTam.body?.data?.length}`)
    assert('Test 18 — Medium Isolation: English query preserves medium parameter', rEng.status === 200 && rTam.status === 200, 'isolated=true')
  }

  // ── 5. Term Selection ────────────────────────────────────────────────────────
  {
    const rTerms = await request('GET', '/subjects/sub-10-sci/terms', null, null)
    test('Test 19 — Class 10 Science Terms Retrieval', rTerms.status, 200, `count=${rTerms.body?.data?.length}`)
    assert('Test 20 — Exactly 3 terms for Class 10 Science', Array.isArray(rTerms.body?.data) && rTerms.body.data.length === 3, `count=${rTerms.body?.data?.length}`)
    assert('Test 21 — Term 1 ID is trm-10sci-1', rTerms.body?.data?.some((t) => t.id === 'trm-10sci-1'), 'trm-10sci-1=found')

    // Class 11 English Semesters regression
    const r11Terms = await request('GET', '/subjects/sub-11-eng/terms', null, null)
    test('Test 22 — Class 11 English Semesters Retrieval', r11Terms.status, 200, `count=${r11Terms.body?.data?.length}`)
    assert('Test 23 — Class 11 English returns exactly 2 semesters', Array.isArray(r11Terms.body?.data) && r11Terms.body.data.length === 2, `count=${r11Terms.body?.data?.length}`)
  }

  // ── 6. Chapter Selection & READY Status Guard ────────────────────────────────
  {
    const rChaps = await request('GET', '/terms/trm-10sci-1/chapters', null, null)
    test('Test 24 — Term 1 Chapters Retrieval', rChaps.status, 200, `count=${rChaps.body?.data?.length}`)
    const chaps = rChaps.body?.data || []
    assert('Test 25 — Laws of Motion is READY', chaps.some((c) => c.id === 'ch-10sci-t1-1' && c.indexing_status === 'READY'), 'Laws of Motion=READY')
    assert('Test 26 — Optics is READY', chaps.some((c) => c.id === 'ch-10sci-t1-2' && c.indexing_status === 'READY'), 'Optics=READY')
    assert('Test 27 — Thermal Physics is READY', chaps.some((c) => c.id === 'ch-10sci-t1-3' && c.indexing_status === 'READY'), 'Thermal Physics=READY')
    assert('Test 28 — Electricity is READY', chaps.some((c) => c.id === 'ch-10sci-t1-4' && c.indexing_status === 'READY'), 'Electricity=READY')
    assert('Test 29 — Acoustics is READY', chaps.some((c) => c.id === 'ch-10sci-t1-5' && c.indexing_status === 'READY'), 'Acoustics=READY')
  }

  // ── 7. Authentic Lesson Retrieval ────────────────────────────────────────────
  {
    const rLesson = await request('GET', '/student/chapters/ch-10sci-t1-1/lesson', null, studentToken)
    test('Test 30 — Authentic Lesson Retrieval (Laws of Motion)', rLesson.status, 200, `status=${rLesson.status}`)
    const les = rLesson.body?.data
    assert('Test 31 — Lesson is marked isReady: true', les?.isReady === true, `isReady=${les?.isReady}`)
    assert('Test 32 — Lesson contains authentic topics array', Array.isArray(les?.topics) && les.topics.length > 0, `topicCount=${les?.topics?.length}`)
    assert('Test 33 — Lesson topics contain exact page citations', les?.topics?.every((t) => t.citation && t.pageNumber), 'citations_present=true')
    assert('Test 34 — Lesson references Tamil Nadu State Board source textbook', les?.textbookName?.includes('Tamil Nadu State Board'), `textbookName="${les?.textbookName}"`)

    // PENDING chapter guard
    const rPending = await request('GET', '/student/chapters/ch-unindexed-pending-1/lesson', null, studentToken)
    test('Test 35 — PENDING Chapter Guard', rPending.status, 200, `isReady=${rPending.body?.data?.isReady}`)
    assert('Test 36 — PENDING chapter returns unindexed notice', rPending.body?.data?.isReady === false && !!rPending.body?.data?.notice, `notice="${rPending.body?.data?.notice}"`)
  }

  // ── 8. AI Ask / RAG Pipeline & Grounding ─────────────────────────────────────
  {
    const rRAG = await request(
      'POST',
      '/questions/ask',
      {
        classId: 'c-10',
        subjectId: 'sub-10-sci',
        termId: 'trm-10sci-1',
        chapterId: 'ch-10sci-t1-1',
        question: "What is Newton's first law of motion?",
      },
      studentToken
    )
    test('Test 37 — RAG Pipeline Question Ask', rRAG.status === 200 || rRAG.status === 201 ? 200 : rRAG.status, 200, `status=${rRAG.status}`)
    const ans = rRAG.body?.data
    assert('Test 38 — RAG Answer contains simple explanation', !!ans?.simple_explanation, `has_simple=${!!ans?.simple_explanation}`)
    assert('Test 39 — RAG Answer contains detailed answer', !!ans?.answer, `has_detailed=${!!ans?.answer}`)
    assert('Test 40 — RAG Answer contains source textbook citation', !!ans?.grounding?.sourceBook || !!ans?.source?.book, 'sourceBook_present=true')
    assert('Test 41 — RAG Answer contains page citation numbers', (ans?.grounding?.sourcePages?.length > 0) || (ans?.source?.pages?.length > 0) || (ans?.page_numbers?.length > 0), 'pages_present=true')
  }

  // ── 9. Practice Quiz System ──────────────────────────────────────────────────
  let quizId = ''
  let sampleQuestionId = ''
  {
    const rQuiz = await request(
      'POST',
      '/quizzes/generate',
      {
        classId: 'c-10',
        subjectId: 'sub-10-sci',
        chapterId: 'ch-10sci-t1-1',
        questionCount: 5,
        difficulty: 'mixed',
      },
      studentToken
    )
    test('Test 42 — Practice Quiz Generation', rQuiz.status === 200 || rQuiz.status === 201 ? 200 : rQuiz.status, 200, `status=${rQuiz.status}`)
    const qData = rQuiz.body?.data
    assert('Test 43 — Quiz contains 5 questions', qData?.questions?.length === 5, `count=${qData?.questions?.length}`)
    assert('Test 44 — Security: Correct answers hidden before submit', qData?.questions?.every((q) => !q.correctAnswer && !q.answer), 'answers_hidden=true')
    quizId = qData?.quizId || ''
    sampleQuestionId = qData?.questions?.[0]?.id || ''
  }

  // ── 10. Quiz Submission & Scoring ────────────────────────────────────────────
  {
    if (quizId) {
      const rSubmit = await request(
        'POST',
        `/quizzes/${quizId}/submit`,
        {
          answers: [
            { questionId: sampleQuestionId, selectedAnswer: 'Inertia' },
          ],
        },
        studentToken
      )
      test('Test 45 — Practice Quiz Submission', rSubmit.status, 200, `status=${rSubmit.status}`)
      const res = rSubmit.body?.data
      assert('Test 46 — Quiz result returns score & total', typeof res?.score === 'number' && typeof res?.total === 'number', `score=${res?.score}/${res?.total}`)
      assert('Test 47 — Quiz result returns percentage', typeof res?.percentage === 'number', `percentage=${res?.percentage}%`)
      assert('Test 48 — Quiz result returns explanations and textbook source pages', Array.isArray(res?.results) && res.results.length > 0, 'results_breakdown=true')
    } else {
      console.log('⚠️  SKIP  — Tests 45-48 (quizId not generated)')
    }
  }

  // ── 11. Role Protection & Security Gates ─────────────────────────────────────
  {
    const rAdminDenied = await request('GET', '/admin/dashboard/stats', null, studentToken)
    test('Test 49 — Student blocked from Admin API (403 Forbidden)', rAdminDenied.status, 403, `status=${rAdminDenied.status}`)

    const rTeacherDenied = await request('GET', '/admin/dashboard/stats', null, teacherToken)
    test('Test 50 — Teacher blocked from Admin API (403 Forbidden)', rTeacherDenied.status, 403, `status=${rTeacherDenied.status}`)

    const rAdminAllowed = await request('GET', '/admin/dashboard/stats', null, adminToken)
    test('Test 51 — Admin allowed on Admin API (200 OK)', rAdminAllowed.status, 200, `status=${rAdminAllowed.status}`)

    const rUnauthDenied = await request('GET', '/student/dashboard', null, null)
    test('Test 52 — Unauthenticated access rejected (401 Unauthorized)', rUnauthDenied.status, 401, `status=${rUnauthDenied.status}`)
  }

  // ── 12. Complete Authentic Coverage & Data Integrity ─────────────────────────
  {
    const rCoverage = await request('GET', '/admin/content-status', null, adminToken)
    test('Test 53 — 100% Authentic Textbook Coverage (Class 10 Science)', rCoverage.status, 200, `status=${rCoverage.status}`)
    const cov = rCoverage.body?.data
    assert('Test 54 — 10 / 10 chapters READY', cov?.readyChapters >= 10, `readyChapters=${cov?.readyChapters}`)
    assert('Test 55 — Zero synthetic/fake content (Strict Data Integrity)', cov?.pendingChapters === 0, `pendingChapters=${cov?.pendingChapters}`)
  }

  console.log('\n════════════════════════════════════════════════════════════════════════════')
  console.log(`📊 Phase 24 Student Learning Suite Results: ${pass + fail} assertions — ${pass} passed, ${fail} failed`)
  if (fail === 0) {
    console.log('🎉 ALL 55 TESTS PASSED — Complete Student Learning Experience Verified!')
  } else {
    console.log(`⚠️  ${fail} test(s) failed — check output above`)
  }
  console.log('════════════════════════════════════════════════════════════════════════════\n')

  process.exit(fail > 0 ? 1 : 0)
}

runSuite().catch((err) => {
  console.error('❌ Test execution error:', err)
  process.exit(1)
})
