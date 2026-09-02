const db = require('../dist/db/connection').default;
const { memoryStore, initMemoryStore } = require('../dist/db/connection');
const fs = require('fs');
const path = require('path');

async function inspect() {
  await initMemoryStore();
  console.log('=== REAL DATA DIAGNOSTIC REPORT ===');
  console.log('Classes configured:', memoryStore.classes.length);
  console.log('Subjects configured:', memoryStore.subjects.length);
  console.log('Textbooks registered:', memoryStore.textbooks.length);
  console.log('Chapters registered:', memoryStore.chapters.length);
  
  const readyCh = memoryStore.chapters.filter(c => c.indexing_status === 'READY');
  const pendingCh = memoryStore.chapters.filter(c => c.indexing_status === 'PENDING' || !c.indexing_status);
  const partialCh = memoryStore.chapters.filter(c => c.indexing_status === 'PARTIAL');
  const failedCh = memoryStore.chapters.filter(c => c.indexing_status === 'FAILED');
  
  console.log('READY chapters:', readyCh.length);
  console.log('PENDING chapters:', pendingCh.length);
  console.log('PARTIAL chapters:', partialCh.length);
  console.log('FAILED chapters:', failedCh.length);
  console.log('Chunks:', memoryStore.bookChunks.length);
  
  const embCount = memoryStore.bookChunks.filter(c => c.embedding && Array.isArray(c.embedding) && c.embedding.length > 0).length;
  console.log('Embeddings:', embCount);

  let withSrc = 0;
  let withoutSrc = 0;
  for (const tb of memoryStore.textbooks) {
    const p1 = path.join(process.cwd(), tb.pdf_url || '');
    const p2 = path.join(process.cwd(), 'storage', path.basename(tb.pdf_url || ''));
    const p3 = path.join(process.cwd(), 'data', 'textbooks', 'class10', 'science', 'english', path.basename(tb.pdf_url || ''));
    if ((tb.pdf_url && fs.existsSync(p1)) || (tb.pdf_url && fs.existsSync(p2)) || (tb.pdf_url && fs.existsSync(p3))) {
      withSrc++;
    } else {
      withoutSrc++;
    }
  }
  console.log('Textbooks with actual source files:', withSrc);
  console.log('Textbooks without source files:', withoutSrc);

  console.log('\n=== CHAPTERS PER CLASS BREAKDOWN ===');
  for (const cls of memoryStore.classes) {
    const subs = memoryStore.subjects.filter(s => s.class_id === cls.id);
    const subIds = subs.map(s => s.id);
    const chs = memoryStore.chapters.filter(c => subIds.includes(c.subject_id));
    const rCount = chs.filter(c => c.indexing_status === 'READY').length;
    const pCount = chs.filter(c => c.indexing_status === 'PENDING').length;
    console.log(`${cls.class_name} (${cls.id}): Total=${chs.length}, READY=${rCount}, PENDING=${pCount}`);
  }

  console.log('\n=== POSTGRESQL DIRECT CHECK ===');
  try {
    const classesCount = await db.one('SELECT count(id)::int as count FROM classes');
    console.log('PostgreSQL Connected: YES');
    console.log('PG Classes:', classesCount.count);
  } catch (err) {
    console.log('PostgreSQL Connected: NO (Running on in-memory store) -', err.message);
  }
}

inspect().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
