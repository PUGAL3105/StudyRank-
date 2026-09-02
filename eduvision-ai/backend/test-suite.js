const http = require('http')

function makeRequest(path, method = 'GET', body = null) {
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

async function runTests() {
  console.log('====================================================')
  console.log('🧪 EduVision AI Backend Comprehensive API Test Suite')
  console.log('====================================================\n')

  try {
    // 1. GET /api/classes
    const test1 = await makeRequest('/api/classes')
    console.log('Test 1 [GET /api/classes]:', test1.status, JSON.stringify(test1.data).slice(0, 100) + '...')

    // 2. GET /api/classes/c-999/subjects (Invalid Class)
    const test2 = await makeRequest('/api/classes/c-999/subjects')
    console.log('Test 2 [GET /api/classes/c-999/subjects (Invalid Class)]:', test2.status, test2.data)

    // 3. GET /api/classes/c-10/subjects (Valid Class)
    const test3 = await makeRequest('/api/classes/c-10/subjects')
    console.log('Test 3 [GET /api/classes/c-10/subjects]:', test3.status, 'Count:', test3.data.data?.length)

    // 4. GET /api/subjects/sub-invalid/chapters (Invalid Subject)
    const test4 = await makeRequest('/api/subjects/sub-invalid/chapters')
    console.log('Test 4 [GET /api/subjects/sub-invalid/chapters (Invalid Subject)]:', test4.status, test4.data)

    // 5. GET /api/subjects/sub-10-sci/chapters (Valid Subject)
    const test5 = await makeRequest('/api/subjects/sub-10-sci/chapters')
    console.log('Test 5 [GET /api/subjects/sub-10-sci/chapters]:', test5.status, 'Count:', test5.data.data?.length)

    // 6. POST /api/questions/ask (Empty Question)
    const test6 = await makeRequest('/api/questions/ask', 'POST', {
      classId: 'c-10', subjectId: 'sub-10-sci', chapterId: 'ch-1005', question: '   '
    })
    console.log('Test 6 [POST /ask (Empty Question)]:', test6.status, test6.data)

    // 7. POST /api/questions/ask (Invalid Class ID)
    const test7 = await makeRequest('/api/questions/ask', 'POST', {
      classId: 'c-999', subjectId: 'sub-10-sci', chapterId: 'ch-1005', question: 'What is respiration?'
    })
    console.log('Test 7 [POST /ask (Invalid Class ID)]:', test7.status, test7.data)

    // 8. POST /api/questions/ask (Subject Not Belonging to Class)
    const test8 = await makeRequest('/api/questions/ask', 'POST', {
      classId: 'c-6', subjectId: 'sub-10-sci', chapterId: 'ch-1005', question: 'What is respiration?'
    })
    console.log('Test 8 [POST /ask (Subject Mismatch)]:', test8.status, test8.data)

    // 9. POST /api/questions/ask (Chapter Not Belonging to Subject)
    const test9 = await makeRequest('/api/questions/ask', 'POST', {
      classId: 'c-10', subjectId: 'sub-10-sci', chapterId: 'ch-1101', question: 'What is respiration?'
    })
    console.log('Test 9 [POST /ask (Chapter Mismatch)]:', test9.status, test9.data)

    // 10. POST /api/questions/ask (Valid Student Flow)
    const test10 = await makeRequest('/api/questions/ask', 'POST', {
      classId: 'c-10', subjectId: 'sub-10-sci', chapterId: 'ch-1005', question: 'Explain respiration in human beings'
    })
    console.log('\nTest 10 [POST /ask (Valid Student Flow)] Status:', test10.status)
    console.log('Source Citation:', test10.data.data?.answer?.source_reference)
    console.log('Explanation Snippet:', test10.data.data?.answer?.explanation?.slice(0, 120) + '...')

  } catch (err) {
    console.error('Test execution error:', err)
  }
}

runTests()
