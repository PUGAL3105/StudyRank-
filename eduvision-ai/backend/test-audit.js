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

async function runAudit() {
  console.log('========================================================================')
  console.log('🔍 EduVision AI — RAG Data Integrity & Vector Audit Engine')
  console.log('========================================================================\n')

  try {
    // 1. Audit Query 1: Class 10 -> Science -> Life Processes -> Respiration
    console.log('--- AUDIT QUERY 1: Class 10 Science (Life Processes) — Respiration ---')
    const a1 = await makeRequest('/api/questions/ask', 'POST', {
      classId: 'c-10', subjectId: 'sub-10-sci', chapterId: 'ch-1005', question: 'Explain respiration in human beings'
    })
    console.log('Status:', a1.status)
    console.log('Book:', a1.data.data?.source?.book)
    console.log('Chapter:', a1.data.data?.source?.chapter)
    console.log('Returned Pages:', a1.data.data?.source?.pages)
    console.log('Returned Sections:', a1.data.data?.source?.sections)
    console.log('Confidence Score:', a1.data.data?.confidence)
    console.log('Retrieved Chunks Count:', a1.data.data?.retrieved_chunks?.length)
    console.log('First Chunk ID:', a1.data.data?.retrieved_chunks?.[0]?.chunk_id, '\n')

    // 2. Audit Query 2: Class 10 -> Science -> Life Processes -> Photosynthesis
    console.log('--- AUDIT QUERY 2: Class 10 Science (Life Processes) — Photosynthesis ---')
    const a2 = await makeRequest('/api/questions/ask', 'POST', {
      classId: 'c-10', subjectId: 'sub-10-sci', chapterId: 'ch-1005', question: 'What is photosynthesis?'
    })
    console.log('Status:', a2.status)
    console.log('Returned Pages:', a2.data.data?.source?.pages)
    console.log('Returned Sections:', a2.data.data?.source?.sections)
    console.log('Confidence Score:', a2.data.data?.confidence, '\n')

    // 3. Audit Query 3: Class 10 -> Science -> Life Processes -> Non-existent Concept
    console.log('--- AUDIT QUERY 3: Class 10 Science (Life Processes) — Non-existent Concept ---')
    const a3 = await makeRequest('/api/questions/ask', 'POST', {
      classId: 'c-10', subjectId: 'sub-10-sci', chapterId: 'ch-1005', question: 'What is black hole event horizon quantum gravity string theory?'
    })
    console.log('Status:', a3.status)
    console.log('Confidence Score:', a3.data.data?.confidence)
    console.log('Hallucination Response:', `"${a3.data.data?.answer}"\n`)

    // 4. Audit Query 4: Class 10 -> Science -> Chemical Reactions -> Life Processes Question
    console.log('--- AUDIT QUERY 4: Class 10 Science (Chemical Reactions) — Life Processes Question ---')
    const a4 = await makeRequest('/api/questions/ask', 'POST', {
      classId: 'c-10', subjectId: 'sub-10-sci', chapterId: 'ch-1001', question: 'Explain respiration in human beings'
    })
    console.log('Status:', a4.status)
    console.log('Confidence Score:', a4.data.data?.confidence)
    console.log('Hallucination Response:', `"${a4.data.data?.answer}"\n`)

    // 5. Audit Query 5: Class 6 -> Science -> Components of Food -> Class 10 Respiration Question
    console.log('--- AUDIT QUERY 5: Class 6 Science (Components of Food) — Class 10 Respiration Question ---')
    const a5 = await makeRequest('/api/questions/ask', 'POST', {
      classId: 'c-6', subjectId: 'sub-6-sci', chapterId: 'ch-601', question: 'Explain human alveoli respiration and ATP synthesis'
    })
    console.log('Status:', a5.status)
    console.log('Confidence Score:', a5.data.data?.confidence)
    console.log('Hallucination Response:', `"${a5.data.data?.answer}"\n`)

    console.log('========================================================================')
    console.log('✅ AUDIT EXECUTION COMPLETE')
    console.log('========================================================================')

  } catch (err) {
    console.error('Audit execution error:', err)
  }
}

runAudit()
