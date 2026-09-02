import db from '../src/db/connection'

async function run() {
  try {
    const termId = 'trm-6math-1'
    const subjectId = 'sub-6-math'
    const chapId = `ch-${termId}-1`
    await db.none(`INSERT INTO chapters (id, subject_id, term_id, chapter_number, chapter_name, indexing_status) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO NOTHING`, [chapId, subjectId, termId, 1, 'Introduction', 'METADATA_ONLY'])
    console.log('Inserted placeholder chapter for', termId)
  } catch (err) {
    console.error('Error:', err)
  } finally {
    process.exit(0)
  }
}

run()
