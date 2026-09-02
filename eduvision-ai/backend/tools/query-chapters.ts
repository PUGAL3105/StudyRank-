import db from '../src/db/connection'

async function run() {
  try {
    const rows = await db.any("SELECT id, subject_id, term_id, chapter_number, chapter_name FROM chapters WHERE subject_id = 'sub-6-math'")
    console.log('Rows:', rows)
  } catch (err) {
    console.error('Error querying chapters:', err)
  } finally {
    process.exit(0)
  }
}

run()
