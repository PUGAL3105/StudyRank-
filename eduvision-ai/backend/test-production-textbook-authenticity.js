/**
 * EduVision AI — Production Textbook Authenticity & RAG Isolation Test Suite
 * Step 15 & 17 Verification
 */
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:5000/api';
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log('  ” PASS — ' + message);
    passed++;
  } else {
    console.error('  🔩 FAIL — ' + message);
    failed++;
  }
}

async function runAuthenticitySuite() {
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log('🙰️ EduVision AI — Production Textbook Authenticity & RAG Isolation Suite');
  console.log('═══════════════════════════════════════════════════════════════════════\n');

  // 1. Authenticate as Admin & Student
  const adminLogin = await axios.post(BASE_URL + '/auth/login', {
    email: 'admin@demo.com',
    password: 'password',
  });
  const adminToken = adminLogin.data.data.token;
  const adminHeaders = { Authorization: 'Bearer ' + adminToken };

  const studentLogin = await axios.post(BASE_URL + '/auth/login', {
    email: 'student@demo.com',
    password: 'password',
  });
  const studentToken = studentLogin.data.data.token;
  const studentHeaders = { Authorization: 'Bearer ' + studentToken };

  // 2. Health Endpoint & Database State Consistency
  console.log('--- 1. HEALTH & METRICS CONSISTENCY ---');
  const healthRes = await axios.get(BASE_URL + '/books/health');
  assert(healthRes.data.success === true, 'GET /api/books/health succeeds');
  const h = healthRes.data.data;
  assert(h.curriculum.classes === 7, 'Curriculum classes = 7');
  assert(h.curriculum.subjects === 54, 'Curriculum subjects = 54');
  assert(h.curriculum.chapters === 109, 'Curriculum total chapters = 109');
  assert(h.chapterStatus.total === 109, 'Chapter status total = 109');
  const sum = h.chapterStatus.ready + h.chapterStatus.pending + (h.chapterStatus.processing || 0) + (h.chapterStatus.failed || 0) + (h.chapterStatus.rejected || 0);
  assert(sum === 109, 'Chapter status sum (ready+pending+processing+failed+rejected) matches total chapters (109)');

  // 3. Textbook & Vector Dimension Verification
  console.log('\n--- 2. VECTOR EMBEDDING & DIMENSIONALITY ---');
  assert(h.ragIndex.vectorDimension === 1536, 'Vector dimension is strictly 1536');
  assert(h.ragIndex.embeddingModel === 'text-embedding-3-small', 'Embedding model is text-embedding-3-small');
  assert(h.ragIndex.chunksWithEmbeddings === h.ragIndex.totalChunks, 'All indexed chunks have valid 1536-dim embeddings');

  // 4. Negative RAG Retrieval Tests (Step 17)
  console.log('\n--- 3. NEGATIVE RAG RETRIEVAL & ISOLATION TESTS ---');

  // 4a. Pending Chapter Query
  const pendingRes = await axios.post(BASE_URL + '/questions/ask', {
    classId: 'c-10',
    subjectId: 'sub-10-math',
    chapterId: 'ch-10math-t1-1',
    question: 'What is a relation and function in mathematics?',
  }, { headers: studentHeaders });
  assert(pendingRes.data.success === true, 'Pending chapter query returns 200 response');
  assert(pendingRes.data.data.grounding.isGrounded === false, 'Pending chapter is not grounded (isGrounded=false)');
  assert(pendingRes.data.data.grounding.sourcePages.length === 0, 'Pending chapter returns 0 source pages');

  // 4b. Cross-Class Isolation (Class 10 Science cannot retrieve Class 9 English)
  try {
    const crossClassRes = await axios.post(BASE_URL + '/questions/ask', {
      classId: 'c-10',
      subjectId: 'sub-9-eng',
      chapterId: 'ch-9eng-t1-1',
      question: 'What is Tommy reading in the book?',
    }, { headers: studentHeaders });
    assert(crossClassRes.data.success === false, 'Cross-class query blocked with 400');
  } catch (e) {
    assert(e.response && e.response.status === 400, 'Cross-class query rejected with HTTP 400 Bad Request');
  }


  // 4c. Unknown/Unrelated Question Grounding Fallback
  const ungroundedRes = await axios.post(BASE_URL + '/questions/ask', {
    classId: 'c-10',
    subjectId: 'sub-10-sci',
    chapterId: 'ch-10sci-t1-1',
    question: 'How do you bake a chocolate cake with vanilla frosting?',
  }, { headers: studentHeaders });
  assert(ungroundedRes.data.success === true, 'Irrelevant question returns 200');
  assert(ungroundedRes.data.data.grounding.isGrounded === false, 'Irrelevant question returns isGrounded = false');
  assert(ungroundedRes.data.data.grounding.confidence === 0, 'Irrelevant question returns confidence = 0');
  assert(ungroundedRes.data.data.grounding.sourcePages.length === 0, 'Irrelevant question returns sourcePages = []');

  // 5. Chapter PDF Security: PENDING return 404 (Step 11)
  console.log('\n--- 4. CHAPTER PDF STREAMING SECURITY ---');
  try {
    await axios.get(BASE_URL + '/student/chapters/ch-10math-t1-1/pdf?token=' + studentToken);
    assert(false, 'Pending chapter PDF should return 404');
  } catch (e) {
    assert(e.response && e.response.status === 404, 'Pending chapter PDF request returns HTTP 404 Not Found');
  }


  // 5b. Ready chapter returns 200 with PDF content-type
  const readyPdfRes = await axios.get(BASE_URL + '/student/chapters/ch-10sci-t1-1/pdf?token=' + studentToken, {
    responseType: 'arraybuffer',
  });
  assert(readyPdfRes.status === 200, 'Ready chapter PDF stream returns HTTP 200 OK');
  assert(readyPdfRes.headers['content-type'] === 'application/pdf', 'Content-Type is application/pdf');
  assert(readyPdfRes.headers['accept-ranges'] === 'bytes', 'Accept-Ranges: bytes is present');


  console.log('\n======================================================================');
  console.log('Authenticity Suite Results: ' + (passed + failed) + ' tests - ' + passed + ' passed, ' + failed + ' failed');
  console.log('======================================================================');
  process.exit(failed > 0 ? 1 : 0);
}

runAuthenticitySuite().catch((err) => {
  console.error('Fatal Authenticity Suite error:', err);
  process.exit(1);
});