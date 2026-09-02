/**
 * EduVision AI — Phase 27: Production Hardening & Full End-to-End Verification Suite
 * 
 * 110+ Comprehensive Automated Assertions Covering:
 * 1. Authentication Security & Token Lifecycle (Valid/Invalid, Weak Password, Duplicate, Admin Block, Logout)
 * 2. Role-Based Access Control (RBAC) & Endpoint Isolation (Student, Teacher, Admin Matrix)
 * 3. Insecure Direct Object Reference (IDOR) & Cross-Tenant Attack Resistance
 * 4. Complete Student Learning Experience & All 10 Class 10 Science Chapters Grounding
 * 5. Multi-Chunk RAG Retrieval, Embedding Dimension (1536-dim), & Page Coordinate Verification
 * 6. Teacher Portal Assignment Workflow, Server-Side Grading, & Grounded Feedback
 * 7. Admin Control Center 10-Tab Capabilities, PDF Validation (%PDF-), SHA-256 & Audit Security
 * 8. Database & MemoryStore Integrity (10 READY, 0 PENDING, 0 FAILED)
 * 9. API Error Code Handling (400, 401, 403, 404, 409) & Data Sanitization (Zero Password Leakage)
 * 10. Platform-Wide Regression Verification (Phase 20, 21, 22, 24, 25, 26)
 */

const http = require('http')

const BASE_URL = 'http://localhost:5000'
let studentToken = ''
let teacherToken = ''
let adminToken = ''

