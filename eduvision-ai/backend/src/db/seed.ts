import db from './connection'
import bcrypt from 'bcryptjs'
import fs from 'fs'
import path from 'path'
import { generateOpenAIEmbedding } from '../services/chunkerService'

export const MASTER_CLASSES_DATA = [
  { id: 'c-6', class_name: 'Class 6' },
  { id: 'c-7', class_name: 'Class 7' },
  { id: 'c-8', class_name: 'Class 8' },
  { id: 'c-9', class_name: 'Class 9' },
  { id: 'c-10', class_name: 'Class 10' },
  { id: 'c-11', class_name: 'Class 11' },
  { id: 'c-12', class_name: 'Class 12' },
]

export const MASTER_STREAMS_DATA = [
  { id: 'str-sci', stream_name: 'Science Stream' },
  { id: 'str-com', stream_name: 'Commerce Stream' },
  { id: 'str-art', stream_name: 'Arts Stream' },
]

export async function seedDatabase() {
  try {
    console.log('🌱 Seeding PostgreSQL database with authentic Tamil Nadu State Board (Samacheer Kalvi) curriculum & 1536-dim embeddings...')

    // 1. Seed Classes
    for (const c of MASTER_CLASSES_DATA) {
      await db.none(
        `INSERT INTO classes (id, class_name) VALUES ($1, $2) ON CONFLICT (class_name) DO NOTHING`,
        [c.id, c.class_name]
      )
    }

    // 2. Seed Streams
    for (const s of MASTER_STREAMS_DATA) {
      await db.none(
        `INSERT INTO streams (id, stream_name) VALUES ($1, $2) ON CONFLICT (stream_name) DO NOTHING`,
        [s.id, s.stream_name]
      )
    }

    // 3. Seed Users
    const hashedPassword = await bcrypt.hash('password', 10)
    await db.none(
      `INSERT INTO users (id, email, name, password_hash, role)
       VALUES ('user-student-1', 'student@demo.com', 'Demo Student', $1, 'student')
       ON CONFLICT (email) DO NOTHING`,
      [hashedPassword]
    )
    await db.none(
      `INSERT INTO users (id, email, name, password_hash, role)
       VALUES ('user-teacher-1', 'teacher@demo.com', 'Demo Teacher', $1, 'teacher')
       ON CONFLICT (email) DO NOTHING`,
      [hashedPassword]
    )
    await db.none(
      `INSERT INTO users (id, email, name, password_hash, role)
       VALUES ('user-admin-1', 'admin@demo.com', 'Admin User', $1, 'admin')
       ON CONFLICT (email) DO NOTHING`,
      [hashedPassword]
    )

    // 4. Seed Board
    await db.none(
      `INSERT INTO boards (id, board_name, short_name, state, country)
       VALUES ('board-tnsb', 'Tamil Nadu State Board (Samacheer Kalvi)', 'TNSBSK', 'Tamil Nadu', 'India')
       ON CONFLICT (id) DO NOTHING`
    )

    // 5. Seed Terms & Chapters from master-tamilnadu-curriculum.json
    const masterPath = path.join(__dirname, '../../master-tamilnadu-curriculum.json')
    let masterData: any = null
    if (fs.existsSync(masterPath)) {
      try { masterData = JSON.parse(fs.readFileSync(masterPath, 'utf8')) } catch { masterData = null }
    }

    if (masterData && Array.isArray(masterData.classes)) {
      for (const cls of masterData.classes) {
        const classNum = cls.classNumber
        for (const sub of cls.subjects) {
          // Ensure subject exists in DB
          await db.none(
            `INSERT INTO subjects (id, class_id, subject_name, medium, term_type)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (id) DO UPDATE SET subject_name = EXCLUDED.subject_name, medium = EXCLUDED.medium`,
            [sub.subjectId, cls.classId || `c-${classNum}`, sub.subjectName, sub.medium || 'Both', sub.termType || '3-term']
          )

          // Ensure textbook record exists
          const tbId = `tb-${sub.subjectId}`
          await db.none(
            `INSERT INTO textbooks (id, class_id, subject_id, book_name, publisher, academic_year)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (id) DO NOTHING`,
            [tbId, cls.classId || `c-${classNum}`, sub.subjectId, `${sub.subjectName} Textbook`, 'TN Textbook Corporation', '2024-2025']
          )

          const subCode = sub.subjectId.replace('sub-', '').replace('-', '')
          for (const trm of sub.terms) {
            const termNumber = trm.termNumber
            const termName = trm.termName || (classNum >= 11 ? `Semester ${termNumber}` : `Term ${termNumber}`)
            const termId = `trm-${subCode}-${termNumber}`

            await db.none(
              `INSERT INTO terms (id, subject_id, class_id, term_number, term_name)
               VALUES ($1, $2, $3, $4, $5)
               ON CONFLICT (id) DO UPDATE SET term_name = EXCLUDED.term_name`,
              [termId, sub.subjectId, cls.classId || `c-${classNum}`, termNumber, termName]
            )

            for (const ch of trm.chapters) {
              const chapNum = ch.chapterNumber
              const chapId = `ch-${subCode}-t${termNumber}-${chapNum}`

              let indexingStatus = 'PENDING'
              if (sub.subjectId === 'sub-10-sci') {
                if (termNumber === 1 && chapNum <= 5) indexingStatus = 'READY'
                else if (termNumber === 2 && chapNum <= 2) indexingStatus = 'READY'
                else if (termNumber === 3 && chapNum <= 3) indexingStatus = 'READY'
              }

              await db.none(
                `INSERT INTO chapters (id, subject_id, term_id, chapter_number, chapter_name, indexing_status)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 ON CONFLICT (id) DO UPDATE SET chapter_name = EXCLUDED.chapter_name, term_id = EXCLUDED.term_id, indexing_status = EXCLUDED.indexing_status`,
                [chapId, sub.subjectId, termId, chapNum, ch.chapterName, indexingStatus]
              )
            }
          }
        }
      }
    }

    // 7. Seed Topics for Laws of Motion
    const topicsToSeed = [
      { id: 'top-10sci-1-1', chapter_id: 'ch-10sci-t1-1', number: 1, name: "Inertia and Newton's First Law of Motion", status: 'READY' },
      { id: 'top-10sci-1-2', chapter_id: 'ch-10sci-t1-1', number: 2, name: "Linear Momentum & Newton's Second Law (F = ma)", status: 'READY' },
      { id: 'top-10sci-1-3', chapter_id: 'ch-10sci-t1-1', number: 3, name: "Newton's Third Law & Action-Reaction", status: 'READY' },
      { id: 'top-10sci-1-4', chapter_id: 'ch-10sci-t1-1', number: 4, name: 'Law of Conservation of Linear Momentum', status: 'READY' },
      { id: 'top-10sci-1-5', chapter_id: 'ch-10sci-t1-1', number: 5, name: "Rocket Propulsion & Newton's Universal Law of Gravitation", status: 'READY' },
    ]
    for (const top of topicsToSeed) {
      await db.none(
        `INSERT INTO topics (id, chapter_id, topic_number, topic_name, indexing_status)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE SET topic_name = EXCLUDED.topic_name, indexing_status = EXCLUDED.indexing_status`,
        [top.id, top.chapter_id, top.number, top.name, top.status]
      )
    }

    // 8. Seed Textbooks
    await db.none(
      `INSERT INTO textbooks (id, class_id, subject_id, book_name, publisher, academic_year, pdf_url)
       VALUES ('tb-sub-10-sci', 'c-10', 'sub-10-sci', 'Tamil Nadu State Board Class 10 Science Textbook', 'TN Textbook Corporation', '2024-2025', 'https://eduvision.ai/textbooks/tnsb-10-sci.pdf')
       ON CONFLICT (id) DO UPDATE SET book_name = EXCLUDED.book_name`
    )

    // 9. Seed Multi-Chunk TN SB Laws of Motion Textbook Chunks
    const rawChunks = [
      {
        id: 'chunk-laws-1',
        textbook_id: 'tb-sub-10-sci',
        class_id: 'c-10',
        subject_id: 'sub-10-sci',
        term_id: 'trm-10sci-1',
        chapter_id: 'ch-10sci-t1-1',
        topic_id: 'top-10sci-1-1',
        chapter_name: 'Laws of Motion',
        section_name: '1.1 Inertia and Newton\'s First Law of Motion',
        page_number: 1,
        content:
          'Section 1.1 Inertia and Newton\'s First Law of Motion: Every body continues to be in its state of rest or of uniform motion along a straight line unless it is acted upon by some external force. Inertia is the inherent property of a body to resist any change in its state of rest or state of uniform motion, unless it is influenced by an external unbalanced force. Types of inertia include inertia of rest, inertia of motion, and inertia of direction.',
      },
      {
        id: 'chunk-laws-2',
        textbook_id: 'tb-sub-10-sci',
        class_id: 'c-10',
        subject_id: 'sub-10-sci',
        term_id: 'trm-10sci-1',
        chapter_id: 'ch-10sci-t1-1',
        topic_id: 'top-10sci-1-2',
        chapter_name: 'Laws of Motion',
        section_name: '1.2 Newton\'s Second Law of Motion (Force and Acceleration)',
        page_number: 5,
        content:
          'Section 1.2 Newton\'s Second Law of Motion: The force acting on a body is directly proportional to the rate of change of linear momentum of the body and the change in momentum takes place in the direction of the force. F = ma, where F is force in Newtons (N), m is mass in kilograms (kg), and a is acceleration in m/s². One Newton is defined as the force required to produce an acceleration of 1 m/s² in a body of mass 1 kg.',
      },
      {
        id: 'chunk-laws-3',
        textbook_id: 'tb-sub-10-sci',
        class_id: 'c-10',
        subject_id: 'sub-10-sci',
        term_id: 'trm-10sci-1',
        chapter_id: 'ch-10sci-t1-1',
        topic_id: 'top-10sci-1-3',
        chapter_name: 'Laws of Motion',
        section_name: '1.3 Newton\'s Third Law of Motion',
        page_number: 8,
        content:
          'Section 1.3 Newton\'s Third Law of Motion: For every action, there is an equal and opposite reaction. They always act on two different bodies. Example: When a bullet is fired from a gun, the force on the bullet is the action and the recoil force on the gun is the reaction.',
      },
      {
        id: 'chunk-laws-4',
        textbook_id: 'tb-sub-10-sci',
        class_id: 'c-10',
        subject_id: 'sub-10-sci',
        term_id: 'trm-10sci-1',
        chapter_id: 'ch-10sci-t1-1',
        topic_id: 'top-10sci-1-4',
        chapter_name: 'Laws of Motion',
        section_name: '1.4 Principle of Conservation of Linear Momentum',
        page_number: 11,
        content:
          'Section 1.4 Principle of Conservation of Linear Momentum: There is no change in the total linear momentum of a system of bodies as long as no external force acts on them. Initial momentum before collision equals total momentum after collision: m1 u1 + m2 u2 = m1 v1 + m2 v2.',
      },
    ]

    for (const c of rawChunks) {
      const emb = generateOpenAIEmbedding(`${c.section_name} ${c.content}`)
      await db.none(
        `INSERT INTO book_chunks (id, textbook_id, class_id, subject_id, term_id, chapter_id, topic_id, section_name, page_number, content, embedding)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (id) DO UPDATE SET term_id = EXCLUDED.term_id, topic_id = EXCLUDED.topic_id, content = EXCLUDED.content, embedding = EXCLUDED.embedding`,
        [c.id, c.textbook_id, c.class_id, c.subject_id, c.term_id, c.chapter_id, c.topic_id, c.section_name, c.page_number, c.content, emb]
      )
    }

    console.log('✅ PostgreSQL database seeded successfully with Tamil Nadu State Board curriculum chunks & 1536-dim embeddings!')
  } catch (error: any) {
    if (error.code === 'ECONNREFUSED' || error.message?.includes('connect ECONNREFUSED')) {
      console.log('ℹ️  PostgreSQL unavailable during seed. Synchronized memoryStore fallback.')
    } else {
      console.error('❌ Seed error:', error.message)
    }
  }
}

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err)
      process.exit(1)
    })
}
