const http = require('http');

function checkPdf(chapterId) {
  return new Promise((resolve) => {
    http.get(`http://localhost:5000/api/student/chapters/${chapterId}/pdf`, (res) => {
      let len = 0;
      let header = '';
      res.on('data', (d) => {
        len += d.length;
        if (!header) header = d.slice(0, 8).toString('utf8');
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          contentType: res.headers['content-type'],
          bytes: len,
          header: header.trim()
        });
      });
    }).on('error', (e) => resolve({ status: 500, error: e.message }));
  });
}

async function run() {
  const chapters = [
    'ch-6tam-t1-1',
    'ch-6sci-t1-1',
    'ch-7math-t1-1',
    'ch-8soc-t1-1',
    'ch-9eng-t1-1',
    'ch-10sci-t1-1',
    'ch-11phy-t1-1',
    'ch-12chem-t1-1'
  ];

  console.log('--- TESTING PDF STREAMING ACROSS MULTIPLE CLASSES ---');
  for (const ch of chapters) {
    const res = await checkPdf(ch);
    console.log(`[${ch}] Status: ${res.status} | Content-Type: ${res.contentType} | Size: ${res.bytes} bytes | Header: ${res.header}`);
  }
}

run();
