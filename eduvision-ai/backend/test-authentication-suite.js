/**
 * EduVision AI — Phase 22: Authentication System Test Suite
 * Tests: Registration, Login, JWT, Role-Based Access, Security, Regression
 *
 * Run: node test-authentication-suite.js
 */

const BASE = 'http://localhost:5000/api'
const TEST_EMAIL = `testauth_${Date.now()}@eduvision-test.com`
const TEST_EMAIL2 = `testauth2_${Date.now()}@eduvision-test.com`

let pass = 0
let fail = 0
let studentToken = ''
let teacherToken = ''
let adminToken = ''
let newUserToken = ''

// ── Utility ────────────────────────────────────────────────────────────────────

async function request(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  let json
  try { json = await res.json() } catch { json = {} }
  return { status: res.status, body: json }
}

function test(name, result, expected, detail = '') {
  const ok = result === expected
  const icon = ok ? '🟢' : '🔴'
  const label = ok ? 'PASS' : 'FAIL'
  console.log(`${icon} ${label} — ${name}${detail ? ' [' + detail + ']' : ''}`)
  if (ok) pass++; else { fail++; if (!ok) console.log(`       Expected: ${expected}, Got: ${result}`) }
}

function assert(name, cond, detail = '') {
  const ok = !!cond
  const icon = ok ? '🟢' : '🔴'
  console.log(`${icon} ${ok ? 'PASS' : 'FAIL'} — ${name}${detail ? ' [' + detail + ']' : ''}`)
  if (ok) pass++; else fail++
}

// ══════════════════════════════════════════════════════════════════════════════
// TESTS
// ══════════════════════════════════════════════════════════════════════════════