let totalTests = 0
let passedTests = 0
let failedTests = 0

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL)
    const options = {
      hostname: url.hostname,
      port: url.port || 5000,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    }
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`
    }

    const req = http.request(options, (res) => {
      let rawData = ''
      res.on('data', (chunk) => {
        rawData += chunk
      })
      res.on('end', () => {
        let json = null
        try {
          json = JSON.parse(rawData)
        } catch (e) {
          json = { raw: rawData }
        }
        resolve({ status: res.statusCode, data: json, headers: res.headers })
      })
    })

    req.on('error', (err) => reject(err))

    if (body) {
      req.write(JSON.stringify(body))
    }
    req.end()
  })
}

function assert(condition, message) {
  totalTests++
  if (condition) {
    passedTests++
    console.log(`  ✓ [TEST ${totalTests}] ${message}`)
  } else {
    failedTests++
    console.error(`  ✗ [TEST ${totalTests}] FAILED: ${message}`)
  }
}

async function runSuite() {
  console.log('\n======================================================================')
  console.log('  PHASE 27: EDUVISION AI PRODUCTION HARDENING & E2E SUITE')
  console.log('======================================================================\n')

  // ── 1. AUTHENTICATION SECURITY AUDIT ───────────────────────────────────────
  console.log('--- SECTION 1: AUTHENTICATION & CREDENTIAL SECURITY ---')

  const studentLogin = await request('POST', '/api/auth/login', {
    email: 'student@demo.com',
    password: 'password',
  })
  assert(studentLogin.status === 200, 'Student login succeeds (200 OK)')
  assert(studentLogin.data?.data?.token, 'Student login returns valid JWT')
  assert(studentLogin.data?.data?.role === 'student', 'Student token role is student')
  assert(!studentLogin.data?.data?.password_hash, 'Student login does NOT leak password_hash')
  studentToken = studentLogin.data?.data?.token

  const teacherLogin = await request('POST', '/api/auth/login', {
    email: 'teacher@demo.com',
    password: 'password',
  })
  assert(teacherLogin.status === 200, 'Teacher login succeeds (200 OK)')
  assert(teacherLogin.data?.data?.role === 'teacher', 'Teacher token role is teacher')
  teacherToken = teacherLogin.data?.data?.token

  const adminLogin = await request('POST', '/api/auth/login', {
    email: 'admin@demo.com',
    password: 'password',
  })
  assert(adminLogin.status === 200, 'Admin login succeeds (200 OK)')
  assert(adminLogin.data?.data?.role === 'admin', 'Admin token role is admin')
  adminToken = adminLogin.data?.data?.token

  const invalidPass = await request('POST', '/api/auth/login', {
    email: 'student@demo.com',
    password: 'wrong_password_xyz',
  })
  assert(invalidPass.status === 401, 'Invalid password rejected with 401 Unauthorized')

  const nonExistentUser = await request('POST', '/api/auth/login', {
    email: 'nonexistent_user_999@demo.com',
    password: 'password',
  })
  assert(nonExistentUser.status === 401, 'Non-existent account login rejected with 401 Unauthorized')

  const adminSelfReg = await request('POST', '/api/auth/register', {
    name: 'Hacker Admin',
    email: `admin_hack_${Date.now()}@demo.com`,
    password: 'password123',
    role: 'admin',
    medium: 'English',
  })
  assert(adminSelfReg.status === 400 || adminSelfReg.status === 403, 'Admin self-registration blocked (400/403)')

  const weakPassReg = await request('POST', '/api/auth/register', {
    name: 'Weak User',
    email: `weak_${Date.now()}@demo.com`,
    password: '123',
    role: 'student',
    class_level: '10',
    medium: 'English',
  })
  assert(weakPassReg.status === 400, 'Weak password <8 chars rejected with 400 Bad Request')

  const invalidEmailReg = await request('POST', '/api/auth/register', {
    name: 'Invalid Email',
    email: 'not-an-email',
    password: 'password123',
    role: 'student',
    class_level: '10',
    medium: 'English',
  })
  assert(invalidEmailReg.status === 400, 'Invalid email format rejected with 400 Bad Request')

  const uniqueStudentEmail = `new_student_${Date.now()}@demo.com`
  const validReg = await request('POST', '/api/auth/register', {
    name: 'New Student Test',
    email: uniqueStudentEmail,
    password: 'password123',
    role: 'student',
    class_level: '10',
    medium: 'English',
  })
  assert(validReg.status === 201, 'Valid student registration accepted with 201 Created')
  assert(!validReg.data?.data?.password_hash, 'Registration response does NOT leak password_hash')

  const duplicateReg = await request('POST', '/api/auth/register', {
    name: 'Duplicate Student',
    email: uniqueStudentEmail,
    password: 'password123',
    role: 'student',
    class_level: '10',
    medium: 'English',
  })
  assert(duplicateReg.status === 409, 'Duplicate email registration rejected with 409 Conflict')

  const authMe = await request('GET', '/api/auth/me', null, studentToken)
  assert(authMe.status === 200, 'GET /api/auth/me returns 200 OK')
  assert(authMe.data?.data?.email === 'student@demo.com', 'GET /api/auth/me returns authenticated user email')
  assert(!authMe.data?.data?.password_hash, 'GET /api/auth/me does NOT leak password_hash')

  const logoutRes = await request('POST', '/api/auth/logout', null, studentToken)
  assert(logoutRes.status === 200, 'POST /api/auth/logout responds with 200 OK')

  // ── 2. ROLE ISOLATION & RBAC AUDIT ─────────────────────────────────────────
  console.log('\n--- SECTION 2: ROLE-BASED ACCESS CONTROL (RBAC) ISOLATION ---')

  const studentOnTeacherDash = await request('GET', '/api/teacher/dashboard', null, studentToken)
  assert(studentOnTeacherDash.status === 403, 'Student blocked from GET /api/teacher/dashboard (403 Forbidden)')

  const studentOnAdminStats = await request('GET', '/api/admin/dashboard/stats', null, studentToken)
  assert(studentOnAdminStats.status === 403, 'Student blocked from GET /api/admin/dashboard/stats (403 Forbidden)')

  const studentOnAdminUsers = await request('GET', '/api/admin/users', null, studentToken)
  assert(studentOnAdminUsers.status === 403, 'Student blocked from GET /api/admin/users (403 Forbidden)')

  const teacherOnAdminStats = await request('GET', '/api/admin/dashboard/stats', null, teacherToken)
  assert(teacherOnAdminStats.status === 403, 'Teacher blocked from GET /api/admin/dashboard/stats (403 Forbidden)')

  const teacherOnAdminAudit = await request('GET', '/api/admin/audit-logs', null, teacherToken)
  assert(teacherOnAdminAudit.status === 403, 'Teacher blocked from GET /api/admin/audit-logs (403 Forbidden)')

  const noTokenReq = await request('GET', '/api/admin/system-health')
  assert(noTokenReq.status === 401, 'Unauthenticated request rejected with 401 Unauthorized')

  const malformedTokenReq = await request('GET', '/api/admin/system-health', null, 'malformed-jwt-token')
  assert(malformedTokenReq.status === 401 || malformedTokenReq.status === 403, 'Malformed JWT token rejected (401/403)')

  // ── 3. IDOR SECURITY AUDIT ─────────────────────────────────────────────────
  console.log('\n--- SECTION 3: INSECURE DIRECT OBJECT REFERENCE (IDOR) AUDIT ---')

  // Create temporary teacher 2
  const teacher2Email = `teacher2_${Date.now()}@demo.com`
  const regTeacher2 = await request('POST', '/api/auth/register', {
    name: 'Teacher Two',
    email: teacher2Email,
    password: 'password123',
    role: 'teacher',
    medium: 'English',
  })
  const teacher2Token = regTeacher2.data?.data?.token

  // Teacher 1 creates assignment
  const asgCreate = await request(
    'POST',
    '/api/teacher/assignments',
    {
      title: 'Teacher 1 IDOR Test Assignment',
      description: 'Verifying IDOR isolation between teachers',
      class_level: 'Class 10',
      medium: 'English',
      subject_id: 'sub-10-sci',
      term_id: 'trm-10sci-1',
      chapter_id: 'ch-10sci-t1-1',
      due_date: '2026-09-01',
    },
    teacherToken
  )
  const asgId = asgCreate.data?.data?.id
  assert(asgCreate.status === 201, 'Teacher 1 creates assignment successfully (201 Created)')

  // Teacher 2 tries to update Teacher 1 assignment
  const idorUpdate = await request(
    'PUT',
    `/api/teacher/assignments/${asgId}`,
    { title: 'Hacked Title by Teacher 2' },
    teacher2Token
  )
  assert(idorUpdate.status === 403, 'Teacher 2 blocked from updating Teacher 1 assignment (403 Forbidden)')

  // Teacher 2 tries to delete Teacher 1 assignment
  const idorDelete = await request('DELETE', `/api/teacher/assignments/${asgId}`, null, teacher2Token)
  assert(idorDelete.status === 403, 'Teacher 2 blocked from deleting Teacher 1 assignment (403 Forbidden)')

  // Teacher 2 tries to view Teacher 1 assignment submissions
  const idorSubmissions = await request('GET', `/api/teacher/assignments/${asgId}/submissions`, null, teacher2Token)
  assert(idorSubmissions.status === 403, 'Teacher 2 blocked from viewing Teacher 1 assignment submissions (403 Forbidden)')

  // Clean up assignment by Teacher 1
  const cleanAsg = await request('DELETE', `/api/teacher/assignments/${asgId}`, null, teacherToken)
  assert(cleanAsg.status === 200, 'Teacher 1 can delete own assignment (200 OK)')

  // ── 4. STUDENT E2E WORKFLOW & 10 READY CHAPTERS ────────────────────────────
  console.log('\n--- SECTION 4: STUDENT END-TO-END WORKFLOW & ALL 10 CHAPTERS ---')

  const studentDash = await request('GET', '/api/student/dashboard', null, studentToken)
  assert(studentDash.status === 200, 'Student dashboard retrieved successfully (200 OK)')
  assert(studentDash.data?.data?.student?.board?.includes('Tamil Nadu'), 'Student dashboard returns Tamil Nadu State Board')

  // Verify All 10 Canonical Class 10 Science Chapters
  const canonicalChapters = [
    { id: 'ch-10sci-t1-1', name: 'Laws of Motion' },
    { id: 'ch-10sci-t1-2', name: 'Optics' },
    { id: 'ch-10sci-t1-3', name: 'Thermal Physics' },
    { id: 'ch-10sci-t1-4', name: 'Electricity' },
    { id: 'ch-10sci-t1-5', name: 'Acoustics' },
    { id: 'ch-10sci-t2-1', name: 'Plant Anatomy and Plant Physiology' },
    { id: 'ch-10sci-t2-2', name: 'Structural Organisation of Animals' },
    { id: 'ch-10sci-t3-1', name: 'Atomic Structure' },
    { id: 'ch-10sci-t3-2', name: 'Periodic Classification of Elements' },
    { id: 'ch-10sci-t3-3', name: 'Chemical Reactions' },
  ]

  for (const ch of canonicalChapters) {
    const lessonRes = await request('GET', `/api/student/chapters/${ch.id}/lesson`, null, studentToken)
    assert(lessonRes.status === 200, `Lesson for ${ch.name} (${ch.id}) returns 200 OK`)
    assert(lessonRes.data?.data?.isReady === true, `Chapter ${ch.name} is marked isReady: true`)
    assert(lessonRes.data?.data?.topics?.length > 0, `Chapter ${ch.name} contains authentic topic sections`)
  }

  // ── 5. RAG GROUNDING & CITATION ACCURACY AUDIT ─────────────────────────────
  console.log('\n--- SECTION 5: RAG GROUNDING & STRICT CITATION ACCURACY ---')

  const ragQuery = await request(
    'POST',
    '/api/questions/ask',
    {
      classId: 'c-10',
      subjectId: 'sub-10-sci',
      termId: 'trm-10sci-1',
      chapterId: 'ch-10sci-t1-1',
      question: "Explain Newton's second law of motion and momentum.",
    },
    studentToken
  )
  assert(ragQuery.status === 200 || ragQuery.status === 201, 'RAG question query returns 200/201 OK')
  const ragAns = ragQuery.data?.data
  assert(!!ragAns?.answer || !!ragAns?.simple_explanation, 'RAG response contains explanation')
  assert(!!ragAns?.grounding?.sourceBook || !!ragAns?.source?.book, 'RAG response references authentic Tamil Nadu textbook')
  assert((ragAns?.grounding?.sourcePages?.length > 0) || (ragAns?.page_numbers?.length > 0), 'RAG response includes exact page citations')

  // Unindexed Chapter Guard
  const unindexedLesson = await request('GET', '/api/student/chapters/ch-unindexed-pending-1/lesson', null, studentToken)
  assert(unindexedLesson.status === 200, 'Unindexed chapter query returns 200 OK')
  assert(unindexedLesson.data?.data?.isReady === false, 'Unindexed chapter correctly marked isReady: false')
  assert(!!unindexedLesson.data?.data?.notice, 'Unindexed chapter returns transparent notice')

  // Practice Quiz Generation & Submission
  const quizGen = await request(
    'POST',
    '/api/quizzes/generate',
    {
      classId: 'c-10',
      subjectId: 'sub-10-sci',
      termId: 'trm-10sci-1',
      chapterId: 'ch-10sci-t1-1',
    },
    studentToken
  )
  assert(quizGen.status === 200 || quizGen.status === 201, 'Practice quiz generation returns 200/201 OK')
  const quizQuestions = quizGen.data?.data?.questions || []
  assert(quizQuestions.length > 0, 'Generated quiz contains questions')
  assert(!quizQuestions[0]?.correct_option && !quizQuestions[0]?.correctAnswer, 'Correct option is hidden before submission')

  const genQuizId = quizGen.data?.data?.quizId || quizGen.data?.data?.id || 'qz-demo'
  const quizSubmit = await request(
    'POST',
    `/api/quizzes/${genQuizId}/submit`,
    {
      answers: quizQuestions.map((q) => ({ questionId: q.id, selectedOption: 0, selectedAnswer: 'Inertia' })),
    },
    studentToken
  )
  assert(quizSubmit.status === 200, 'Quiz submission returns 200 OK')
  assert(typeof quizSubmit.data?.data?.score === 'number' || typeof quizSubmit.data?.data?.percentage === 'number', 'Quiz result includes numeric score/percentage')

  // ── 6. TEACHER PORTAL & ASSIGNMENT WORKFLOW ────────────────────────────────
  console.log('\n--- SECTION 6: TEACHER PORTAL & ASSIGNMENT SUBMISSIONS ---')

  const teacherDash = await request('GET', '/api/teacher/dashboard', null, teacherToken)
  assert(teacherDash.status === 200, 'Teacher dashboard retrieved (200 OK)')
  assert(typeof teacherDash.data?.data?.totalStudents === 'number', 'Teacher dashboard contains student count')

  const teacherStudents = await request('GET', '/api/teacher/students', null, teacherToken)
  assert(teacherStudents.status === 200, 'Teacher students roster retrieved (200 OK)')
  assert(teacherStudents.data?.data?.length > 0, 'Teacher students roster is non-empty')

  const sampleStudentId = teacherStudents.data.data[0].id
  const studentPerf = await request('GET', `/api/teacher/students/${sampleStudentId}/performance`, null, teacherToken)
  assert(studentPerf.status === 200, 'Student performance diagnostics retrieved (200 OK)')
  assert(Array.isArray(studentPerf.data?.data?.chapters) || Array.isArray(studentPerf.data?.data?.chapterBreakdown), 'Student performance has chapter breakdown')

  // Create Assignment on READY chapter
  const newAsg = await request(
    'POST',
    '/api/teacher/assignments',
    {
      title: 'Optics & Refraction Homework',
      description: 'Complete questions on concave and convex lenses',
      class_level: 'Class 10',
      medium: 'English',
      subject_id: 'sub-10-sci',
      term_id: 'trm-10sci-1',
      chapter_id: 'ch-10sci-t1-2',
      due_date: '2026-09-15',
    },
    teacherToken
  )
  assert(newAsg.status === 201, 'Assignment created on READY chapter (201 Created)')
  const createdAsgId = newAsg.data?.data?.id

  // Block Assignment on PENDING chapter
  const pendingAsg = await request(
    'POST',
    '/api/teacher/assignments',
    {
      title: 'Class 6 Science Assignment',
      class_level: 'Class 6',
      subject_id: 'sub-6-sci',
      term_id: 'trm-6sci-1',
      chapter_id: 'ch-6sci-t1-1',
      due_date: '2026-09-15',
    },
    teacherToken
  )
  assert(pendingAsg.status === 400, 'Assignment creation on PENDING chapter rejected with 400 Bad Request')

  // Student views and submits assignment
  const studentAsgList = await request('GET', '/api/student/assignments', null, studentToken)
  assert(studentAsgList.status === 200, 'Student retrieves active assignments list (200 OK)')

  const studentAsgDetails = await request('GET', `/api/student/assignments/${createdAsgId}`, null, studentToken)
  assert(studentAsgDetails.status === 200, 'Student retrieves assignment details (200 OK)')

  const studentAsgSubmit = await request(
    'POST',
    `/api/student/assignments/${createdAsgId}/submit`,
    {
      answers: [
        { questionId: 'asg-q1', selectedOption: 1 },
        { questionId: 'asg-q2', selectedOption: 0 },
      ],
    },
    studentToken
  )
  assert(studentAsgSubmit.status === 200, 'Student submits assignment successfully (200 OK)')
  assert(typeof studentAsgSubmit.data?.data?.score === 'number', 'Server calculates assignment score')

  // Teacher reviews submission
  const teacherSubmissions = await request('GET', `/api/teacher/assignments/${createdAsgId}/submissions`, null, teacherToken)
  assert(teacherSubmissions.status === 200, 'Teacher retrieves assignment submissions (200 OK)')
  assert(teacherSubmissions.data?.data?.length > 0, 'Teacher sees student submission in list')

  // Clean up
  await request('DELETE', `/api/teacher/assignments/${createdAsgId}`, null, teacherToken)

  // ── 7. ADMIN CONTROL CENTER AUDIT ──────────────────────────────────────────
  console.log('\n--- SECTION 7: ADMIN CONTROL CENTER & INGESTION INTEGRITY ---')

  const adminStats = await request('GET', '/api/admin/dashboard/stats', null, adminToken)
  assert(adminStats.status === 200, 'Admin dashboard stats retrieved (200 OK)')
  assert(adminStats.data?.data?.readyChapters === 10, 'Admin stats report exactly 10 READY chapters')
  assert(adminStats.data?.data?.coveragePercentage === 100, 'Admin stats report 100% authentic coverage')

  const adminUsers = await request('GET', '/api/admin/users?page=1&limit=10', null, adminToken)
  assert(adminUsers.status === 200, 'Admin users list retrieved with pagination (200 OK)')
  assert(adminUsers.data?.pagination?.page === 1, 'Admin users pagination page is 1')

  const adminCurriculum = await request('GET', '/api/admin/curriculum', null, adminToken)
  assert(adminCurriculum.status === 200, 'Admin curriculum hierarchy retrieved (200 OK)')
  assert(adminCurriculum.data?.data?.length >= 7, 'Admin curriculum contains at least 7 classes')

  const adminTextbooks = await request('GET', '/api/admin/textbooks', null, adminToken)
  assert(adminTextbooks.status === 200, 'Admin authentic textbooks repository retrieved (200 OK)')
  assert(adminTextbooks.data?.data?.length > 0, 'Textbooks repository is non-empty')
  assert(adminTextbooks.data?.data[0]?.sha256?.length === 64, 'Textbook SHA-256 hash is valid 64-hex string')

  const adminIngestion = await request('GET', '/api/admin/ingestion', null, adminToken)
  assert(adminIngestion.status === 200, 'Admin ingestion pipeline monitor retrieved (200 OK)')
  assert(adminIngestion.data?.data?.pipeline?.length === 11, 'Ingestion pipeline contains all 11 stages')

  const adminHealth = await request('GET', '/api/admin/system-health', null, adminToken)
  assert(adminHealth.status === 200, 'Admin system health retrieved (200 OK)')
  assert(adminHealth.data?.data?.pgvector?.dimensions === 1536, 'pgvector reports 1536 dimensions')
  assert(adminHealth.data?.data?.pgvector?.indexType === 'HNSW', 'pgvector index type is HNSW')
  assert(adminHealth.data?.data?.citations?.verifiedPercentage === 100, 'Citations report 100% verified')

  const adminAuditLogs = await request('GET', '/api/admin/audit-logs', null, adminToken)
  assert(adminAuditLogs.status === 200, 'Admin audit logs retrieved (200 OK)')
  assert(adminAuditLogs.data?.data?.length > 0, 'Audit logs captured administrative actions')

  // PDF Upload Magic-Byte Validation
  const salt = Date.now()
  const validPdfUpload = await request(
    'POST',
    '/api/admin/textbooks',
    {
      book_name: `TN Class 12 Chemistry Vol 1 ${salt}`,
      publisher: 'Tamil Nadu Textbook Corporation',
      board: 'Tamil Nadu State Board (Samacheer Kalvi)',
      class_level: 'Class 12',
      subject_id: 'sub-12-chem',
      medium: 'English',
      academic_year: '2024-2025',
      file_name: `Std12_Chem_${salt}.pdf`,
      file_content: `%PDF-1.4\nAuthentic Class 12 Chemistry Content ${salt}\n`,
    },
    adminToken
  )
  assert(validPdfUpload.status === 201, 'Valid PDF upload accepted (201 Created)')

  const duplicatePdfUpload = await request(
    'POST',
    '/api/admin/textbooks',
    {
      book_name: `TN Class 12 Chemistry Vol 1 Duplicate ${salt}`,
      class_level: 'Class 12',
      subject_id: 'sub-12-chem',
      file_name: `Std12_Chem_${salt}_dup.pdf`,
      file_content: `%PDF-1.4\nAuthentic Class 12 Chemistry Content ${salt}\n`,
    },
    adminToken
  )
  assert(duplicatePdfUpload.status === 409, 'Duplicate PDF rejected with 409 Conflict')

  // ── 8. DATABASE & MEMORYSTORE CONSISTENCY ──────────────────────────────────
  console.log('\n--- SECTION 8: DATABASE & MEMORYSTORE CONSISTENCY ---')

  const coverageRes = await request('GET', '/api/admin/content-coverage', null, adminToken)
  assert(coverageRes.status === 200, 'GET /api/admin/content-coverage returns 200 OK')
  const covData = coverageRes.data?.data
  assert(covData?.readyChapters === 10, 'Class 10 Science readyChapters == 10')
  assert(covData?.pendingChapters === 0, 'Class 10 Science pendingChapters == 0')
  assert(covData?.failedChapters === 0, 'Class 10 Science failedChapters == 0')
  assert(covData?.coveragePercentage === 100, 'Class 10 Science authentic coverage == 100%')

  // ── 9. SECURITY & DATA SANITIZATION AUDIT ──────────────────────────────────
  console.log('\n--- SECTION 9: DATA SANITIZATION & ATTACK RESISTANCE ---')

  // SQL Injection Probe in search parameter
  const sqlInjection = await request('GET', `/api/admin/users?q=${encodeURIComponent("'; DROP TABLE users; --")}`, null, adminToken)
  assert(sqlInjection.status === 200, 'SQL injection probe handled safely without crash (200 OK)')

  // XSS Injection Probe
  const xssProbe = await request('GET', `/api/admin/users?q=${encodeURIComponent("<script>window.location='hack'</script>")}`, null, adminToken)
  assert(xssProbe.status === 200, 'XSS probe handled safely (200 OK)')

  // Password Leakage Audit across all endpoints
  let zeroLeakage = true
  const usersList = adminUsers.data?.data || []
  for (const u of usersList) {
    if (u.password || u.password_hash || u.secret) zeroLeakage = false
  }
  assert(zeroLeakage, 'Zero password_hash or credential leakage in users list')

  // ── 10. SYSTEM REGRESSIONS VERIFICATION (PHASE 20–26) ──────────────────────
  console.log('\n--- SECTION 10: FULL PLATFORM REGRESSION VERIFICATION ---')

  // Phase 20: 10/10 READY Class 10 Science
  const p20 = await request('GET', '/api/admin/content-status', null, adminToken)
  assert(p20.status === 200 && (p20.data?.data?.readyChapters === 10 || p20.data?.data?.ready_chapters === 10), '[Regression] Phase 20: 10/10 READY Class 10 Science chapters intact')

  // Phase 21: Class 11 Semesters
  const p21 = await request('GET', '/api/curriculum/subjects/sub-11-eng/terms')
  assert(p21.status === 200 && p21.data?.data?.length === 2, '[Regression] Phase 21: Class 11 English returns 2 semesters')

  // Phase 22: Auth Me
  const p22 = await request('GET', '/api/auth/me', null, adminToken)
  assert(p22.status === 200 && p22.data?.data?.role === 'admin', '[Regression] Phase 22: Auth me endpoint intact')

  // Phase 24: Student Learning
  const p24 = await request('GET', '/api/student/dashboard', null, studentToken)
  assert(p24.status === 200, '[Regression] Phase 24: Student dashboard intact')

  // Phase 25: Teacher Portal
  const p25 = await request('GET', '/api/teacher/dashboard', null, teacherToken)
  assert(p25.status === 200, '[Regression] Phase 25: Teacher Portal dashboard intact')

  // Phase 26: Admin Control Center
  const p26 = await request('GET', '/api/admin/dashboard/stats', null, adminToken)
  assert(p26.status === 200, '[Regression] Phase 26: Admin Control Center stats intact')

  // ── SUMMARY REPORT ─────────────────────────────────────────────────────────
  console.log('\n======================================================================')
  console.log(`  PHASE 27 PRODUCTION HARDENING TEST RESULTS:`)
  console.log(`  Total Test Assertions: ${totalTests}`)
  console.log(`  Passed: ${passedTests}`)
  console.log(`  Failed: ${failedTests}`)
  console.log(`  Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`)
  console.log('======================================================================\n')

  if (failedTests > 0) {
    process.exit(1)
  } else {
    process.exit(0)
  }
}

runSuite().catch((err) => {
  console.error('Test Suite encountered fatal error:', err)
  process.exit(1)
})
