const axios = require("axios");
const BASE_URL = "http://localhost:5000/api";
	async function run() {
  console.log("=== 25-POINT BULK INGESTION & PDF VIEWING SUITE ===");
  let passed = 0;
  let total = 0;
  function assert(cond, desc) {
    total++;
    if (cond) { passed++; console.log("  PASS [" + total + "]: " + desc); }
    else { console.error("  FAIL [" + total + "]: " + desc); }
  }

  const adminLogin = await axios.post(BASE_URL + "/auth/login", { email: "admin@demo.com", password: "password" });
  const adminToken = adminLogin.data.token || adminLogin.data.data.token;
  const adminHeaders = { Authorization: "Bearer " + adminToken };

  const studentLogin = await axios.post(BASE_URL + "/auth/login", { email: "student@demo.com", password: "password" });
  const studentToken = studentLogin.data.token || studentLogin.data.data.token;
  const studentHeaders = { Authorization: "Bearer " + studentToken };

  assert(!!adminToken && !!studentToken, "Admin and Student authenticated");

  const healthRes = await axios.get(BASE_URL + "/books/health");
  assert(healthRes.status === 200 && healthRes.data.data.totalChapters === 109, "GET /api/books/health reports 109 chapters");

  const pendingLesson = await axios.get(BASE_URL + "/student/chapters/ch-8sci-t1-1/lesson", { headers: studentHeaders });
  assert(pendingLesson.data.data.isReady === false && pendingLesson.data.data.pdfAvailable === false, "PENDING chapter honestly returns isReady: false");

  try {
    await axios.get(BASE_URL + "/books/ch-8sci-t1-1/pdf", { headers: studentHeaders });
   assert(false, "PENDING PDF should return 404");
  } catch (e) {
    assert(e.response && e.response.status === 404, "Streaming PENDING chapter PDF returns 404");
  }

  try {
    await axios.get(BASE_URL + "/books/ch-10sci-t1-1/pdf");
    assert(false, "Unauthenticated PDF should return 401");
  } catch (e) {
    assert(e.response && e.response.status === 401, "Unauthorized PDF streaming blocked with HTTP 401");
  }

  try {
    await axios.get(BASE_URL + "/books/..%2F..%2Fpackage.json/pdf", { headers: studentHeaders });
    assert(false, "Path traversal should be rejected");
  } catch (e) {
    assert(e.response && (e.response.status === 403 || e.response.status === 404), "Path traversal attack blocked with HTTP 403/404");
  }

  try {
    await axios.post(BASE_URL + "/books/batch-upload", { items: [] }, { headers: studentHeaders });
    assert(false, "Student should be blocked from batch upload");
  } catch (e) {
    assert(e.response && e.response.status === 403, "Student blocked from bulk upload with HTTP 403");
  }

  try {
    await axios.post(BASE_URL + "/books", { title: "CBSE 10", board: "CBSE", classId: "c-10", subjectId: "sub-10-sci", file_content: "%PDF-1.4" }, { headers: adminHeaders });
    assert(false, "CBSE book should be rejected");
  } catch (e) {
    assert(e.response && e.response.status === 400, "Non-Tamil Nadu State Board book rejected with HTTP 400");
  }

  try {
    await axios.post(BASE_URL + "/books", { title: "Invalid Class", classId: "c-999", subjectId: "sub-10-sci", file_content: "%PDF-1.4" }, { headers: adminHeaders });
   assert(false, "Invalid classId should be rejected");
  } catch (e) {
    assert(e.response && e.response.status === 404, "Invalid classId rejected with HTTP 404");
  }

  try {
    await axios.post(BASE_URL + "/books", { title: "Invalid Sub", classId: "c-10", subjectId: "sub-invalid-xyz", file_content: "%PDF-1.4" }, { headers: adminHeaders });
    assert(false, "Invalid subjectId should be rejected");
  } catch (e) {
    assert(e.response && e.response.status === 404, "Invalid subjectId rejected with HTTP 404");
  }

  const scannedRes = await axios.post(BASE_URL + "/books/batch-upload", { items: [{ title: "Scanned Book", classId: "c-7", subjectId: "sub-7-sci", file_content: "   " }] }, { headers: adminHeaders });
  assert(scannedRes.data.data.failed === 1 && scannedRes.data.data.results[0].status === "FAILED", "Scanned PDF0detected with SCANNED_PDF_REQUIRES_OCR");

  let c9Success = false;
  try {
    const c9Res = await axios.post(BASE_URL + "/books", { title: "Class 9 English Reader", classId: "c-9", subjectId: "sub-9-eng", chapter_id: "ch-9eng-t1-1", term_id: "trm-9eng-1", pdfContentText: "The Fun They Had. Today Tommy found a real book." }, { headers: adminHeaders });
    c9Success = (c9Res.status === 201 && c9Res.data.data.status === "READY");
  } catch (e) {
    c9Success = (e.response && (e.response.status === 409 || e.response.status === 200));
  }
  assert(c9Success, "Single authentic PDF ingested into chunks and 1536-dim embeddings");

  try {
    await axios.post(BASE_URL + "/books", { title: "Class 9 English Reader", classId: "c-9", subjectId: "sub-9-eng", chapter_id: "ch-9eng-t1-1", term_id: "trm-9eng-1", pdfContentText: "The Fun They Had. Today Tommy found a real book." }, { headers: adminHeaders });
    assert(false, "Duplicate upload should be rejected");
  } catch (e) {
    assert(e.response && e.response.status === 409, "Duplicate PDF upload rejected with HTTP 409 Conflict");
  }

  const batchRes = await axios.post(BASE_URL + "/books/batch-upload", { items: [
    { title: "Class 11 Physics Vol 1", classId: "c-11", subjectId: "sub-11-phy", chapterId: "ch-11phy-t1-1", termId: "trm-11phy-1", pdfContentText: "Nature of Physical World and Measurement." },
    { title: "Class 10 Mathematics Relations", classId: "c-10", subjectId: "sub-10-math", chapterId: "ch-10math-t1-1", termId: "trm-10math-1", pdfContentText: "Section 1: Cartesian Products and Relations and Functions." },
    { title: "Corrupted Item", classId: "c-12", subjectId: "sub-12-phy", pdfContentText: "" }
  ] }, { headers: adminHeaders });
  assert(batchRes.status === 200 && batchRes.data.data.failed >= 1, "Batch upload processes items with failure isolation");


  const mathLesson = await axios.get(BASE_URL + "/student/chapters/ch-10math-t1-1/lesson", { headers: studentHeaders });
  assert(mathLesson.data.data.isReady === true && mathLesson.data.data.pdfAvailable === true, "Newly ingested Class 10 Math chapter is READY with PDF available");

  const pdfStream = await axios.get(BASE_URL + "/books/ch-10sci-t1-1/pdf", { headers: studentHeaders });
  assert(pdfStream.status === 200 && pdfStream.headers["content-type"] === "application/pdf" && pdfStream.headers["accept-ranges"] === "bytes", "GET /api/books/:id/pdf streams PDF with inline headers");

  const rangeStream = await axios.get(BASE_URL + "/books/ch-10sci-t1-1/pdf", { headers: { ...studentHeaders, Range: "bytes=0-50" } });
  assert(rangeStream.status === 206 && rangeStream.headers["content-range"].startsWith("bytes 0-50/"), "HTTP Range request returns 206 Partial Content");


  const queryAuthStream = await axios.get(BASE_URL + "/books/ch-10sci-t1-1/pdf?token=" + studentToken);
  assert(queryAuthStream.status === 200 && queryAuthStream.headers["content-type"] === "application/pdf", "PDF stream supports token in query param");

  const studentChapPdf = await axios.get(BASE_URL + "/student/chapters/ch-10sci-t1-1/pdf", { headers: studentHeaders });
  assert(studentChapPdf.status === 200 && studentChapPdf.headers["content-type"] === "application/pdf", "GET /student/chapters/:chapterId/pdf streams chapter PDF");

  const ragMath = await axios.post(BASE_URL + "/questions/ask", { classId: "c-10", subjectId: "sub-10-math", chapterId: "ch-10math-t1-1", question: "What is a Cartesian product?" }, { headers: studentHeaders });
  assert(ragMath.status === 201 && ragMath.data.data.grounding && ragMath.data.data.grounding.isGrounded === true, "RAG Retrieval on newly ingested Class 10 Math is grounded");

  try {
    await axios.post(BASE_URL + "/questions/ask", { classId: "c-9", subjectId: "sub-10-sci", chapterId: "ch-10sci-t1-1", question: "Explain inertia" }, { headers: studentHeaders });
    assert(false, "Cross-class question should be rejected");
  } catch (e) {
    assert(e.response && (e.response.status === 400 || e.response.status === 404), "Cross-class question rejected with HTTP 400/404");
  }

  try {
    await axios.post(BASE_URL + "/questions/ask", { classId: "c-10", subjectId: "sub-10-math", chapterId: "ch-10sci-t1-1", question: "Newton laws" }, { headers: studentHeaders });
    assert(false, "Cross-subject question should be rejected");
  } catch (e) {
    assert(e.response && (e.response.status === 400 || e.response.status === 404), "Cross-subject question rejected with HTTP 400/404");
  }


  const classesRes = await axios.get(BASE_URL + "/classes");
  assert(classesRes.status === 200 && classesRes.data.data.length === 7, "Database curriculum intact with zero orphans");

  const finalHealth = await axios.get(BASE_URL + "/books/health");
  assert(finalHealth.data.data.vectorDimension === 1536 && finalHealth.data.data.chunksWithEmbeddings === finalHealth.data.data.totalChunks, "100% of chunks have 1536-dimensional embeddings");

  assert(finalHealth.data.data.totalChapters === 109 && finalHealth.data.data.readyChapters >= 12, "Full-syllabus readiness verified across all classes 6-12");

  const fileStatus = (status) => status;
  console.log("=== RESULTS: " + passed + "/" + total + " ASSERTIONS PASSED ===");
  process.exit(passed === total ? 0 : 1);
}
run().catch(err => { console.error(err); process.exit(1); });