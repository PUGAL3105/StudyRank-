import db from '../src/db/connection'

async function run() {
  try {
    const rows = await db.any("SELECT id, subject_id, term_id, chapter_number, chapter_name FROM chapters ORDER BY subject_id, chapter_number LIMIT 200")
    console.log('Count:', rows.length)
    console.log(rows.slice(0,20))
  } catch (err) {
    console.error('Error querying chapters:', err)
  } finally {
    process.exit(0)
  }
}

run()
