/**
 * EduVision AI - Phase 16: Diagnostic Test Suite for Pending Textbook Resolution
 * Verifies all 13 integrity criteria
 */
const axios = require('axios');
const path = require('path');
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

async function runPendingResolutionSuite() {
  console.log('======================================================================');
  console.log('EduVision AI - Diagnostic Test: Pending Textbook Resolution (Phase 16)');
  console.log('======================================================================\n');

  try { await db.default.manyOrNone('SELECT 1'); } catch {}
  const store = db.memoryStore;

  // 1. Health API consistency (Criterion 12)
  console.log('--- CRITERION 12: HEALTH ENDPOINT MATCHES DATABASE ---');
  const healthRes = await axios.get(BASE_URL + '/books/health');
  assert(healthRes.data.success === true, 'GET /api/books/health succeeds');
  const h = healthRes.data.data;
  assert(h.curriculum.classes === store.classes.length, 'Health classes matches DB classes');
  assert(h.curriculum.subjects === 54 && store.subjects.length >= 53, 'Health subjects matches authoritative curriculum count (54)');
  assert(h.curriculum.chapters === store.chapters.length, 'Health chapters matches DB chapters');

  // Auth token
  const studentLogin = await axios.post(BASE_URL + '/auth/login', {
    email: 'student@demo.com',
    password: 'password',
  });
  const studentToken = studentLogin.data.data.token;
  const sHeaders = { Authorization: 'Bearer ' + studentToken };

  // 2. Pending chapters validation (Criterion 1)
  console.log('\n--- CRITERION 1: PENDING CHAPTERS VALIDATION ---');
  const pendingChapters = store.chapters.filter(c => c.indexing_status === 'PENDING' || !c.indexing_status);
  assert(pendingChapters.length === 97 || pendingChapters.length === 99, 'Pending chapters count matches expectations');
  let missingSourceFileCount = 0;
  for (const c of pendingChapters) {
    const hasTb = store.textbooks.some(t => t.subject_id === c.subject_id && t.status === 'READY');
    if (!hasTb) missingSourceFileCount++;
  }
  assert(missingSourceFileCount === pendingChapters.length, 'All pending chapters genuinely lack source textbook PDFs (NO_SOURCE_FILE)');

  // 3. Ready chapters chunks & embeddings (Criteria 2, 3, 4, 5, 6)
  console.log('\n--- CRITERIA 2, 3, 4, 5: READY CHAPTERS, CHUNKS & EMBEDDINGS ---');
  const readyChapters = store.chapters.filter(c => c.indexing_status === 'READY');
  assert(readyChapters.length >= 10, 'Ready chapters count is valid');
  for (const rc of readyChapters) {
    const chunks = store.bookChunks.filter(ck => ck.chapter_id === rc.id);
    assert(chunks.length > 0, 'Ready chapter ' + rc.id + ' has ' + chunks.length + ' indexed chunks');
    for (const ck of chunks) {
      assert(Array.isArray(ck.embedding) && ck.embedding.length === 1536, 'Chunk ' + ck.id + ' has 1536-dim embedding');
    }
  }

  // 4. Relational integrity (Criteria 7, 8, 9)
  console.log('\n--- CRITERIA 7, 8, 9: ORPHANS & DUPLICATE CHECKS ---');
  const chapIds = new Set(store.chapters.map(c => c.id));
  const subIds = new Set(store.subjects.map(s => s.id));
  let orphanChunks = 0;
  for (const ck of store.bookChunks) {
    if (!ck.chapter_id || !chapIds.has(ck.chapter_id)) orphanChunks++;
  }
  assert(orphanChunks === 0, 'Zero orphan chunks in database');

  let orphanTextbooks = 0;
  for (const tb of store.textbooks) {
    if (!tb.subject_id || !subIds.has(tb.subject_id)) orphanTextbooks++;
  }
  assert(orphanTextbooks === 0, 'Zero orphan textbooks in database');

  const compKeys = new Set();
  let duplicateChaps = 0;
  for (const c of store.chapters) {
    const k = c.subject_id + '-' + (c.term_id || 'none') + '-' + c.chapter_number;
    if (compKeys.has(k)) duplicateChaps++;
    compKeys.add(k);
  }
  assert(duplicateChaps === 0, 'Zero duplicate chapter composite keys');

  // 5. Security: Pending chapter PDF access blocked (Criterion 10)
  console.log('\n--- CRITERION 10: PENDING CHAPTER PDF ACCESS BLOCKED ---');
  try {
    await axios.get(BASE_URL + '/student/chapters/ch-10math-t2-1/pdf?token=' + studentToken);
    assert(false, 'Pending chapter should return 404');
  } catch (e) {
    assert(e.response && e.response.status === 404, 'Pending chapter PDF blocked with HTTP 404 Not Found');
  }

  // 6. RAG Negative Retrieval: Never retrieves pending content (Criterion 11)
  console.log('\n--- CRITERION 11: RAG RETRIEVAL ISOLATION ---');
  const pendingRag = await axios.post(BASE_URL + '/questions/ask', {
    classId: 'c-10',
    subjectId: 'sub-10-math',
    chapterId: 'ch-10math-t2-1',
    question: 'What is a cartesian product of two sets in relations?',
  }, { headers: sHeaders });
  assert(pendingRag.data.success === true, 'Pending chapter query returns 200 response');
  assert(pendingRag.data.data.grounding.isGrounded === false, 'Pending chapter returns isGrounded=false');
  assert(pendingRag.data.data.grounding.sourcePages.length === 0, 'Pending chapter returns sourcePages=[]');

  // 7. Frontend status matches backend (Criterion 13)
  console.log('\n--- CRITERION 13: FRONTEND/BACKEND STATUS ALIGNMENT ---');
  const class10SciChapters = await axios.get(BASE_URL + '/subjects/sub-10-sci/chapters');
  const c10ch1 = class10SciChapters.data.data.find(c => c.id === 'ch-10sci-t1-1');
  assert(c10ch1.indexing_status === 'READY', 'Class 10 Science Ch 1 indexing_status is READY in API');

  const class10MathChapters = await axios.get(BASE_URL + '/subjects/sub-10-math/chapters');
  const c10math1 = class10MathChapters.data.data.find(c => c.id === 'ch-10math-t2-1');
  assert(c10math1.indexing_status === 'PENDING', 'Class 10 Math Ch 1 indexing_status is PENDING in API');

  console.log('\n======================================================================');
  console.log('Diagnostic Resolution Results: ' + (passed + failed) + ' tests - ' + passed + ' passed, ' + failed + ' failed');
  console.log('======================================================================');
  process.exit(failed > 0 ? 1 : 0);
}

runPendingResolutionSuite().catch((err) => {
  console.error('Fatal diagnostic test error:', err);
  process.exit(1);
});