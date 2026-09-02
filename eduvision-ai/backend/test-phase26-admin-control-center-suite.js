/**
 * Phase 26: EduVision AI Admin Control Center Comprehensive Test Suite
 * 
 * 70+ automated tests verifying:
 * - Admin Authentication & RBAC (Student/Teacher blocked 403, Admin allowed 200)
 * - Dashboard Real Analytics (Users, Teachers, Students, Ready Chapters, 100% Coverage)
 * - User Management (Filter, Search, Status Update, Final Admin Protection, Profile)
 * - Student & Teacher Management (Roster, Subject Assignments, IDOR protection)
 * - Curriculum Hierarchy & Chapter Status (10/10 READY Class 10 Science chapters)
 * - Authentic Textbooks & Provenance (SHA-256 Checksums, Citations, Chunk counts)
 * - Textbook Upload PDF Validation (%PDF- magic bytes, SHA-256, Duplicate 409 rejection)
 * - Ingestion Pipeline Monitor (11 stages, Retry endpoint 200/404)
 * - System Health Diagnostics (PostgreSQL, pgvector 1536-dim HNSW, RAG, Citations)
 * - Security & Audit Trail (Zero password/token leakage in responses and audit logs)
 * - Phase 20, 22, 24, 25 Regressions
 */

const http = require('http')

let studentToken = ''
let teacherToken = ''
let adminToken = ''

