const http = require('http')

function makeRequest(path, method = 'POST', body = null) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : ''
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: body ? {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      } : {}
    }

    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(data) }))
    })

    req.on('error', (err) => reject(err))
    if (body) req.write(postData)
    req.end()
  })
}

async function runMultiRAGTests() {
  console.log('===================================================================================')
  console.log('🚀 EduVision AI Production Multi-Chunk Vector RAG Engine — Detailed Retrieval Test')
  console.log('===================================================================================\n')

  try {
    // 1. Covered Question: "Explain respiration in human beings"
    console.log('--- TEST 1: QUESTION COVERED BY TEXTBOOK ---')
    const t1 = await makeRequest('/api/questions/ask', 'POST', {
      classId: 'c-10', subjectId: 'sub-10-sci', chapterId: 'ch-1005', question: 'Explain respiration in human beings'
    })
    console.log('HTTP Status:', t1.status)
    console.log('Textbook:', t1.data.data?.source?.book)
    console.log('Chapter:', t1.data.data?.source?.chapter)
    console.log('Aggregated Source Pages:', t1.data.data?.source?.pages)
    console.log('Retrieved Sections:', t1.data.data?.source?.sections)
    console.log('Retrieved Chunks Count:', t1.data.data?.retrieved_chunks?.length)
    console.log('Top Chunk Preview:')
    t1.data.data?.retrieved_chunks?.forEach((chunk, i) => {
      console.log(`  [Chunk ${i+1}] ID: ${chunk.chunk_id} | Page: ${chunk.page_number} | Score: ${chunk.similarity_score} | Section: ${chunk.section_name}`)
      console.log(`    Content: "${chunk.content.slice(0, 110)}..."\n`)
    })

    // 2. Question Partially Covered
    console.log('--- TEST 2: QUESTION PARTIALLY COVERED ---')
    const t2 = await makeRequest('/api/questions/ask', 'POST', {
      classId: 'c-10', subjectId: 'sub-10-sci', chapterId: 'ch-1005', question: 'How do stomata regulate gas exchange during photosynthesis?'
    })
    console.log('HTTP Status:', t2.status, '| Pages:', t2.data.data?.source?.pages, '| Top Score:', t2.data.data?.confidence)

    // 3. Question Not Covered (Unrelated / Out-of-bounds)
    console.log('\n--- TEST 3: QUESTION NOT COVERED ---')
    const t3 = await makeRequest('/api/questions/ask', 'POST', {
      classId: 'c-10', subjectId: 'sub-10-sci', chapterId: 'ch-1005', question: 'What is quantum entanglement superstring theory?'
    })
    console.log('HTTP Status:', t3.status, '| Confidence:', t3.data.data?.confidence)
    console.log('Hallucination Guard Response:', `"${t3.data.data?.answer}"`)

    // 4. Question from Another Chapter
    console.log('\n--- TEST 4: QUESTION FROM ANOTHER CHAPTER ---')
    const t4 = await makeRequest('/api/questions/ask', 'POST', {
      classId: 'c-10', subjectId: 'sub-10-sci', chapterId: 'ch-1005', question: 'What are fundamental SI units of mass and time?'
    })
    console.log('HTTP Status:', t4.status, '| Confidence:', t4.data.data?.confidence)
    console.log('Response:', `"${t4.data.data?.answer}"`)

    // 5. Question from Another Subject
    console.log('\n--- TEST 5: QUESTION FROM ANOTHER SUBJECT (MISMATCH GUARD) ---')
    const t5 = await makeRequest('/api/questions/ask', 'POST', {
      classId: 'c-10', subjectId: 'sub-10-sci', chapterId: 'ch-1101', question: 'Explain respiration'
    })
    console.log('HTTP Status:', t5.status, '| Error:', t5.data.error)

    // 6. Question from Another Class
    console.log('\n--- TEST 6: QUESTION FROM ANOTHER CLASS (MISMATCH GUARD) ---')
    const t6 = await makeRequest('/api/questions/ask', 'POST', {
      classId: 'c-6', subjectId: 'sub-10-sci', chapterId: 'ch-1005', question: 'Explain respiration'
    })
    console.log('HTTP Status:', t6.status, '| Error:', t6.data.error)

    console.log('\n===================================================================================')
    console.log('✅ MULTI-CHUNK VECTOR RAG PIPELINE VERIFICATION COMPLETE')
    console.log('===================================================================================')

  } catch (err) {
    console.error('Test execution error:', err)
  }
}

runMultiRAGTests()
