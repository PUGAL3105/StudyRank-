const axios = require("axios");
const BASE_URL = "http://localhost:5000/api";
	async function run() {
  console.log("=== EDUvISION AI — PHASE 15: AUTHENTIC PDF VIEWING E2E TEST SUITE ===");
  let passed = 0;
  let total = 0;
  function assert(cond, desc) {
    total++;
    if (cond) { passed++; console.log("  PASS [" + total + "]: " + desc); }
    else { console.error("  FAIL [" + total + "]: " + desc); }
  }

  // 1. Admin & Student Authentication
  const adminLogin = await axios.post(BASE_URL + "/auth/login", { email: "admin@demo.com", password: "password" });
  const adminToken = adminLogin.data.token || adminLogin.data.data?.token;
  const adminHeaders = { Authorization: "Bearer " + adminToken };

  const studentLogin = await axios.post(BASE_URL + "/auth/login", { email: "student@demo.com", password: "password" });
  const studentToken = studentLogin.data.token || studentLogin.data.data?.token;
  const studentHeaders = { Authorization: "Bearer " + studentToken };

  assert(!!studentToken && !!adminToken, "Student and Admin authentication successful");

  // 2. Fetch READY Chapter Lesson Metadata
  const lessonRes = await axios.get(BASE_URL + "/student/chapters/ch-10sci-t1-1/lesson", { headers: studentHeaders });
  assert(
    lessonRes.data.success === true &&
    lessonRes.data.data.isReady === true &&
    lessonRes.data.data.pdfAvailable === true &&
    lessonRes.data.data.pdfUrl.includes("/pdf"),
    "READY chapter lesson returns pdfAvailable: true and valid pdfUrl"
  );

  // 3. Stream READY Chapter PDF (Full HTTP 200 OK)
  const pdfStreamRes = await axios.get(BASE_URL + "/student/chapters/ch-10sci-t1-1/pdf", {
    headers: studentHeaders,
    responseType: 'arraybuffer'
  });

  assert(pdfStreamRes.status === 200, "GET /student/chapters/ch-10sci-t1-1/pdf responds with HTTP 200 OK");
  assert(pdfStreamRes.headers["content-type"] === "application/pdf", "Content-Type is application/pdf");
  assert(pdfStreamRes.headers["content-disposition"].includes("inline"), "Content-Disposition is inline (no forced download)");
  assert(pdfStreamRes.headers["accept-ranges"] === "bytes", "Accept-Ranges is bytes");

  const pdfBuffer = Buffer.from(pdfStreamRes.data);
  assert(pdfBuffer.slice(0, 4).toString() === "%PDF", "PDF stream binary starts with authentic %PDF- header");

  // 4. HTTP Range Request (206 Partial Content, bytes=0-50)
  const rangeRes = await axios.get(BASE_URL + "/student/chapters/ch-10sci-t1-1/pdf", {
    headers: {
      ...studentHeaders,
      Range: "bytes=0-50"
    }
  });

  assert(rangeRes.status === 206, "HTTP Range request returns 206 Partial Content");
  assert(rangeRes.headers["content-range"].startsWith("bytes 0-50/"), "Content-Range returns bytes 0-50/TOTAL");
  assert(rangeRes.headers["content-length"] === "51", "Content-Length is 51 bytes");

  // 5. Open-Ended Range Request (bytes=30-)
  const openRangeRes = await axios.get(BASE_URL + "/student/chapters/ch-10sci-t1-1/pdf", {
    headers: {
      ...studentHeaders,
      Range: "bytes=30-"
    }
  });
  assert(openRangeRes.status === 206 && openRangeRes.headers["content-range"].startsWith("bytes 30-"), "Open-ended Range request succeeds with 206");

  // 6. Invalid Range Request (416 Range Not Satisfiable)
  try {
    await axios.get(BASE_URL + "/student/chapters/ch-10sci-t1-1/pdf", {
      headers: {
        ...studentHeaders,
        Range: "bytes=999999-9999999"
      }
    });
    assert(false, "Invalid range should return 416");
  } catch (e) {
    assert(e.response && e.response.status === 416, "Invalid range returns HTTP 416 Range Not Satisfiable");
  }

  // 7. Query Parameter Token Streaming (for browser iframe & new tab)
  const queryPdfRes = await axios.get(BASE_URL + "/student/chapters/ch-10sci-t1-1/pdf?token=" + studentToken);
  assert(queryPdfRes.status === 200 && queryPdfRes.headers["content-type"] === "application/pdf", "PDF stream supports token in query param for iframe");

  // 8. Unauthorized PDF Streaming Blocked
  try {
    await axios.get(BASE_URL + "/student/chapters/ch-10sci-t1-1/pdf");
    assert(false, "Unauthorized PDF request should be blocked");
  } catch (e) {
    assert(e.response && e.response.status === 401, "Unauthenticated PDF request blocked with HTTP 401");
  }

  // 9. PENDING Chapter PDF Request (401/404 returns clean notice)
  try {
    await axios.get(BASE_URL + "/student/chapters/ch-8sci-t1-1/pdf", { headers: studentHeaders });
    assert(false, "PENDING PDF should return 404");
  } catch (e) {
    assert(e.response && e.response.status === 404 && e.response.data.status === "PENDING", "PENDING chapter PDF request returns 404 with honest PENDING status");
  }


  // 10. Non-existent Chapter ID returns 404
  try {
    await axios.get(BASE_URL + "/student/chapters/ch-invalid-nonexistent/pdf", { headers: studentHeaders });
    assert(false, "Invalid chapter should return 404");
  } catch (e) {
    assert(e.response && e.response.status === 404, "Invalid chapter ID returns HTTP 404");
  }

  // 11. Path Traversal Attacks Strictly Blocked
  try {
    await axios.get(BASE_URL + "/books/..%2F..%2Fpackage.json/pdf", { headers: studentHeaders });
    assert(false, "Path traversal ../../ should be rejected");
  } catch (e) {
    assert(e.response && (e.response.status === 403 || e.response.status === 404), "Path traversal attack rejected with 403/404");
  }

  // 12. Verify all 10 Class 10 Science Seeded READY Chapters Stream Authentic PDFs
  const class10ReadyIds = [
    "ch-10sci-t1-1",
    "ch-10sci-t1-2",
    "ch-10sci-t1-3",
    "ch-10sci-t1-4",
    "ch-10sci-t1-5",
    "ch-10sci-t2-1",
    "ch-10sci-t2-2",
    "ch-10sci-t3-1",
    "ch-10sci-t3-2",
    "ch-10sci-t3-3"
  ];

  let allClass10Streamed = true;
  for (const caId of class10ReadyIds) {
    try {
      const r = await axios.get(BASE_URL + "/student/chapters/" + caId + "/pdf", {
        headers: studentHeaders,
        responseType: 'arraybuffer'
      });
      if (r.status !== 200 || !Buffer.from(r.data).slice(0, 4).toString().includes("%PDF")) {
        allClass10Streamed = false;
      }
    } catch (e) {
      allClass10Streamed = false;
      }
  }
  assert(allClass10Streamed, "All 10 Class 10 Science chapters stream authentic PDFs beginning with %PDF");

  // 13. Ingest Class 9 English & Class 11 Physics and Verify PDF Stream
  try {
    await axios.post(BASE_URL + "/books", {
      title: "Class 9 English Reader", classId: "c-9", subjectId: "sub-9-eng", chapter_id: "ch-9eng-t1-1", term_id: "trm-9eng-1", pdfContentText: "The Fun They Had. Today Tommy found a real book."
    }, { headers: adminHeaders });
  } catch (e) {}

  try {
    await axios.post(BASE_URL + "/books", {
      title: "Class 11 Physics Vol 1", classId: "c-11", subjectId: "sub-11-phy", chapter_id: "ch-11phy-t1-1", term_id: "trm-11phy-1", pdfContentText: "Nature of Physical World and Measurement. SI Units define seven base quantities."
    }, { headers: adminHeaders });
  } catch (e) {}


  const c9Stream = await axios.get(BASE_URL + "/student/chapters/ch-9eng-t1-1/pdf", { headers: studentHeaders });
  const c11Stream = await axios.get(BASE_URL + "/student/chapters/ch-11phy-t1-1/pdf", { headers: studentHeaders });

  assert(c9Stream.status === 200 && c11Stream.status === 200, "Ingested Class 9 English & Class 11 Physics chapters stream PDF successfully");

  // 14. RAG Retrieval Isolation &gndstone Behavior
  const ragRes = await axios.post(BASE_URL + "/questions/ask", {
    classId: "c-10",
    subjectId: "sub-10-sci",
    chapterId: "ch-10sci-t1-1",
    question: "What is inertia and how many types of inertia exist?"
  }, { headers: studentHeaders });

  assert(
    ragRes.status === 201 &&
    ragRes.data.data.grounding &&
    ragRes.data.data.grounding.isGrounded === true &&
    ragRes.data.data.grounding.sourcePages.length > 0,
    "RAG question returns grounded answer with authentic page citations"
  );

  // 15. Health Endpoint Consistency
  const health = await axios.get(BASE_URL + "/books/health");
  assert(
    health.data.data.totalChapters === 109 &&
    health.data.data.vectorDimension === 1536 &&
    health.data.data.chunksWithEmbeddings === health.data.data.totalChunks,
    "Health reports 109 chapters and 100% of chunks have 1536-dim embeddings"
  );


  console.log("\n=== RESULTS: " + passed + "/" + total + " ASSERTIONS PASSED ===");
  process.exit(passed === total ? 0 : 1);
}
run().catch(err => { console.error(err); process.exit(1); });