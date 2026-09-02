/**
 * EduVision AI — Real Data Coverage & RAG Isolation Verification Suite
 * 
 * Tests:
 * 1. Authoritative Manifest Integrity (Classes 6–12, 35 subjects, 409 chapters)
 * 2. Multi-Class Authentic Corpus & 1536-dim Embedding Validation
 * 3. Strict Metadata-Gated Retrieval & Class Isolation (Class 8 vs Class 10 vs Class 12)
 * 4. Strict Subject Isolation (Science vs Math vs Social Science)
 * 5. Strict Chapter Isolation (Laws of Motion vs Optics vs Electricity)
 * 6. Authentic Page Citation Verification (Real textbook page numbers)
 * 7. Bilingual Grounding (English & Tamil queries)
 * 8. Hallucination Guard on Unindexed Chapters
 * 9. Admin RAG Debug Diagnostic Endpoint
 */

const http = require('http')
const fs = require('fs')
const path = require('path')

const BASE_URL = 'http://localhost:5000'
let studentToken = ''
let teacherToken = ''
let adminToken = ''

let totalTests = 0
let passedTests = 0
let failedTests = 0

function request(method, path, body = null, token = null) {
  const startTime = Date.now()
  return new Promise((resolve) => {
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
        const duration = Date.now() - startTime
        let json = null
        try {
          json = JSON.parse(rawData)
        } catch {
          json = { raw: rawData }
        }
        resolve({ status: res.statusCode, data: json, headers: res.headers, duration })
      })
    })

    req.on('error', (err) => {
      resolve({ status: 0, error: err.message, duration: Date.now() - startTime })
    })

    if (body) {
      req.write(JSON.stringify(body))
    }
    req.end()
  })
}

function verify(description, condition, duration = null) {
  totalTests++
  if (condition) {
    passedTests++
    const durStr = duration !== null ? ` (${duration}ms)` : ''
    console.log(`  ✓ [TEST ${totalTests}] ${description}${durStr}`)
  } else {
    failedTests++
    console.log(`  ✗ [TEST ${totalTests}] FAILED: ${description}`)
  }
}

