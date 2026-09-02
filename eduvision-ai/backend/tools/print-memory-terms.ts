import { memoryStore } from '../src/db/connection'

function run() {
  const subj = 'sub-6-math'
  const terms = memoryStore.terms.filter((t: any) => t.subject_id === subj)
  console.log('Memory terms for', subj, 'count=', terms.length)
  console.log(terms)
}

run()
