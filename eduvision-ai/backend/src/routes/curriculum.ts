import { Router, Request, Response } from 'express'
import db from '../db/connection'

const router = Router()

// ── GET /api/board ────────────────────────────────────────────────────────────
router.get('/board', async (_req: Request, res: Response) => {
  try {
    const board = await db.oneOrNone('SELECT * FROM boards LIMIT 1')
    if (!board) return res.status(404).json({ success: false, error: 'No board configured.' })
    res.json({ success: true, data: board })
  } catch {
    res.status(500).json({ success: false, error: 'Unable to retrieve board information.' })
  }
})

// ── GET /api/classes ──────────────────────────────────────────────────────────
router.get('/classes', async (_req: Request, res: Response) => {
  try {
    const rawClasses = await db.any('SELECT id, class_name, board_id FROM classes ORDER BY class_name ASC')
    const uniqueClasses = rawClasses.filter((c: any, i: number, self: any[]) => i === self.findIndex((x: any) => x.class_name === c.class_name))
    res.json({ success: true, data: uniqueClasses })
  } catch {
    res.status(500).json({ success: false, error: 'Unable to retrieve classes.' })
  }
})


// ── GET /api/streams ──────────────────────────────────────────────────────────
router.get('/streams', async (_req: Request, res: Response) => {
  try {
    const streams = await db.any('SELECT id, stream_name FROM streams ORDER BY stream_name ASC')
    res.json({ success: true, data: streams })
  } catch {
    res.status(500).json({ success: false, error: 'Unable to retrieve streams.' })
  }
})

// ── GET /api/classes/:classId/subjects?medium=English|Tamil ──────────────────
router.get('/classes/:classId/subjects', async (req: Request, res: Response) => {
  const { classId } = req.params
  const { streamId, medium } = req.query as { streamId?: string; medium?: string }

  try {
    const validClass = await db.oneOrNone('SELECT id, class_name FROM classes WHERE id = $1', [classId])
    if (!validClass) return res.status(404).json({ success: false, error: `Class not found: ${classId}` })

    let query = 'SELECT id, class_id, stream_id, subject_name, subject_code, medium, term_type FROM subjects WHERE class_id = $1'
    const params: any[] = [classId]

    if (streamId) {
      query += ' AND (stream_id = $2 OR stream_id IS NULL)'
      params.push(streamId)
      if (medium) {
        query += ` AND (medium = $3 OR medium = 'Both')`
        params.push(medium)
      }
    } else if (medium) {
      query += ` AND (medium = $2 OR medium = 'Both')`
      params.push(medium)
    }

    query += ' ORDER BY subject_name ASC'

    const subjects = await db.any(query, params)
    res.json({ success: true, data: subjects })
  } catch {
    res.status(500).json({ success: false, error: 'Unable to retrieve subjects.' })
  }
})

// ── GET /api/subjects/:subjectId/terms ───────────────────────────────────────
router.get('/subjects/:subjectId/terms', async (req: Request, res: Response) => {
  const { subjectId } = req.params
  try {
    const validSubject = await db.oneOrNone('SELECT id, subject_name FROM subjects WHERE id = $1', [subjectId])
    if (!validSubject) return res.status(404).json({ success: false, error: `Subject not found: ${subjectId}` })

    const terms = await db.any(
      'SELECT id, subject_id, class_id, term_number, term_name FROM terms WHERE subject_id = $1 ORDER BY term_number ASC',
      [subjectId]
    )
    res.json({ success: true, data: terms })
  } catch {
    res.status(500).json({ success: false, error: 'Unable to retrieve terms.' })
  }
})

// ── GET /api/terms/:termId/chapters ──────────────────────────────────────────
router.get('/terms/:termId/chapters', async (req: Request, res: Response) => {
  const { termId } = req.params
  try {
    const validTerm = await db.oneOrNone('SELECT id, term_name FROM terms WHERE id = $1', [termId])
    if (!validTerm) return res.status(404).json({ success: false, error: `Term not found: ${termId}` })

    const chapters = await db.any(
      `SELECT id, subject_id, term_id, chapter_number, chapter_name,
              COALESCE(curriculum_status, 'VERIFIED') AS curriculum_status,
              COALESCE(textbook_status, CASE WHEN indexing_status = 'READY' THEN 'AVAILABLE' ELSE 'PENDING' END) AS textbook_status,
              COALESCE(indexing_status, 'PENDING') AS indexing_status
       FROM chapters WHERE term_id = $1 ORDER BY chapter_number ASC`,
      [termId]
    )
    res.json({ success: true, data: chapters })
  } catch {
    res.status(500).json({ success: false, error: 'Unable to retrieve chapters.' })
  }
})

// ── GET /api/subjects/:subjectId/chapters (all chapters for subject) ─────────
router.get('/subjects/:subjectId/chapters', async (req: Request, res: Response) => {
  const { subjectId } = req.params
  try {
    const validSubject = await db.oneOrNone('SELECT id, subject_name FROM subjects WHERE id = $1', [subjectId])
    if (!validSubject) return res.status(404).json({ success: false, error: `Subject not found: ${subjectId}` })

    const chapters = await db.any(
      `SELECT id, subject_id, term_id, chapter_number, chapter_name,
              COALESCE(curriculum_status, 'VERIFIED') AS curriculum_status,
              COALESCE(textbook_status, CASE WHEN indexing_status = 'READY' THEN 'AVAILABLE' ELSE 'PENDING' END) AS textbook_status,
              COALESCE(indexing_status, 'PENDING') AS indexing_status
       FROM chapters WHERE subject_id = $1 ORDER BY chapter_number ASC`,
      [subjectId]
    )
    res.json({ success: true, data: chapters })
  } catch {
    res.status(500).json({ success: false, error: 'Unable to retrieve chapters.' })
  }
})

// ── GET /api/chapters/:chapterId/topics ──────────────────────────────────────
router.get('/chapters/:chapterId/topics', async (req: Request, res: Response) => {
  const { chapterId } = req.params
  try {
    const validChapter = await db.oneOrNone('SELECT id, chapter_name FROM chapters WHERE id = $1', [chapterId])
    if (!validChapter) return res.status(404).json({ success: false, error: `Chapter not found: ${chapterId}` })

    const topics = await db.any(
      `SELECT id, chapter_id, topic_number, topic_name, indexing_status
       FROM topics WHERE chapter_id = $1 ORDER BY topic_number ASC`,
      [chapterId]
    )
    res.json({ success: true, data: topics })
  } catch {
    res.status(500).json({ success: false, error: 'Unable to retrieve topics.' })
  }
})

// ── GET /api/textbooks/:subjectId ─────────────────────────────────────────────
router.get('/textbooks/:subjectId', async (req: Request, res: Response) => {
  const { subjectId } = req.params
  try {
    const textbook = await db.oneOrNone(
      'SELECT id, class_id, subject_id, book_name, publisher, academic_year, pdf_url FROM textbooks WHERE subject_id = $1',
      [subjectId]
    )
    if (!textbook) return res.status(404).json({ success: false, error: `Textbook not found for subject: ${subjectId}` })
    res.json({ success: true, data: textbook })
  } catch {
    res.status(500).json({ success: false, error: 'Unable to retrieve textbook.' })
  }
})

export default router