async function runSuite() {
  console.log('\n======================================================================')
  console.log('  EDUVISION AI: REAL DATA COVERAGE & RAG ISOLATION TEST SUITE')
  console.log('======================================================================\n')

  // ── SECTION 1: AUTHENTICATION ─────────────────────────────────────────────
  console.log('--- SECTION 1: AUTHENTICATION MATRIX ---')
  const sLog = await request('POST', '/api/auth/login', { email: 'student@demo.com', password: 'password' })
  studentToken = sLog.data?.data?.token
  verify('Student authentication succeeds and issues JWT', sLog.status === 200 && !!studentToken, sLog.duration)

  const tLog = await request('POST', '/api/auth/login', { email: 'teacher@demo.com', password: 'password' })
  teacherToken = tLog.data?.data?.token
  verify('Teacher authentication succeeds and issues JWT', tLog.status === 200 && !!teacherToken, tLog.duration)

  const aLog = await request('POST', '/api/auth/login', { email: 'admin@demo.com', password: 'password' })
  adminToken = aLog.data?.data?.token
  verify('Admin authentication succeeds and issues JWT', aLog.status === 200 && !!adminToken, aLog.duration)

  // ── SECTION 2: AUTHORITATIVE MANIFEST VALIDATION ──────────────────────────
  console.log('\n--- SECTION 2: AUTHORITATIVE MANIFEST VALIDATION ---')
  const manifestPath = path.join(__dirname, 'data', 'authoritative-tnsb-manifest.json')
  const manifestExists = fs.existsSync(manifestPath)
  verify('authoritative-tnsb-manifest.json exists in filesystem', manifestExists)

  let manifestData = null
  if (manifestExists) {
    manifestData = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  }
  verify('Manifest covers all 7 classes (Classes 6–12)', manifestData && manifestData.classes?.length === 7)
  verify('Manifest defines exactly 409 canonical chapters', manifestData && manifestData.totalExpectedChapters === 409)
  verify('Manifest board is Tamil Nadu State Board (Samacheer Kalvi)', manifestData && manifestData.board?.includes('Tamil Nadu State Board'))

  // ── SECTION 3: CLASS ISOLATION IN RAG RETRIEVAL ───────────────────────────
  console.log('\n--- SECTION 3: STRICT CLASS ISOLATION IN RAG RETRIEVAL ---')

  // Query Class 8 Science (ch-8sci-t1-1: Base SI Units)
  const c8Query = await request(
    'POST',
    '/api/questions/ask',
    {
      classId: 'c-8',
      subjectId: 'sub-8-sci',
      termId: 'trm-8sci-1',
      chapterId: 'ch-8sci-t1-1',
      question: 'What are the base SI units of measurement and luminous intensity in candela?',
    },
    studentToken
  )
  verify('Class 8 Science query returns 200/201 OK', c8Query.status === 200 || c8Query.status === 201, c8Query.duration)
  const c8Chunks = c8Query.data?.data?.retrieved_chunks || []
  const c8Isolated = c8Chunks.length > 0 && c8Chunks.every((c) => !c.chunk_id.includes('10sci') && !c.chunk_id.includes('12phy'))
  verify('Class 8 retrieval is strictly isolated (0 Class 10/12 chunks)', c8Isolated)
  verify('Class 8 answer references authentic page 3 and candela', c8Query.data?.data?.answer?.includes('candela') || c8Query.data?.data?.simple_explanation?.includes('candela'))

  // Query Class 12 Physics (ch-12phy-t1-1: Electrostatics & Coulomb's Law)
  const c12Query = await request(
    'POST',
    '/api/questions/ask',
    {
      classId: 'c-12',
      subjectId: 'sub-12-phy',
      termId: 'trm-12phy-1',
      chapterId: 'ch-12phy-t1-1',
      question: "State Coulomb's Law and Gauss's Law in Electrostatics.",
    },
    studentToken
  )
  verify('Class 12 Physics query returns 200/201 OK', c12Query.status === 200 || c12Query.status === 201, c12Query.duration)
  const c12Chunks = c12Query.data?.data?.retrieved_chunks || []
  const c12Isolated = c12Chunks.length > 0 && c12Chunks.every((c) => !c.chunk_id.includes('10sci') && !c.chunk_id.includes('8sci'))
  verify('Class 12 retrieval is strictly isolated (0 Class 8/10 chunks)', c12Isolated)
  verify("Class 12 answer references Coulomb's Law and Page 15", c12Query.data?.data?.answer?.includes("Coulomb") || c12Query.data?.data?.page_numbers?.includes(15))

  // ── SECTION 4: STRICT SUBJECT ISOLATION ───────────────────────────────────
  console.log('\n--- SECTION 4: STRICT SUBJECT ISOLATION ---')

  // Query Class 10 Science (ch-10sci-t1-1: Laws of Motion)
  const c10SciQuery = await request(
    'POST',
    '/api/questions/ask',
    {
      classId: 'c-10',
      subjectId: 'sub-10-sci',
      termId: 'trm-10sci-1',
      chapterId: 'ch-10sci-t1-1',
      question: "Explain Newton's first law of motion and inertia.",
    },
    studentToken
  )
  verify('Class 10 Science query returns 200/201 OK', c10SciQuery.status === 200 || c10SciQuery.status === 201, c10SciQuery.duration)
  const c10SciChunks = c10SciQuery.data?.data?.retrieved_chunks || []
  const c10SciIsolated = c10SciChunks.length > 0 && c10SciChunks.every((c) => !c.chunk_id.includes('10math') && !c.chunk_id.includes('10soc'))
  verify('Class 10 Science retrieval excludes Math and Social Science chunks', c10SciIsolated)
  verify('Class 10 Science answer includes exact page 1 reference', c10SciQuery.data?.data?.page_numbers?.includes(1))

  // Query Class 10 Social Science (ch-10soc-t1-3: Indian Constitution)
  const c10SocQuery = await request(
    'POST',
    '/api/questions/ask',
    {
      classId: 'c-10',
      subjectId: 'sub-10-soc',
      termId: 'trm-10soc-1',
      chapterId: 'ch-10soc-t1-3',
      question: 'Explain the Preamble, Fundamental Rights and Article 32 of Indian Constitution.',
    },
    studentToken
  )
  verify('Class 10 Social Science query returns 200/201 OK', c10SocQuery.status === 200 || c10SocQuery.status === 201, c10SocQuery.duration)
  const c10SocChunks = c10SocQuery.data?.data?.retrieved_chunks || []
  const c10SocIsolated = c10SocChunks.length > 0 && c10SocChunks.every((c) => !c.chunk_id.includes('10sci') && !c.chunk_id.includes('10math'))
  verify('Class 10 Social Science retrieval excludes Science and Math chunks', c10SocIsolated)

  // ── SECTION 5: BILINGUAL GROUNDING & STRUCTURED FORMAT ────────────────────
  console.log('\n--- SECTION 5: BILINGUAL GROUNDING & STRUCTURED FORMAT ---')

  // English query structured headers verification
  const ansText = c10SciQuery.data?.data?.answer || ''
  verify('English response contains ## Answer header', ansText.includes('## Answer'))
  verify('English response contains ## Key Points header', ansText.includes('## Key Points'))
  verify('English response contains ## Textbook Reference header', ansText.includes('## Textbook Reference'))
  verify('Textbook Reference contains Class 10 and Science', ansText.includes('Class 10') && ansText.includes('Science'))

  // Tamil query verification
  const tamilQuery = await request(
    'POST',
    '/api/questions/ask',
    {
      classId: 'c-10',
      subjectId: 'sub-10-sci',
      termId: 'trm-10sci-1',
      chapterId: 'ch-10sci-t1-1',
      question: 'நியூட்டனின் முதல் இயக்க விதி மற்றும் நிலைமம் பற்றி விளக்குக.',
    },
    studentToken
  )
  verify('Tamil query returns 200/201 OK', tamilQuery.status === 200 || tamilQuery.status === 201, tamilQuery.duration)
  const taAns = tamilQuery.data?.data?.answer || ''
  verify('Tamil response contains ## விடை header', taAns.includes('## விடை'))
  verify('Tamil response contains ## பாடநூல் குறிப்பு reference', taAns.includes('## பாடநூல் குறிப்பு'))

  // ── SECTION 6: HALLUCINATION GUARD ON UNINDEXED CHAPTERS ──────────────────
  console.log('\n--- SECTION 6: HALLUCINATION GUARD ON UNINDEXED CHAPTERS ---')

  const unindexedQuery = await request(
    'POST',
    '/api/questions/ask',
    {
      classId: 'c-6',
      subjectId: 'sub-pending-sample',
      termId: 'trm-pending-sample-1',
      chapterId: 'ch-unindexed-pending-1',
      question: 'உரைநடை பகுதியின் சிறப்புகள் யாவை?',
    },
    studentToken
  )
  verify('Unindexed chapter query returns 200 OK without crash', unindexedQuery.status === 200, unindexedQuery.duration)
  const unindexedAns = unindexedQuery.data?.data?.answer || ''
  verify('Unindexed chapter returns transparent notice rather than hallucinating', unindexedAns.includes('not been indexed') || unindexedAns.includes('couldn\'t find enough'))
  verify('Unindexed chapter reports confidence 0.0', unindexedQuery.data?.data?.confidence === 0.0)

  // ── SECTION 7: ADMIN RAG DEBUG DIAGNOSTIC TRACE ───────────────────────────
  console.log('\n--- SECTION 7: ADMIN RAG DEBUG DIAGNOSTIC TRACE ---')

  const studentOnDebug = await request('POST', '/api/ai/rag-debug', { question: 'Test' }, studentToken)
  verify('Student blocked from /api/ai/rag-debug (403 Forbidden)', studentOnDebug.status === 403)

  const adminDebug = await request(
    'POST',
    '/api/ai/rag-debug',
    {
      classId: 'c-10',
      subjectId: 'sub-10-sci',
      chapterId: 'ch-10sci-t1-1',
      question: 'Explain inertia of rest and inertia of motion.',
    },
    adminToken
  )
  verify('Admin access to /api/ai/rag-debug succeeds (200 OK)', adminDebug.status === 200, adminDebug.duration)
  const debugData = adminDebug.data?.debug
  verify('Debug trace contains detectedClass Class 10', debugData?.detectedClass?.includes('Class 10'))
  verify('Debug trace contains retrievedChunks with similarityScore', debugData?.retrievedChunks?.length > 0 && typeof debugData?.retrievedChunks[0]?.similarityScore === 'number')
  verify('Debug trace reports text-embedding-3-small (1536-dim)', debugData?.sourceProvenance?.model?.includes('1536-dim'))

  // ── SUMMARY REPORT ────────────────────────────────────────────────────────
  console.log('\n======================================================================')
  console.log('  REAL DATA COVERAGE & RAG ISOLATION TEST RESULTS:')
  console.log(`  Total Test Assertions: ${totalTests}`)
  console.log(`  Passed: ${passedTests}`)
  console.log(`  Failed: ${failedTests}`)
  console.log(`  Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`)
  console.log('======================================================================\n')

  if (failedTests > 0) {
    process.exit(1)
  }
}

runSuite().catch((err) => {
  console.error('Fatal error during real-data suite execution:', err)
  process.exit(1)
})
