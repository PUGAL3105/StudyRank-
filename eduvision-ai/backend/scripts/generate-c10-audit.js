/**
 * EduVision AI — Generate Class 10 Audit JSON
 */
const fs = require('fs')
const path = require('path')
const db = require('../dist/db/connection')

async function runAudit() {
  if (db.initMemoryStore) {
    await db.initMemoryStore()
  }
  const store = db.memoryStore

  const c10Subjects = store.subjects.filter((s) => s.class_id === 'c-10')
  const c10Chapters = store.chapters.filter((c) => c.subject_id && c.subject_id.startsWith('sub-10'))
  const readyChapters = c10Chapters.filter((c) => c.indexing_status === 'READY')
  const pendingChapters = c10Chapters.filter((c) => c.indexing_status !== 'READY')

  const auditResult = {
    totalSubjects: c10Subjects.length,
    totalTerms: store.terms.filter((t) => t.class_id === 'c-10').length,
    totalChapters: c10Chapters.length,
    readyChapters: readyChapters.length,
    pendingChapters: pendingChapters.length,
    subjects: c10Subjects.map((sub) => {
      const subChaps = c10Chapters.filter((c) => c.subject_id === sub.id)
      return {
        subjectId: sub.id,
        subjectName: sub.subject_name,
        medium: sub.medium || 'Both',
        chaptersCount: subChaps.length,
        readyCount: subChaps.filter((c) => c.indexing_status === 'READY').length,
        chapters: subChaps.map((c) => ({
          subjectId: sub.id,
          subjectName: sub.subject_name,
          medium: sub.medium || 'Both',
          termId: c.term_id,
          chapterId: c.id,
          chapterNumber: c.chapter_number,
          chapterTitle: c.chapter_name,
          status: c.indexing_status,
        })),
      }
    }),
  }

  const auditPath = path.join(__dirname, '..', 'c10-audit.json')
  fs.writeFileSync(auditPath, JSON.stringify(auditResult, null, 2))
  console.log(`✓ c10-audit.json updated! READY: ${readyChapters.length} / ${c10Chapters.length} chapters.`)
}

runAudit().catch(console.error)