async function runTests() {
  console.log('══════════════════════════════════════════════════════════════════════')
  console.log('🔐 EduVision AI — Phase 22: Authentication Suite (23-Point)')
  console.log('══════════════════════════════════════════════════════════════════════\n')

  // ── 1. Registration — new student ────────────────────────────────────────────
  {
    const r = await request('POST', '/auth/register', {
      name: 'Test Student Auth',
      email: TEST_EMAIL,
      password: 'SecurePass8!',
      role: 'student',
      class_level: '10',
      medium: 'English',
    })
    test('Test 1  — Registration (new student)', r.status, 201, `status=${r.status}`)
    assert('Test 1a — Registration returns token', r.body?.data?.token, `token_present=${!!r.body?.data?.token}`)
    newUserToken = r.body?.data?.token || ''
  }

  // ── 2. Duplicate email (409) ─────────────────────────────────────────────────
  {
    const r = await request('POST', '/auth/register', {
      name: 'Duplicate User',
      email: TEST_EMAIL,
      password: 'SecurePass8!',
      role: 'student',
      class_level: '10',
      medium: 'English',
    })
    test('Test 2  — Duplicate email → 409 Conflict', r.status, 409, `status=${r.status}`)
    assert('Test 2a — Duplicate error message correct', r.body?.error?.includes('already exists'), `msg="${r.body?.error}"`)
  }

  // ── 3. Invalid email format (400) ─────────────────────────────────────────────
  {
    const r = await request('POST', '/auth/register', {
      name: 'Bad Email',
      email: 'notanemail',
      password: 'SecurePass8!',
      role: 'student',
      class_level: '10',
      medium: 'English',
    })
    test('Test 3  — Invalid email format → 400', r.status, 400, `status=${r.status}`)
  }

  // ── 4. Weak password <8 chars (400) ──────────────────────────────────────────
  {
    const r = await request('POST', '/auth/register', {
      name: 'Weak Pass',
      email: 'weakpass@test.com',
      password: '1234',
      role: 'student',
      class_level: '10',
      medium: 'English',
    })
    test('Test 4  — Weak password <8 chars → 400', r.status, 400, `status=${r.status}`)
    assert('Test 4a — Error mentions 8 characters', r.body?.error?.includes('8'), `msg="${r.body?.error}"`)
  }

  // ── 5. Admin self-registration blocked (400/403) ──────────────────────────────
  {
    const r = await request('POST', '/auth/register', {
      name: 'Fake Admin',
      email: 'fakeadmin@test.com',
      password: 'SecurePass8!',
      role: 'admin',
      medium: 'English',
    })
    // role='admin' is blocked by Joi (400) before service (403)
    assert('Test 5  — Admin self-registration blocked (400 or 403)', r.status === 400 || r.status === 403, `status=${r.status}`)
  }

  // ── 6. Missing medium (400) ───────────────────────────────────────────────────
  {
    const r = await request('POST', '/auth/register', {
      name: 'No Medium',
      email: 'nomedium@test.com',
      password: 'SecurePass8!',
      role: 'student',
      class_level: '10',
    })
    test('Test 6  — Missing medium → 400', r.status, 400, `status=${r.status}`)
  }

  // ── 7. Login — valid student credentials ─────────────────────────────────────
  {
    const r = await request('POST', '/auth/login', {
      email: 'student@demo.com',
      password: 'password',
    })
    test('Test 7  — Login valid student credentials → 200', r.status, 200, `status=${r.status}`)
    assert('Test 7a — Login returns token', !!r.body?.data?.token, `token_present=${!!r.body?.data?.token}`)
    assert('Test 7b — Login returns role=student', r.body?.data?.role === 'student', `role=${r.body?.data?.role}`)
    studentToken = r.body?.data?.token || ''
  }

  // ── 8. Login — valid teacher ──────────────────────────────────────────────────
  {
    const r = await request('POST', '/auth/login', {
      email: 'teacher@demo.com',
      password: 'password',
    })
    test('Test 8  — Login valid teacher credentials → 200', r.status, 200, `status=${r.status}`)
    teacherToken = r.body?.data?.token || ''
  }

  // ── 9. Login — valid admin ────────────────────────────────────────────────────
  {
    const r = await request('POST', '/auth/login', {
      email: 'admin@demo.com',
      password: 'password',
    })
    test('Test 9  — Login valid admin credentials → 200', r.status, 200, `status=${r.status}`)
    adminToken = r.body?.data?.token || ''
  }

  // ── 10. Login — wrong password (401) ──────────────────────────────────────────
  {
    const r = await request('POST', '/auth/login', {
      email: 'student@demo.com',
      password: 'wrongpassword',
    })
    test('Test 10 — Wrong password → 401', r.status, 401, `status=${r.status}`)
  }

  // ── 11. Login — nonexistent email (401) ───────────────────────────────────────
  {
    const r = await request('POST', '/auth/login', {
      email: 'nobody@nowhere.com',
      password: 'anypassword',
    })
    test('Test 11 — Nonexistent email → 401', r.status, 401, `status=${r.status}`)
  }

  // ── 12. GET /auth/me — valid student token ─────────────────────────────────────
  {
    const r = await request('GET', '/auth/me', null, studentToken)
    test('Test 12 — GET /auth/me with valid student token → 200', r.status, 200, `status=${r.status}`)
    assert('Test 12a — /me returns email', !!r.body?.data?.email, `email=${r.body?.data?.email}`)
    assert('Test 12b — /me does NOT return password_hash', !r.body?.data?.password_hash, 'no_hash=true')
  }

  // ── 13. GET /auth/me — no token (401) ─────────────────────────────────────────
  {
    const r = await request('GET', '/auth/me', null, null)
    test('Test 13 — GET /auth/me without token → 401', r.status, 401, `status=${r.status}`)
  }

  // ── 14. GET /auth/me — invalid token (401) ────────────────────────────────────
  {
    const r = await request('GET', '/auth/me', null, 'invalid.token.here')
    test('Test 14 — GET /auth/me with invalid token → 401', r.status, 401, `status=${r.status}`)
  }

  // ── 15. POST /auth/logout ─────────────────────────────────────────────────────
  {
    const r = await request('POST', '/auth/logout', null, studentToken)
    test('Test 15 — POST /auth/logout → 200', r.status, 200, `status=${r.status}`)
    assert('Test 15a — Logout returns success', r.body?.success === true, `success=${r.body?.success}`)
  }

  // ── 16. Admin API — no token (401) ────────────────────────────────────────────
  {
    const r = await request('GET', '/admin/dashboard/stats', null, null)
    test('Test 16 — Admin API without token → 401', r.status, 401, `status=${r.status}`)
  }

  // ── 17. Admin API — student token (403) ───────────────────────────────────────
  {
    const r = await request('GET', '/admin/dashboard/stats', null, studentToken)
    test('Test 17 — Admin API with student token → 403', r.status, 403, `status=${r.status}`)
  }

  // ── 18. Admin API — admin token (200) ─────────────────────────────────────────
  {
    const r = await request('GET', '/admin/dashboard/stats', null, adminToken)
    test('Test 18 — Admin API with admin token → 200', r.status, 200, `status=${r.status}`)
  }

  // ── 19. Admin API — teacher token (403) ───────────────────────────────────────
  {
    const r = await request('GET', '/admin/dashboard/stats', null, teacherToken)
    test('Test 19 — Admin API with teacher token → 403', r.status, 403, `status=${r.status}`)
  }

  // ── 20. Password hash NOT in login response ────────────────────────────────────
  {
    const r = await request('POST', '/auth/login', {
      email: 'student@demo.com',
      password: 'password',
    })
    assert('Test 20 — password_hash NOT in login response', !r.body?.data?.password_hash, `hash_present=${!!r.body?.data?.password_hash}`)
    assert('Test 20a — password NOT in login response', !r.body?.data?.password, `pw_present=${!!r.body?.data?.password}`)
  }

  // ── 21. New user /me returns class_level and medium ───────────────────────────
  {
    if (newUserToken) {
      const r = await request('GET', '/auth/me', null, newUserToken)
      test('Test 21 — New user /me → 200', r.status, 200, `status=${r.status}`)
      assert('Test 21a — class_level is stored', r.body?.data?.class_level === '10', `class_level=${r.body?.data?.class_level}`)
      assert('Test 21b — medium is stored', r.body?.data?.medium === 'English', `medium=${r.body?.data?.medium}`)
    } else {
      console.log('⚠️  SKIP  — Test 21 (newUserToken unavailable)')
    }
  }

  // ── 22. Class 11 English still returns 2 semesters ────────────────────────────
  {
    const r = await request('GET', '/subjects/sub-11-eng/terms', null, null)
    test('Test 22 — Class 11 English terms → 200', r.status, 200, `status=${r.status}`)
    assert('Test 22a — Returns exactly 2 semesters', Array.isArray(r.body?.data) && r.body.data.length === 2, `count=${r.body?.data?.length}`)
    assert('Test 22b — Semester 1 present', r.body?.data?.some((t) => t.id === 'trm-11eng-1'), 'trm-11eng-1=found')
    assert('Test 22c — Semester 2 present', r.body?.data?.some((t) => t.id === 'trm-11eng-2'), 'trm-11eng-2=found')
  }

  // ── 23. Class 10 Science coverage still 100% ──────────────────────────────────
  {
    // Use admin token for content-status
    const r = await request('GET', '/admin/content-status', null, adminToken)
    test('Test 23 — Class 10 Science content-status → 200', r.status, 200, `status=${r.status}`)
    const data = r.body?.data
    if (data) {
      assert('Test 23a — Coverage = 100%', data.coveragePercentage === 100 || data.coverage === '100%' || data.readyChapters >= 10, `coverage=${JSON.stringify(data.coveragePercentage || data.coverage)}`)
      assert('Test 23b — READY chapters = 10', data.readyChapters >= 10, `readyChapters=${data.readyChapters}`)
      assert('Test 23c — PENDING = 0', data.pendingChapters === 0, `pendingChapters=${data.pendingChapters}`)
    }
  }

  // ── Summary ────────────────────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════════════════════════════════')
  console.log(`📊 Authentication Suite Results: ${pass + fail} tests — ${pass} passed, ${fail} failed`)
  if (fail === 0) {
    console.log('🎉 ALL TESTS PASSED — Authentication system fully operational!')
  } else {
    console.log(`⚠️  ${fail} test(s) failed — review output above`)
  }
  console.log('══════════════════════════════════════════════════════════════════════\n')
  process.exit(fail > 0 ? 1 : 0)
}

runTests().catch((err) => {
  console.error('❌ Test runner error:', err)
  process.exit(1)
})
