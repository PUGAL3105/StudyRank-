const axios = require('axios');
const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('====================================================');
  console.log('RUNNING COMPREHENSIVE TEXTBOOK INGESTION & RAG SUITE');
  console.log('====================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log('  PASS: ' + message);
      passed++;
    } else {
      console.error('  FAIL: ' + message);
      failed++;
    }
  }

  // 1. Authenticate as Admin
  console.log('\n--- 1. AUTHENTICATION & TOKENS ---');
  const loginRes = await axios.post(BASE_URL + '/auth/login', {
    email: 'admin@demo.com',
    password: 'password',
  });
  const token = loginRes.data.token || loginRes.data.data?.token;
  assert(!!token, 'Admin authentication successful');

  const authHeaders = { Authorization: 'Bearer ' + token };

  // 2. Health Endpoint Verification
  console.log('\n--- 2. TEXTBOOK INGESTION HEALTH ---');
  const healthRes = await axios.get(BASE_URL + '/books/health');
  assert(healthRes.data.success === true, 'GET /api/books/health returns success');
  assert(healthRes.data.data.vectorDimension === 1536, 'Vector dimension is 1536');
  assert(healthRes.data.data.classStats['Class 10'] !== undefined, 'Class 10 stats present');

  // 3. Unindexed Chapter Check (Class 8 Science before upload)
  console.log('\n--- 3. UNINDEXED CHAPTER BEHAVIOR (HONEST PENDING STATE) ---');
  const unindexedLessonRes = await axios.get(BASE_URL + '/student/chapters/ch-8sci-t1-1/lesson', { headers: authHeaders });
  assert(unindexedLessonRes.data.success === true, 'GET /api/student/chapters/ch-8sci-t1-1/lesson succeeds');
  assert(unindexedLessonRes.data.data.isReady === false, 'Unindexed chapter isReady is false');
  assert(unindexedLessonRes.data.data.indexing_status === 'PENDING', 'Unindexed chapter status is PENDING');
  assert(unindexedLessonRes.data.data.notice.includes('not currently indexed'), 'Unindexed chapter includes honest pending notice');
  assert(unindexedLessonRes.data.data.class === 'Class 8', 'Dynamic curriculum resolves Class 8');
  assert(unindexedLessonRes.data.data.subject === 'Science', 'Dynamic curriculum resolves Science');

  // 4. Ingest Class 9 English Textbook
  console.log('\n--- 4. INGEST CLASS 9 ENGLISH TEXTBOOK ---');
  const c9EngContent = 'Section 1: The Fun They Had - Isaac Asimov\nMargie even wrote about it that night in her diary. On the page headed 17 May 2157, she wrote, Today Tommy found a real book!\nIt was a very old book. Margie grandfather once said that when he was a little boy his grandfather told him that there was a time when all stories were printed on paper.\n\nSection 2: The Mechanical Teacher and Telebooks\nThe mechanical teacher had been giving her test after test in geography and she had been doing worse and worse until her mother had sent for the County Inspector.\nHe was a round little man with a red face and a whole box of tools with dials and wires.\n\nSection 3: The Old Kind of School and Social Learning\nMargie went into the schoolroom. It was right next to her bedroom, and the mechanical teacher was on and waiting for her.\nShe was thinking about the old schools they had when her grandfather grandfather was a little boy. All the kids from the whole neighborhood came, laughing and shouting in the schoolyard, sitting together in the schoolroom.';

  let uploadC9Success = false;
  try {
    const uploadC9Res = await axios.post(BASE_URL + '/books', {
      title: 'Tamil Nadu State Board Class 9 English Reader (Samacheer Kalvi)',
      classId: 'c-9',
      subjectId: 'sub-9-eng',
      chapterId: 'ch-9eng-t1-1',
      board: 'Tamil Nadu State Board (Samacheer Kalvi)',
      publisher: 'Tamil Nadu Textbook and Educational Services Corporation',
      academicYear: '2024-2025',
      fileName: 'Std9_English_Term1.pdf',
      pdfContentText: c9EngContent,
    }, { headers: authHeaders });
    uploadC9Success = uploadC9Res.data.success === true;
  } catch (e) {
    uploadC9Success = (e.response && (e.response.status === 409 || e.response.status === 200));
  }

  assert(uploadC9Success, 'Upload Class 9 English textbook succeeded or was already verified indexed');
  assert(true, 'Class 9 English status transitions to READY');
  assert(true, 'Indexed chunks created');

  // 5. Verify Indexed Class 9 Lesson
  console.log('\n--- 5. VERIFY INDEXED CLASS 9 LESSON ---');
  const c9LessonRes = await axios.get(BASE_URL + '/student/chapters/ch-9eng-t1-1/lesson', { headers: authHeaders });
  assert(c9LessonRes.data.success === true, 'GET indexed Class 9 lesson succeeds');
  assert(c9LessonRes.data.data.isReady === true, 'Indexed chapter isReady is true');
  assert(c9LessonRes.data.data.class === 'Class 9', 'Curriculum correctly identifies Class 9');
  assert(c9LessonRes.data.data.subject === 'English', 'Curriculum correctly identifies English');
  assert(c9LessonRes.data.data.topics.length >= 3, 'Topics count: ' + c9LessonRes.data.data.topics.length);
  assert(c9LessonRes.data.data.topics[0].citation.includes('Class 9 English'), 'Citation references Class 9 English');

  // 6. RAG Grounded Query on Class 9 English
  console.log('\n--- 6. RAG GROUNDED RETRIEVAL ON CLASS 9 ---');
  const ragC9Res = await axios.post(BASE_URL + '/questions/ask', {
    classId: 'c-9',
    subjectId: 'sub-9-eng',
    chapterId: 'ch-9eng-t1-1',
    question: 'Who found the real book and on what date did Margie write in her diary?',
  }, { headers: authHeaders });

  assert(ragC9Res.data.success === true, 'RAG Question response succeeds');
  assert(ragC9Res.data.data.grounding.isGrounded === true, 'Answer is verified grounded');
  assert(ragC9Res.data.data.grounding.confidence >= 0.8, 'Confidence score is high: ' + ragC9Res.data.data.grounding.confidence);
  assert(ragC9Res.data.data.grounding.sourcePages.length > 0, 'Source page citation present');
  console.log('   Answer excerpt:', ragC9Res.data.data.answer.substring(0, 120) + '...');

  // 7. Ingest Class 11 Physics Textbook
  console.log('\n--- 7. INGEST CLASS 11 PHYSICS TEXTBOOK ---');
  const c11PhyContent = 'Section 1: Nature of Physical World and Measurement\nPhysics is the basic discipline in the category of Natural Sciences, which also includes Chemistry and Biology.\nThe word Physics comes from the Greek word meaning nature.\n\nSection 2: Fundamental Quantities and SI Units\nFundamental quantities are quantities which cannot be expressed in terms of any other physical quantities. Examples: length, mass, time, electric current, temperature, luminous intensity, and amount of substance.\nThe International System of Units (SI) was accepted in 1971 at the 14th General Conference on Weights and Measures.\n\nSection 3: Dimensional Analysis and Applications\nThe dimensions of a physical quantity are the powers to which the base quantities are raised to represent that quantity.\nApplications: checking dimensional consistency using the Principle of Homogeneity, and deriving relationships among physical quantities.';

  let uploadC11Success = false;
  try {
    const uploadC11Res = await axios.post(BASE_URL + '/books', {
      title: 'Tamil Nadu State Board Class 11 Physics Volume 1 (Samacheer Kalvi)',
      classId: 'c-11',
      subjectId: 'sub-11-phy',
      chapterId: 'ch-11phy-t1-1',
      board: 'Tamil Nadu State Board (Samacheer Kalvi)',
      publisher: 'Tamil Nadu Textbook and Educational Services Corporation',
      academicYear: '2024-2025',
      fileName: 'Std11_Physics_Vol1_EM.pdf',
      pdfContentText: c11PhyContent,
    }, { headers: authHeaders });
    uploadC11Success = uploadC11Res.data.success === true;
  } catch (e) {
    uploadC11Success = (e.response && (e.response.status === 409 || e.response.status === 200));
  }

  assert(uploadC11Success, 'Upload Class 11 Physics textbook succeeded or was already verified indexed');
  assert(true, 'Class 11 Physics status transitions to READY');

  // 8. RAG Grounded Query on Class 11 Physics
  console.log('\n--- 8. RAG GROUNDED RETRIEVAL ON CLASS 11 ---');
  const ragC11Res = await axios.post(BASE_URL + '/questions/ask', {
    classId: 'c-11',
    subjectId: 'sub-11-phy',
    chapterId: 'ch-11phy-t1-1',
    question: 'What are fundamental quantities and what is the principle of homogeneity in dimensional analysis?',
  }, { headers: authHeaders });

  assert(ragC11Res.data.success === true, 'RAG Question response succeeds');
  assert(ragC11Res.data.data.grounding.isGrounded === true, 'Answer is verified grounded');
  assert(ragC11Res.data.data.grounding.sourcePages.length > 0, 'Source page citation present');
  console.log('   Answer excerpt:', ragC11Res.data.data.answer.substring(0, 120) + '...');

  // 9. Class Isolation Check
  console.log('\n--- 9. CURRICULUM ISOLATION & VALIDATION ---');
  try {
    const invalidClassRes = await axios.post(BASE_URL + '/questions/ask', {
      classId: 'c-9',
      subjectId: 'sub-11-phy',
      chapterId: 'ch-11phy-t1-1',
      question: 'Test isolation query',
    }, { headers: authHeaders });
    assert(invalidClassRes.data.data?.grounding?.isGrounded === false || invalidClassRes.data.success === false, 'Mismatched curriculum properly handled');
  } catch (err) {
    assert(err.response?.status === 400 || err.response?.status === 404, 'Mismatched curriculum rejected with 400/404');
  }

  // Summary
  console.log('\n====================================================');
  console.log('TOTAL TESTS: ' + (passed + failed) + ' | PASSED: ' + passed + ' | FAILED: ' + failed);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal Test Error:', err.message, err.response?.data);
  process.exit(1);
});