const http = require('http')

const postData = JSON.stringify({
  classId: 'c-10',
  subjectId: 'sub-10-sci',
  chapterId: 'ch-10sci-t1-1',
  question: "Explain Newton's first law of motion and inertia"
})

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/questions/ask',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
}

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`)
  let body = ''
  res.on('data', (chunk) => body += chunk)
  res.on('end', () => console.log('RESPONSE:', body))
})

req.on('error', (e) => console.error('ERROR:', e.message))
req.write(postData)
req.end()
