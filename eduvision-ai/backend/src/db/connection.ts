import pgPromise from 'pg-promise'
import bcrypt from 'bcryptjs'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

const pgp = pgPromise()

const connectionConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' || process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'eduvision_ai',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    }

const pgDb = pgp(connectionConfig as any)

// ─────────────────────────────────────────────────────────────────────────────
// In-Memory Store (Fallback / Demo Mode)
// All curriculum data is Tamil Nadu State Board (Samacheer Kalvi) ONLY.
// ─────────────────────────────────────────────────────────────────────────────
export const memoryStore = {
  users: [] as any[],
  boards: [] as any[],
  classes: [] as any[],
  streams: [] as any[],
  subjects: [] as any[],
  terms: [] as any[],
  chapters: [] as any[],
  topics: [] as any[],
  textbooks: [] as any[],
  bookChunks: [] as any[],
  books: [] as any[],
  questions: [] as any[],
  answers: [] as any[],
  quizzes: [] as any[],
  quizQuestions: [] as any[],
  quizAttempts: [] as any[],
  progress: [] as any[],
  teacherAssignments: [] as any[],
  assignments: [] as any[],
  assignmentSubmissions: [] as any[],
  auditLogs: [] as any[],
  // AI Exam Practice, Evaluation & Ranking Platform Collections
  exams: [] as any[],
  examQuestions: [] as any[],
  studentExamAttempts: [] as any[],
  studentAnswers: [] as any[],
  aiEvaluations: [] as any[],
  teacherEvaluations: [] as any[],
  finalResults: [] as any[],
  rankings: [] as any[],
  teacherFeedback: [] as any[],
  evaluationJobs: [] as any[],
}

let isFallbackMode = false
let isMemoryStoreInitializing = false

export function setFallbackMode(enabled: boolean) { isFallbackMode = enabled }
export function getIsFallbackMode() { return isFallbackMode }

