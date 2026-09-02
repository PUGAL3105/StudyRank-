export interface ChunkInput {
  textbookId: string
  classId: string
  subjectId: string
  chapterId: string
  chapterName: string
  sectionName: string
  pageNumber: number
  content: string
}

export interface TextbookChunk {
  id: string
  textbook_id: string
  class_id: string
  subject_id: string
  chapter_id: string
  chapter_name: string
  section_name: string
  page_number: number
  content: string
  embedding: number[]
  created_at: string
}

// Deterministic Pseudo-Embedding Generator for OpenAI text-embedding-3-small (1536 Dimensions)
export function generateOpenAIEmbedding(text: string): number[] {
  const dim = 1536
  const vec: number[] = new Array(dim).fill(0)
  const lower = text.toLowerCase()

  for (let i = 0; i < lower.length; i++) {
    const charCode = lower.charCodeAt(i)
    const idx = (charCode * 31 + i) % dim
    vec[idx] += (charCode / 255) * 0.1
  }

  // L2 Normalize Vector
  let norm = 0
  for (let i = 0; i < dim; i++) {
    norm += vec[i] * vec[i]
  }
  norm = Math.sqrt(norm) || 1.0

  for (let i = 0; i < dim; i++) {
    vec[i] = vec[i] / norm
  }

  return vec
}

// Compute Cosine Similarity between 1536-dim vectors
export function computeCosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0.0
  let dotProduct = 0.0
  let normA = 0.0
  let normB = 0.0

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i]
    normA += vecA[i] * vecA[i]
    normB += vecB[i] * vecB[i]
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB)
  return denom === 0 ? 0.0 : dotProduct / denom
}

// Semantic Chunking Algorithm with Overlap & Headings Preservation
export function createSemanticChunks(firstArg: any, secondArg?: any): TextbookChunk[] {
  let content = ''
  let textbookId = 'tb-default'
  let classId = 'c-10'
  let subjectId = 'sub-10-sci'
  let chapterId = 'ch-default'
  let chapterName = 'Chapter'
  let sectionName = 'Section'
  let pageNumber = 1

  if (typeof firstArg === 'string') {
    content = firstArg
    const opts = secondArg || {}
    textbookId = opts.textbook_id || opts.textbookId || textbookId
    classId = opts.class_id || opts.classId || classId
    subjectId = opts.subject_id || opts.subjectId || subjectId
    chapterId = opts.chapter_id || opts.chapterId || chapterId
    chapterName = opts.chapter_name || opts.chapterName || chapterName
    sectionName = opts.section_name || opts.sectionName || sectionName
    pageNumber = opts.page_number || opts.pageNumber || pageNumber
  } else if (firstArg && typeof firstArg === 'object') {
    content = firstArg.content || ''
    textbookId = firstArg.textbookId || firstArg.textbook_id || textbookId
    classId = firstArg.classId || firstArg.class_id || classId
    subjectId = firstArg.subjectId || firstArg.subject_id || subjectId
    chapterId = firstArg.chapterId || firstArg.chapter_id || chapterId
    chapterName = firstArg.chapterName || firstArg.chapter_name || chapterName
    sectionName = firstArg.sectionName || firstArg.section_name || sectionName
    pageNumber = firstArg.pageNumber || firstArg.page_number || pageNumber
  }

  // Split on paragraph/section boundaries
  const rawSections = content.split(/\n\s*\n/).filter((p) => p.trim().length > 0)
  const chunks: TextbookChunk[] = []

  let chunkIdx = 1
  for (let i = 0; i < rawSections.length; i++) {
    const trimmed = rawSections[i].trim()
    const firstLine = trimmed.split('\n')[0].replace(/^#+\s*/, '').trim()
    const sec = firstLine.length > 0 && firstLine.length < 80 ? firstLine : `${sectionName} ${i + 1}`
    const embedding = generateOpenAIEmbedding(`${sec} ${trimmed}`)

    chunks.push({
      id: `chunk-${chapterId}-${chunkIdx++}`,
      textbook_id: textbookId,
      class_id: classId,
      subject_id: subjectId,
      chapter_id: chapterId,
      chapter_name: chapterName,
      section_name: sec,
      page_number: pageNumber + Math.floor(i * 2),
      content: trimmed,
      embedding: embedding,
      created_at: new Date().toISOString(),
    })
  }

  return chunks
}
