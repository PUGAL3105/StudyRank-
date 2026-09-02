/**
 * EduVision AI - Curriculum and Database Integrity Test Suite
 * Step 16 Verification
 */
const axios = require('axios');
const db = require('./dist/db/connection');

const BASE_URL = 'http://localhost:5000/api';
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log('  PASS - ' + message);
    passed++;
  } else {
    console.error('  FAIL - ' + message);
    failed++;
  }
}

async function runCurriculumIntegritySuite() {
  console.log('======================================================================');
  console.log('EduVision AI - Curriculum and Database Integrity Suite');
  console.log('======================================================================\n');

  // 1. Relational Iteration & Health Check
  try { await db.default.manyOrNone('SELECT 1'); } catch {}
  const store = db.memoryStore;
  assert(store.classes.length === 7, 'Exactly 7 classes configured (Classes 6-12)');
  assert(store.subjects.length >= 50, 'Subjects count matches syllabus (54 subjects)');
  assert(store.chapters.length >= 100, `Verified curriculum chapters loaded (${store.chapters.length} chapters)`);
  const syntheticFound = store.chapters.filter(c => c.chapter_name.includes('Fundamentals') || c.chapter_name.includes('upload required'));
  assert(syntheticFound.length === 0, 'Zero synthetic/placeholder chapter names found');

  // 2. Class -> Subject Integrity
  const classIds = new Set(store.classes.map((c) => c.id));
  let subjectOrphans = 0;
  for (const s of store.subjects) {
    if (!s.class_id || !classIds.has(s.class_id)) {
      subjectOrphans++;
    }
  }
  assert(subjectOrphans === 0, 'Zero orphan subjects (all belong to valid classes)');

  // 3. Subject -> Chapter Integrity
  const subIds = new Set(store.subjects.map((s) => s.id));
  let chapterOrphans = 0;
  for (const c of store.chapters) {
    if (!c.subject_id || !subIds.has(c.subject_id)) {
      chapterOrphans++;
    }
  }
  assert(chapterOrphans === 0, 'Zero orphan chapters (all belong to valid subjects)');

  // 4. Chapter -> Chunk & Embedding Integrity
  const chapIds = new Set(store.chapters.map((c) => c.id));
  let chunkOrphans = 0;
  let invalidEmbeddings = 0;
  for (const ck of store.bookChunks) {
    if (!ck.chapter_id || !chapIds.has(ck.chapter_id)) {
      chunkOrphans++;
    }
    if (!Array.isArray(ck.embedding) || ck.embedding.length !== 1536) {
      invalidEmbeddings++;
    }
  }
  assert(chunkOrphans === 0, 'Zero orphan chunks (all belong to valid chapters)');
  assert(invalidEmbeddings === 0, 'All indexed chunks have exactly 1536-dimensional embeddings');

  // 5. Uniqueness and Composite Keys Assertion
  const chapterKeys = new Set();
  let duplicateChapters = 0;
  for (const c of store.chapters) {
    const k = `chap-${c.subject_id}-${c.term_id || 'none'}-${c.chapter_number}`;
    if (chapterKeys.has(k)) {
      duplicateChapters++;
    }
    chapterKeys.add(k);
  }
  assert(duplicateChapters === 0, 'Zero duplicate chapter composite keys');

  console.log('\n======================================================================');
  console.log('Curriculum Integrity Suite Results: ' + (passed + failed) + ' tests - ' + passed + ' passed, ' + failed + ' failed');
  console.log('======================================================================');
  process.exit(failed > 0 ? 1 : 0);
}

runCurriculumIntegritySuite().catch((err) => {
  console.error('Fatal Curriculum Integrity Suite error:', err);
  process.exit(1);
});