import { memoryStore } from '../src/db/connection'

function run() {
  const termId = 'trm-6math-1'
  const chapters = memoryStore.chapters.filter((c: any) => c.term_id === termId)
  console.log('Memory chapters for', termId, 'count=', chapters.length)
  console.log(chapters)
}

run()
