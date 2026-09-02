const http = require('http');

function testChat(payload) {
  return new Promise((resolve) => {
    const data = JSON.stringify(payload);
    const req = http.request('http://localhost:5000/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    }, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(body) }));
    });
    req.write(data);
    req.end();
  });
}

async function run() {
  console.log('--- TEST 1: English Question on Class 10 Science ---');
  const r1 = await testChat({
    message: "What is Newton's second law of motion?",
    classId: 'c-10',
    subjectId: 'sub-10-sci',
    chapterId: 'ch-10sci-t1-1'
  });
  console.log('Status:', r1.status);
  console.log('Reply:\n', r1.data.data?.reply);

  console.log('\n--- TEST 2: Tamil Question on Class 6 Tamil ---');
  const r2 = await testChat({
    message: 'இன்பத்தமிழ் பாடலின் ஆசிரியர் யார்?',
    classId: 'c-6',
    subjectId: 'sub-6-tam',
    chapterId: 'ch-6tam-t1-1',
    language: 'ta'
  });
  console.log('Status:', r2.status);
  console.log('Reply:\n', r2.data.data?.reply);

  console.log('\n--- TEST 3: General Question on Biology ---');
  const r3 = await testChat({
    message: 'How do plants perform photosynthesis?',
    classId: 'c-10',
    subjectId: 'sub-10-sci'
  });
  console.log('Status:', r3.status);
  console.log('Reply:\n', r3.data.data?.reply);
}

run();