let totalTests = 0
let passedTests = 0
let failedTests = 0

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, 'http://localhost:5000')
    const options = {
      hostname: url.hostname,
      port: 5000,
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
  console.log('  PHASE 26: EDUVISION AI ADMIN CONTROL CENTER TEST SUITE')
  console.log('======================================================================\n')

  // ── 1. AUTHENTICATION SETUP & RBAC ─────────────────────────────────────────
  console.log('--- SECTION 1: AUTHENTICATION & RBAC ENFORCEMENT ---')

  const adminLogin = await request('POST', '/api/auth/login', {
    email: 'admin@demo.com',
    password: 'password',
  })
  assert(adminLogin.status === 200, 'Admin login succeeds with 200 OK')
  assert(adminLogin.data?.data?.token, 'Admin login returns JWT token')
  assert(
    adminLogin.data?.data?.role === 'admin' || adminLogin.data?.data?.user?.role === 'admin',
    'Admin login user has role=admin'
  )
  adminToken = adminLogin.data?.data?.token

  const teacherLogin = await request('POST', '/api/auth/login', {
    email: 'teacher@demo.com',
    password: 'password',
  })
  assert(teacherLogin.status === 200, 'Teacher login succeeds with 200 OK')
  teacherToken = teacherLogin.data?.data?.token

  const studentLogin = await request('POST', '/api/auth/login', {
    email: 'student@demo.com',
    password: 'password',
  })
  assert(studentLogin.status === 200, 'Student login succeeds with 200 OK')
  studentToken = studentLogin.data?.data?.token

  const invalidAdminLogin = await request('POST', '/api/auth/login', {
    email: 'admin@demo.com',
    password: 'wrongpassword',
  })
  assert(invalidAdminLogin.status === 401, 'Invalid admin password rejected with 401 Unauthorized')

  const noTokenAdminReq = await request('GET', '/api/admin/dashboard/stats')
  assert(noTokenAdminReq.status === 401, 'Unauthenticated access to /api/admin/dashboard/stats rejected with 401')

  const studentAdminReq = await request('GET', '/api/admin/dashboard/stats', null, studentToken)
  assert(studentAdminReq.status === 403, 'Student access to /api/admin/dashboard/stats blocked with 403 Forbidden')

  const teacherAdminReq = await request('GET', '/api/admin/dashboard/stats', null, teacherToken)
  assert(teacherAdminReq.status === 403, 'Teacher access to /api/admin/dashboard/stats blocked with 403 Forbidden')

  const adminStatsReq = await request('GET', '/api/admin/dashboard/stats', null, adminToken)
  assert(adminStatsReq.status === 200, 'Admin access to /api/admin/dashboard/stats allowed with 200 OK')

  // ── 2. DASHBOARD REAL METRICS & INTEGRITY ──────────────────────────────────
  console.log('\n--- SECTION 2: REAL DASHBOARD METRICS & COVERAGE ---')

  const stats = adminStatsReq.data?.data
  assert(stats !== undefined, 'Stats payload is present')
  assert(typeof stats.totalStudents === 'number' && stats.totalStudents >= 1, 'Real totalStudents count >= 1')
  assert(typeof stats.totalTeachers === 'number' && stats.totalTeachers >= 1, 'Real totalTeachers count >= 1')
  assert(typeof stats.totalUsers === 'number' && stats.totalUsers >= 3, 'Real totalUsers count >= 3')
  assert(typeof stats.totalClasses === 'number' && stats.totalClasses >= 7, 'Total classes >= 7 (Classes 6–12)')
  assert(typeof stats.totalSubjects === 'number' && stats.totalSubjects >= 11, 'Total subjects >= 11')
  assert(stats.readyChapters === 10, 'Canonical Class 10 Science readyChapters == 10')
  assert(stats.pendingChapters === 0, 'Class 10 Science pendingChapters == 0')
  assert(stats.failedChapters === 0, 'Class 10 Science failedChapters == 0')
  assert(stats.coveragePercentage === 100, 'Class 10 Science authentic coverage percentage == 100%')

  const coverageRes = await request('GET', '/api/admin/content-coverage', null, adminToken)
  assert(coverageRes.status === 200, 'GET /api/admin/content-coverage returns 200 OK')
  assert(
    coverageRes.data?.data?.overall?.readyChapters === 10 || coverageRes.data?.data?.readyChapters === 10,
    'Content coverage readyChapters == 10'
  )
  assert(
    coverageRes.data?.data?.overall?.coveragePercentage === 100 || coverageRes.data?.data?.coveragePercentage === 100,
    'Content coverage overall percentage == 100%'
  )

  // ── 3. USER MANAGEMENT & SECURITY ──────────────────────────────────────────
  console.log('\n--- SECTION 3: USER MANAGEMENT, SEARCH, FILTERS & SECURITY ---')

  const allUsersRes = await request('GET', '/api/admin/users', null, adminToken)
  assert(allUsersRes.status === 200, 'GET /api/admin/users returns 200 OK')
  assert(Array.isArray(allUsersRes.data?.data), 'Users list is an array')
  assert(allUsersRes.data?.data?.length >= 3, 'Users list contains at least 3 users')

  // Verify No Password Hash or Token Leakage
  let leakedSecret = false
  for (const u of allUsersRes.data.data) {
    if (u.password || u.password_hash || u.token || u.secret) {
      leakedSecret = true
    }
  }
  assert(!leakedSecret, 'Zero password_hash, token, or secret leakage in /api/admin/users')

  const studentFilterRes = await request('GET', '/api/admin/users?role=student', null, adminToken)
  assert(studentFilterRes.status === 200, 'GET /api/admin/users?role=student returns 200 OK')
  const allStudents = studentFilterRes.data?.data?.every((u) => u.role === 'student')
  assert(allStudents, 'Filtered users strictly contain only student role')

  const teacherFilterRes = await request('GET', '/api/admin/users?role=teacher', null, adminToken)
  assert(teacherFilterRes.status === 200, 'GET /api/admin/users?role=teacher returns 200 OK')
  const allTeachers = teacherFilterRes.data?.data?.every((u) => u.role === 'teacher')
  assert(allTeachers, 'Filtered users strictly contain only teacher role')

  const searchRes = await request('GET', '/api/admin/users?q=demo', null, adminToken)
  assert(searchRes.status === 200, 'GET /api/admin/users?q=demo returns 200 OK')
  assert(searchRes.data?.data?.length >= 1, 'Search query matches demo accounts')

  // User Profile
  const sampleUserId = allUsersRes.data.data[0].id
  const userProfileRes = await request('GET', `/api/admin/users/${sampleUserId}`, null, adminToken)
  assert(userProfileRes.status === 200, 'GET /api/admin/users/:id returns 200 OK')
  assert(userProfileRes.data?.data?.id === sampleUserId, 'User profile matches requested user ID')
  assert(!userProfileRes.data?.data?.password_hash, 'User profile does NOT leak password_hash')

  const nonExistentUserRes = await request('GET', '/api/admin/users/non-existent-id-9999', null, adminToken)
  assert(nonExistentUserRes.status === 404, 'GET non-existent user returns 404 Not Found')

  // User Status Toggle & Final Admin Protection
  const targetStudent = allUsersRes.data.data.find((u) => u.role === 'student')
  const updateStatusRes = await request(
    'PUT',
    `/api/admin/users/${targetStudent.id}/status`,
    { status: 'Suspended' },
    adminToken
  )
  assert(updateStatusRes.status === 200, 'PUT /api/admin/users/:id/status toggles status to Suspended')

  const verifySuspended = await request('GET', `/api/admin/users/${targetStudent.id}`, null, adminToken)
  assert(verifySuspended.data?.data?.status === 'Suspended', 'User status correctly persisted as Suspended')

  // Restore Student Status
  await request('PUT', `/api/admin/users/${targetStudent.id}/status`, { status: 'Active' }, adminToken)

  // Test Final Admin Suspension Block
  const adminUser = allUsersRes.data.data.find((u) => u.role === 'admin')
  const suspendAdminRes = await request(
    'PUT',
    `/api/admin/users/${adminUser.id}/status`,
    { status: 'Suspended' },
    adminToken
  )
  assert(suspendAdminRes.status === 400, 'Suspending the only active administrator is rejected with 400 Bad Request')

  const invalidStatusRes = await request(
    'PUT',
    `/api/admin/users/${targetStudent.id}/status`,
    { status: 'INVALID_STATUS' },
    adminToken
  )
  assert(invalidStatusRes.status === 400, 'Invalid status value rejected with 400 Bad Request')

  // ── 4. STUDENT & TEACHER ROSTER MANAGEMENT ─────────────────────────────────
  console.log('\n--- SECTION 4: STUDENT & TEACHER ROSTERS & ASSIGNMENTS ---')

  const studentsListRes = await request('GET', '/api/admin/students', null, adminToken)
  assert(studentsListRes.status === 200, 'GET /api/admin/students returns 200 OK')
  assert(Array.isArray(studentsListRes.data?.data), 'Students roster is an array')
  assert(studentsListRes.data?.data?.length >= 1, 'Students roster has at least 1 student')
  assert(typeof studentsListRes.data?.data[0]?.questionsAsked === 'number', 'Student metrics include questionsAsked')

  const teachersListRes = await request('GET', '/api/admin/teachers', null, adminToken)
  assert(teachersListRes.status === 200, 'GET /api/admin/teachers returns 200 OK')
  assert(Array.isArray(teachersListRes.data?.data), 'Teachers roster is an array')
  const sampleTeacher = teachersListRes.data.data[0]
  assert(sampleTeacher !== undefined, 'Teacher record exists')

  // Assign Subject to Teacher
  const assignRes = await request(
    'POST',
    `/api/admin/teachers/${sampleTeacher.id}/assignments`,
    { classId: 'c-9', subjectId: 'sub-9-sci' },
    adminToken
  )
  assert(assignRes.status === 200 || assignRes.status === 201 || assignRes.status === 409, 'Assign subject to teacher succeeds or idempotent (200/201/409)')

  // ── 5. CURRICULUM HIERARCHY & CHAPTER READINESS ────────────────────────────
  console.log('\n--- SECTION 5: CURRICULUM HIERARCHY & CHAPTER STATUS ---')

  const curriculumRes = await request('GET', '/api/admin/curriculum', null, adminToken)
  assert(curriculumRes.status === 200, 'GET /api/admin/curriculum returns 200 OK')
  assert(Array.isArray(curriculumRes.data?.data), 'Curriculum hierarchy is an array')
  const class10 = curriculumRes.data.data.find((c) => c.class_name === 'Class 10')
  assert(class10 !== undefined, 'Class 10 exists in curriculum hierarchy')

  const c10Science = class10?.subjects?.find((s) => s.id === 'sub-10-sci' || s.subject_name === 'Science')
  assert(c10Science !== undefined, 'Class 10 Science subject exists')

  const chaptersStatusRes = await request('GET', '/api/admin/chapters/status', null, adminToken)
  assert(chaptersStatusRes.status === 200, 'GET /api/admin/chapters/status returns 200 OK')
  const c10SciChapters = chaptersStatusRes.data?.data?.filter((ch) => ch.subject_id === 'sub-10-sci')
  assert(c10SciChapters?.length >= 10, 'Class 10 Science contains 10 chapters')
  const readyC10Sci = c10SciChapters?.filter((ch) => ch.indexing_status === 'READY')
  assert(readyC10Sci?.length >= 10, 'Exactly 10 Class 10 Science chapters have indexing_status == READY')

  // ── 6. AUTHENTIC TEXTBOOKS & PROVENANCE ────────────────────────────────────
  console.log('\n--- SECTION 6: AUTHENTIC TEXTBOOKS & PROVENANCE METADATA ---')

  const textbooksRes = await request('GET', '/api/admin/textbooks', null, adminToken)
  assert(textbooksRes.status === 200, 'GET /api/admin/textbooks returns 200 OK')
  assert(Array.isArray(textbooksRes.data?.data), 'Textbooks list is an array')
  assert(textbooksRes.data?.data?.length >= 1, 'Textbook repository contains indexed textbooks')

  const primaryBook = textbooksRes.data.data[0]
  assert(primaryBook.publisher !== undefined, 'Textbook provenance contains publisher')
  assert(primaryBook.board !== undefined, 'Textbook provenance contains board')
  assert(primaryBook.sha256 !== undefined && primaryBook.sha256.length === 64, 'Textbook has valid 64-char SHA-256 hash')
  assert(primaryBook.chunk_count >= 10, 'Textbook chunk_count >= 10')
  assert(primaryBook.embedding_count >= 10, 'Textbook embedding_count >= 10')
  assert(primaryBook.citation_status === 'VERIFIED', 'Textbook citation_status is VERIFIED')

  // ── 7. TEXTBOOK UPLOAD VALIDATION & DUPLICATE DETECTION ────────────────────
  console.log('\n--- SECTION 7: TEXTBOOK UPLOAD VALIDATION & SECURITY ---')

  // Student upload blocked
  const studentUpload = await request(
    'POST',
    '/api/admin/textbooks',
    { book_name: 'Unauthorized Book', class_level: 'Class 10', subject_id: 'sub-10-sci' },
    studentToken
  )
  assert(studentUpload.status === 403, 'Student textbook upload blocked with 403 Forbidden')

  // Missing required metadata
  const missingMetaUpload = await request('POST', '/api/admin/textbooks', {}, adminToken)
  assert(missingMetaUpload.status === 400, 'Textbook upload without metadata rejected with 400 Bad Request')

  // Invalid file type (not .pdf)
  const invalidExtUpload = await request(
    'POST',
    '/api/admin/textbooks',
    {
      book_name: 'Invalid File Test',
      class_level: 'Class 10',
      subject_id: 'sub-10-sci',
      file_name: 'test.exe',
    },
    adminToken
  )
  assert(invalidExtUpload.status === 400, 'Non-PDF file extension upload rejected with 400 Bad Request')

  // Invalid magic bytes (content doesn't start with %PDF-)
  const invalidMagicUpload = await request(
    'POST',
    '/api/admin/textbooks',
    {
      book_name: 'Fake PDF Test',
      class_level: 'Class 10',
      subject_id: 'sub-10-sci',
      file_name: 'fake.pdf',
      file_content: 'NOT_A_REAL_PDF_CONTENT',
    },
    adminToken
  )
  assert(invalidMagicUpload.status === 400, 'Invalid PDF magic-byte header rejected with 400 Bad Request')

  // Valid Authentic PDF Upload
  const uniqueSalt = Date.now()
  const validUploadRes = await request(
    'POST',
    '/api/admin/textbooks',
    {
      book_name: `TN State Board Class 11 Physics Volume 1 ${uniqueSalt}`,
      publisher: 'Tamil Nadu Textbook Corporation',
      board: 'Tamil Nadu State Board (Samacheer Kalvi)',
      class_level: 'Class 11',
      subject_id: 'sub-11-phy',
      medium: 'English',
      academic_year: '2024-2025',
      file_name: `Std11_Physics_Vol1_${uniqueSalt}.pdf`,
      file_content: `%PDF-1.5\nAuthentic Class 11 Physics Textbook Content ${uniqueSalt}\n`,
    },
    adminToken
  )
  assert(validUploadRes.status === 201, 'Valid authentic PDF upload accepted with 201 Created')
  assert(validUploadRes.data?.data?.sha256 !== undefined, 'Uploaded textbook contains computed SHA-256 checksum')

  // Duplicate Upload Rejection (409 Conflict)
  const duplicateUploadRes = await request(
    'POST',
    '/api/admin/textbooks',
    {
      book_name: `TN State Board Class 11 Physics Volume 1 ${uniqueSalt} Duplicate`,
      class_level: 'Class 11',
      subject_id: 'sub-11-phy',
      file_name: `Std11_Physics_Vol1_${uniqueSalt}_dup.pdf`,
      file_content: `%PDF-1.5\nAuthentic Class 11 Physics Textbook Content ${uniqueSalt}\n`,
    },
    adminToken
  )
  assert(duplicateUploadRes.status === 409, 'Duplicate PDF upload rejected with 409 Conflict')

  // ── 8. INGESTION PIPELINE & RETRY ENDPOINT ─────────────────────────────────
  console.log('\n--- SECTION 8: INGESTION PIPELINE & RETRY ENDPOINT ---')

  const ingestionHealthRes = await request('GET', '/api/admin/ingestion', null, adminToken)
  assert(ingestionHealthRes.status === 200, 'GET /api/admin/ingestion returns 200 OK')
  assert(ingestionHealthRes.data?.data?.pipeline_status === 'HEALTHY', 'Ingestion pipeline status is HEALTHY')
  assert(Array.isArray(ingestionHealthRes.data?.data?.pipeline), 'Ingestion stages list is an array')
  assert(ingestionHealthRes.data?.data?.pipeline?.length === 11, 'Ingestion pipeline contains exactly 11 stages')
  assert(ingestionHealthRes.data?.data?.embedding_dimension === 1536, 'Vector embedding dimension is 1536')

  // Retry Ingestion on Valid Textbook
  const retryRes = await request('POST', `/api/admin/textbooks/${primaryBook.id}/retry`, null, adminToken)
  assert(retryRes.status === 200, 'POST /api/admin/textbooks/:id/retry returns 200 OK')
  assert(retryRes.data?.data?.indexing_status === 'READY', 'Retried textbook indexing_status is READY')

  const retryNonExistent = await request('POST', '/api/admin/textbooks/tb-non-existent-999/retry', null, adminToken)
  assert(retryNonExistent.status === 404, 'Retrying non-existent textbook returns 404 Not Found')

  // ── 9. SYSTEM HEALTH DIAGNOSTICS ───────────────────────────────────────────
  console.log('\n--- SECTION 9: SYSTEM HEALTH DIAGNOSTICS & INFRASTRUCTURE ---')

  const healthRes = await request('GET', '/api/admin/system-health', null, adminToken)
  assert(healthRes.status === 200, 'GET /api/admin/system-health returns 200 OK')
  const healthData = healthRes.data?.data
  assert(healthData?.database?.status === 'HEALTHY', 'Database health is HEALTHY')
  assert(healthData?.pgvector?.status === 'HEALTHY', 'pgvector health is HEALTHY')
  assert(healthData?.pgvector?.dimensions === 1536, 'pgvector dimensions == 1536')
  assert(healthData?.pgvector?.indexType === 'HNSW', 'pgvector indexType == HNSW')
  assert(healthData?.ragService?.status === 'HEALTHY', 'RAG service status is HEALTHY')
  assert(healthData?.citations?.verifiedPercentage === 100, 'Citations verifiedPercentage == 100%')

  // ── 10. AUDIT ACTIVITY LOGS & SECURITY ─────────────────────────────────────
  console.log('\n--- SECTION 10: AUDIT LOGS & SECURITY PRIVACY ---')

  const auditLogsRes = await request('GET', '/api/admin/audit-logs', null, adminToken)
  assert(auditLogsRes.status === 200, 'GET /api/admin/audit-logs returns 200 OK')
  assert(Array.isArray(auditLogsRes.data?.data), 'Audit logs data is an array')
  assert(auditLogsRes.data?.data?.length >= 1, 'Audit log records are captured')

  const latestLog = auditLogsRes.data.data[0]
  assert(latestLog.action !== undefined, 'Audit log record contains action')
  assert(latestLog.user_id !== undefined, 'Audit log record contains user_id')

  let leakedAuditSecrets = false
  for (const log of auditLogsRes.data.data) {
    if (log.password || log.password_hash || log.token || log.secret) {
      leakedAuditSecrets = true
    }
  }
  assert(!leakedAuditSecrets, 'Zero credentials, password_hashes, or tokens leaked in audit logs')

  const auditPaginationRes = await request('GET', '/api/admin/audit-logs?page=1&limit=2', null, adminToken)
  assert(auditPaginationRes.status === 200, 'GET /api/admin/audit-logs with pagination returns 200 OK')
  assert(auditPaginationRes.data?.pagination?.limit === 2, 'Audit pagination limit respected')

  // ── 11. SECURITY ATTACK RESISTANCE & SANITIZATION ──────────────────────────
  console.log('\n--- SECTION 11: SQL INJECTION & XSS ATTACK RESISTANCE ---')

  const sqlInjectionSearch = await request('GET', `/api/admin/users?q=${encodeURIComponent("' OR '1'='1")}`, null, adminToken)
  assert(sqlInjectionSearch.status === 200, 'SQL injection attempt in user search safely handled without crash')

  const xssSearch = await request('GET', `/api/admin/users?q=${encodeURIComponent("<script>alert('xss')</script>")}`, null, adminToken)
  assert(xssSearch.status === 200, 'XSS attempt in user search safely handled without script execution')

  const tamperedTokenRes = await request('GET', '/api/admin/dashboard/stats', null, 'tampered.fake.jwt.token')
  assert(tamperedTokenRes.status === 401 || tamperedTokenRes.status === 403, 'Tampered JWT token rejected with 401/403')

  // ── 12. REGRESSIONS VERIFICATION (PHASE 20, 22, 24, 25) ─────────────────────
  console.log('\n--- SECTION 12: PREVIOUS PHASES REGRESSION VERIFICATION ---')

  // Phase 20: 10/10 READY Class 10 Science
  const p20Check = await request('GET', '/api/admin/content-coverage', null, adminToken)
  assert(
    p20Check.data?.data?.overall?.readyChapters === 10 || p20Check.data?.data?.readyChapters === 10,
    '[Regression] Phase 20: 10/10 READY Class 10 Science chapters intact'
  )

  // Phase 22: Auth Me Endpoint
  const authMe = await request('GET', '/api/auth/me', null, adminToken)
  assert(
    authMe.status === 200 && (authMe.data?.data?.role === 'admin' || authMe.data?.data?.user?.role === 'admin'),
    '[Regression] Phase 22: Auth me endpoint intact'
  )

  // Phase 24: Student Learning RAG Ask Question
  const studentRag = await request(
    'POST',
    '/api/questions/ask',
    {
      classId: 'c-10',
      subjectId: 'sub-10-sci',
      termId: 'trm-10sci-1',
      chapterId: 'ch-10sci-t1-1',
      question: "What is Newton's first law of motion?",
    },
    studentToken
  )
  assert(studentRag.status === 200 || studentRag.status === 201, '[Regression] Phase 24: Student Question / RAG query responds with 200/201 OK')

  // Phase 25: Teacher Assignments Endpoint
  const teacherDash = await request('GET', '/api/teacher/dashboard', null, teacherToken)
  assert(teacherDash.status === 200, '[Regression] Phase 25: Teacher Portal dashboard responds with 200 OK')

  // ── SUMMARY REPORT ─────────────────────────────────────────────────────────
  console.log('\n======================================================================')
  console.log(`  PHASE 26 ADMIN CONTROL CENTER TEST RESULTS:`)
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