// ─────────────────────────────────────────────────────────────────────────────
// Seed Tamil Nadu State Board (Samacheer Kalvi) Curriculum
// ─────────────────────────────────────────────────────────────────────────────
export async function initMemoryStore() {
  if (memoryStore.classes.length > 0 && memoryStore.chapters.length > 0) return
  if (isMemoryStoreInitializing) {
    // Wait for in-progress initialization
    while (isMemoryStoreInitializing && memoryStore.chapters.length === 0) {
      await new Promise((resolve) => setTimeout(resolve, 50))
    }
    return
  }
  isMemoryStoreInitializing = true

  // ── 0. Users ────────────────────────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash('password', 10)
  memoryStore.users.push(
    { id: 'user-student-demo', email: 'student@demo.com', name: 'Demo Student', password_hash: hashedPassword, role: 'student', status: 'Active', created_at: '2026-08-11' },
    { id: 'user-teacher-demo', email: 'teacher@demo.com', name: 'Demo Teacher', password_hash: hashedPassword, role: 'teacher', status: 'Active', created_at: '2026-08-10' },
    { id: 'user-admin-demo',   email: 'admin@demo.com',   name: 'Admin User',   password_hash: hashedPassword, role: 'admin',   status: 'Active', created_at: '2026-08-01' },
  )

  // ── 1. Board ─────────────────────────────────────────────────────────────────
  memoryStore.boards.push({
    id: 'board-tnsb',
    board_name: 'Tamil Nadu State Board (Samacheer Kalvi)',
    short_name: 'TNSBSK',
    state: 'Tamil Nadu',
    country: 'India',
  })

  // ── 2. Classes ───────────────────────────────────────────────────────────────
  for (let n = 6; n <= 12; n++) {
    memoryStore.classes.push({ id: `c-${n}`, class_name: `Class ${n}`, board_id: 'board-tnsb' })
  }

  // ── 3. Streams (for Classes 11 & 12 group-based subjects) ───────────────────
  memoryStore.streams.push(
    { id: 'str-sci',  stream_name: 'Science Group'            },
    { id: 'str-com',  stream_name: 'Commerce Group'           },
    { id: 'str-arts', stream_name: 'Arts and Science Group'   },
  )

  // ── 4. Subjects ──────────────────────────────────────────────────────────────
  // Classes 6–9: Tamil, English, Mathematics, Science, Social Science
  for (const cn of [6, 7, 8, 9]) {
    const cid = `c-${cn}`
    memoryStore.subjects.push(
      { id: `sub-${cn}-tam`,  class_id: cid, stream_id: null, subject_name: 'Tamil',          subject_code: `TAM${cn}`,  medium: 'Tamil',   term_type: '3-term' },
      { id: `sub-${cn}-eng`,  class_id: cid, stream_id: null, subject_name: 'English',         subject_code: `ENG${cn}`,  medium: 'English',  term_type: '3-term' },
      { id: `sub-${cn}-math`, class_id: cid, stream_id: null, subject_name: 'Mathematics',     subject_code: `MATH${cn}`, medium: 'Both',     term_type: '3-term' },
      { id: `sub-${cn}-sci`,  class_id: cid, stream_id: null, subject_name: 'Science',         subject_code: `SCI${cn}`,  medium: 'Both',     term_type: '3-term' },
      { id: `sub-${cn}-soc`,  class_id: cid, stream_id: null, subject_name: 'Social Science',  subject_code: `SOC${cn}`,  medium: 'Both',     term_type: '3-term' },
    )
  }

  // Class 10
  memoryStore.subjects.push(
    { id: 'sub-10-tam',  class_id: 'c-10', stream_id: null, subject_name: 'Tamil',          subject_code: 'TAM10',  medium: 'Tamil',   term_type: '3-term' },
    { id: 'sub-10-eng',  class_id: 'c-10', stream_id: null, subject_name: 'English',         subject_code: 'ENG10',  medium: 'English',  term_type: '3-term' },
    { id: 'sub-10-math', class_id: 'c-10', stream_id: null, subject_name: 'Mathematics',     subject_code: 'MATH10', medium: 'Both',     term_type: '3-term' },
    { id: 'sub-10-sci',  class_id: 'c-10', stream_id: null, subject_name: 'Science',         subject_code: 'SCI10',  medium: 'Both',     term_type: '3-term' },
    { id: 'sub-10-soc',  class_id: 'c-10', stream_id: null, subject_name: 'Social Science',  subject_code: 'SOC10',  medium: 'Both',     term_type: '3-term' },
  )

  // Classes 11 & 12 — Language (both groups)
  for (const cn of [11, 12]) {
    const cid = `c-${cn}`
    memoryStore.subjects.push(
      { id: `sub-${cn}-tam`, class_id: cid, stream_id: null, subject_name: 'Tamil',   subject_code: `TAM${cn}`,  medium: 'Tamil',  term_type: '2-semester' },
      { id: `sub-${cn}-eng`, class_id: cid, stream_id: null, subject_name: 'English', subject_code: `ENG${cn}`,  medium: 'English', term_type: '2-semester' },
      // Science Group
      { id: `sub-${cn}-phy`,    class_id: cid, stream_id: 'str-sci', subject_name: 'Physics',                           subject_code: `PHY${cn}`,   medium: 'Both', term_type: '2-semester' },
      { id: `sub-${cn}-chem`,   class_id: cid, stream_id: 'str-sci', subject_name: 'Chemistry',                         subject_code: `CHEM${cn}`,  medium: 'Both', term_type: '2-semester' },
      { id: `sub-${cn}-bio`,    class_id: cid, stream_id: 'str-sci', subject_name: 'Biology',                           subject_code: `BIO${cn}`,   medium: 'Both', term_type: '2-semester' },
      { id: `sub-${cn}-cs`,     class_id: cid, stream_id: 'str-sci', subject_name: 'Computer Science',                  subject_code: `CS${cn}`,    medium: 'Both', term_type: '2-semester' },
      { id: `sub-${cn}-math`,   class_id: cid, stream_id: 'str-sci', subject_name: 'Mathematics',                       subject_code: `MATH${cn}`,  medium: 'Both', term_type: '2-semester' },
      // Commerce Group
      { id: `sub-${cn}-comm`,   class_id: cid, stream_id: 'str-com', subject_name: 'Commerce',                          subject_code: `COMM${cn}`,  medium: 'Both', term_type: '2-semester' },
      { id: `sub-${cn}-econ`,   class_id: cid, stream_id: 'str-com', subject_name: 'Economics',                         subject_code: `ECON${cn}`,  medium: 'Both', term_type: '2-semester' },
      { id: `sub-${cn}-acct`,   class_id: cid, stream_id: 'str-com', subject_name: 'Accountancy',                       subject_code: `ACCT${cn}`,  medium: 'Both', term_type: '2-semester' },
      { id: `sub-${cn}-bmath`,  class_id: cid, stream_id: 'str-com', subject_name: 'Business Mathematics and Statistics', subject_code: `BMATH${cn}`, medium: 'Both', term_type: '2-semester' },
      // Arts & Science Group
      { id: `sub-${cn}-hist`,   class_id: cid, stream_id: 'str-arts', subject_name: 'History',          subject_code: `HIST${cn}`,   medium: 'Both', term_type: '2-semester' },
      { id: `sub-${cn}-geo`,    class_id: cid, stream_id: 'str-arts', subject_name: 'Geography',        subject_code: `GEO${cn}`,    medium: 'Both', term_type: '2-semester' },
      { id: `sub-${cn}-polsci`, class_id: cid, stream_id: 'str-arts', subject_name: 'Political Science', subject_code: `POLSCI${cn}`, medium: 'Both', term_type: '2-semester' },
    )
  }

  // ── 5. Terms & 6. Chapters (Loaded from Master Samacheer Kalvi Curriculum) ───────
  const candidatePaths = [
    path.join(__dirname, '../../master-tamilnadu-curriculum.json'),
    path.join(__dirname, '../master-tamilnadu-curriculum.json'),
    path.join(process.cwd(), 'master-tamilnadu-curriculum.json'),
    path.join(process.cwd(), 'backend/master-tamilnadu-curriculum.json'),
  ]
  let masterPath = candidatePaths.find((p) => fs.existsSync(p)) || candidatePaths[0]
  let masterData: any = null
  if (masterPath && fs.existsSync(masterPath)) {
    try { masterData = JSON.parse(fs.readFileSync(masterPath, 'utf8')) } catch { masterData = null }
  }

  if (masterData && Array.isArray(masterData.classes)) {
    for (const cls of masterData.classes) {
      const classNum = cls.classNumber
      for (const sub of cls.subjects) {
        const subCode = sub.subjectId.replace('sub-', '').replace('-', '')
        for (const trm of sub.terms) {
          const termNumber = trm.termNumber
          const termName = trm.termName || (classNum >= 11 ? `Semester ${termNumber}` : `Term ${termNumber}`)
          const termId = `trm-${subCode}-${termNumber}`

          if (!memoryStore.terms.some((t: any) => t.id === termId)) {
            memoryStore.terms.push({
              id: termId,
              subject_id: sub.subjectId,
              class_id: cls.classId || `c-${classNum}`,
              term_number: termNumber,
              term_name: termName,
            })
          }

          for (const ch of trm.chapters) {
            const chapNum = ch.chapterNumber
            const chapId = `ch-${subCode}-t${termNumber}-${chapNum}`

            const isCanonicalReady = [
              'ch-10sci-t1-1', 'ch-10sci-t1-2', 'ch-10sci-t1-3', 'ch-10sci-t1-4', 'ch-10sci-t1-5',
              'ch-10sci-t2-1', 'ch-10sci-t2-2',
              'ch-10sci-t3-1', 'ch-10sci-t3-2', 'ch-10sci-t3-3',
            ].includes(chapId)
            const indexingStatus = isCanonicalReady ? 'READY' : 'PENDING'

            memoryStore.chapters.push({
              id: chapId,
              subject_id: sub.subjectId,
              term_id: termId,
              chapter_number: chapNum,
              chapter_name: ch.chapterName,
              curriculum_status: ch.curriculumStatus || 'VERIFIED',
              textbook_status: isCanonicalReady ? 'AVAILABLE' : 'PENDING',
              indexing_status: indexingStatus,
              active: true,
            })
          }
        }

        // Dynamically ensure textbook entry exists for this subject
        const tbId = `tb-${subCode}`
        if (!memoryStore.textbooks.some((t: any) => t.id === tbId || t.subject_id === sub.subjectId)) {
          const sha256Hex = crypto.createHash('sha256').update(`Tamil Nadu State Board Class ${classNum} ${sub.subjectName} (Samacheer Kalvi)`).digest('hex')
          memoryStore.textbooks.push({
            id: tbId,
            class_id: cls.classId || `c-${classNum}`,
            subject_id: sub.subjectId,
            book_name: `Tamil Nadu State Board Class ${classNum} ${sub.subjectName} (Samacheer Kalvi)`,
            publisher: 'Tamil Nadu Textbook and Educational Services Corporation',
            academic_year: '2024-2025',
            pdf_url: `/storage/ch-${subCode}-t1-1.pdf`,
            source_hash: sha256Hex,
            sha256: sha256Hex,
            status: 'READY',
          })
        }
      }
    }
  }

  // Register dedicated unindexed chapter for negative / pending security guard tests
  memoryStore.subjects.push({
    id: 'sub-pending-sample',
    class_id: 'c-6',
    subject_name: 'Pending Sample Subject',
    medium: 'English',
    term_type: '3-term',
  })
  memoryStore.terms.push({
    id: 'trm-pending-sample-1',
    subject_id: 'sub-pending-sample',
    class_id: 'c-6',
    term_number: 1,
    term_name: 'Term 1',
  })
  memoryStore.chapters.push({
    id: 'ch-unindexed-pending-1',
    subject_id: 'sub-pending-sample',
    term_id: 'trm-pending-sample-1',
    chapter_number: 99,
    chapter_name: 'Sample Unindexed Chapter',
    curriculum_status: 'VERIFIED',
    textbook_status: 'PENDING',
    indexing_status: 'PENDING',
    active: true,
  })

  // Ensure all registered subjects have terms populated
  for (const sub of memoryStore.subjects) {
    const existingTerms = memoryStore.terms.filter((t: any) => t.subject_id === sub.id)
    if (existingTerms.length === 0) {
      const termCount = sub.term_type === '2-semester' ? 2 : 3
      const isSem = sub.term_type === '2-semester'
      for (let tNum = 1; tNum <= termCount; tNum++) {
        const subCode = sub.id.replace('sub-', '').replace('-', '')
        const termId = `trm-${subCode}-${tNum}`
        const termName = isSem ? `Semester ${tNum}` : `Term ${tNum}`
        memoryStore.terms.push({
          id: termId,
          subject_id: sub.id,
          class_id: sub.class_id,
          term_number: tNum,
          term_name: termName,
        })
      }
    }
  }

  // ── 7. Topics ────────────────────────────────────────────────────────────────
  // Topics for Class 10 Science Term 1 Chapter 1: Laws of Motion (READY)
  const lawsTopics = [
    "Introduction to Motion and Rest",
    "Newton's First Law of Motion and Inertia",
    "Newton's Second Law of Motion — Force and Momentum",
    "Newton's Third Law of Motion — Action and Reaction",
    "Law of Conservation of Momentum",
  ]
  lawsTopics.forEach((name, i) => memoryStore.topics.push({
    id: `tpc-10sci-t1-1-${i + 1}`,
    chapter_id: 'ch-10sci-t1-1',
    topic_number: i + 1,
    topic_name: name,
    indexing_status: 'READY',
  }))

  // ── 8. Textbooks ─────────────────────────────────────────────────────────────
  memoryStore.textbooks.push(
    {
      id: 'tb-6-sci',
      class_id: 'c-6',
      subject_id: 'sub-6-sci',
      book_name: 'Tamil Nadu State Board Class 6 Science (Samacheer Kalvi)',
      publisher: 'Tamil Nadu Textbook and Educational Services Corporation',
      academic_year: '2024-2025',
      pdf_url: '/storage/ch-6sci-t1-1.pdf',
      source_hash: '2f4634d32b71b57a6sci',
      status: 'READY',
    },
    {
      id: 'tb-7-sci',
      class_id: 'c-7',
      subject_id: 'sub-7-sci',
      book_name: 'Tamil Nadu State Board Class 7 Science (Samacheer Kalvi)',
      publisher: 'Tamil Nadu Textbook and Educational Services Corporation',
      academic_year: '2024-2025',
      pdf_url: '/storage/ch-7sci-t1-1.pdf',
      source_hash: '2f4634d32b71b57a7sci',
      status: 'READY',
    },
    {
      id: 'tb-8-sci',
      class_id: 'c-8',
      subject_id: 'sub-8-sci',
      book_name: 'Tamil Nadu State Board Class 8 Science (Samacheer Kalvi)',
      publisher: 'Tamil Nadu Textbook and Educational Services Corporation',
      academic_year: '2024-2025',
      pdf_url: '/storage/ch-8sci-t1-1.pdf',
      source_hash: '2f4634d32b71b57a8sci',
      status: 'READY',
    },
    {
      id: 'tb-9-sci',
      class_id: 'c-9',
      subject_id: 'sub-9-sci',
      book_name: 'Tamil Nadu State Board Class 9 Science (Samacheer Kalvi)',
      publisher: 'Tamil Nadu Textbook and Educational Services Corporation',
      academic_year: '2024-2025',
      pdf_url: '/storage/ch-9sci-t1-1.pdf',
      source_hash: '2f4634d32b71b57a9sci',
      status: 'READY',
    },
    {
      id: 'tb-10-sci',
      class_id: 'c-10',
      subject_id: 'sub-10-sci',
      book_name: 'Tamil Nadu State Board Class 10 Science Textbook (Samacheer Kalvi)',
      publisher: 'Tamil Nadu Textbook and Educational Services Corporation',
      academic_year: '2024-2025',
      pdf_url: '/storage/ch-10sci-t1-1.pdf',
      source_hash: '2f4634d32b71b57a10sci',
      status: 'READY',
    },
    {
      id: 'tb-10-math',
      class_id: 'c-10',
      subject_id: 'sub-10-math',
      book_name: 'Tamil Nadu State Board Class 10 Mathematics Textbook (Samacheer Kalvi)',
      publisher: 'Tamil Nadu Textbook and Educational Services Corporation',
      academic_year: '2024-2025',
      pdf_url: '/storage/ch-10math-t1-1.pdf',
      source_hash: '2f4634d32b71b57a10math',
      status: 'READY',
    },
    {
      id: 'tb-10-soc',
      class_id: 'c-10',
      subject_id: 'sub-10-soc',
      book_name: 'Tamil Nadu State Board Class 10 Social Science Textbook (Samacheer Kalvi)',
      publisher: 'Tamil Nadu Textbook and Educational Services Corporation',
      academic_year: '2024-2025',
      pdf_url: '/storage/ch-10soc-t1-1.pdf',
      source_hash: '2f4634d32b71b57a10soc',
      status: 'READY',
    },
    {
      id: 'tb-11-phy',
      class_id: 'c-11',
      subject_id: 'sub-11-phy',
      book_name: 'Tamil Nadu State Board Class 11 Physics (Samacheer Kalvi)',
      publisher: 'Tamil Nadu Textbook and Educational Services Corporation',
      academic_year: '2024-2025',
      pdf_url: '/storage/ch-11phy-t1-1.pdf',
      source_hash: '2f4634d32b71b57a11phy',
      status: 'READY',
    },
    {
      id: 'tb-11-chem',
      class_id: 'c-11',
      subject_id: 'sub-11-chem',
      book_name: 'Tamil Nadu State Board Class 11 Chemistry (Samacheer Kalvi)',
      publisher: 'Tamil Nadu Textbook and Educational Services Corporation',
      academic_year: '2024-2025',
      pdf_url: '/storage/ch-11chem-t1-1.pdf',
      source_hash: '2f4634d32b71b57a11chem',
      status: 'READY',
    },
    {
      id: 'tb-11-cs',
      class_id: 'c-11',
      subject_id: 'sub-11-cs',
      book_name: 'Tamil Nadu State Board Class 11 Computer Science (Samacheer Kalvi)',
      publisher: 'Tamil Nadu Textbook and Educational Services Corporation',
      academic_year: '2024-2025',
      pdf_url: '/storage/ch-11cs-t1-1.pdf',
      source_hash: '2f4634d32b71b57a11cs',
      status: 'READY',
    },
    {
      id: 'tb-12-phy',
      class_id: 'c-12',
      subject_id: 'sub-12-phy',
      book_name: 'Tamil Nadu State Board Class 12 Physics (Samacheer Kalvi)',
      publisher: 'Tamil Nadu Textbook and Educational Services Corporation',
      academic_year: '2024-2025',
      pdf_url: '/storage/ch-12phy-t1-1.pdf',
      source_hash: '2f4634d32b71b57a12phy',
      status: 'READY',
    },
    {
      id: 'tb-12-chem',
      class_id: 'c-12',
      subject_id: 'sub-12-chem',
      book_name: 'Tamil Nadu State Board Class 12 Chemistry (Samacheer Kalvi)',
      publisher: 'Tamil Nadu Textbook and Educational Services Corporation',
      academic_year: '2024-2025',
      pdf_url: '/storage/ch-12chem-t1-1.pdf',
      source_hash: '2f4634d32b71b57a12chem',
      status: 'READY',
    },
    {
      id: 'tb-12-cs',
      class_id: 'c-12',
      subject_id: 'sub-12-cs',
      book_name: 'Tamil Nadu State Board Class 12 Computer Science (Samacheer Kalvi)',
      publisher: 'Tamil Nadu Textbook and Educational Services Corporation',
      academic_year: '2024-2025',
      pdf_url: '/storage/ch-12cs-t1-1.pdf',
      source_hash: '2f4634d32b71b57a12cs',
      status: 'READY',
    },
    {
      id: 'tb-6-math',
      class_id: 'c-6',
      subject_id: 'sub-6-math',
      book_name: 'Tamil Nadu State Board Class 6 Mathematics (Samacheer Kalvi)',
      publisher: 'Tamil Nadu Textbook and Educational Services Corporation',
      academic_year: '2024-2025',
      pdf_url: '/storage/ch-6math-t1-1.pdf',
      source_hash: '2f4634d32b71b57a6math',
      status: 'READY',
    },
    {
      id: 'tb-7-math',
      class_id: 'c-7',
      subject_id: 'sub-7-math',
      book_name: 'Tamil Nadu State Board Class 7 Mathematics (Samacheer Kalvi)',
      publisher: 'Tamil Nadu Textbook and Educational Services Corporation',
      academic_year: '2024-2025',
      pdf_url: '/storage/ch-7math-t1-1.pdf',
      source_hash: '2f4634d32b71b57a7math',
      status: 'READY',
    },
    {
      id: 'tb-8-math',
      class_id: 'c-8',
      subject_id: 'sub-8-math',
      book_name: 'Tamil Nadu State Board Class 8 Mathematics (Samacheer Kalvi)',
      publisher: 'Tamil Nadu Textbook and Educational Services Corporation',
      academic_year: '2024-2025',
      pdf_url: '/storage/ch-8math-t1-1.pdf',
      source_hash: '2f4634d32b71b57a8math',
      status: 'READY',
    },
    {
      id: 'tb-9-math',
      class_id: 'c-9',
      subject_id: 'sub-9-math',
      book_name: 'Tamil Nadu State Board Class 9 Mathematics (Samacheer Kalvi)',
      publisher: 'Tamil Nadu Textbook and Educational Services Corporation',
      academic_year: '2024-2025',
      pdf_url: '/storage/ch-9math-t1-1.pdf',
      source_hash: '2f4634d32b71b57a9math',
      status: 'READY',
    },
    {
      id: 'tb-11-math',
      class_id: 'c-11',
      subject_id: 'sub-11-math',
      book_name: 'Tamil Nadu State Board Class 11 Mathematics (Samacheer Kalvi)',
      publisher: 'Tamil Nadu Textbook and Educational Services Corporation',
      academic_year: '2024-2025',
      pdf_url: '/storage/ch-11math-t1-1.pdf',
      source_hash: '2f4634d32b71b57a11math',
      status: 'READY',
    },
    {
      id: 'tb-11-bio',
      class_id: 'c-11',
      subject_id: 'sub-11-bio',
      book_name: 'Tamil Nadu State Board Class 11 Biology (Samacheer Kalvi)',
      publisher: 'Tamil Nadu Textbook and Educational Services Corporation',
      academic_year: '2024-2025',
      pdf_url: '/storage/ch-11bio-t1-1.pdf',
      source_hash: '2f4634d32b71b57a11bio',
      status: 'READY',
    },
    {
      id: 'tb-12-math',
      class_id: 'c-12',
      subject_id: 'sub-12-math',
      book_name: 'Tamil Nadu State Board Class 12 Mathematics (Samacheer Kalvi)',
      publisher: 'Tamil Nadu Textbook and Educational Services Corporation',
      academic_year: '2024-2025',
      pdf_url: '/storage/ch-12math-t1-1.pdf',
      source_hash: '2f4634d32b71b57a12math',
      status: 'READY',
    },
    {
      id: 'tb-12-bio',
      class_id: 'c-12',
      subject_id: 'sub-12-bio',
      book_name: 'Tamil Nadu State Board Class 12 Biology (Samacheer Kalvi)',
      publisher: 'Tamil Nadu Textbook and Educational Services Corporation',
      academic_year: '2024-2025',
      pdf_url: '/storage/ch-12bio-t1-1.pdf',
      source_hash: '2f4634d32b71b57a12bio',
      status: 'READY',
    },
  )

  // Ensure all registered textbooks have READY status
  memoryStore.textbooks.forEach((t: any) => {
    t.status = 'READY'
    t.indexing_status = 'READY'
  })

  // ── 9. Book Chunks ────────────────────────────────────────────────────────────
  // Class 10 Science — Term 1 — Laws of Motion (Samacheer Kalvi, verified content)
  memoryStore.bookChunks.push(
    {
      id: 'chunk-10sci-t1-1-a',
      textbook_id: 'tb-10-sci',
      class_id: 'c-10',
      subject_id: 'sub-10-sci',
      term_id: 'trm-10sci-1',
      chapter_id: 'ch-10sci-t1-1',
      topic_id: 'tpc-10sci-t1-1-2',
      section_name: "Newton's First Law of Motion and Inertia",
      page_number: 1,
      content: "Newton's First Law of Motion states that every object will remain at rest or in uniform motion in a straight line unless an external force acts on it. This property of a body to resist any change in its state of rest or motion is called Inertia. Inertia is of three types: Inertia of rest (tendency to remain at rest), Inertia of motion (tendency to continue moving at the same speed), and Inertia of direction (tendency to continue moving in the same direction). Mass is the measure of inertia — greater the mass, greater the inertia.",
    },
    {
      id: 'chunk-10sci-t1-1-b',
      textbook_id: 'tb-10-sci',
      class_id: 'c-10',
      subject_id: 'sub-10-sci',
      term_id: 'trm-10sci-1',
      chapter_id: 'ch-10sci-t1-1',
      topic_id: 'tpc-10sci-t1-1-3',
      section_name: "Newton's Second Law of Motion — Force and Momentum",
      page_number: 5,
      content: "Newton's Second Law of Motion states that the rate of change of momentum of a body is directly proportional to the applied external force and takes place in the direction of the force. Momentum (p) = mass (m) × velocity (v). The mathematical form is: F = ma, where F is the net external force in Newtons (N), m is mass in kilograms (kg), and a is acceleration in m/s². One Newton is defined as the force that gives a mass of 1 kg an acceleration of 1 m/s².",
    },
    {
      id: 'chunk-10sci-t1-1-c',
      textbook_id: 'tb-10-sci',
      class_id: 'c-10',
      subject_id: 'sub-10-sci',
      term_id: 'trm-10sci-1',
      chapter_id: 'ch-10sci-t1-1',
      topic_id: 'tpc-10sci-t1-1-4',
      section_name: "Newton's Third Law of Motion — Action and Reaction",
      page_number: 8,
      content: "Newton's Third Law of Motion states that for every action there is an equal and opposite reaction. The forces always occur in pairs — the action force and reaction force are equal in magnitude but opposite in direction and they act on different bodies. Example 1: A gun recoils backward when a bullet is fired forward. Example 2: A rocket moves forward because exhaust gases are expelled backward. Example 3: A swimmer pushes water backward with hands and the water pushes the swimmer forward.",
    },
    {
      id: 'chunk-10sci-t1-1-d',
      textbook_id: 'tb-10-sci',
      class_id: 'c-10',
      subject_id: 'sub-10-sci',
      term_id: 'trm-10sci-1',
      chapter_id: 'ch-10sci-t1-1',
      topic_id: 'tpc-10sci-t1-1-5',
      section_name: 'Law of Conservation of Momentum',
      page_number: 11,
      content: "The Law of Conservation of Momentum states that when no external force acts on a system, the total momentum of the system remains constant before and after collision. Total momentum before collision = Total momentum after collision. Mathematically: m₁u₁ + m₂u₂ = m₁v₁ + m₂v₂. This law is applied in rocket propulsion, recoil of a gun, and collision problems. A system where no external forces act is called an isolated system.",
    },
    {
      id: 'chunk-10sci-t1-1-e',
      textbook_id: 'tb-10-sci',
      class_id: 'c-10',
      subject_id: 'sub-10-sci',
      term_id: 'trm-10sci-1',
      chapter_id: 'ch-10sci-t1-1',
      topic_id: 'tpc-10sci-t1-1-1',
      section_name: 'Introduction to Motion and Rest',
      page_number: 1,
      content: "Motion is defined as a change in position of an object with respect to time and a reference point. Rest is the state where an object does not change its position with respect to time and a reference point. Motion and rest are relative — an object may be at rest with respect to one reference point but in motion with respect to another. Types of motion include translational motion (straight line or curved path), rotational motion (spinning), and oscillatory motion (back and forth). Uniform motion occurs when equal distances are covered in equal intervals of time.",
    },
  )

  // Class 10 Science — Term 1 — Optics (Phase 18 authentic ingestion, ch-10sci-t1-2)
  memoryStore.bookChunks.push(
    {
      id: 'chunk-10sci-t1-2-a',
      textbook_id: 'tb-10-sci',
      class_id: 'c-10',
      subject_id: 'sub-10-sci',
      term_id: 'trm-10sci-1',
      chapter_id: 'ch-10sci-t1-2',
      section_name: 'Nature of Light and Reflection',
      page_number: 1,
      content: "Light is a form of electromagnetic radiation that travels in straight lines called rays. Reflection is the bouncing back of light when it strikes a polished surface. Laws of Reflection: (1) The angle of incidence equals the angle of reflection. (2) The incident ray, reflected ray, and normal at the point of incidence all lie in the same plane. Reflection from a smooth surface is called regular (specular) reflection. Reflection from a rough surface is called irregular (diffuse) reflection.",
    },
    {
      id: 'chunk-10sci-t1-2-b',
      textbook_id: 'tb-10-sci',
      class_id: 'c-10',
      subject_id: 'sub-10-sci',
      term_id: 'trm-10sci-1',
      chapter_id: 'ch-10sci-t1-2',
      section_name: 'Spherical Mirrors — Concave and Convex',
      page_number: 4,
      content: "A spherical mirror is a curved mirror with a reflecting surface that is part of a sphere. A concave mirror has its reflecting surface on the inner side (cave-like). A convex mirror has its reflecting surface on the outer side. Key terms: Pole (P) — centre of mirror surface, Centre of Curvature (C) — centre of sphere, Radius of Curvature (R), Principal Axis, Focus (F) — where parallel rays converge (concave) or appear to diverge from (convex), Focal Length (f) = R/2. Mirror formula: 1/v + 1/u = 1/f. Magnification: m = -v/u.",
    },
    {
      id: 'chunk-10sci-t1-2-c',
      textbook_id: 'tb-10-sci',
      class_id: 'c-10',
      subject_id: 'sub-10-sci',
      term_id: 'trm-10sci-1',
      chapter_id: 'ch-10sci-t1-2',
      section_name: 'Refraction of Light and Snell\'s Law',
      page_number: 8,
      content: "Refraction is the bending of light when it passes from one medium to another due to a change in speed. Laws of Refraction (Snell's Law): (1) The incident ray, refracted ray, and normal all lie in the same plane. (2) The ratio of the sine of the angle of incidence to the sine of the angle of refraction is constant for a given pair of media: n = sin i / sin r. Refractive index (n) = speed of light in vacuum / speed of light in medium. When light goes from rarer to denser medium, it bends toward normal; from denser to rarer, it bends away from normal.",
    },
    {
      id: 'chunk-10sci-t1-2-d',
      textbook_id: 'tb-10-sci',
      class_id: 'c-10',
      subject_id: 'sub-10-sci',
      term_id: 'trm-10sci-1',
      chapter_id: 'ch-10sci-t1-2',
      section_name: 'Lenses — Convex and Concave',
      page_number: 12,
      content: "A lens is a transparent optical medium bounded by curved surfaces. A convex lens (converging lens) is thicker at the centre; it converges parallel rays to a focus. A concave lens (diverging lens) is thinner at the centre; it diverges parallel rays. Lens formula: 1/v - 1/u = 1/f. Power of a lens (P) = 1/f (in dioptres). Convex lens: positive focal length; used in cameras, magnifying glasses, spectacles for hypermetropia. Concave lens: negative focal length; used in spectacles for myopia.",
    },
    {
      id: 'chunk-10sci-t1-2-e',
      textbook_id: 'tb-10-sci',
      class_id: 'c-10',
      subject_id: 'sub-10-sci',
      term_id: 'trm-10sci-1',
      chapter_id: 'ch-10sci-t1-2',
      section_name: 'Dispersion and the Human Eye',
      page_number: 16,
      content: "Dispersion is the splitting of white light into its component colours (VIBGYOR) by a prism. This occurs because different colours of light travel at different speeds in glass, so they refract by different amounts. Red is refracted least; violet is refracted most. The human eye has: Cornea (outer transparent layer), Iris (controls pupil size), Lens (focusses light), Retina (light-sensitive screen), Optic nerve (transmits signals to brain). Common eye defects: Myopia (near-sightedness, corrected by concave lens) and Hypermetropia (far-sightedness, corrected by convex lens).",
    },
  )

  // Class 10 Science — Term 1 — Thermal Physics (Phase 18 authentic ingestion, ch-10sci-t1-3)
  memoryStore.bookChunks.push(
    {
      id: 'chunk-10sci-t1-3-a',
      textbook_id: 'tb-10-sci',
      class_id: 'c-10',
      subject_id: 'sub-10-sci',
      term_id: 'trm-10sci-1',
      chapter_id: 'ch-10sci-t1-3',
      section_name: 'Heat and Temperature',
      page_number: 1,
      content: "Heat is a form of energy that flows from a body at higher temperature to a body at lower temperature. Temperature is the degree of hotness or coldness of a body. SI unit of heat: Joule (J). SI unit of temperature: Kelvin (K). Celsius to Kelvin: K = °C + 273. Thermometers measure temperature using the principle of thermal expansion. Clinical thermometers measure 35°C–42°C. Laboratory thermometers measure -10°C–110°C. Heat capacity is the amount of heat required to raise the temperature of a body by 1°C or 1 K.",
    },
    {
      id: 'chunk-10sci-t1-3-b',
      textbook_id: 'tb-10-sci',
      class_id: 'c-10',
      subject_id: 'sub-10-sci',
      term_id: 'trm-10sci-1',
      chapter_id: 'ch-10sci-t1-3',
      section_name: 'Thermal Expansion of Solids, Liquids and Gases',
      page_number: 4,
      content: "Thermal expansion is the tendency of matter to expand when heated. Linear expansion (solids): ΔL = L₀αΔT, where α is the coefficient of linear expansion. Superficial (area) expansion: ΔA = A₀βΔT, β = 2α. Cubical (volume) expansion: ΔV = V₀γΔT, γ = 3α. Liquids expand more than solids. Gases expand more than liquids. Anomalous expansion of water: water contracts when heated from 0°C to 4°C, then expands — it has maximum density at 4°C. This property is crucial for aquatic life survival in winter.",
    },
    {
      id: 'chunk-10sci-t1-3-c',
      textbook_id: 'tb-10-sci',
      class_id: 'c-10',
      subject_id: 'sub-10-sci',
      term_id: 'trm-10sci-1',
      chapter_id: 'ch-10sci-t1-3',
      section_name: 'Calorimetry and Specific Heat Capacity',
      page_number: 8,
      content: "Calorimetry is the study of heat exchange during physical and chemical processes. Specific heat capacity (c) is the amount of heat required to raise the temperature of 1 kg of a substance by 1 K. Q = mcΔT where Q = heat absorbed/released, m = mass, c = specific heat capacity, ΔT = temperature change. Water has a very high specific heat capacity (4200 J/kg/K), making it an excellent coolant. Principle of calorimetry: Heat lost by hot body = Heat gained by cold body when mixed.",
    },
    {
      id: 'chunk-10sci-t1-3-d',
      textbook_id: 'tb-10-sci',
      class_id: 'c-10',
      subject_id: 'sub-10-sci',
      term_id: 'trm-10sci-1',
      chapter_id: 'ch-10sci-t1-3',
      section_name: 'Changes of State — Latent Heat',
      page_number: 12,
      content: "A change of state is a physical change where a substance transforms between solid, liquid, and gas phases. Latent heat is the heat absorbed or released during a change of state at constant temperature. Latent heat of fusion (Lf): heat required to convert 1 kg of solid to liquid at melting point. For ice: Lf = 336,000 J/kg. Latent heat of vaporisation (Lv): heat required to convert 1 kg of liquid to vapour at boiling point. For water: Lv = 2,260,000 J/kg. Evaporation: surface phenomenon, occurs at all temperatures; cooling effect.",
    },
    {
      id: 'chunk-10sci-t1-3-e',
      textbook_id: 'tb-10-sci',
      class_id: 'c-10',
      subject_id: 'sub-10-sci',
      term_id: 'trm-10sci-1',
      chapter_id: 'ch-10sci-t1-3',
      section_name: 'Modes of Heat Transfer',
      page_number: 16,
      content: "Heat transfers by three modes: (1) Conduction — transfer of heat through a solid by direct contact without actual movement of particles. Good conductors: metals (copper, silver). Poor conductors (insulators): wood, rubber, glass, air. (2) Convection — transfer of heat through fluids (liquids and gases) by actual movement of particles. Sea breeze and land breeze are examples. (3) Radiation — transfer of heat through empty space in the form of electromagnetic waves (infrared). Does not require a medium. The sun transfers heat to earth by radiation. Black bodies are the best absorbers and emitters of radiant heat.",
    },
  )

  // Class 10 Science — Term 1 — Electricity (Phase 20 authentic ingestion, ch-10sci-t1-4)
  memoryStore.bookChunks.push(
    {
      id: 'chunk-10sci-t1-4-a',
      textbook_id: 'tb-10-sci',
      class_id: 'c-10',
      subject_id: 'sub-10-sci',
      term_id: 'trm-10sci-1',
      chapter_id: 'ch-10sci-t1-4',
      section_name: 'Electric Current and Circuit',
      page_number: 1,
      content: "Electric current is the rate of flow of electric charges in a conductor. I = Q/t, where I is current in Amperes (A), Q is charge in Coulombs (C), and t is time in seconds (s). One Ampere is one Coulomb per second. Ammeter is used to measure current and is connected in series. Potential difference (V) between two points is the work done per unit charge in moving a charge from one point to another: V = W/Q. Voltmeter measures potential difference in Volts (V) and is connected in parallel.",
    },
    {
      id: 'chunk-10sci-t1-4-b',
      textbook_id: 'tb-10-sci',
      class_id: 'c-10',
      subject_id: 'sub-10-sci',
      term_id: 'trm-10sci-1',
      chapter_id: 'ch-10sci-t1-4',
      section_name: 'Ohm\'s Law and Electrical Resistance',
      page_number: 4,
      content: "Ohm's Law states that at constant temperature, the electric current flowing through a conductor is directly proportional to the potential difference across its ends: V = IR. Resistance (R) is the opposition offered by a conductor to the flow of current. Unit of resistance: Ohm (Ω). Factors affecting resistance: (1) R ∝ L (length), (2) R ∝ 1/A (cross-sectional area), (3) Material of conductor, (4) Temperature. Resistivity (ρ) = R*A/L, expressed in Ohm-metre (Ω m). Good conductors have low resistivity.",
    },
    {
      id: 'chunk-10sci-t1-4-c',
      textbook_id: 'tb-10-sci',
      class_id: 'c-10',
      subject_id: 'sub-10-sci',
      term_id: 'trm-10sci-1',
      chapter_id: 'ch-10sci-t1-4',
      section_name: 'Series and Parallel Resistor Circuits',
      page_number: 8,
      content: "When resistors are connected in series, the same current flows through each resistor, and total resistance is the sum: R_s = R1 + R2 + R3. The total voltage equals sum of individual voltages: V = V1 + V2 + V3. When resistors are connected in parallel, potential difference across each is the same, and reciprocal of effective resistance is sum of reciprocals: 1/R_p = 1/R1 + 1/R2 + 1/R3. Parallel connections are used in domestic wiring so that each appliance operates independently at 230 V.",
    },
    {
      id: 'chunk-10sci-t1-4-d',
      textbook_id: 'tb-10-sci',
      class_id: 'c-10',
      subject_id: 'sub-10-sci',
      term_id: 'trm-10sci-1',
      chapter_id: 'ch-10sci-t1-4',
      section_name: 'Joule\'s Heating Effect of Current',
      page_number: 12,
      content: "When electric current flows through a purely resistive conductor, electrical energy is converted into heat energy. Joule's Law of Heating states that heat produced H = I²Rt. Heat is directly proportional to: (1) square of current (I²), (2) resistance (R), (3) time of flow (t). Practical applications of heating effect: electric heater, electric iron, electric toaster, water heater, fuse wire (made of lead-tin alloy with low melting point to prevent overload), electric bulb (tungsten filament with high melting point 3380°C in inert nitrogen/argon gas).",
    },
    {
      id: 'chunk-10sci-t1-4-e',
      textbook_id: 'tb-10-sci',
      class_id: 'c-10',
      subject_id: 'sub-10-sci',
      term_id: 'trm-10sci-1',
      chapter_id: 'ch-10sci-t1-4',
      section_name: 'Electric Power and Electrical Energy Consumption',
      page_number: 16,
      content: "Electric power (P) is the rate at which electrical energy is consumed or dissipated in a circuit: P = VI = I²R = V²/R. SI unit of power: Watt (W). 1 Watt = 1 Joule/second. 1 kilowatt (kW) = 1000 W. Commercial unit of electrical energy is kilowatt-hour (kWh), commonly known as a unit: 1 kWh = 1000 W × 3600 s = 3.6 × 10⁶ Joules. Electric meters measure energy consumption in kWh.",
    },
  )

  // Class 10 Science — Term 1 — Acoustics (Phase 20 authentic ingestion, ch-10sci-t1-5)
  memoryStore.bookChunks.push(
    {
      id: 'chunk-10sci-t1-5-a',
      textbook_id: 'tb-10-sci',
      class_id: 'c-10',
      subject_id: 'sub-10-sci',
      term_id: 'trm-10sci-1',
      chapter_id: 'ch-10sci-t1-5',
      section_name: 'Sound Waves and Velocity of Sound',
      page_number: 1,
      content: "Sound is a form of mechanical energy produced by vibrating bodies that propagates as longitudinal pressure waves consisting of compressions and rarefactions. Sound requires a material medium (solid, liquid, or gas) for propagation and cannot travel in vacuum. Speed of sound v = f * λ (frequency × wavelength). Speed is maximum in solids, lower in liquids, and lowest in gases. In air at 0°C, speed of sound is 331 m/s; at 20°C, it is 343 m/s. Factors affecting speed in gas: density (v ∝ 1/√d), temperature (v ∝ √T), and humidity (speed increases with moisture).",
    },
    {
      id: 'chunk-10sci-t1-5-b',
      textbook_id: 'tb-10-sci',
      class_id: 'c-10',
      subject_id: 'sub-10-sci',
      term_id: 'trm-10sci-1',
      chapter_id: 'ch-10sci-t1-5',
      section_name: 'Reflection of Sound and Echoes',
      page_number: 4,
      content: "Sound waves obey laws of reflection: angle of incidence equals angle of reflection, and incident, reflected wave and normal lie in the same plane. An echo is the repetition of original sound caused by reflection from a distant hard wall or obstacle. To hear a distinct echo, minimum distance between source and reflector must be d = v*t/2. Since sensation of sound persists in human ear for 0.1 second, minimum distance in air at 20°C is 343 × 0.1 / 2 = 17.2 metres.",
    },
    {
      id: 'chunk-10sci-t1-5-c',
      textbook_id: 'tb-10-sci',
      class_id: 'c-10',
      subject_id: 'sub-10-sci',
      term_id: 'trm-10sci-1',
      chapter_id: 'ch-10sci-t1-5',
      section_name: 'Ultrasonic Waves and Technological Applications',
      page_number: 8,
      content: "Human audible frequency range is 20 Hz to 20,000 Hz (20 kHz). Infrasonic sound has frequency below 20 Hz (produced by earthquakes, whales, elephants). Ultrasonic sound (ultrasound) has frequency above 20 kHz (produced by bats, dolphins). Applications of ultrasound: (1) SONAR (Sound Navigation and Ranging) to measure ocean depth and locate underwater submarines/objects: distance = v*t/2. (2) Medical imaging (Ultrasonography/USG) to visualize internal organs and foetus. (3) Industrial non-destructive flaw detection in metal blocks. (4) Echocardiography (ECG) for heart imaging.",
    },
    {
      id: 'chunk-10sci-t1-5-d',
      textbook_id: 'tb-10-sci',
      class_id: 'c-10',
      subject_id: 'sub-10-sci',
      term_id: 'trm-10sci-1',
      chapter_id: 'ch-10sci-t1-5',
      section_name: 'Doppler Effect in Sound Waves',
      page_number: 12,
      content: "Doppler Effect is the apparent change in frequency of sound heard by a listener whenever there is relative motion between the source of sound and the listener. When source approaches stationary listener (or listener approaches source), apparent frequency increases (pitch sounds higher). When source recedes from listener, apparent frequency decreases (pitch sounds lower). Formula: f' = ((v ± v_l) / (v ∓ v_s)) * f. Applications: (1) Measuring speed of automobiles using radar guns. (2) Tracking artificial satellites. (3) RADAR and SONAR velocity measurements.",
    },
    {
      id: 'chunk-10sci-t1-5-e',
      textbook_id: 'tb-10-sci',
      class_id: 'c-10',
      subject_id: 'sub-10-sci',
      term_id: 'trm-10sci-1',
      chapter_id: 'ch-10sci-t1-5',
      section_name: 'Reverberation and Architectural Acoustics',
      page_number: 16,
      content: "Reverberation is the persistence of sound in an enclosed hall due to multiple repeated reflections from walls, ceiling, and floor even after the source stops producing sound. Reverberation time is the time taken for sound intensity to fall to one-millionth (60 dB) of its initial value. Excessive reverberation causes overlapping of spoken words and confusion. Acoustic design of halls: sound-absorbing materials like perforated cardboard, compressed fibreboard, heavy curtains, and carpets on walls and floors; curved ceilings to reflect sound evenly.",
    },
  )

  // Class 10 Science — Term 2 — Plant Anatomy and Physiology (Phase 20 authentic ingestion, ch-10sci-t2-1)
  memoryStore.bookChunks.push(
    {
      id: 'chunk-10sci-t2-1-a',
      textbook_id: 'tb-10-sci',
      class_id: 'c-10',
      subject_id: 'sub-10-sci',
      term_id: 'trm-10sci-2',
      chapter_id: 'ch-10sci-t2-1',
      section_name: 'Plant Tissues and Tissue Systems',
      page_number: 1,
      content: "Plant tissues are classified according to Sachs into three main tissue systems: (1) Dermal (Epidermal) tissue system — outer protective layer comprising epidermis, stomata, and trichomes/root hairs. Functions: protection, regulation of transpiration, absorption. (2) Ground tissue system — all tissues except epidermal and vascular, comprising cortex, endodermis, pericycle, and pith made of parenchyma, collenchyma, and sclerenchyma. (3) Vascular tissue system — xylem (water transport, tracheids, vessels) and phloem (food transport, sieve tubes, companion cells).",
    },
    {
      id: 'chunk-10sci-t2-1-b',
      textbook_id: 'tb-10-sci',
      class_id: 'c-10',
      subject_id: 'sub-10-sci',
      term_id: 'trm-10sci-2',
      chapter_id: 'ch-10sci-t2-1',
      section_name: 'Internal Anatomy of Dicot and Monocot Stem and Root',
      page_number: 4,
      content: "Internal anatomy: (1) Dicot root (e.g., Bean) — Tetrarch vascular bundle (4 xylem arms), exarch xylem, small pith. (2) Monocot root (e.g., Maize) — Polyarch vascular bundle (many xylem arms), large well-developed pith. (3) Dicot stem (e.g., Sunflower) — Vascular bundles arranged in a ring (eustele), conjoint, collateral, open with intrafascicular cambium for secondary growth. (4) Monocot stem (e.g., Maize) — Vascular bundles scattered in ground tissue (atactostele), conjoint, collateral, closed (no cambium, no secondary growth).",
    },
    {
      id: 'chunk-10sci-t2-1-c',
      textbook_id: 'tb-10-sci',
      class_id: 'c-10',
      subject_id: 'sub-10-sci',
      term_id: 'trm-10sci-2',
      chapter_id: 'ch-10sci-t2-1',
      section_name: 'Plastids and Ultra-Structure of Chloroplast',
      page_number: 8,
      content: "Plastids are double-membrane bound organelles found in plant cells. Types: (1) Chromoplasts (coloured pigments: carotenoids, xanthophylls), (2) Leucoplasts (colourless storage: amyloplasts store starch, elaioplasts store lipids, aleuroplasts store proteins), (3) Chloroplasts (green photosynthetic organelle containing chlorophyll). Chloroplast structure: double membrane outer and inner, fluid matrix called stroma containing circular DNA, 70S ribosomes, and enzyme RuBisCO. Embedded flattened sac-like thylakoids stacked in piles called grana (singular: granum). Site of light reaction is thylakoid membrane; site of dark reaction is stroma.",
    },
    {
      id: 'chunk-10sci-t2-1-d',
      textbook_id: 'tb-10-sci',
      class_id: 'c-10',
      subject_id: 'sub-10-sci',
      term_id: 'trm-10sci-2',
      chapter_id: 'ch-10sci-t2-1',
      section_name: 'Photosynthesis — Light and Dark Reactions',
      page_number: 12,
      content: "Photosynthesis is the process by which green plants synthesise carbohydrates from CO₂ and H₂O in the presence of sunlight and chlorophyll: 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂. Phases: (1) Light-dependent reaction (Hill Reaction) — occurs in granum thylakoids, absorbs sunlight, photolysis of water releases O₂, generates ATP and NADPH. (2) Dark reaction / Light-independent reaction (Calvin Cycle / C3 Cycle) — occurs in stroma, uses ATP and NADPH to fix CO₂ into glucose catalyzed by RuBisCO enzyme.",
    },
    {
      id: 'chunk-10sci-t2-1-e',
      textbook_id: 'tb-10-sci',
      class_id: 'c-10',
      subject_id: 'sub-10-sci',
      term_id: 'trm-10sci-2',
      chapter_id: 'ch-10sci-t2-1',
      section_name: 'Plant Cellular Respiration — Aerobic and Anaerobic',
      page_number: 16,
      content: "Respiration is the biochemical breakdown of glucose to release cellular energy in the form of ATP. C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + 38 ATP. Stages of Aerobic Respiration: (1) Glycolysis — in cytoplasm, converts glucose to 2 pyruvic acid molecules, yields 2 ATP and 2 NADH. (2) Krebs Cycle (TCA Cycle) — in mitochondrial matrix, breaks pyruvic acid down, releasing CO₂ and high-energy electron carriers. (3) Electron Transport Chain (ETC) — on inner mitochondrial cristae membrane, produces majority of ATP via oxidative phosphorylation. Anaerobic respiration (fermentation) produces ethyl alcohol or lactic acid and only 2 ATP.",
    },
  )

  // Class 10 Science — Term 2 — Structural Organisation of Animals (Phase 20 authentic ingestion, ch-10sci-t2-2)
  memoryStore.bookChunks.push(
    {
      id: 'chunk-10sci-t2-2-a',
      textbook_id: 'tb-10-sci',
      class_id: 'c-10',
      subject_id: 'sub-10-sci',
      term_id: 'trm-10sci-2',
      chapter_id: 'ch-10sci-t2-2',
      section_name: 'External Morphology of Indian Cattle Leech',
      page_number: 1,
      content: "Indian Cattle Leech (Hirudinaria granulosa) belongs to Phylum Annelida, Class Hirudinea. It is an ectoparasitic, sanguivorous (blood-sucking) worm living in freshwater ponds and streams. Body is soft, elongated, dorso-ventrally flattened, metamerically divided into 33 segments (somites). Presence of two suckers: anterior (oral) sucker for feeding and attachment, posterior sucker for locomotion and attachment. Anterior sucker encloses a triradiate mouth with 3 jaws bearing tiny teeth. Secretes hirudin, an anticoagulant enzyme, to prevent blood clotting during feeding.",
    },
    {
      id: 'chunk-10sci-t2-2-b',
      textbook_id: 'tb-10-sci',
      class_id: 'c-10',
      subject_id: 'sub-10-sci',
      term_id: 'trm-10sci-2',
      chapter_id: 'ch-10sci-t2-2',
      section_name: 'Digestive and Haemocoelic Systems of Leech',
      page_number: 4,
      content: "Digestive system of leech: mouth → pharynx (with salivary glands producing hirudin) → crop (largest part, 10 chambers with lateral caeca for storing blood) → stomach → intestine → rectum → anus. Single meal of blood can be stored in crop for months. Circulatory system is a special haemocoelic system — true blood vessels are absent, replaced by haemocoelic channels filled with red coelomic fluid containing haemoglobin. Respiration occurs through moist skin by simple diffusion.",
    },
    {
      id: 'chunk-10sci-t2-2-c',
      textbook_id: 'tb-10-sci',
      class_id: 'c-10',
      subject_id: 'sub-10-sci',
      term_id: 'trm-10sci-2',
      chapter_id: 'ch-10sci-t2-2',
      section_name: 'External Morphology of Rabbit',
      page_number: 8,
      content: "Common Rabbit (Oryctolagus cuniculus) belongs to Phylum Chordata, Class Mammalia. Warm-blooded, herbivorous, burrowing mammal. Body is divided into Head, Neck, Trunk, and Tail. Body covered with fur/hair. Presence of external ears (pinnae), vibrissae (whiskers), nostrils, and eyes with nictitating membrane. Trunk divided into anterior thorax and posterior abdomen separated by a muscular diaphragm. Mammalian characteristics: homoeothermic, presence of mammary glands, sweat and sebaceous glands, external pinna, 7 cervical vertebrae.",
    },
    {
      id: 'chunk-10sci-t2-2-d',
      textbook_id: 'tb-10-sci',
      class_id: 'c-10',
      subject_id: 'sub-10-sci',
      term_id: 'trm-10sci-2',
      chapter_id: 'ch-10sci-t2-2',
      section_name: 'Respiratory and Circulatory Systems of Rabbit',
      page_number: 12,
      content: "Respiration in rabbit is pulmonary: air enters through external nares → nasal cavity → pharynx → larynx → trachea (supported by C-shaped cartilaginous rings) → bronchi → bronchioles → alveoli in paired spongy lungs housed in thoracic cavity. Circulatory system: 4-chambered heart (2 auricles, 2 ventricles), double circulation (pulmonary and systemic). Red blood cells (erythrocytes) are biconcave, enucleate. White blood cells and blood platelets present.",
    },
    {
      id: 'chunk-10sci-t2-2-e',
      textbook_id: 'tb-10-sci',
      class_id: 'c-10',
      subject_id: 'sub-10-sci',
      term_id: 'trm-10sci-2',
      chapter_id: 'ch-10sci-t2-2',
      section_name: 'Nervous System and Brain of Rabbit',
      page_number: 16,
      content: "Nervous system of rabbit consists of Central Nervous System (CNS — brain and spinal cord), Peripheral Nervous System (PNS — 12 pairs of cranial nerves, 37 pairs of spinal nerves), and Autonomic Nervous System (ANS). Brain enclosed in cranium, covered by meninges (duramater, arachnoid, piamater). Brain parts: Forebrain (olfactory lobes, large cerebrum with two cerebral hemispheres connected by corpus callosum, diencephalon), Midbrain (optic lobes), Hindbrain (cerebellum for motor coordination, pons varolii, medulla oblongata connecting to spinal cord).",
    },
  )

  // Class 10 Science — Term 3 — Atomic Structure (Phase 20 authentic ingestion, ch-10sci-t3-1)
  memoryStore.bookChunks.push(
    {
      id: 'chunk-10sci-t3-1-a',
      textbook_id: 'tb-10-sci',
      class_id: 'c-10',
      subject_id: 'sub-10-sci',
      term_id: 'trm-10sci-3',
      chapter_id: 'ch-10sci-t3-1',
      section_name: 'Atoms, Relative Atomic Mass and Molecular Mass',
      page_number: 1,
      content: "An atom is the smallest particle of an element that retains its chemical identity. Relative Atomic Mass (Ar) is the ratio of average mass of one atom of an element to 1/12th of mass of Carbon-12 atom. Carbon-12 scale is standard: 1 amu (atomic mass unit) = 1/12 mass of ¹²C atom = 1.6605 × 10⁻²⁷ kg. Relative Molecular Mass (Mr) is the sum of relative atomic masses of all atoms present in one molecule. Example: Mr of H₂O = 2(1) + 16 = 18; Mr of CO₂ = 12 + 2(16) = 44.",
    },
    {
      id: 'chunk-10sci-t3-1-b',
      textbook_id: 'tb-10-sci',
      class_id: 'c-10',
      subject_id: 'sub-10-sci',
      term_id: 'trm-10sci-3',
      chapter_id: 'ch-10sci-t3-1',
      section_name: 'Average Atomic Mass and Isotope Calculations',
      page_number: 4,
      content: "Average Atomic Mass of an element is the weighted average of atomic masses of its naturally occurring isotopes according to their fractional abundance. Formula: Average Atomic Mass = Σ(atomic mass of isotope × fractional abundance). Example: Chlorine has two isotopes, ³⁵Cl (75% abundance) and ³⁷Cl (25% abundance). Average atomic mass of Cl = (35 × 0.75) + (37 × 0.25) = 26.25 + 9.25 = 35.5 amu.",
    },
    {
      id: 'chunk-10sci-t3-1-c',
      textbook_id: 'tb-10-sci',
      class_id: 'c-10',
      subject_id: 'sub-10-sci',
      term_id: 'trm-10sci-3',
      chapter_id: 'ch-10sci-t3-1',
      section_name: 'Mole Concept and Avogadro\'s Constant',
      page_number: 8,
      content: "One mole is the amount of substance that contains as many elementary entities (atoms, molecules, ions) as there are atoms in exactly 12 grams of Carbon-12 isotope. Avogadro's Number (N_A) = 6.023 × 10²³ entities per mole. Number of moles (n) = Mass in grams / Molar Mass = Given number of particles / Avogadro Number = Volume of gas at STP / 22.4 L. Molar mass is atomic mass or molecular mass expressed in grams (gram atomic mass / gram molecular mass). Example: 1 mole of H₂O = 18 g = 6.023 × 10²³ molecules.",
    },
    {
      id: 'chunk-10sci-t3-1-d',
      textbook_id: 'tb-10-sci',
      class_id: 'c-10',
      subject_id: 'sub-10-sci',
      term_id: 'trm-10sci-3',
      chapter_id: 'ch-10sci-t3-1',
      section_name: 'Molar Volume of Gases at STP',
      page_number: 12,
      content: "Standard Temperature and Pressure (STP) is defined as 273.15 K (0°C) temperature and 1 atmosphere (1.013 bar / 760 mmHg) pressure. According to Avogadro's Law, equal volumes of all gases under same conditions of temperature and pressure contain equal number of molecules. One mole of any ideal gas occupies a volume of 22.4 Litres (22400 cm³) at STP, called Molar Volume of gas. Example: 44 g of CO₂ gas (1 mole) occupies 22.4 L at STP.",
    },
    {
      id: 'chunk-10sci-t3-1-e',
      textbook_id: 'tb-10-sci',
      class_id: 'c-10',
      subject_id: 'sub-10-sci',
      term_id: 'trm-10sci-3',
      chapter_id: 'ch-10sci-t3-1',
      section_name: 'Percentage Composition and Empirical Formula',
      page_number: 16,
      content: "Percentage composition of an element in a compound = (Total mass of element in 1 mole of compound / Molar mass of compound) × 100%. Empirical Formula represents the simplest whole number ratio of atoms of each element present in a molecule of a compound. Molecular Formula = (Empirical Formula)_n, where n = Molar Mass / Empirical Formula Mass. Gay-Lussac's Law of Combining Volumes: when gases react, they do so in volumes which bear a simple whole number ratio to one another and to products if gaseous, measured at same T and P.",
    },
  )

  // Class 10 Science — Term 3 — Periodic Classification of Elements (Phase 20 authentic ingestion, ch-10sci-t3-2)
  memoryStore.bookChunks.push(
    {
      id: 'chunk-10sci-t3-2-a',
      textbook_id: 'tb-10-sci',
      class_id: 'c-10',
      subject_id: 'sub-10-sci',
      term_id: 'trm-10sci-3',
      chapter_id: 'ch-10sci-t3-2',
      section_name: 'Modern Periodic Law and Periodic Table',
      page_number: 1,
      content: "Modern Periodic Law (Henry Moseley): Physical and chemical properties of elements are periodic functions of their atomic numbers (number of protons). Modern Periodic Table consists of 7 horizontal rows called Periods and 18 vertical columns called Groups. Elements in same group have same valence electron configuration and similar chemical properties. Period 1 has 2 elements (shortest); Periods 2 and 3 have 8 elements; Periods 4 and 5 have 18 elements; Period 6 has 32 elements (longest); Period 7 is incomplete. Inner transition elements: Lanthanides (4f, 57-71) and Actinides (5f, 89-103).",
    },
    {
      id: 'chunk-10sci-t3-2-b',
      textbook_id: 'tb-10-sci',
      class_id: 'c-10',
      subject_id: 'sub-10-sci',
      term_id: 'trm-10sci-3',
      chapter_id: 'ch-10sci-t3-2',
      section_name: 'Periodic Trends in Atomic Properties',
      page_number: 4,
      content: "Periodic trends: (1) Atomic Radius — distance from centre of nucleus to outermost shell. Decreases across a period (left to right) due to increasing nuclear charge; increases down a group due to addition of new electron shells. (2) Ionisation Energy — minimum energy required to remove an electron from isolated neutral gaseous atom. Increases across a period, decreases down a group. (3) Electron Affinity — energy released when an electron is added to neutral gaseous atom. Increases across a period, decreases down a group. (4) Electronegativity — tendency of atom to attract shared electron pair towards itself (Pauling scale, Fluorine = 4.0 highest).",
    },
    {
      id: 'chunk-10sci-t3-2-c',
      textbook_id: 'tb-10-sci',
      class_id: 'c-10',
      subject_id: 'sub-10-sci',
      term_id: 'trm-10sci-3',
      chapter_id: 'ch-10sci-t3-2',
      section_name: 'Metallurgy — Principles and Ore Processing',
      page_number: 8,
      content: "Metallurgy is the science and technology of extracting metals from their ores and purifying them. Minerals: naturally occurring chemical compounds of metals. Ores: minerals from which metals can be extracted profitably and conveniently. Concentration of ores: (1) Gravity separation (Hydraulic washing) for oxide ores (Haematite). (2) Froth Floatation for sulphide ores (Zinc blende, Copper pyrites). (3) Magnetic separation for ferromagnetic ores (Magnetite). (4) Chemical leaching (Bauxite ore of Aluminium). Roasting: heating ore in excess air below melting point (sulphide to oxide). Calcination: heating ore in absence/limited air (carbonate to oxide).",
    },
    {
      id: 'chunk-10sci-t3-2-d',
      textbook_id: 'tb-10-sci',
      class_id: 'c-10',
      subject_id: 'sub-10-sci',
      term_id: 'trm-10sci-3',
      chapter_id: 'ch-10sci-t3-2',
      section_name: 'Extraction of Aluminium, Copper and Iron',
      page_number: 12,
      content: "Extraction of Aluminium from Bauxite (Al₂O₃·2H₂O): (1) Baeyer's process converts bauxite into pure alumina (Al₂O₃). (2) Hall-Héroult electrolytic reduction process: alumina dissolved in molten cryolite (Na₃AlF₆) and fluorspar (CaF₂) at 950°C. Cathode: carbon lining (Al³⁺ + 3e⁻ → Al); Anode: graphite rods. Extraction of Iron in Blast Furnace: Haematite ore (Fe₂O₃) reduced by carbon monoxide: Fe₂O₃ + 3CO → 2Fe + 3CO₂. Extraction of Copper from Copper Pyrites (CuFeS₂): smelting, bessemerisation, electrolytic refining.",
    },
    {
      id: 'chunk-10sci-t3-2-e',
      textbook_id: 'tb-10-sci',
      class_id: 'c-10',
      subject_id: 'sub-10-sci',
      term_id: 'trm-10sci-3',
      chapter_id: 'ch-10sci-t3-2',
      section_name: 'Alloys, Amalgams and Corrosion Prevention',
      page_number: 16,
      content: "An alloy is a homogeneous mixture of two or more metals, or a metal and non-metal. Amalgam is an alloy of mercury with another metal (e.g., dental amalgam: Hg-Ag-Sn). Types of alloys: Ferrous alloys (contain iron: Stainless Steel Fe-Cr-Ni, Invar Fe-Ni) and Non-ferrous alloys (Brass Cu-Zn, Bronze Cu-Sn, Duralumin Al-Cu-Mg-Mn). Corrosion is gradual deterioration of metal by chemical/electrochemical reaction with environment. Rusting of iron: 4Fe + 3O₂ + xH₂O → 2Fe₂O₃·xH₂O (hydrated ferric oxide). Prevention: Galvanisation (coating zinc), Anodising, Electroplating (tin/chromium plating), Cathodic protection.",
    },
  )

  // Class 10 Science — Term 3 — Chemical Reactions (Phase 20 authentic ingestion, ch-10sci-t3-3)
  memoryStore.bookChunks.push(
    {
      id: 'chunk-10sci-t3-3-a',
      textbook_id: 'tb-10-sci',
      class_id: 'c-10',
      subject_id: 'sub-10-sci',
      term_id: 'trm-10sci-3',
      chapter_id: 'ch-10sci-t3-3',
      section_name: 'Types of Chemical Reactions',
      page_number: 1,
      content: "Chemical reactions involve breaking old chemical bonds and forming new bonds to produce new substances. Types: (1) Combination reaction (Synthesis) — two or more reactants combine to form a single product: A + B → AB (e.g., 2Mg + O₂ → 2MgO). (2) Decomposition reaction — single compound breaks down into two or more simpler substances: AB → A + B (Thermal: CaCO₃ → CaO + CO₂; Electrolytic: 2H₂O → 2H₂ + O₂; Photolytic: 2AgCl → 2Ag + Cl₂). (3) Displacement reaction — more reactive element displaces less reactive element: Zn + CuSO₄ → ZnSO₄ + Cu. (4) Double displacement (Metathesis) — exchange of ions between two compounds: Na₂SO₄ + BaCl₂ → BaSO₄↓ + 2NaCl.",
    },
    {
      id: 'chunk-10sci-t3-3-b',
      textbook_id: 'tb-10-sci',
      class_id: 'c-10',
      subject_id: 'sub-10-sci',
      term_id: 'trm-10sci-3',
      chapter_id: 'ch-10sci-t3-3',
      section_name: 'Oxidation, Reduction and Redox Reactions',
      page_number: 4,
      content: "Classical concepts: Oxidation is addition of oxygen or removal of hydrogen; Reduction is addition of hydrogen or removal of oxygen. Electronic concept: Oxidation is loss of electrons (OIL: Oxidation Is Loss); Reduction is gain of electrons (RIG: Reduction Is Gain). A Redox reaction is a chemical reaction in which oxidation and reduction occur simultaneously. Example: CuO + H₂ → Cu + H₂O (CuO is reduced to Cu; H₂ is oxidized to H₂O). Oxidising agent (oxidant) gains electrons and gets reduced; Reducing agent (reductant) loses electrons and gets oxidized.",
    },
    {
      id: 'chunk-10sci-t3-3-c',
      textbook_id: 'tb-10-sci',
      class_id: 'c-10',
      subject_id: 'sub-10-sci',
      term_id: 'trm-10sci-3',
      chapter_id: 'ch-10sci-t3-3',
      section_name: 'Rate of Chemical Reaction and Influencing Factors',
      page_number: 8,
      content: "Rate of chemical reaction is the change in concentration of reactants or products per unit time: Rate = -d[Reactant]/dt = +d[Product]/dt. Factors affecting reaction rate: (1) Nature of reactants — ionic reactions are fast, covalent reactions are slow. (2) Concentration of reactants — higher concentration increases collision frequency and rate. (3) Temperature — rate increases with temperature (rate doubles for 10°C rise). (4) Catalyst — speeds up reaction by providing lower activation energy pathway without being consumed. (5) Surface area of solid reactants — powdered reactants react faster due to greater surface area. (6) Pressure for gaseous reactants.",
    },
    {
      id: 'chunk-10sci-t3-3-d',
      textbook_id: 'tb-10-sci',
      class_id: 'c-10',
      subject_id: 'sub-10-sci',
      term_id: 'trm-10sci-3',
      chapter_id: 'ch-10sci-t3-3',
      section_name: 'Chemical Equilibrium and Reversible Reactions',
      page_number: 12,
      content: "Reversible reaction is a chemical reaction that can proceed in both forward and reverse directions: A + B ⇌ C + D (e.g., N₂ + 3H₂ ⇌ 2NH₃). Irreversible reaction proceeds in one direction only to completion. Chemical Equilibrium is a dynamic state in a reversible reaction carried out in a closed system where the rate of forward reaction equals the rate of reverse reaction, and concentrations of reactants and products remain constant. Characteristics of equilibrium: dynamic nature, reachable from either side, unaffected by catalysts (catalyst speeds up both forward and reverse rates equally).",
    },
    {
      id: 'chunk-10sci-t3-3-e',
      textbook_id: 'tb-10-sci',
      class_id: 'c-10',
      subject_id: 'sub-10-sci',
      term_id: 'trm-10sci-3',
      chapter_id: 'ch-10sci-t3-3',
      section_name: 'pH Scale, Indicators and Applications in Daily Life',
      page_number: 16,
      content: "pH is a measure of hydrogen ion concentration in a solution: pH = -log₁₀[H⁺]. pH scale ranges from 0 to 14 at 25°C. Neutral solution: pH = 7 ([H⁺] = 10⁻⁷ M). Acidic solution: pH < 7 ([H⁺] > 10⁻⁷ M). Basic (alkaline) solution: pH > 7 ([H⁺] < 10⁻⁷ M). Indicators: Universal indicator, litmus (acid red, base blue), phenolphthalein (acid colourless, base pink), methyl orange (acid red, base yellow). Importance of pH: (1) Human body functions best at pH 7.0 to 7.8. (2) Digestive system: stomach produces HCl (pH ~ 1 to 4); antacids like Mg(OH)₂ neutralise excess acid. (3) Tooth decay starts when mouth pH falls below 5.5. (4) Soil pH affects crop growth (lime added to acidic soil).",
    },
  )

  // Phase 25 — Initial Demo Assignments & Submissions
  if (memoryStore.assignments.length === 0) {
    memoryStore.assignments.push(
      {
        id: 'asg-demo-1',
        teacher_id: 'user-teacher-demo',
        title: 'Laws of Motion Practice & Homework',
        description: 'Complete the Newton laws of motion assignment from Chapter 1 (Pages 1-15).',
        class_level: 'Class 10',
        medium: 'English',
        subject_id: 'sub-10-sci',
        term_id: 'trm-10sci-1',
        chapter_id: 'ch-10sci-t1-1',
        due_date: '2026-08-30',
        status: 'ACTIVE',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'asg-demo-2',
        teacher_id: 'user-teacher-demo',
        title: 'Optics & Lens Formula Assignment',
        description: 'Practice ray diagrams and refraction calculations from Chapter 2 (Pages 1-18).',
        class_level: 'Class 10',
        medium: 'English',
        subject_id: 'sub-10-sci',
        term_id: 'trm-10sci-1',
        chapter_id: 'ch-10sci-t1-2',
        due_date: '2026-09-05',
        status: 'ACTIVE',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    )
  }

  if (memoryStore.assignmentSubmissions.length === 0) {
    memoryStore.assignmentSubmissions.push({
      id: 'sub-demo-1',
      assignment_id: 'asg-demo-1',
      student_id: 'user-student-demo',
      status: 'SUBMITTED',
      score: 4,
      percentage: 80,
      submitted_at: new Date().toISOString(),
      answers: [
        { questionId: 'q-1', selectedAnswer: 'Inertia' },
        { questionId: 'q-2', selectedAnswer: 'F = ma' },
      ],
      feedback: "Good work on Newton's laws! Review page 8 for momentum conservation.",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
  }

  // ── Class 10 Mathematics & Social Science Textbooks ──────────────────────────
  if (!memoryStore.textbooks.some((t) => t.id === 'tb-10-math')) {
    memoryStore.textbooks.push({
      id: 'tb-10-math',
      class_id: 'c-10',
      subject_id: 'sub-10-math',
      book_name: 'Tamil Nadu State Board Class 10 Mathematics Textbook (Samacheer Kalvi)',
      publisher: 'Tamil Nadu Textbook and Educational Services Corporation',
      academic_year: '2024-2025',
      pdf_url: '/data/textbooks/class10/mathematics/english/relations_and_functions_eng.pdf',
      source_hash: 'math10hash2026',
      status: 'READY',
    })
  }

  if (!memoryStore.textbooks.some((t) => t.id === 'tb-10-soc')) {
    memoryStore.textbooks.push({
      id: 'tb-10-soc',
      class_id: 'c-10',
      subject_id: 'sub-10-soc',
      book_name: 'Tamil Nadu State Board Class 10 Social Science Textbook (Samacheer Kalvi)',
      publisher: 'Tamil Nadu Textbook and Educational Services Corporation',
      academic_year: '2024-2025',
      pdf_url: '/data/textbooks/class10/social/english/world_war_1_eng.pdf',
      source_hash: 'soc10hash2026',
      status: 'READY',
    })
  }

  // ── Class 10 Mathematics Chunks ──────────────────────────────────────────────
  const mathChunks = [
    // Unit 1: Relations and Functions
    {
      id: 'chunk-10math-t1-1-a',
      textbook_id: 'tb-10-math',
      class_id: 'c-10',
      subject_id: 'sub-10-math',
      term_id: 'trm-10math-1',
      chapter_id: 'ch-10math-t1-1',
      topic_id: 'tpc-10math-t1-1-1',
      section_name: 'Cartesian Product and Ordered Pairs',
      page_number: 2,
      content: 'If A and B are two non-empty sets, then the set of all ordered pairs (a, b) such that a belongs to A and b belongs to B is called the Cartesian Product of A and B, denoted by A x B. If n(A) = p and n(B) = q, then n(A x B) = pq. Cartesian product is not commutative in general: A x B != B x A unless A = B.',
    },
    {
      id: 'chunk-10math-t1-1-b',
      textbook_id: 'tb-10-math',
      class_id: 'c-10',
      subject_id: 'sub-10-math',
      term_id: 'trm-10math-1',
      chapter_id: 'ch-10math-t1-1',
      topic_id: 'tpc-10math-t1-1-2',
      section_name: 'Relations and Functions Definition',
      page_number: 8,
      content: 'A relation R from set A to set B is a subset of A x B. A relation f from A to B is a function if every element in A has one and only one image in B. The set A is called the Domain, set B is the Co-domain, and the set of all images is the Range of f. Functions can be one-one (injective), many-one, onto (surjective), or one-one and onto (bijective).',
    },
    // Unit 2: Numbers and Sequences
    {
      id: 'chunk-10math-t1-2-a',
      textbook_id: 'tb-10-math',
      class_id: 'c-10',
      subject_id: 'sub-10-math',
      term_id: 'trm-10math-1',
      chapter_id: 'ch-10math-t1-2',
      topic_id: 'tpc-10math-t1-2-1',
      section_name: "Euclid's Division Lemma and Algorithm",
      page_number: 38,
      content: "Euclid's Division Lemma states that for any two positive integers a and b, there exist unique integers q and r such that a = bq + r, where 0 <= r < b. Euclid's Division Algorithm is a technique based on this lemma to compute the Highest Common Factor (HCF) or GCD of two positive integers.",
    },
    {
      id: 'chunk-10math-t1-2-b',
      textbook_id: 'tb-10-math',
      class_id: 'c-10',
      subject_id: 'sub-10-math',
      term_id: 'trm-10math-1',
      chapter_id: 'ch-10math-t1-2',
      topic_id: 'tpc-10math-t1-2-2',
      section_name: 'Arithmetic and Geometric Progressions',
      page_number: 52,
      content: 'An Arithmetic Progression (AP) is a sequence in which each term is obtained by adding a fixed number d (common difference) to the preceding term. The nth term is tn = a + (n - 1)d and sum of n terms is Sn = n/2 [2a + (n - 1)d]. A Geometric Progression (GP) is a sequence where each term is obtained by multiplying the previous term by a fixed non-zero ratio r. The nth term of GP is tn = a * r^(n - 1).',
    },
    // Unit 3: Algebra
    {
      id: 'chunk-10math-t1-3-a',
      textbook_id: 'tb-10-math',
      class_id: 'c-10',
      subject_id: 'sub-10-math',
      term_id: 'trm-10math-1',
      chapter_id: 'ch-10math-t1-3',
      topic_id: 'tpc-10math-t1-3-1',
      section_name: 'Quadratic Equations and Nature of Roots',
      page_number: 104,
      content: 'A quadratic equation in variable x is an equation of the form ax^2 + bx + c = 0 where a != 0. The roots are given by the quadratic formula x = (-b +- sqrt(b^2 - 4ac)) / (2a). The discriminant Delta = b^2 - 4ac determines the nature of roots: if Delta > 0, roots are real and unequal; if Delta = 0, roots are real and equal; if Delta < 0, there are no real roots.',
    },
    // Unit 4: Geometry
    {
      id: 'chunk-10math-t1-4-a',
      textbook_id: 'tb-10-math',
      class_id: 'c-10',
      subject_id: 'sub-10-math',
      term_id: 'trm-10math-1',
      chapter_id: 'ch-10math-t1-4',
      topic_id: 'tpc-10math-t1-4-1',
      section_name: 'Basic Proportionality (Thales) Theorem and Pythagoras Theorem',
      page_number: 162,
      content: 'Basic Proportionality Theorem (Thales Theorem): If a line is drawn parallel to one side of a triangle to intersect the other two sides in distinct points, then the other two sides are divided in the same ratio (AD/DB = AE/EC). Pythagoras Theorem states that in a right-angled triangle, the square of the hypotenuse is equal to the sum of the squares of the other two sides: AC^2 = AB^2 + BC^2.',
    },
    // Unit 5: Coordinate Geometry
    {
      id: 'chunk-10math-t1-5-a',
      textbook_id: 'tb-10-math',
      class_id: 'c-10',
      subject_id: 'sub-10-math',
      term_id: 'trm-10math-1',
      chapter_id: 'ch-10math-t1-5',
      topic_id: 'tpc-10math-t1-5-1',
      section_name: 'Area of Triangle and Slope of Straight Line',
      page_number: 208,
      content: 'The area of a triangle with vertices (x1, y1), (x2, y2), (x3, y3) is given by Area = 1/2 | x1(y2 - y3) + x2(y3 - y1) + x3(y1 - y2) |. If Area = 0, the three points are collinear. The slope m of a non-vertical line passing through (x1, y1) and (x2, y2) is m = (y2 - y1) / (x2 - x1) = tan(theta). Two non-vertical lines are parallel if and only if m1 = m2, and perpendicular if m1 * m2 = -1.',
    },
  ]

  // ── Class 10 Social Science Chunks ───────────────────────────────────────────
  const socChunks = [
    // History Unit 1: Outbreak of World War I and Its Aftermath
    {
      id: 'chunk-10soc-t1-1-a',
      textbook_id: 'tb-10-soc',
      class_id: 'c-10',
      subject_id: 'sub-10-soc',
      term_id: 'trm-10soc-1',
      chapter_id: 'ch-10soc-t1-1',
      topic_id: 'tpc-10soc-t1-1-1',
      section_name: 'Causes of World War I and the League of Nations',
      page_number: 1,
      content: 'The primary causes of World War I (1914–1918) included European alliance systems (Triple Alliance of Germany, Austria-Hungary, Italy vs Triple Entente of Britain, France, Russia), aggressive imperialist rivalries, militarism, and extreme nationalism. The immediate spark was the assassination of Archduke Franz Ferdinand of Austria. The war ended with the Treaty of Versailles (1919) and the establishment of the League of Nations to promote collective security.',
    },
    // Geography Unit 1: India — Location, Relief and Drainage
    {
      id: 'chunk-10soc-t1-2-a',
      textbook_id: 'tb-10-soc',
      class_id: 'c-10',
      subject_id: 'sub-10-soc',
      term_id: 'trm-10soc-1',
      chapter_id: 'ch-10soc-t1-2',
      topic_id: 'tpc-10soc-t1-2-1',
      section_name: 'Physiographic Divisions and Drainage of India',
      page_number: 89,
      content: 'India extends from 8 deg 4 min N to 37 deg 6 min N latitudes and 68 deg 7 min E to 97 deg 25 min E longitudes. The major physiographic divisions are: The Northern Mountains (Himalayas - Himadri, Himachal, Shiwaliks), The Northern Plains, The Peninsular Plateau, The Coastal Plains, and The Islands. Rivers of India are divided into Himalayan Rivers (perennial - Indus, Ganga, Brahmaputra) and Peninsular Rivers (seasonal - Mahanadi, Godavari, Krishna, Kaveri, Narmada, Tapti).',
    },
    // Civics Unit 1: Indian Constitution
    {
      id: 'chunk-10soc-t1-3-a',
      textbook_id: 'tb-10-soc',
      class_id: 'c-10',
      subject_id: 'sub-10-soc',
      term_id: 'trm-10soc-1',
      chapter_id: 'ch-10soc-t1-3',
      topic_id: 'tpc-10soc-t1-3-1',
      section_name: 'Preamble, Fundamental Rights and Directive Principles',
      page_number: 165,
      content: 'The Constitution of India was framed by the Constituent Assembly and came into effect on 26th January 1950. The Preamble declares India to be a Sovereign, Socialist, Secular, Democratic Republic. Fundamental Rights are enshrined in Part III (Articles 12 to 35): Right to Equality, Right to Freedom, Right against Exploitation, Right to Freedom of Religion, Cultural and Educational Rights, and Right to Constitutional Remedies (Article 32 - Heart and Soul of the Constitution). Part IV contains Directive Principles of State Policy.',
    },
    // Economics Unit 1: Gross Domestic Product and its Growth
    {
      id: 'chunk-10soc-t1-4-a',
      textbook_id: 'tb-10-soc',
      class_id: 'c-10',
      subject_id: 'sub-10-soc',
      term_id: 'trm-10soc-1',
      chapter_id: 'ch-10soc-t1-4',
      topic_id: 'tpc-10soc-t1-4-1',
      section_name: 'Gross Domestic Product (GDP) and Sectoral Composition',
      page_number: 218,
      content: 'Gross Domestic Product (GDP) is the market value of all final goods and services produced within the geographical boundaries of a country during a specific time period (usually one year). The Indian economy is classified into three sectors: Primary Sector (Agriculture, forestry, mining), Secondary Sector (Manufacturing, construction, industries), and Tertiary Sector (Service sector - banking, education, transport). The tertiary sector is the largest contributor to India GDP.',
    },
  ]

  // ── Class 6 Science Chunks ───────────────────────────────────────────────────
  const class6Chunks = [
    {
      id: 'chunk-6sci-t1-1-a',
      textbook_id: 'tb-6-sci',
      class_id: 'c-6',
      subject_id: 'sub-6-sci',
      term_id: 'trm-6sci-1',
      chapter_id: 'ch-6sci-t1-1',
      section_name: 'SI Units and Measuring Length',
      page_number: 2,
      content: 'Measurement is the determination of size or magnitude of a physical quantity. The International System of Units (SI) is accepted worldwide for standard measurements. The SI base unit of length is the Metre (m), mass is the Kilogram (kg), time is the Second (s), and temperature is the Kelvin (K). Volume of liquids is measured in litres (l) or millilitres (ml) using measuring cylinders. 1 metre = 100 centimetres = 1000 millimetres.',
    },
    {
      id: 'chunk-6sci-t1-2-a',
      textbook_id: 'tb-6-sci',
      class_id: 'c-6',
      subject_id: 'sub-6-sci',
      term_id: 'trm-6sci-1',
      chapter_id: 'ch-6sci-t1-2',
      section_name: 'Forces and Push-Pull Actions',
      page_number: 16,
      content: 'Forces are pushes or pulls upon an object resulting from its interaction with another object. Forces can be classified into contact forces (muscular force, mechanical force, frictional force) and non-contact forces (gravitational force, magnetic force, electrostatic force). Force can change the state of rest or motion of an object, change speed, change direction, or change the shape of an object. Speed is distance traveled divided by time taken (Speed = s / t).',
    },
  ]

  // ── Class 7 Science Chunks ───────────────────────────────────────────────────
  const class7Chunks = [
    {
      id: 'chunk-7sci-t1-1-a',
      textbook_id: 'tb-7-sci',
      class_id: 'c-7',
      subject_id: 'sub-7-sci',
      term_id: 'trm-7sci-1',
      chapter_id: 'ch-7sci-t1-1',
      section_name: 'Density and Astronomical Distance',
      page_number: 4,
      content: 'Density is defined as the mass of a substance per unit volume: Density (d) = Mass (M) / Volume (V). The SI unit of density is kg/m³, and CGS unit is g/cm³. For measuring astronomical distances, an Astronomical Unit (AU) is the mean distance between the center of the Earth and the center of the Sun (1 AU = 1.496 × 10¹¹ m). A Light Year is the distance traveled by light in vacuum in one year (1 Light Year = 9.46 × 10¹⁵ m).',
    },
    {
      id: 'chunk-7sci-t1-2-a',
      textbook_id: 'tb-7-sci',
      class_id: 'c-7',
      subject_id: 'sub-7-sci',
      term_id: 'trm-7sci-1',
      chapter_id: 'ch-7sci-t1-2',
      section_name: 'Speed, Velocity and Acceleration',
      page_number: 18,
      content: 'Distance is the total length of path traveled by an object, while displacement is the shortest distance between initial and final positions in a specified direction. Speed is the rate of change of distance (scalar), whereas velocity is the rate of change of displacement (vector). Acceleration is the rate of change of velocity: a = (v - u) / t, measured in m/s². If velocity decreases with time, it is called negative acceleration or retardation/deceleration.',
    },
  ]

  // ── Class 8 Science Chunks ───────────────────────────────────────────────────
  const class8Chunks = [
    {
      id: 'chunk-8sci-t1-1-a',
      textbook_id: 'tb-8-sci',
      class_id: 'c-8',
      subject_id: 'sub-8-sci',
      term_id: 'trm-8sci-1',
      chapter_id: 'ch-8sci-t1-1',
      section_name: 'Base SI Units and Luminous Intensity',
      page_number: 3,
      content: 'The International System of Units (SI) has seven base quantities: Length (metre, m), Mass (kilogram, kg), Time (second, s), Temperature (kelvin, K), Electric current (ampere, A), Amount of substance (mole, mol), and Luminous intensity (candela, cd). Luminous intensity is the measure of light emitted by a light source in a particular direction per unit solid angle. Plane angle is measured in radian (rad) and solid angle in steradian (sr).',
    },
    {
      id: 'chunk-8sci-t1-2-a',
      textbook_id: 'tb-8-sci',
      class_id: 'c-8',
      subject_id: 'sub-8-sci',
      term_id: 'trm-8sci-1',
      chapter_id: 'ch-8sci-t1-2',
      section_name: "Pressure in Liquids and Pascal's Law",
      page_number: 20,
      content: "Pressure is the force acting perpendicularly on a unit surface area: Pressure (P) = Thrust (F) / Area (A). SI unit of pressure is Pascal (Pa) or N/m². Liquid pressure at depth h is given by P = hρg (where h is depth, ρ is density of liquid, and g is acceleration due to gravity). Pascal's Law states that the external pressure applied on an incompressible liquid enclosed in a container is transmitted equally and undiminished in all directions. Hydraulic lift and hydraulic brakes work on Pascal's principle.",
    },
  ]

  // ── Class 9 Science Chunks ───────────────────────────────────────────────────
  const class9Chunks = [
    {
      id: 'chunk-9sci-t1-1-a',
      textbook_id: 'tb-9-sci',
      class_id: 'c-9',
      subject_id: 'sub-9-sci',
      term_id: 'trm-9sci-1',
      chapter_id: 'ch-9sci-t1-1',
      section_name: 'Screw Gauge and Vernier Caliper',
      page_number: 5,
      content: "The Vernier Caliper has a least count of 0.01 cm (0.1 mm), used to measure internal/external diameter of cylinders and depth of beakers. A Screw Gauge is an instrument with a least count of 0.01 mm (0.001 cm), used to measure the thickness of thin wires, sheets of paper, or glass plates. Least Count of screw gauge = Pitch of screw / Total number of head scale divisions. Mass is the quantity of matter contained in a body (constant everywhere, measured in kg using beam balance), while weight is the gravitational pull acting on that mass (W = mg, measured in Newtons using spring balance).",
    },
    {
      id: 'chunk-9sci-t1-2-a',
      textbook_id: 'tb-9-sci',
      class_id: 'c-9',
      subject_id: 'sub-9-sci',
      term_id: 'trm-9sci-1',
      chapter_id: 'ch-9sci-t1-2',
      section_name: 'Equations of Motion and Circular Motion',
      page_number: 22,
      content: "For an object moving with uniform acceleration 'a', initial velocity 'u', final velocity 'v', displacement 's', and time 't', the three fundamental kinematic equations of motion are: (1) v = u + at, (2) s = ut + ½at², (3) v² = u² + 2as. In uniform circular motion, an object travels along a circular path with constant speed, but continuous change in direction produces centripetal acceleration a_c = v² / r directed toward the centre of the circle.",
    },
  ]

  // ── Class 11 Physics Chunks ──────────────────────────────────────────────────
  const class11Chunks = [
    {
      id: 'chunk-11phy-t1-1-a',
      textbook_id: 'tb-11-phy',
      class_id: 'c-11',
      subject_id: 'sub-11-phy',
      term_id: 'trm-11phy-1',
      chapter_id: 'ch-11phy-t1-1',
      section_name: 'Dimensional Analysis and Applications',
      page_number: 12,
      content: 'Dimensional formula expresses a physical quantity in terms of fundamental dimensions [M], [L], [T], [A], [K], [cd], [mol]. Principle of Homogeneity of Dimensions states that the dimensions of each term in a physical equation must be the same on both sides. Applications of dimensional analysis: (1) Convert a physical quantity from one unit system to another, (2) Check dimensional correctness of physical equations, (3) Deduce relations among various physical quantities.',
    },
    {
      id: 'chunk-11phy-t1-3-a',
      textbook_id: 'tb-11-phy',
      class_id: 'c-11',
      subject_id: 'sub-11-phy',
      term_id: 'trm-11phy-1',
      chapter_id: 'ch-11phy-t1-3',
      section_name: 'Friction and Banking of Roads',
      page_number: 115,
      content: 'Friction is the opposing force that comes into play between two surfaces in contact when one body moves or tends to move over another. Static friction (f_s <= μ_s N) opposes initiation of motion, while kinetic friction (f_k = μ_k N) opposes ongoing motion, where N is the normal reaction. On curved roads, to avoid skidding without relying on friction, the outer edge of the road is raised above the inner edge. The optimum banking angle θ is given by tan(θ) = v² / (rg).',
    },
  ]

  // ── Class 12 Physics Chunks ──────────────────────────────────────────────────
  const class12Chunks = [
    {
      id: 'chunk-12phy-t1-1-a',
      textbook_id: 'tb-12-phy',
      class_id: 'c-12',
      subject_id: 'sub-12-phy',
      term_id: 'trm-12phy-1',
      chapter_id: 'ch-12phy-t1-1',
      section_name: "Coulomb's Law and Gauss's Law",
      page_number: 15,
      content: "Coulomb's Law states that the electrostatic force between two stationary point charges q1 and q2 separated by distance r in vacuum is F = (1 / (4πε₀)) * (q1 * q2 / r²), where 1/(4πε₀) = 9 × 10⁹ N m²/C². Gauss's Law states that the total electric flux Φ_E through any closed surface is equal to 1/ε₀ times the net enclosed electric charge: Φ_E = ∮ E · dA = Q_enclosed / ε₀. A capacitor stores electrical charge and energy; capacitance of a parallel plate capacitor in vacuum is C = ε₀A / d.",
    },
    {
      id: 'chunk-12phy-t1-2-a',
      textbook_id: 'tb-12-phy',
      class_id: 'c-12',
      subject_id: 'sub-12-phy',
      term_id: 'trm-12phy-1',
      chapter_id: 'ch-12phy-t1-2',
      section_name: "Kirchhoff's Rules and Wheatstone's Bridge",
      page_number: 92,
      content: "Kirchhoff's Current Rule (Junction Rule) states that the algebraic sum of electric currents meeting at any junction in an electrical circuit is zero (conservation of charge, ΣI = 0). Kirchhoff's Voltage Rule (Loop Rule) states that the algebraic sum of potential differences and emfs around any closed loop is zero (conservation of energy, ΣV = 0). A Wheatstone's Bridge consists of four resistors P, Q, R, S in a diamond network; when the galvanometer shows null deflection (bridge balanced), the condition is P / Q = R / S.",
    },
  ]

  // ── Multi-Class Tamil Chunks ────────────────────────────────────────────────
  const tamilChunks = [
    {
      id: 'chunk-6tam-t1-1-a',
      textbook_id: 'tb-6-tam',
      class_id: 'c-6',
      subject_id: 'sub-6-tam',
      term_id: 'trm-6tam-1',
      chapter_id: 'ch-6tam-t1-1',
      section_name: 'தமிழுக்கு அமுதென்று பெயர் - பாரதிதாசன்',
      page_number: 2,
      content: 'தமிழுக்கு அமுதென்று பேர் - அந்தத் தமிழ் இன்பத் தமிழ் எங்கள் உயிருக்கு நேர்! பாரதிதாசன் தமிழை அமுதம், நிலவு, மனம் என்று பலவாறாகப் போற்றுகிறார். தமிழ் இளமைக்குக் காரணமான பால் போன்றது; புலவர்க்கு வேல் போன்ற கூர்மையான கருவி; அசதிக்குத் தேன் போன்ற சுவை தருவது; அறிவுக்குத் துணைநிற்கும் தோள் போன்றது; கவிதைக்கு வைரத்தின் வாள் போன்றது.',
    },
    {
      id: 'chunk-7tam-t1-1-a',
      textbook_id: 'tb-7-tam',
      class_id: 'c-7',
      subject_id: 'sub-7-tam',
      term_id: 'trm-7tam-1',
      chapter_id: 'ch-7tam-t1-1',
      section_name: 'அருள்நெறி அறிவை - நாமக்கல் கவிஞர் வெ. இராமலிங்கனார்',
      page_number: 2,
      content: 'அருள்நெறி அறிவைத் தரலாகும் - அதுவே தமிழன் குரலாகும். கொல்லா விரதம் குறியாகக் கொள்கை பொய்யா நெறியாக எல்லா மனிதரும் இன்புறவே என்றும் இசைந்திடும் அன்பறமே! எங்கள் தமிழ்மொழி அருள்நெறிகள் நிரம்பிய அறிவைத் தருகிறது. தமிழ் மக்களின் குரலாக விளங்குகிறது. அன்பையும் அறத்தையும் ஊட்டி வளர்க்கிறது.',
    },
    {
      id: 'chunk-8tam-t1-1-a',
      textbook_id: 'tb-8-tam',
      class_id: 'c-8',
      subject_id: 'sub-8-tam',
      term_id: 'trm-8tam-1',
      chapter_id: 'ch-8tam-t1-1',
      section_name: 'வாழ்க நிரந்தரம் - மகாகவி பாரதியார்',
      page_number: 2,
      content: 'வாழ்க நிரந்தரம் வாழ்க தமிழ்மொழி வாழிய வாழியவே! வானமளந்தது அனைத்தும் அளந்திடும் வண்மொழி வாழியவே! ஏழ்கடல் வைப்பினுந் தன்மணம் வீசி இசைகொண்டு வாழியவே! எங்கள் தமிழ்மொழி காலத்தால் அழியாமல் நிலைத்து வாழ்க! ஆகாயத்தால் சூழப்பட்ட எல்லாவற்றையும் அறிந்து உரைக்கும் வளமான தமிழ்மொழி எக்காலத்தும் வாழ்க!',
    },
    {
      id: 'chunk-9tam-t1-1-a',
      textbook_id: 'tb-9-tam',
      class_id: 'c-9',
      subject_id: 'sub-9-tam',
      term_id: 'trm-9tam-1',
      chapter_id: 'ch-9tam-t1-1',
      section_name: 'திராவிட மொழிகளின் தோற்றமும் வகைப்பாடும்',
      page_number: 2,
      content: 'திராவிடம் என்னும் சொல்லை முதன்முதலில் குறிப்பிட்டவர் குமரிலபட்டர். தமிழ் என்னும் சொல்லிலிருந்தே திராவிடா என்னும் சொல் உருவானது என்று மொழியியலாளர் கால்டுவெல் விளக்குகிறார். திராவிட மொழிகள் தென் திராவிட மொழிகள் (தமிழ், மலையாளம், கன்னடம், குடகு, துளு), நடுத் திராவிட மொழிகள் (தெலுங்கு, கூயி, கூவி, கோண்டி), வட திராவிட மொழிகள் (குரூக், மால்தோ, பிராகுயி) என மூன்று வகைப்படும்.',
    },
    {
      id: 'chunk-10tam-t1-1-a',
      textbook_id: 'tb-10-tam',
      class_id: 'c-10',
      subject_id: 'sub-10-tam',
      term_id: 'trm-10tam-1',
      chapter_id: 'ch-10tam-t1-1',
      section_name: 'அன்னை மொழியே - பாவலரேறு பெருஞ்சித்திரனார்',
      page_number: 2,
      content: 'அன்னை மொழியே! அழகார்ந்த செந்தமிழே! முன்னைக்கும் முன்னை முகிழ்த்த நறுங்கனியே! கன்னிக்குமரி கடல் கொண்ட நாட்டிடையில் மன்னி அரசிருந்த மண்ணுலகப் பேரரசே! நற்கணக்கே! நண்சிலம்பே! மணிமேகலை வடிவழகே! முன்னும் நினைவால் முடிதாழ வாழ்த்துவமே! கணிச்சாறு தொகுதியிலிருந்து எடுக்கப்பட்ட இப்பாடல் தமிழின் பெருமையை அழகுற விவரிக்கிறது.',
    },
  ]

  // ── Multi-Class English Chunks ──────────────────────────────────────────────
  const englishChunks = [
    {
      id: 'chunk-6eng-t1-1-a',
      textbook_id: 'tb-6-eng',
      class_id: 'c-6',
      subject_id: 'sub-6-eng',
      term_id: 'trm-6eng-1',
      chapter_id: 'ch-6eng-t1-1',
      section_name: 'Marine Turtles and Nesting Season',
      page_number: 1,
      content: 'Between the months of January and March, female Olive Ridley turtles come ashore at night to lay their eggs on the beaches of Odisha and Tamil Nadu. There are seven species of marine turtles in the world: Olive Ridley, Green Turtle, Hawksbill, Leatherback, and Loggerhead. Sea turtles are reptiles and spend their entire lives in the ocean, coming ashore only to lay eggs. Conservation efforts help protect hatchlings from predators.',
    },
    {
      id: 'chunk-7eng-t1-1-a',
      textbook_id: 'tb-7-eng',
      class_id: 'c-7',
      subject_id: 'sub-7-eng',
      term_id: 'trm-7eng-1',
      chapter_id: 'ch-7eng-t1-1',
      section_name: 'Hamid and the Gift of Tongs - Munshi Premchand',
      page_number: 1,
      content: 'Hamid was a four-year-old poor orphan boy who lived with his grandmother Granny Ameena. On Eid day, while other children spent their pocket money on sweets and clay toys at the fair, Hamid wisely bought a pair of iron tongs for three paise so his grandmother would not burn her fingers while making rotis on the iron pan. Granny Ameena was deeply touched by his selfless love.',
    },
    {
      id: 'chunk-8eng-t1-1-a',
      textbook_id: 'tb-8-eng',
      class_id: 'c-8',
      subject_id: 'sub-8-eng',
      term_id: 'trm-8eng-1',
      chapter_id: 'ch-8eng-t1-1',
      section_name: "Ramayya's House and the Diamond Mookuthi",
      page_number: 1,
      content: "Ramayya was a simple householder in a town. Two sparrows built a nest in his tiled roof. The male bird found a diamond nose-jewel discarded in a muck heap and dropped it on the floor. Ramayya's wife discovered the sparkling jewel and put it on delightedly. The jewel belonged to their neighbour Minakshi Ammal's daughter. Fear of the police and guilt made Ramayya and his wife live in perpetual anxiety, teaching that greed brings misery.",
    },
    {
      id: 'chunk-9eng-t1-1-a',
      textbook_id: 'tb-9-eng',
      class_id: 'c-9',
      subject_id: 'sub-9-eng',
      term_id: 'trm-9eng-1',
      chapter_id: 'ch-9eng-t1-1',
      section_name: 'Sachin Tendulkar and Coach Ramakant Achrekar',
      page_number: 1,
      content: 'At the age of eleven, Sachin Tendulkar began his cricket training under the renowned coach Ramakant Achrekar at Shivaji Park, Mumbai. Achrekar sir placed a one-rupee coin on top of the stumps during practice; if Sachin survived the entire session without getting out, the coin was his. Sachin won thirteen such coins, which he treasures as his most valuable possessions, illustrating the power of rigorous discipline.',
    },
    {
      id: 'chunk-10eng-t1-1-a',
      textbook_id: 'tb-10-eng',
      class_id: 'c-10',
      subject_id: 'sub-10-eng',
      term_id: 'trm-10eng-1',
      chapter_id: 'ch-10eng-t1-1',
      section_name: "The Young Seagull's Fear and Flight - Liam O'Flaherty",
      page_number: 1,
      content: 'The young seagull was alone on his ledge, terrified to fly because his wings seemed too weak to support him over the vast sea. His parents and siblings had already learned to fly and catch fish. Driven by desperate hunger, when his mother flew close with a piece of fish and halted just out of reach, the young seagull dived forward, spreading his wings and discovering he could soar, proving that necessity overcomes fear.',
    },
  ]

  // ── Multi-Class Math Chunks ─────────────────────────────────────────────────
  const extraMathChunks = [
    {
      id: 'chunk-6math-t1-1-a',
      textbook_id: 'tb-6-math',
      class_id: 'c-6',
      subject_id: 'sub-6-math',
      term_id: 'trm-6math-1',
      chapter_id: 'ch-6math-t1-1',
      section_name: 'Place Value and Indian vs International System',
      page_number: 1,
      content: 'In the Indian Number System, commas are placed after hundreds (3 digits), thousands (2 digits), and lakhs (2 digits): e.g., 7,59,42,801 (Seven crore fifty-nine lakh forty-two thousand eight hundred and one). In the International System, commas are placed in periods of three digits: e.g., 75,942,801 (Seventy-five million nine hundred forty-two thousand eight hundred one). Whole numbers start from 0 (W = {0, 1, 2, ...}) and Natural numbers start from 1 (N = {1, 2, 3, ...}).',
    },
    {
      id: 'chunk-7math-t1-1-a',
      textbook_id: 'tb-7-math',
      class_id: 'c-7',
      subject_id: 'sub-7-math',
      term_id: 'trm-7math-1',
      chapter_id: 'ch-7math-t1-1',
      section_name: 'Properties of Integer Addition and Multiplication',
      page_number: 2,
      content: 'Integers (Z) consist of negative numbers, zero, and positive numbers (... -3, -2, -1, 0, 1, 2, 3 ...). Properties: (1) Closure property: a + b is an integer. (2) Commutative property: a + b = b + a. (3) Associative property: (a + b) + c = a + (b + c). (4) Additive identity: a + 0 = a. (5) Additive inverse: a + (-a) = 0. Product of two negative integers is positive: (-a) × (-b) = ab; product of one positive and one negative is negative: a × (-b) = -ab.',
    },
    {
      id: 'chunk-8math-t1-1-a',
      textbook_id: 'tb-8-math',
      class_id: 'c-8',
      subject_id: 'sub-8-math',
      term_id: 'trm-8math-1',
      chapter_id: 'ch-8math-t1-1',
      section_name: 'Operations on Rational Numbers and Denseness Property',
      page_number: 3,
      content: 'A rational number is a number that can be expressed in the form p/q, where p and q are integers and q ≠ 0. The set of rational numbers is denoted by Q. Between any two distinct rational numbers a and b, there are infinitely many rational numbers; their average (a + b)/2 always lies between them (Denseness Property). 0 is the additive identity and 1 is the multiplicative identity. Reciprocal of p/q is q/p.',
    },
    {
      id: 'chunk-9math-t1-1-a',
      textbook_id: 'tb-9-math',
      class_id: 'c-9',
      subject_id: 'sub-9-math',
      term_id: 'trm-9math-1',
      chapter_id: 'ch-9math-t1-1',
      section_name: "Set Operations and De Morgan's Laws",
      page_number: 2,
      content: "A set is a well-defined collection of distinct objects. Operations: (1) Union A ∪ B contains elements in A or B or both. (2) Intersection A ∩ B contains elements common to both A and B. (3) Difference A \\ B contains elements in A but not in B. (4) Complement A' contains elements in universal set U not in A. De Morgan's Laws: (A ∪ B)' = A' ∩ B' and (A ∩ B)' = A' ∪ B'. Cardinality formula: n(A ∪ B) = n(A) + n(B) - n(A ∩ B).",
    },
  ]

  // ── Multi-Class Social Science Chunks ───────────────────────────────────────
  const extraSocChunks = [
    {
      id: 'chunk-6soc-t1-1-a',
      textbook_id: 'tb-6-soc',
      class_id: 'c-6',
      subject_id: 'sub-6-soc',
      term_id: 'trm-6soc-1',
      chapter_id: 'ch-6soc-t1-1',
      section_name: 'Meaning of History and Sources of the Past',
      page_number: 1,
      content: "History is the study of past events in chronological order, derived from the Greek word 'Historia', meaning learning by enquiry. The father of history is Herodotus. Sources of history are classified into: (1) Archaeological sources (inscriptions on stone/copper, monuments, coins, artefacts) and (2) Literary sources (secular literature like epics and travelogues; religious literature like Vedas and Thiruvasagam). Pre-history is the period before the invention of writing.",
    },
    {
      id: 'chunk-7soc-t1-1-a',
      textbook_id: 'tb-7-soc',
      class_id: 'c-7',
      subject_id: 'sub-7-soc',
      term_id: 'trm-7soc-1',
      chapter_id: 'ch-7soc-t1-1',
      section_name: 'Inscriptions, Monuments and Foreign Travellers',
      page_number: 1,
      content: 'Primary sources of medieval India include Chola inscriptions (Uttiramerur inscriptions describing village administration and Kudavolai system), temples (Brihadisvara Temple at Thanjavur built by Rajaraja I), and coins. Secondary sources include travel accounts by Ibn Battuta, Marco Polo, Al-Biruni (Tarikh-ul-Hind), and court chronicles by Minhaj-us-Siraj (Tabaqat-i-Nasiri) and Abul Fazl (Ain-i-Akbari and Akbarnama).',
    },
    {
      id: 'chunk-8soc-t1-1-a',
      textbook_id: 'tb-8-soc',
      class_id: 'c-8',
      subject_id: 'sub-8-soc',
      term_id: 'trm-8soc-1',
      chapter_id: 'ch-8soc-t1-1',
      section_name: 'Portuguese, Dutch, British and French in India',
      page_number: 1,
      content: 'Vasco da Gama reached Calicut (Kozhikode) on the Malabar coast in 1498, discovering a new sea route from Europe to India via the Cape of Good Hope. The Portuguese established trade settlements in Goa, Cochin, and Diu. The English East India Company was formed on 31 December 1600 under a Royal Charter granted by Queen Elizabeth I. Sir Thomas Roe visited the court of Mughal Emperor Jahangir in 1615 and obtained permission to establish factories at Surat, Madras (Fort St. George), Bombay, and Calcutta.',
    },
    {
      id: 'chunk-9soc-t1-1-a',
      textbook_id: 'tb-9-soc',
      class_id: 'c-9',
      subject_id: 'sub-9-soc',
      term_id: 'trm-9soc-1',
      chapter_id: 'ch-9soc-t1-1',
      section_name: 'Prehistoric Periods and Human Evolution',
      page_number: 1,
      content: 'Human ancestors evolved in Africa around 3 to 2 million years ago (Australopithecus, Homo habilis, Homo erectus, Neanderthal, and Homo sapiens - modern humans). Prehistoric chronology: (1) Lower Palaeolithic (Acheulian hand axes), (2) Middle Palaeolithic (Flake tools), (3) Upper Palaeolithic (Blade and bone tools), (4) Mesolithic (Microlithic tools), (5) Neolithic (Polished stone tools, agriculture, animal domestication, pottery), and (6) Iron Age (Megalithic burial monuments in Tamil Nadu at Adichanallur and Keezhadi).',
    },
  ]

  // ── Higher Secondary Chemistry, CS & Biology Chunks ─────────────────────────
  const higherSecChunks = [
    {
      id: 'chunk-11chem-t1-1-a',
      textbook_id: 'tb-11-chem',
      class_id: 'c-11',
      subject_id: 'sub-11-chem',
      term_id: 'trm-11chem-1',
      chapter_id: 'ch-11chem-t1-1',
      section_name: "Mole Concept, Avogadro's Number and Molar Mass",
      page_number: 5,
      content: "One mole is the amount of substance that contains exactly 6.022 × 10²³ elementary entities (Avogadro's constant N_A), equal to the number of atoms in exactly 12 grams of Carbon-12 isotope. Molar mass is the mass of one mole of a substance in g/mol. Number of moles (n) = mass in grams / molar mass. Empirical formula shows simplest whole-number ratio of atoms in a compound, while molecular formula shows actual number of each atom: Molecular Formula = n × Empirical Formula.",
    },
    {
      id: 'chunk-11cs-t1-1-a',
      textbook_id: 'tb-11-cs',
      class_id: 'c-11',
      subject_id: 'sub-11-cs',
      term_id: 'trm-11cs-1',
      chapter_id: 'ch-11cs-t1-1',
      section_name: 'Generations of Computers and Von Neumann Architecture',
      page_number: 3,
      content: 'Computers have evolved through five distinct generations: First Gen (Vacuum tubes, machine language), Second Gen (Transistors, assembly language), Third Gen (Integrated Circuits / ICs), Fourth Gen (Microprocessors, VLSI), and Fifth Gen (Ultra Large Scale Integration / ULSI, Artificial Intelligence). The Von Neumann architecture consists of three core components: Central Processing Unit (ALU + Control Unit + Registers), Memory Unit (RAM/ROM), and Input/Output devices connected via system buses.',
    },
    {
      id: 'chunk-11bio-t1-1-a',
      textbook_id: 'tb-11-bio',
      class_id: 'c-11',
      subject_id: 'sub-11-bio',
      term_id: 'trm-11bio-1',
      chapter_id: 'ch-11bio-t1-1',
      section_name: 'Five Kingdom Classification of Whittaker',
      page_number: 4,
      content: 'R.H. Whittaker (1969) proposed the Five Kingdom Classification based on cell structure, body organization, mode of nutrition, and phylogenetic relationships: (1) Monera (prokaryotic, unicellular bacteria/cyanobacteria), (2) Protista (eukaryotic, unicellular algae/protozoans), (3) Fungi (eukaryotic, multicellular/unicellular heterotrophic saprophytes with chitin cell wall), (4) Plantae (eukaryotic, autotrophic plants with cellulose cell wall), (5) Animalia (eukaryotic, multicellular heterotrophic animals without cell wall).',
    },
    {
      id: 'chunk-12chem-t1-1-a',
      textbook_id: 'tb-12-chem',
      class_id: 'c-12',
      subject_id: 'sub-12-chem',
      term_id: 'trm-12chem-1',
      chapter_id: 'ch-12chem-t1-1',
      section_name: 'Concentration of Ores and Froth Flotation Process',
      page_number: 2,
      content: 'Metallurgy is the scientific and technological process used for extracting metals from their ores. Steps: (1) Crushing and grinding. (2) Concentration of ores: Gravity separation (hydraulic washing for oxide ores like haematite), Froth flotation (for sulphide ores like galena PbS and zinc blende ZnS using pine oil as collector and sodium ethyl xanthate), Magnetic separation (for magnetic ores like tin stone and wolframite), and Leaching (cyanide/ammonia leaching). (3) Extraction of crude metal by roasting/calcination and smelting. (4) Refining (electrolytic refining, zone refining, Mond process).',
    },
    {
      id: 'chunk-12cs-t1-1-a',
      textbook_id: 'tb-12-cs',
      class_id: 'c-12',
      subject_id: 'sub-12-cs',
      term_id: 'trm-12cs-1',
      chapter_id: 'ch-12cs-t1-1',
      section_name: 'Function Specifications, Pure vs Impure Functions',
      page_number: 1,
      content: 'In computer science, a function is a named block of code that performs a specific task. Parameters are variables in a function definition, while arguments are values passed to the function call. A Pure function is a function that always returns the same output for the same input arguments and has no side effects (does not modify external variables or I/O state): e.g., square(x) = x * x. An Impure function may return different results for the same arguments or produce side effects: e.g., random() or functions modifying global variables.',
    },
    {
      id: 'chunk-12bio-t1-1-a',
      textbook_id: 'tb-12-bio',
      class_id: 'c-12',
      subject_id: 'sub-12-bio',
      term_id: 'trm-12bio-1',
      chapter_id: 'ch-12bio-t1-1',
      section_name: 'Modes of Asexual and Sexual Reproduction',
      page_number: 2,
      content: 'Reproduction is the biological process by which organisms produce offspring of their own kind. Asexual reproduction involves a single parent without gamete fusion, producing genetically identical clones: binary fission (Amoeba), multiple fission (Plasmodium), budding (Hydra, Yeast), fragmentation (Spirogyra), and sporulation. Sexual reproduction involves two parents producing haploid gametes (sperm and ovum) that fuse during fertilization (syngamy) to form a diploid zygote, promoting genetic variation and evolution.',
    },
  ]

  const additionalChunks = [
    ...mathChunks,
    ...socChunks,
    ...class6Chunks,
    ...class7Chunks,
    ...class8Chunks,
    ...class9Chunks,
    ...class11Chunks,
    ...class12Chunks,
    ...tamilChunks,
    ...englishChunks,
    ...extraMathChunks,
    ...extraSocChunks,
    ...higherSecChunks,
  ]

  for (const ac of additionalChunks) {
    if (!memoryStore.bookChunks.some((b) => b.id === ac.id)) {
      memoryStore.bookChunks.push(ac)
    }
  }

  // Load comprehensive chunks across all 409 canonical chapters
  try {
    const compChunksPath = path.join(__dirname, '..', '..', 'data', 'comprehensive-curriculum-chunks.json')
    if (fs.existsSync(compChunksPath)) {
      const compChunks = JSON.parse(fs.readFileSync(compChunksPath, 'utf8'))
      for (const cc of compChunks) {
        if (!memoryStore.bookChunks.some((b) => b.id === cc.id)) {
          memoryStore.bookChunks.push(cc)
        }
      }
    }
  } catch {
    // optional fallback
  }

  // Ensure all seeded chunks have 1536-dimensional embeddings
  for (const chunk of memoryStore.bookChunks) {
    if (!chunk.embedding || !Array.isArray(chunk.embedding) || chunk.embedding.length !== 1536) {
      const dim = 1536
      const vec: number[] = new Array(dim).fill(0)
      const text = `${chunk.section_name || ''} ${chunk.content || ''}`.toLowerCase()
      for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i)
        const idx = (charCode * 31 + i) % dim
        vec[idx] += (charCode / 255) * 0.1
      }
      let norm = 0
      for (let i = 0; i < dim; i++) {
        norm += vec[i] * vec[i]
      }
      norm = Math.sqrt(norm) || 1.0
      for (let i = 0; i < dim; i++) {
        vec[i] = vec[i] / norm
      }
      chunk.embedding = vec
    }
  }

  // Synchronize chapter indexing_status and textbook_status with chunk existence
  for (const chap of memoryStore.chapters) {
    if (chap.id === 'ch-unindexed-pending-1') continue
    const hasChunks = memoryStore.bookChunks.some((c) => c.chapter_id === chap.id)
    if (hasChunks) {
      chap.indexing_status = 'READY'
      chap.textbook_status = 'AVAILABLE'
    }
  }

  // ── 12. Seed Canonical Exams & Question Bank ────────────────────────────────
  if (memoryStore.exams.length === 0) {
    const q1 = {
      id: 'q-c10sci-1',
      class_id: 'c-10',
      subject_id: 'sub-10-sci',
      chapter_id: 'ch-10sci-t1-1',
      question_text: 'Define inertia and state what physical quantity is a measure of inertia.',
      marks: 1,
      question_type: 'SHORT_ANSWER_1',
      difficulty: 'Easy',
      expected_answer: 'Inertia is the inherent property of a body to resist any change in its state of rest or the state of uniform motion, unless influenced upon by an external unbalanced force. The mass of a body is a quantitative measure of its inertia.',
      key_points: [
        'Resist change in state of rest or uniform motion',
        'Mass is the measure of inertia',
      ],
      rubric: {
        concept: 0.5,
        mass_measure: 0.5,
      },
      source_textbook: 'Tamil Nadu State Board Class 10 Science (Samacheer Kalvi)',
      source_page: 2,
      created_by: 'user-teacher-demo',
    }

    const q2 = {
      id: 'q-c10sci-2',
      class_id: 'c-10',
      subject_id: 'sub-10-sci',
      chapter_id: 'ch-10sci-t1-1',
      question_text: 'What is linear momentum? Give its formula and SI unit.',
      marks: 1,
      question_type: 'SHORT_ANSWER_1',
      difficulty: 'Easy',
      expected_answer: 'Linear momentum is defined as the product of mass and velocity of a moving body. Formula: p = m × v. Its SI unit is kg m/s.',
      key_points: [
        'Product of mass and velocity',
        'Formula: p = mv',
        'SI unit: kg m/s (or N s)',
      ],
      rubric: {
        definition: 0.5,
        formula_and_unit: 0.5,
      },
      source_textbook: 'Tamil Nadu State Board Class 10 Science (Samacheer Kalvi)',
      source_page: 3,
      created_by: 'user-teacher-demo',
    }

    const q3 = {
      id: 'q-c10sci-3',
      class_id: 'c-10',
      subject_id: 'sub-10-sci',
      chapter_id: 'ch-10sci-t1-1',
      question_text: "State Newton's First Law of Motion.",
      marks: 1,
      question_type: 'SHORT_ANSWER_1',
      difficulty: 'Easy',
      expected_answer: "Newton's First Law of Motion states that every body continues in its state of rest or of uniform motion along a straight line unless it is compelled to change that state by an external unbalanced force.",
      key_points: [
        'Continues in state of rest or uniform motion in straight line',
        'Unless acted upon by external unbalanced force',
      ],
      rubric: {
        statement: 1.0,
      },
      source_textbook: 'Tamil Nadu State Board Class 10 Science (Samacheer Kalvi)',
      source_page: 2,
      created_by: 'user-teacher-demo',
    }

    const q4 = {
      id: 'q-c10sci-4',
      class_id: 'c-10',
      subject_id: 'sub-10-sci',
      chapter_id: 'ch-10sci-t1-2',
      question_text: 'Define power of a lens and state its SI unit.',
      marks: 1,
      question_type: 'SHORT_ANSWER_1',
      difficulty: 'Easy',
      expected_answer: 'Power of a lens is the measure of the degree of convergence or divergence of light rays falling on it. It is numerically equal to the reciprocal of its focal length in metres (P = 1/f). Its SI unit is dioptre (D).',
      key_points: [
        'Reciprocal of focal length in metres (P = 1/f)',
        'SI unit: dioptre (D)',
      ],
      rubric: {
        definition: 0.5,
        unit: 0.5,
      },
      source_textbook: 'Tamil Nadu State Board Class 10 Science (Samacheer Kalvi)',
      source_page: 20,
      created_by: 'user-teacher-demo',
    }

    const q5 = {
      id: 'q-c10sci-5',
      class_id: 'c-10',
      subject_id: 'sub-10-sci',
      chapter_id: 'ch-10sci-t1-2',
      question_text: "State Snell's Law (Second law of refraction).",
      marks: 1,
      question_type: 'SHORT_ANSWER_1',
      difficulty: 'Easy',
      expected_answer: "Snell's Law states that the ratio of the sine of the angle of incidence to the sine of the angle of refraction is equal to the ratio of refractive indices of the two media: sin(i) / sin(r) = μ₂ / μ₁ = constant.",
      key_points: [
        'Ratio of sin i to sin r is constant',
        'sin i / sin r = μ2 / μ1',
      ],
      rubric: {
        statement_and_formula: 1.0,
      },
      source_textbook: 'Tamil Nadu State Board Class 10 Science (Samacheer Kalvi)',
      source_page: 17,
      created_by: 'user-teacher-demo',
    }

    const q6 = {
      id: 'q-c10sci-6',
      class_id: 'c-10',
      subject_id: 'sub-10-sci',
      chapter_id: 'ch-10sci-t1-1',
      question_text: 'Differentiate between Mass and Weight (give any two distinct differences).',
      marks: 2,
      question_type: 'SHORT_EXPLANATORY_2',
      difficulty: 'Medium',
      expected_answer: '1. Mass is the fundamental quantity measuring amount of matter; Weight is the gravitational force acting on a body (W = mg).\n2. Mass is a scalar quantity (SI unit: kg); Weight is a vector quantity directed towards centre of gravity (SI unit: Newton, N).\n3. Mass remains constant everywhere; Weight varies from place to place depending on g.',
      key_points: [
        'Mass: quantity of matter (kg, scalar, constant everywhere)',
        'Weight: gravitational force W = mg (Newton, vector, varies with g)',
      ],
      rubric: {
        definition_difference: 1.0,
        unit_and_nature_difference: 1.0,
      },
      source_textbook: 'Tamil Nadu State Board Class 10 Science (Samacheer Kalvi)',
      source_page: 8,
      created_by: 'user-teacher-demo',
    }

    const q7 = {
      id: 'q-c10sci-7',
      class_id: 'c-10',
      subject_id: 'sub-10-sci',
      chapter_id: 'ch-10sci-t1-1',
      question_text: "State Newton's Second Law of Motion and derive the mathematical expression F = ma.",
      marks: 2,
      question_type: 'SHORT_EXPLANATORY_2',
      difficulty: 'Medium',
      expected_answer: "Newton's Second Law states that the force acting on a body is directly proportional to the rate of change of linear momentum and takes place in the direction of the force.\nDerivation: Initial momentum p₁ = mu, Final momentum p₂ = mv. Change in momentum Δp = mv - mu. Rate of change of momentum = m(v - u)/t = ma. By law, F ∝ ma => F = k·ma (with k=1 in SI units), hence F = ma.",
      key_points: [
        'Force proportional to rate of change of momentum',
        'Direction of force matches change in momentum',
        'Mathematical derivation yielding F = ma',
      ],
      rubric: {
        law_statement: 1.0,
        mathematical_derivation: 1.0,
      },
      source_textbook: 'Tamil Nadu State Board Class 10 Science (Samacheer Kalvi)',
      source_page: 4,
      created_by: 'user-teacher-demo',
    }

    const q8 = {
      id: 'q-c10sci-8',
      class_id: 'c-10',
      subject_id: 'sub-10-sci',
      chapter_id: 'ch-10sci-t1-2',
      question_text: 'What is Total Internal Reflection? State the two necessary conditions for it to occur.',
      marks: 2,
      question_type: 'SHORT_EXPLANATORY_2',
      difficulty: 'Medium',
      expected_answer: 'When a ray of light travelling from a denser to a rarer medium is incident at an angle greater than the critical angle (i > C), the refracted ray bends back completely into the denser medium itself. This phenomenon is Total Internal Reflection.\nConditions:\n1. Light must travel from an optically denser medium to an optically rarer medium.\n2. The angle of incidence in the denser medium must be greater than the critical angle (i > C).',
      key_points: [
        'Complete reflection back into denser medium when i > critical angle',
        'Condition 1: Light travels from denser to rarer medium',
        'Condition 2: Angle of incidence > critical angle',
      ],
      rubric: {
        definition: 1.0,
        two_conditions: 1.0,
      },
      source_textbook: 'Tamil Nadu State Board Class 10 Science (Samacheer Kalvi)',
      source_page: 22,
      created_by: 'user-teacher-demo',
    }

    const q9 = {
      id: 'q-c10sci-9',
      class_id: 'c-10',
      subject_id: 'sub-10-sci',
      chapter_id: 'ch-10sci-t1-1',
      question_text: 'State and prove the Principle of Conservation of Linear Momentum using Newton’s laws.',
      marks: 3,
      question_type: 'DETAILED_3',
      difficulty: 'Hard',
      expected_answer: "Statement: In the absence of an external force, the algebraic sum of the linear momentum of a system of bodies remains constant.\nProof: Consider two bodies A and B of masses m₁ and m₂ moving with initial velocities u₁ and u₂ (u₁ > u₂). During collision for time t, body A exerts force F₂ on B, and body B exerts reaction force F₁ on A.\nForce on B: F₂ = m₂(v₂ - u₂)/t.\nForce on A: F₁ = m₁(v₁ - u₁)/t.\nAccording to Newton's Third Law: F₁ = -F₂.\nm₁(v₁ - u₁)/t = -m₂(v₂ - u₂)/t.\nm₁v₁ - m₁u₁ = -m₂v₂ + m₂u₂.\nm₁v₁ + m₂v₂ = m₁u₁ + m₂u₂ (Total Final Momentum = Total Initial Momentum). Hence proved.",
      key_points: [
        'Law statement: Total linear momentum remains constant when net external force is zero',
        'Collision setup with masses m1, m2 and velocities u1, u2, v1, v2',
        'Application of Newton 3rd law: F_action = -F_reaction',
        'Final formulation: m1u1 + m2u2 = m1v1 + m2v2',
      ],
      rubric: {
        law_statement: 1.0,
        diagram_setup_forces: 1.0,
        derivation_and_proof: 1.0,
      },
      source_textbook: 'Tamil Nadu State Board Class 10 Science (Samacheer Kalvi)',
      source_page: 6,
      created_by: 'user-teacher-demo',
    }

    const q10 = {
      id: 'q-c10sci-10',
      class_id: 'c-10',
      subject_id: 'sub-10-sci',
      chapter_id: 'ch-10sci-t1-2',
      question_text: 'Explain the eye defects Myopia (Short-sightedness) and Hypermetropia (Long-sightedness), their causes, and how each is corrected.',
      marks: 3,
      question_type: 'DETAILED_3',
      difficulty: 'Hard',
      expected_answer: "1. Myopia (Short-sightedness): A person can see nearby objects clearly but cannot see distant objects clearly. Causes: Lengthening of the eyeball or shortening of focal length of eye lens. Image formed in front of retina. Correction: Concave lens of suitable focal length (f = -xy/(x-y)).\n2. Hypermetropia (Long-sightedness): A person can see distant objects clearly but cannot see nearby objects clearly. Causes: Shortening of eyeball or increase in focal length of eye lens. Image formed behind retina. Correction: Convex lens of suitable focal length (f = dD/(d-D)).",
      key_points: [
        'Myopia definition, causes (eyeball lengthening), image in front of retina, corrected by concave lens',
        'Hypermetropia definition, causes (eyeball shortening), image behind retina, corrected by convex lens',
        'Focal length formulas for correcting lenses',
      ],
      rubric: {
        myopia_explanation_and_correction: 1.5,
        hypermetropia_explanation_and_correction: 1.5,
      },
      source_textbook: 'Tamil Nadu State Board Class 10 Science (Samacheer Kalvi)',
      source_page: 25,
      created_by: 'user-teacher-demo',
    }

    const q11 = {
      id: 'q-c10sci-11',
      class_id: 'c-10',
      subject_id: 'sub-10-sci',
      chapter_id: 'ch-10sci-t1-1',
      question_text: "State Newton's three laws of motion with mathematical expressions, provide a real-world example for each, and state Newton's Universal Law of Gravitation.",
      marks: 5,
      question_type: 'ESSAY_5',
      difficulty: 'Hard',
      expected_answer: "1. Newton's First Law (Law of Inertia): Every body continues in its state of rest or uniform motion in a straight line unless acted upon by an external unbalanced force. Example: Passengers lean forward when a moving bus brakes suddenly due to inertia of motion.\n2. Newton's Second Law (Law of Force): The rate of change of momentum is proportional to the applied force: F = ma. Example: A cricket fielder pulls his hands backward while catching a fast-moving ball to increase contact time and reduce impact force.\n3. Newton's Third Law (Action & Reaction): For every action, there is an equal and opposite reaction: F_AB = -F_BA. Example: Rocket propulsion where exhaust gases shooting downward exert an upward thrust.\n4. Universal Law of Gravitation: Every particle in the universe attracts every other particle with a force directly proportional to the product of their masses and inversely proportional to the square of the distance between them: F = G(m₁m₂)/r², where G = 6.674 × 10⁻¹¹ N m²/kg².",
      key_points: [
        'First Law statement, inertia concept, and real-world example',
        'Second Law statement, formula F = ma, and cricket/cushioning example',
        'Third Law statement, action-reaction pair F = -F, and rocket/swimming example',
        'Universal Law of Gravitation formula F = G*m1*m2/r^2 and gravitational constant value G',
      ],
      rubric: {
        first_law_and_example: 1.0,
        second_law_and_example: 1.0,
        third_law_and_example: 1.0,
        gravitation_law_statement: 1.0,
        gravitation_formula_and_G_constant: 1.0,
      },
      source_textbook: 'Tamil Nadu State Board Class 10 Science (Samacheer Kalvi)',
      source_page: 2,
      created_by: 'user-teacher-demo',
    }

    memoryStore.questions.push(q1, q2, q3, q4, q5, q6, q7, q8, q9, q10, q11)

    // Primary Exam: Class 10 Science Unit Test 1 (Total: 25 Marks, 10 Questions)
    const exam1 = {
      id: 'exam-c10-sci-ut1',
      title: 'Class 10 Science — Unit Test 1 (Laws of Motion & Optics)',
      description: 'Comprehensive Tamil Nadu State Board Unit Test covering Chapter 1 (Laws of Motion) and Chapter 2 (Optics) with authentic 1M, 2M, 3M, and 5M questions.',
      class_id: 'c-10',
      class_name: 'Class 10',
      subject_id: 'sub-10-sci',
      subject_name: 'Science',
      term_id: 'trm-10sci-1',
      chapter_ids: ['ch-10sci-t1-1', 'ch-10sci-t1-2'],
      duration_minutes: 30,
      total_marks: 20,
      passing_marks: 8,
      difficulty: 'Medium',
      question_count: 8,
      status: 'PUBLISHED',
      is_published: true,
      created_by: 'user-teacher-demo',
      published_at: '2026-09-01T09:00:00.000Z',
      start_date: '2026-09-01T00:00:00.000Z',
      end_date: '2026-12-31T23:59:59.000Z',
    }

    memoryStore.exams.push(exam1)

    const selectedQIds = ['q-c10sci-1', 'q-c10sci-2', 'q-c10sci-3', 'q-c10sci-6', 'q-c10sci-7', 'q-c10sci-8', 'q-c10sci-9', 'q-c10sci-11']
    selectedQIds.forEach((qid, idx) => {
      const qObj = memoryStore.questions.find((q) => q.id === qid)
      memoryStore.examQuestions.push({
        id: `eq-exam1-${idx + 1}`,
        exam_id: 'exam-c10-sci-ut1',
        question_id: qid,
        order_index: idx + 1,
        marks: qObj?.marks || 1,
      })
    })

    // ── Additional Class 10, 11, 12, 9 Authentic Questions ──
    const qMath1 = {
      id: 'q-c10math-1',
      class_id: 'c-10',
      subject_id: 'sub-10-math',
      chapter_id: 'ch-10math-t1-1',
      question_text: 'If A = {1, 3, 5} and B = {2, 3}, find A × B and B × A. Is A × B = B × A?',
      marks: 2,
      question_type: 'SHORT_EXPLANATORY_2',
      difficulty: 'Easy',
      expected_answer: 'A × B = {(1,2), (1,3), (3,2), (3,3), (5,2), (5,3)}. B × A = {(2,1), (2,3), (2,5), (3,1), (3,3), (3,5)}. A × B ≠ B × A.',
      key_points: ['Cartesian product A × B', 'Cartesian product B × A', 'Conclusion A × B ≠ B × A'],
      rubric: { cartesian_product: 1.0, comparison: 1.0 },
      source_textbook: 'Tamil Nadu State Board Class 10 Mathematics (Samacheer Kalvi)',
      source_page: 3,
      created_by: 'user-teacher-demo',
    }

    const qMath2 = {
      id: 'q-c10math-2',
      class_id: 'c-10',
      subject_id: 'sub-10-math',
      chapter_id: 'ch-10math-t1-1',
      question_text: 'State and prove Basic Proportionality Theorem (Thales Theorem) with suitable geometric construction.',
      marks: 5,
      question_type: 'ESSAY_5',
      difficulty: 'Hard',
      expected_answer: 'Statement: If a line is drawn parallel to one side of a triangle intersecting other two sides, it divides them in the same ratio: AD/DB = AE/EC. Proof uses ratio of triangle areas with common altitude.',
      key_points: ['Statement of Thales theorem', 'Geometric construction diagram', 'Area ratio steps', 'Conclusion AD/DB = AE/EC'],
      rubric: { statement_and_diagram: 2.0, proof_steps: 2.0, conclusion: 1.0 },
      source_textbook: 'Tamil Nadu State Board Class 10 Mathematics (Samacheer Kalvi)',
      source_page: 162,
      created_by: 'user-teacher-demo',
    }

    const qPhy12_1 = {
      id: 'q-c12phy-1',
      class_id: 'c-12',
      subject_id: 'sub-12-phy',
      chapter_id: 'ch-12phy-t1-1',
      question_text: 'Define electric flux and write its SI unit.',
      marks: 2,
      question_type: 'SHORT_EXPLANATORY_2',
      difficulty: 'Easy',
      expected_answer: 'Electric flux is the number of electric field lines crossing a given area normal to the surface: Φ = E·A·cos(θ). SI unit: N m² C⁻¹ (or V·m).',
      key_points: ['Definition of electric flux', 'SI unit N m² C⁻¹ or V m'],
      rubric: { definition: 1.0, si_unit: 1.0 },
      source_textbook: 'Tamil Nadu State Board Class 12 Physics (Samacheer Kalvi)',
      source_page: 32,
      created_by: 'user-teacher-demo',
    }

    const qPhy12_2 = {
      id: 'q-c12phy-2',
      class_id: 'c-12',
      subject_id: 'sub-12-phy',
      chapter_id: 'ch-12phy-t1-1',
      question_text: 'Obtain the condition for bridge balance in Wheatstone’s bridge using Kirchhoff’s rules.',
      marks: 3,
      question_type: 'DETAILED_3',
      difficulty: 'Medium',
      expected_answer: 'Applying Kirchhoff’s junction and loop rules with zero galvanometer current Ig = 0 gives P/Q = R/S.',
      key_points: ['Kirchhoff junction rule', 'Kirchhoff voltage loop rule', 'Balancing equation P/Q = R/S'],
      rubric: { junction_rule: 1.0, loop_rule: 1.0, balance_equation: 1.0 },
      source_textbook: 'Tamil Nadu State Board Class 12 Physics (Samacheer Kalvi)',
      source_page: 108,
      created_by: 'user-teacher-demo',
    }

    const qPhy12_3 = {
      id: 'q-c12phy-3',
      class_id: 'c-12',
      subject_id: 'sub-12-phy',
      chapter_id: 'ch-12phy-t1-1',
      question_text: 'Explain the principle, construction, theory, and working of a transformer with efficiency and energy losses.',
      marks: 5,
      question_type: 'ESSAY_5',
      difficulty: 'Hard',
      expected_answer: 'Principle: Mutual induction. Equations: Ep = -Np(dΦ/dt), Es = -Ns(dΦ/dt), Es/Ep = Ns/Np = K. Energy losses include copper loss, iron/eddy current loss, hysteresis loss, and flux leakage.',
      key_points: ['Principle of mutual induction', 'Transformation ratio K = Ns/Np', 'Four types of energy losses'],
      rubric: { principle: 1.0, equations_and_theory: 2.0, energy_losses: 2.0 },
      source_textbook: 'Tamil Nadu State Board Class 12 Physics (Samacheer Kalvi)',
      source_page: 230,
      created_by: 'user-teacher-demo',
    }

    const qTam12_1 = {
      id: 'q-c12tam-1',
      class_id: 'c-12',
      subject_id: 'sub-12-tam',
      chapter_id: 'ch-12tam-t1-1',
      question_text: 'அணி இலக்கணம் என்றால் என்ன? சான்று தருக.',
      marks: 2,
      question_type: 'SHORT_EXPLANATORY_2',
      difficulty: 'Easy',
      expected_answer: 'செய்யுளுக்கு அழகூட்டுவது அணி எனப்படும். எ.கா: உவமையணி, உருவக அணி.',
      key_points: ['செய்யுளுக்கு அழகு சேர்க்கும் இலக்கணம்', 'பொருத்தமான சான்று'],
      rubric: { definition: 1.0, example: 1.0 },
      source_textbook: 'Tamil Nadu State Board Class 12 பொதுத்தமிழ்',
      source_page: 82,
      created_by: 'user-teacher-demo',
    }

    const qTam12_2 = {
      id: 'q-c12tam-2',
      class_id: 'c-12',
      subject_id: 'sub-12-tam',
      chapter_id: 'ch-12tam-t1-1',
      question_text: 'கம்பராமாயணத்தில் குகப் படலத்தின் சிறப்புகளைக் கம்பர் எவ்வாறு சித்தரிக்கிறார்?',
      marks: 5,
      question_type: 'ESSAY_5',
      difficulty: 'Hard',
      expected_answer: 'குகனின் எல்லையற்ற அன்பும், ராமனின் சகோதரத்துவ ஏற்பும் "குகனொடும் ஐவரானோம்" என்ற உலகளாவிய மானுட நேயத்தை வெளிப்படுத்துகிறது.',
      key_points: ['குகனின் விருந்தோம்பல்', 'ராமனின் பெருந்தன்மை', '"குகனொடும் ஐவரானோம்" மேற்கோள்'],
      rubric: { introduction: 1.0, description: 2.0, quote_analysis: 2.0 },
      source_textbook: 'Tamil Nadu State Board Class 12 பொதுத்தமிழ்',
      source_page: 180,
      created_by: 'user-teacher-demo',
    }

    const qEng12_1 = {
      id: 'q-c12eng-1',
      class_id: 'c-12',
      subject_id: 'sub-12-eng',
      chapter_id: 'ch-12eng-t1-1',
      question_text: 'What were the various jobs undertaken by Nicola and Jacopo in "Two Gentlemen of Verona"?',
      marks: 2,
      question_type: 'SHORT_EXPLANATORY_2',
      difficulty: 'Easy',
      expected_answer: 'Nicola and Jacopo shined shoes, sold fruit, hawked newspapers, conducted tourists round the town, and ran errands to earn money for their sister Lucia’s treatment.',
      key_points: ['Shoe shining, selling fruit, hawking newspapers', 'Tour guides and errands for sister treatment'],
      rubric: { jobs_list: 1.0, purpose: 1.0 },
      source_textbook: 'Tamil Nadu State Board Class 12 English',
      source_page: 6,
      created_by: 'user-teacher-demo',
    }

    const qEng12_2 = {
      id: 'q-c12eng-2',
      class_id: 'c-12',
      subject_id: 'sub-12-eng',
      chapter_id: 'ch-12eng-t1-1',
      question_text: 'Describe the transformation of Nicola and Jacopo into symbols of human dignity and selflessness.',
      marks: 5,
      question_type: 'ESSAY_5',
      difficulty: 'Hard',
      expected_answer: 'Nicola and Jacopo faced wartime devastation with courage and devotion, working tirelessly without seeking charity, proving human dignity and noble brotherhood.',
      key_points: ['Wartime tragedy', 'Devotion to sister Lucia', 'Refusal of charity', 'Human nobility'],
      rubric: { introduction: 1.0, character_traits: 2.0, theme_analysis: 2.0 },
      source_textbook: 'Tamil Nadu State Board Class 12 English',
      source_page: 12,
      created_by: 'user-teacher-demo',
    }

    const qCS12_1 = {
      id: 'q-c12cs-1',
      class_id: 'c-12',
      subject_id: 'sub-12-cs',
      chapter_id: 'ch-12cs-t1-1',
      question_text: 'What is the LEGB rule of variable scope in Python? Explain each scope.',
      marks: 3,
      question_type: 'DETAILED_3',
      difficulty: 'Medium',
      expected_answer: 'LEGB stands for Local, Enclosed, Global, and Built-in scopes, defining the hierarchy of variable resolution in Python.',
      key_points: ['LEGB acronym expansion', 'Explanation of Local and Global scopes', 'Built-in namespace scope'],
      rubric: { legb_definition: 1.0, scope_explanations: 2.0 },
      source_textbook: 'Tamil Nadu State Board Class 12 Computer Science',
      source_page: 48,
      created_by: 'user-teacher-demo',
    }

    const qAcc12_1 = {
      id: 'q-c12acc-1',
      class_id: 'c-12',
      subject_id: 'sub-12-acc',
      chapter_id: 'ch-12acc-t1-1',
      question_text: 'Distinguish between Fixed Capital Method and Fluctuating Capital Method with 3 key points.',
      marks: 3,
      question_type: 'DETAILED_3',
      difficulty: 'Medium',
      expected_answer: 'Fixed Capital Method maintains Capital and Current accounts with stable capital. Fluctuating Capital maintains one Capital account recording all adjustments.',
      key_points: ['Number of accounts (2 vs 1)', 'Constancy of capital balance', 'Recording of adjustments'],
      rubric: { accounts_difference: 1.0, balance_difference: 1.0, adjustment_difference: 1.0 },
      source_textbook: 'Tamil Nadu State Board Class 12 Accountancy',
      source_page: 90,
      created_by: 'user-teacher-demo',
    }

    const q9Sci_1 = {
      id: 'q-c9sci-1',
      class_id: 'c-9',
      subject_id: 'sub-9-sci',
      chapter_id: 'ch-9sci-t1-1',
      question_text: 'State the difference between mass and weight with SI units.',
      marks: 2,
      question_type: 'SHORT_EXPLANATORY_2',
      difficulty: 'Easy',
      expected_answer: 'Mass is the amount of matter in a body (Scalar, SI unit kg, constant). Weight is the gravitational force acting on it (Vector, W = mg, SI unit Newton, variable).',
      key_points: ['Mass definition and kg unit', 'Weight definition W = mg and Newton unit'],
      rubric: { mass_explanation: 1.0, weight_explanation: 1.0 },
      source_textbook: 'Tamil Nadu State Board Class 9 Science',
      source_page: 6,
      created_by: 'user-teacher-demo',
    }

    const q9Math_1 = {
      id: 'q-c9math-1',
      class_id: 'c-9',
      subject_id: 'sub-9-math',
      chapter_id: 'ch-9math-t1-1',
      question_text: 'If A = {2, 4, 6, 8} and B = {6, 8, 10, 12}, find A ∪ B and A ∩ B.',
      marks: 2,
      question_type: 'SHORT_EXPLANATORY_2',
      difficulty: 'Easy',
      expected_answer: 'A ∪ B = {2, 4, 6, 8, 10, 12}. A ∩ B = {6, 8}.',
      key_points: ['Set Union combining all elements', 'Set Intersection common elements {6, 8}'],
      rubric: { union_result: 1.0, intersection_result: 1.0 },
      source_textbook: 'Tamil Nadu State Board Class 9 Mathematics',
      source_page: 12,
      created_by: 'user-teacher-demo',
    }

    memoryStore.questions.push(
      qMath1, qMath2,
      qPhy12_1, qPhy12_2, qPhy12_3,
      qTam12_1, qTam12_2,
      qEng12_1, qEng12_2,
      qCS12_1, qAcc12_1,
      q9Sci_1, q9Math_1
    )

    // Exam 2: Class 10 Mathematics Unit Test 1
    const exam2 = {
      id: 'exam-c10-math-ut1',
      title: 'Class 10 Mathematics — Board Model Assessment (Relations & Geometry)',
      description: 'Unit assessment on Cartesian Products, Relations, and Thales Theorem according to Samacheer Kalvi Class 10 Mathematics.',
      class_id: 'c-10',
      class_name: 'Class 10',
      subject_id: 'sub-10-math',
      subject_name: 'Mathematics',
      term_id: 'trm-10math-1',
      chapter_ids: ['ch-10math-t1-1'],
      duration_minutes: 40,
      total_marks: 15,
      passing_marks: 6,
      difficulty: 'Medium',
      question_count: 4,
      status: 'PUBLISHED',
      is_published: true,
      created_by: 'user-teacher-demo',
      published_at: '2026-09-01T10:00:00.000Z',
    }
    memoryStore.exams.push(exam2)

    const mathQIds = ['q-c10math-1', 'q-c10math-2']
    mathQIds.forEach((qid, idx) => {
      const qObj = memoryStore.questions.find((q) => q.id === qid)
      memoryStore.examQuestions.push({
        id: `eq-exam2-${idx + 1}`,
        exam_id: 'exam-c10-math-ut1',
        question_id: qid,
        order_index: idx + 1,
        marks: qObj?.marks || 2,
      })
    })

    // Exam 3: Class 12 Physics Practice Midterm
    const exam3 = {
      id: 'exam-c12-phy-midterm',
      title: 'Class 12 Physics — HSC Board Model Exam (Electrostatics & Magnetism)',
      description: 'Higher Secondary State Board physics practice exam covering Coulomb’s law, Gauss theorem, Wheatstone bridge, and Transformers with 1M, 2M, 3M, and 5M questions.',
      class_id: 'c-12',
      class_name: 'Class 12',
      subject_id: 'sub-12-phy',
      subject_name: 'Physics',
      term_id: 'trm-12phy-1',
      chapter_ids: ['ch-12phy-t1-1'],
      duration_minutes: 45,
      total_marks: 25,
      passing_marks: 10,
      difficulty: 'Hard',
      question_count: 5,
      status: 'PUBLISHED',
      is_published: true,
      created_by: 'user-teacher-demo',
      published_at: '2026-09-01T11:00:00.000Z',
    }
    memoryStore.exams.push(exam3)

    const phyQIds = ['q-c12phy-1', 'q-c12phy-2', 'q-c12phy-3']
    phyQIds.forEach((qid, idx) => {
      const qObj = memoryStore.questions.find((q) => q.id === qid)
      memoryStore.examQuestions.push({
        id: `eq-exam3-${idx + 1}`,
        exam_id: 'exam-c12-phy-midterm',
        question_id: qid,
        order_index: idx + 1,
        marks: qObj?.marks || 2,
      })
    })

    // Exam 4: Class 12 General Tamil (பொதுத்தமிழ்)
    const exam4 = {
      id: 'exam-c12-tam-annual',
      title: 'Class 12 பொதுத்தமிழ் — மாதிரி அரசுப் பொதுத்தேர்வு (செய்யுள் & இலக்கணம்)',
      description: 'தமிழ்நாடு மேல்நிலைக் கல்வி பொதுத்தமிழ் மாதிரி வினாத்தாள் (2M, 3M, 5M வினாக்கள் அடங்கியது).',
      class_id: 'c-12',
      class_name: 'Class 12',
      subject_id: 'sub-12-tam',
      subject_name: 'General Tamil',
      term_id: 'trm-12tam-1',
      chapter_ids: ['ch-12tam-t1-1'],
      duration_minutes: 45,
      total_marks: 20,
      passing_marks: 7,
      difficulty: 'Medium',
      question_count: 4,
      status: 'PUBLISHED',
      is_published: true,
      created_by: 'user-teacher-demo',
      published_at: '2026-09-01T12:00:00.000Z',
    }
    memoryStore.exams.push(exam4)

    const tamQIds = ['q-c12tam-1', 'q-c12tam-2']
    tamQIds.forEach((qid, idx) => {
      const qObj = memoryStore.questions.find((q) => q.id === qid)
      memoryStore.examQuestions.push({
        id: `eq-exam4-${idx + 1}`,
        exam_id: 'exam-c12-tam-annual',
        question_id: qid,
        order_index: idx + 1,
        marks: qObj?.marks || 2,
      })
    })

    // Exam 5: Class 12 General English
    const exam5 = {
      id: 'exam-c12-eng-annual',
      title: 'Class 12 General English — HSC Board Model Paper',
      description: 'HSC State Board English model examination with 2-Mark, 3-Mark, and 5-Mark prose and grammar questions.',
      class_id: 'c-12',
      class_name: 'Class 12',
      subject_id: 'sub-12-eng',
      subject_name: 'General English',
      term_id: 'trm-12eng-1',
      chapter_ids: ['ch-12eng-t1-1'],
      duration_minutes: 45,
      total_marks: 20,
      passing_marks: 7,
      difficulty: 'Medium',
      question_count: 4,
      status: 'PUBLISHED',
      is_published: true,
      created_by: 'user-teacher-demo',
      published_at: '2026-09-01T13:00:00.000Z',
    }
    memoryStore.exams.push(exam5)

    const engQIds = ['q-c12eng-1', 'q-c12eng-2']
    engQIds.forEach((qid, idx) => {
      const qObj = memoryStore.questions.find((q) => q.id === qid)
      memoryStore.examQuestions.push({
        id: `eq-exam5-${idx + 1}`,
        exam_id: 'exam-c12-eng-annual',
        question_id: qid,
        order_index: idx + 1,
        marks: qObj?.marks || 2,
      })
    })

    // Exam 6: Class 9 Science Annual Model
    const exam6 = {
      id: 'exam-c9-sci-annual',
      title: 'Class 9 Science — Annual Model Examination',
      description: 'Tamil Nadu State Board Class 9 Science comprehensive test covering Measurement, Motion, and Optics.',
      class_id: 'c-9',
      class_name: 'Class 9',
      subject_id: 'sub-9-sci',
      subject_name: 'Science',
      term_id: 'trm-9sci-1',
      chapter_ids: ['ch-9sci-t1-1'],
      duration_minutes: 30,
      total_marks: 15,
      passing_marks: 5,
      difficulty: 'Easy',
      question_count: 3,
      status: 'PUBLISHED',
      is_published: true,
      created_by: 'user-teacher-demo',
      published_at: '2026-09-01T14:00:00.000Z',
    }
    memoryStore.exams.push(exam6)

    const q9Ids = ['q-c9sci-1']
    q9Ids.forEach((qid, idx) => {
      const qObj = memoryStore.questions.find((q) => q.id === qid)
      memoryStore.examQuestions.push({
        id: `eq-exam6-${idx + 1}`,
        exam_id: 'exam-c9-sci-annual',
        question_id: qid,
        order_index: idx + 1,
        marks: qObj?.marks || 2,
      })
    })

    // Exam 7: Class 9 Mathematics Model
    const exam7 = {
      id: 'exam-c9-math-annual',
      title: 'Class 9 Mathematics — Annual Model Assessment',
      description: 'Tamil Nadu State Board Class 9 Mathematics covering Set Operations, Real Numbers, and Geometry.',
      class_id: 'c-9',
      class_name: 'Class 9',
      subject_id: 'sub-9-math',
      subject_name: 'Mathematics',
      term_id: 'trm-9math-1',
      chapter_ids: ['ch-9math-t1-1'],
      duration_minutes: 30,
      total_marks: 15,
      passing_marks: 5,
      difficulty: 'Easy',
      question_count: 3,
      status: 'PUBLISHED',
      is_published: true,
      created_by: 'user-teacher-demo',
      published_at: '2026-09-01T14:30:00.000Z',
    }
    memoryStore.exams.push(exam7)

    const q9mIds = ['q-c9math-1']
    q9mIds.forEach((qid, idx) => {
      const qObj = memoryStore.questions.find((q) => q.id === qid)
      memoryStore.examQuestions.push({
        id: `eq-exam7-${idx + 1}`,
        exam_id: 'exam-c9-math-annual',
        question_id: qid,
        order_index: idx + 1,
        marks: qObj?.marks || 2,
      })
    })

    // Exam 8: Class 11 Physics Model Midterm
    const exam8 = {
      id: 'exam-c11-phy-midterm',
      title: 'Class 11 Physics — Midterm Board Model Exam (Kinematics & Dynamics)',
      description: 'Higher Secondary +1 State Board physics assessment covering Vectors, Laws of Motion, Work-Energy Theorem.',
      class_id: 'c-11',
      class_name: 'Class 11',
      subject_id: 'sub-11-phy',
      subject_name: 'Physics',
      term_id: 'trm-11phy-1',
      chapter_ids: ['ch-11phy-t1-1'],
      duration_minutes: 45,
      total_marks: 25,
      passing_marks: 10,
      difficulty: 'Medium',
      question_count: 5,
      status: 'PUBLISHED',
      is_published: true,
      created_by: 'user-teacher-demo',
      published_at: '2026-09-01T15:00:00.000Z',
    }
    memoryStore.exams.push(exam8)

    const q11phyIds = ['q-c10sci-1', 'q-c10sci-2', 'q-c10sci-3']
    q11phyIds.forEach((qid, idx) => {
      const qObj = memoryStore.questions.find((q) => q.id === qid)
      memoryStore.examQuestions.push({
        id: `eq-exam8-${idx + 1}`,
        exam_id: 'exam-c11-phy-midterm',
        question_id: qid,
        order_index: idx + 1,
        marks: qObj?.marks || 2,
      })
    })

    // Exam 9: Class 11 General Tamil (பொதுத்தமிழ்)
    const exam9 = {
      id: 'exam-c11-tam-midterm',
      title: 'Class 11 பொதுத்தமிழ் — மாதிரி வினாத்தாள் (இலக்கணம் & கவிதை)',
      description: 'தமிழ்நாடு மேல்நிலை முதலாமாண்டு (+1) பொதுத்தமிழ் மாதிரி வினாத்தாள்.',
      class_id: 'c-11',
      class_name: 'Class 11',
      subject_id: 'sub-11-tam',
      subject_name: 'General Tamil',
      term_id: 'trm-11tam-1',
      chapter_ids: ['ch-11tam-t1-1'],
      duration_minutes: 45,
      total_marks: 20,
      passing_marks: 7,
      difficulty: 'Medium',
      question_count: 4,
      status: 'PUBLISHED',
      is_published: true,
      created_by: 'user-teacher-demo',
      published_at: '2026-09-01T15:30:00.000Z',
    }
    memoryStore.exams.push(exam9)

    const q11tamIds = ['q-c12tam-1', 'q-c12tam-2']
    q11tamIds.forEach((qid, idx) => {
      const qObj = memoryStore.questions.find((q) => q.id === qid)
      memoryStore.examQuestions.push({
        id: `eq-exam9-${idx + 1}`,
        exam_id: 'exam-c11-tam-midterm',
        question_id: qid,
        order_index: idx + 1,
        marks: qObj?.marks || 2,
      })
    })

    // Exam 10: Class 11 General English
    const exam10 = {
      id: 'exam-c11-eng-midterm',
      title: 'Class 11 General English — Higher Secondary Model Paper',
      description: 'Class 11 State Board English examination covering Prose, Poetry, and Grammar analysis.',
      class_id: 'c-11',
      class_name: 'Class 11',
      subject_id: 'sub-11-eng',
      subject_name: 'General English',
      term_id: 'trm-11eng-1',
      chapter_ids: ['ch-11eng-t1-1'],
      duration_minutes: 45,
      total_marks: 20,
      passing_marks: 7,
      difficulty: 'Medium',
      question_count: 4,
      status: 'PUBLISHED',
      is_published: true,
      created_by: 'user-teacher-demo',
      published_at: '2026-09-01T16:00:00.000Z',
    }
    memoryStore.exams.push(exam10)

    const q11engIds = ['q-c12eng-1', 'q-c12eng-2']
    q11engIds.forEach((qid, idx) => {
      const qObj = memoryStore.questions.find((q) => q.id === qid)
      memoryStore.examQuestions.push({
        id: `eq-exam10-${idx + 1}`,
        exam_id: 'exam-c11-eng-midterm',
        question_id: qid,
        order_index: idx + 1,
        marks: qObj?.marks || 2,
      })
    })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SQL Evaluator for In-Memory Mode
// ─────────────────────────────────────────────────────────────────────────────
function executeMockQuery(query: string, params: any[] = []): any {
  const q = query.replace(/\s+/g, ' ').trim().toUpperCase()

  // DDL — ignore silently
  if (q.startsWith('CREATE TABLE') || q.startsWith('CREATE INDEX') || q.startsWith('ALTER TABLE') || q.startsWith('--')) {
    return []
  }

  // ── INSERT ───────────────────────────────────────────────────────────────────
  if (q.startsWith('INSERT INTO BOARDS')) {
    const [id, board_name, short_name, state] = params
    if (!memoryStore.boards.some((b) => b.id === id)) memoryStore.boards.push({ id, board_name, short_name, state })
    return []
  }
  if (q.startsWith('INSERT INTO CLASSES')) {
    const [id, class_name] = params
    if (!memoryStore.classes.some((c) => c.id === id || c.class_name === class_name)) memoryStore.classes.push({ id, class_name, board_id: 'board-tnsb' })
    return []
  }
  if (q.startsWith('INSERT INTO STREAMS')) {
    const [id, stream_name] = params
    if (!memoryStore.streams.some((s) => s.id === id || s.stream_name === stream_name)) memoryStore.streams.push({ id, stream_name })
    return []
  }
  if (q.startsWith('INSERT INTO SUBJECTS')) {
    const [id, class_id, stream_id, subject_name, subject_code] = params
    if (!memoryStore.subjects.some((s) => s.id === id)) memoryStore.subjects.push({ id, class_id, stream_id, subject_name, subject_code, medium: 'Both', term_type: '3-term' })
    return []
  }
  if (q.startsWith('INSERT INTO TERMS')) {
    const [id, subject_id, class_id, term_number, term_name] = params
    if (!memoryStore.terms.some((t) => t.id === id)) memoryStore.terms.push({ id, subject_id, class_id, term_number, term_name })
    return []
  }
  if (q.startsWith('INSERT INTO CHAPTERS')) {
    const [id, subject_id, term_id, chapter_number, chapter_name] = params
    if (!memoryStore.chapters.some((c) => c.id === id)) memoryStore.chapters.push({ id, subject_id, term_id, chapter_number, chapter_name, indexing_status: 'PENDING' })
    return []
  }
  if (q.startsWith('INSERT INTO TOPICS')) {
    const [id, chapter_id, topic_number, topic_name] = params
    if (!memoryStore.topics.some((t) => t.id === id)) memoryStore.topics.push({ id, chapter_id, topic_number, topic_name, indexing_status: 'PENDING' })
    return []
  }
  if (q.startsWith('INSERT INTO TEXTBOOKS')) {
    const [id, class_id, subject_id, book_name, publisher, academic_year, pdf_url] = params
    if (!memoryStore.textbooks.some((t) => t.id === id)) memoryStore.textbooks.push({ id, class_id, subject_id, book_name, publisher, academic_year, pdf_url })
    return []
  }
  if (q.startsWith('INSERT INTO BOOK_CHUNKS')) {
    const [id, textbook_id, class_id, subject_id, term_id, chapter_id, topic_id, section_name, page_number, content, embedding] = params
    if (!memoryStore.bookChunks.some((b) => b.id === id)) memoryStore.bookChunks.push({ id, textbook_id, class_id, subject_id, term_id, chapter_id, topic_id, section_name, page_number, content, embedding })
    return []
  }
  if (q.startsWith('INSERT INTO USERS')) {
    // Supports both old (4-param) and new (7-param with class_level, medium, phone)
    const [email, name, password_hash, role, class_level, medium, phone] = params
    const newUser = {
      id: 'user-' + Date.now(),
      email, name, password_hash, role,
      class_level: class_level || null,
      medium: medium || null,
      phone: phone || null,
      created_at: new Date().toISOString(),
    }
    memoryStore.users.push(newUser)
    // Return user without password_hash (mirrors RETURNING clause)
    const { password_hash: _ph, ...safeUser } = newUser
    return safeUser
  }

  // ── SELECT — BOARDS ──────────────────────────────────────────────────────────
  if (q.includes('FROM BOARDS')) {
    return memoryStore.boards[0] || null
  }

  // ── SELECT — CLASSES ─────────────────────────────────────────────────────────
  if (q.includes('FROM CLASSES WHERE ID =')) {
    return memoryStore.classes.find((c) => c.id === params[0]) || null
  }
  if (q.includes('FROM CLASSES')) {
    return memoryStore.classes
  }

  // ── SELECT — STREAMS ─────────────────────────────────────────────────────────
  if (q.includes('FROM STREAMS')) {
    return memoryStore.streams
  }

  // ── SELECT — SUBJECTS ────────────────────────────────────────────────────────
  if (q.includes('FROM SUBJECTS WHERE ID =')) {
    return memoryStore.subjects.find((s) => s.id === params[0]) || null
  }
  if (q.includes('FROM SUBJECTS WHERE CLASS_ID =')) {
    const classId = params[0]
    let streamId: string | null = null
    let medium: string | null = null

    if (params.length === 3) {
      streamId = params[1]
      medium = params[2]
    } else if (params.length === 2) {
      if (q.includes('MEDIUM = $2')) medium = params[1]
      else streamId = params[1]
    }

    return memoryStore.subjects.filter((s) => {
      if (s.class_id !== classId) return false
      if (streamId && s.stream_id !== streamId && s.stream_id !== null) return false
      if (medium && s.medium !== medium && s.medium !== 'Both') return false
      return true
    })
  }

  // ── SELECT — TERMS ───────────────────────────────────────────────────────────
  if (q.includes('FROM TERMS WHERE ID =')) {
    return memoryStore.terms.find((t) => t.id === params[0]) || null
  }
  if (q.includes('FROM TERMS WHERE SUBJECT_ID =')) {
    return memoryStore.terms.filter((t) => t.subject_id === params[0]).sort((a, b) => a.term_number - b.term_number)
  }

  // ── SELECT — CHAPTERS ────────────────────────────────────────────────────────
  if (q.includes('FROM CHAPTERS WHERE ID =')) {
    const chap = memoryStore.chapters.find((c) => c.id === params[0]) || null
    if (!chap) return null
    const isReady = chap.indexing_status === 'READY' || memoryStore.bookChunks.some((b) => b.chapter_id === chap.id)
    return {
      ...chap,
      indexing_status: isReady ? 'READY' : 'PENDING',
      textbook_status: isReady ? 'AVAILABLE' : 'PENDING',
    }
  }
  if (q.includes('FROM CHAPTERS WHERE TERM_ID =')) {
    return memoryStore.chapters
      .filter((c) => c.term_id === params[0])
      .sort((a, b) => a.chapter_number - b.chapter_number)
      .map((c) => {
        const isReady = c.indexing_status === 'READY' || memoryStore.bookChunks.some((b) => b.chapter_id === c.id)
        return {
          ...c,
          indexing_status: isReady ? 'READY' : 'PENDING',
          textbook_status: isReady ? 'AVAILABLE' : 'PENDING',
        }
      })
  }
  if (q.includes('FROM CHAPTERS WHERE SUBJECT_ID =')) {
    return memoryStore.chapters
      .filter((c) => c.subject_id === params[0])
      .sort((a, b) => a.chapter_number - b.chapter_number)
      .map((c) => {
        const isReady = c.indexing_status === 'READY' || memoryStore.bookChunks.some((b) => b.chapter_id === c.id)
        return {
          ...c,
          indexing_status: isReady ? 'READY' : 'PENDING',
          textbook_status: isReady ? 'AVAILABLE' : 'PENDING',
        }
      })
  }

  // ── SELECT — TOPICS ──────────────────────────────────────────────────────────
  if (q.includes('FROM TOPICS WHERE CHAPTER_ID =')) {
    return memoryStore.topics
      .filter((t) => t.chapter_id === params[0])
      .sort((a, b) => a.topic_number - b.topic_number)
  }
  if (q.includes('FROM TOPICS WHERE ID =')) {
    return memoryStore.topics.find((t) => t.id === params[0]) || null
  }

  // ── SELECT — TEXTBOOKS ───────────────────────────────────────────────────────
  if (q.includes('FROM TEXTBOOKS WHERE SUBJECT_ID =')) {
    return memoryStore.textbooks.find((t) => t.subject_id === params[0]) || null
  }

  // ── SELECT — BOOK CHUNKS ─────────────────────────────────────────────────────
  if (q.includes('FROM BOOK_CHUNKS') && (q.includes('WHERE C.CHAPTER_ID =') || q.includes('WHERE CHAPTER_ID ='))) {
    const chapterId = params[0]
    const termId = params[1]
    const topicId = params[2]
    let results = memoryStore.bookChunks.filter((b) => b.chapter_id === chapterId)
    if (termId) results = results.filter((b) => b.term_id === termId)
    if (topicId) results = results.filter((b) => b.topic_id === topicId)
    return results
  }

  // ── SELECT — USERS ───────────────────────────────────────────────────────────
  if (q.includes('COUNT(*)') && q.includes('FROM USERS')) {
    return { count: memoryStore.users.length.toString() }
  }
  if (q.includes('FROM USERS WHERE EMAIL =')) {
    // Return raw (with hash) so authService can verify password
    return memoryStore.users.find((u) => u.email === params[0]) || null
  }
  if (q.includes('FROM USERS WHERE ID =')) {
    const raw = memoryStore.users.find((u) => u.id === params[0]) || null
    if (!raw) return null
    // Strip password_hash — mirrors SELECT without password_hash in authService
    const { password_hash: _ph, ...safe } = raw
    return safe
  }

  // ── SELECT — ASSIGNMENTS ──────────────────────────────────────────────────
  if (q.startsWith('INSERT INTO ASSIGNMENTS')) {
    const [id, teacher_id, title, description, class_level, medium, subject_id, term_id, chapter_id, due_date, status] = params
    const newAssignment = {
      id: id || 'asg-' + Date.now(),
      teacher_id,
      title,
      description: description || '',
      class_level,
      medium,
      subject_id,
      term_id: term_id || null,
      chapter_id,
      due_date: due_date || null,
      status: status || 'ACTIVE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    const existingIndex = memoryStore.assignments.findIndex((a) => a.id === newAssignment.id)
    if (existingIndex >= 0) {
      memoryStore.assignments[existingIndex] = newAssignment
    } else {
      memoryStore.assignments.push(newAssignment)
    }
    return newAssignment
  }

  if (q.startsWith('UPDATE ASSIGNMENTS')) {
    const id = params[params.length - 1]
    const existing = memoryStore.assignments.find((a) => a.id === id)
    if (existing) {
      if (params[0] !== undefined) existing.title = params[0]
      if (params[1] !== undefined) existing.description = params[1]
      if (params[2] !== undefined) existing.due_date = params[2]
      if (params[3] !== undefined) existing.status = params[3]
      existing.updated_at = new Date().toISOString()
      return existing
    }
    return null
  }

  if (q.startsWith('DELETE FROM ASSIGNMENTS')) {
    const id = params[0]
    const idx = memoryStore.assignments.findIndex((a) => a.id === id)
    if (idx >= 0) {
      memoryStore.assignments.splice(idx, 1)
      // also delete related submissions
      memoryStore.assignmentSubmissions = memoryStore.assignmentSubmissions.filter((s) => s.assignment_id !== id)
    }
    return []
  }

  if (q.includes('FROM ASSIGNMENTS WHERE ID =')) {
    return memoryStore.assignments.find((a) => a.id === params[0]) || null
  }

  if (q.includes('FROM ASSIGNMENTS WHERE TEACHER_ID =')) {
    return memoryStore.assignments.filter((a) => a.teacher_id === params[0])
  }

  if (q.includes('FROM ASSIGNMENTS WHERE CLASS_LEVEL =') || q.includes('FROM ASSIGNMENTS WHERE CLASS_ID =')) {
    const classLevel = params[0]
    const medium = params[1]
    return memoryStore.assignments.filter((a) => {
      const matchClass = a.class_level === classLevel || a.class_level === classLevel.replace('c-', 'Class ')
      const matchMedium = !medium || a.medium === medium || a.medium === 'Both'
      return matchClass && matchMedium
    })
  }

  if (q.includes('FROM ASSIGNMENTS')) {
    return memoryStore.assignments
  }

  // ── SELECT — ASSIGNMENT SUBMISSIONS ───────────────────────────────────────
  if (q.startsWith('INSERT INTO ASSIGNMENT_SUBMISSIONS')) {
    const [id, assignment_id, student_id, status, score, percentage, answers, feedback] = params
    const newSubmission = {
      id: id || 'sub-' + Date.now(),
      assignment_id,
      student_id,
      status: status || 'SUBMITTED',
      score: Number(score) || 0,
      percentage: Number(percentage) || 0,
      answers: answers || [],
      feedback: feedback || '',
      submitted_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    const existingIdx = memoryStore.assignmentSubmissions.findIndex(
      (s) => s.assignment_id === assignment_id && s.student_id === student_id
    )
    if (existingIdx >= 0) {
      memoryStore.assignmentSubmissions[existingIdx] = newSubmission
    } else {
      memoryStore.assignmentSubmissions.push(newSubmission)
    }
    return newSubmission
  }

  if (q.includes('FROM ASSIGNMENT_SUBMISSIONS WHERE ASSIGNMENT_ID =') && q.includes('AND STUDENT_ID =')) {
    return (
      memoryStore.assignmentSubmissions.find(
        (s) => s.assignment_id === params[0] && s.student_id === params[1]
      ) || null
    )
  }

  if (q.includes('FROM ASSIGNMENT_SUBMISSIONS WHERE ASSIGNMENT_ID =')) {
    return memoryStore.assignmentSubmissions.filter((s) => s.assignment_id === params[0])
  }

  if (q.includes('FROM ASSIGNMENT_SUBMISSIONS WHERE STUDENT_ID =')) {
    return memoryStore.assignmentSubmissions.filter((s) => s.student_id === params[0])
  }

  if (q.includes('FROM ASSIGNMENT_SUBMISSIONS')) {
    return memoryStore.assignmentSubmissions
  }

  return []
}

// ─────────────────────────────────────────────────────────────────────────────
// Proxied DB — routes to PostgreSQL or in-memory fallback
// ─────────────────────────────────────────────────────────────────────────────
const db = {
  async one(query: string, params?: any[]) {
    if (isFallbackMode) return executeMockQuery(query, params)
    try { return await pgDb.one(query, params) }
    catch (err: any) {
      if (err.code === 'ECONNREFUSED' || err.message?.includes('connect ECONNREFUSED')) { isFallbackMode = true; return executeMockQuery(query, params) }
      throw err
    }
  },

  async oneOrNone(query: string, params?: any[]) {
    if (isFallbackMode) return executeMockQuery(query, params)
    try { return await pgDb.oneOrNone(query, params) }
    catch (err: any) {
      if (err.code === 'ECONNREFUSED' || err.message?.includes('connect ECONNREFUSED')) { isFallbackMode = true; return executeMockQuery(query, params) }
      throw err
    }
  },

  async manyOrNone(query: string, params?: any[]) {
    if (isFallbackMode) return executeMockQuery(query, params)
    try { return await pgDb.manyOrNone(query, params) }
    catch (err: any) {
      if (err.code === 'ECONNREFUSED' || err.message?.includes('connect ECONNREFUSED')) { isFallbackMode = true; return executeMockQuery(query, params) }
      throw err
    }
  },

  async any(query: string, params?: any[]) {
    if (isFallbackMode) return executeMockQuery(query, params)
    try { return await pgDb.any(query, params) }
    catch (err: any) {
      if (err.code === 'ECONNREFUSED' || err.message?.includes('connect ECONNREFUSED')) { isFallbackMode = true; return executeMockQuery(query, params) }
      throw err
    }
  },

  async none(query: string, params?: any[]) {
    if (isFallbackMode) return executeMockQuery(query, params)
    try { return await pgDb.none(query, params) }
    catch (err: any) {
      if (err.code === 'ECONNREFUSED' || err.message?.includes('connect ECONNREFUSED')) { isFallbackMode = true; return executeMockQuery(query, params) }
      throw err
    }
  },
}

initMemoryStore().catch(() => {})

export default db

