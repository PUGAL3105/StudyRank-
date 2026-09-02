import db, { memoryStore } from '../db/connection'
import { generateOpenAIEmbedding, computeCosineSimilarity } from './chunkerService'

export interface RAGRequest {
  classId?: string
  subjectId: string
  termId?: string       // TN SB Term (Term 1/2/3 or Semester 1/2)
  chapterId: string
  topicId?: string      // Optional topic-level scoping
  question: string
}

export interface RetrievedChunkResult {
  chunk_id: string
  section_name: string
  page_number: number
  similarity_score: number
  content: string
}

export interface RAGResponseData {
  question: string
  answer: string
  simple_explanation: string
  important_points: string[]
  step_by_step: string[]
  example: string | null
  source: {
    book: string
    chapter: string
    pages: number[]
    sections: string[]
  } | null
  grounding?: {
    isGrounded: boolean
    confidence: number
    sourcePages: number[]
    sourceBook: string
  }
  chapter: string
  page_numbers: number[]
  confidence: number
  retrieved_chunks: RetrievedChunkResult[]
}

const STOP_WORDS = new Set([
  'what', 'where', 'which', 'how', 'when', 'who', 'why', 'explain', 'does', 'do',
  'is', 'are', 'was', 'were', 'the', 'a', 'an', 'and', 'or', 'in', 'of', 'to', 'for', 'with', 'on', 'at', 'from', 'by', 'that', 'this', 'these', 'those'
])

// Production RAG Pipeline Engine
export async function processRAGPipeline(payload: RAGRequest): Promise<{ status: number; body: any }> {
  const { classId, subjectId, termId, chapterId, topicId, question } = payload

  const trimmedQuestion = question ? question.trim() : ''
  if (!trimmedQuestion) {
    return {
      status: 400,
      body: { success: false, error: '"question" is not allowed to be empty' },
    }
  }

  // 1. Validate Class in PostgreSQL if provided
  let dbClass: any = null
  if (classId) {
    dbClass = await db.oneOrNone('SELECT id, class_name FROM classes WHERE id = $1', [classId])
    if (!dbClass) {
      return {
        status: 404,
        body: { success: false, error: `Invalid classId: ${classId}` },
      }
    }
  }

  // 2. Validate Subject in PostgreSQL
  const dbSubject = await db.oneOrNone('SELECT id, class_id, subject_name FROM subjects WHERE id = $1', [subjectId])
  if (!dbSubject) {
    return {
      status: 404,
      body: { success: false, error: `Invalid subjectId: ${subjectId}` },
    }
  }

  // 3. Validate Subject belongs to selected Class
  if (classId && dbSubject.class_id !== classId) {
    return {
      status: 400,
      body: {
        success: false,
        error: `Subject '${dbSubject.subject_name}' (${subjectId}) does not belong to Class '${classId}'`,
      },
    }
  }

  // 4. Validate Chapter in PostgreSQL and check subject linkage
  const dbChapter = await db.oneOrNone('SELECT id, subject_id, chapter_name, indexing_status FROM chapters WHERE id = $1', [chapterId])
  if (!dbChapter) {
    return {
      status: 404,
      body: { success: false, error: `Invalid chapterId: ${chapterId}` },
    }
  }

  if (dbChapter.subject_id !== subjectId) {
    return {
      status: 400,
      body: {
        success: false,
        error: `Chapter '${dbChapter.chapter_name}' (${chapterId}) does not belong to Subject '${dbSubject.subject_name}' (${subjectId})`,
      },
    }
  }

  // 5. AI Answering Rule: Check Chapter Indexing Status (Chunk-existence ground truth)
  const isChunkReady = memoryStore.bookChunks.some((chunk) => chunk.chapter_id === chapterId)
  const status = (dbChapter.indexing_status === 'READY' || isChunkReady) ? 'READY' : (dbChapter.indexing_status || 'PENDING')
  if (status === 'PROCESSING' || status === 'INDEXING') {
    return {
      status: 200,
      body: {
        success: true,
        data: {
          question: trimmedQuestion,
          answer: 'This chapter is currently being prepared. Please try again later.',
          simple_explanation: 'Indexing is in progress.',
          important_points: [],
          step_by_step: [],
          example: null,
          source: null,
          grounding: {
            isGrounded: false,
            confidence: 0.0,
            sourcePages: [],
            sourceBook: '',
          },
          chapter: dbChapter.chapter_name,
          page_numbers: [],
          confidence: 0.0,
          retrieved_chunks: [],
        },
      },
    }
  }

  if (status === 'REJECTED') {
    return {
      status: 200,
      body: {
        success: true,
        data: {
          question: trimmedQuestion,
          answer: 'The textbook uploaded for this chapter failed authenticity validation and was rejected.',
          simple_explanation: 'Rejected textbook upload.',
          important_points: [],
          step_by_step: [],
          example: null,
          source: null,
          grounding: {
            isGrounded: false,
            confidence: 0.0,
            sourcePages: [],
            sourceBook: '',
          },
          chapter: dbChapter.chapter_name,
          page_numbers: [],
          confidence: 0.0,
          retrieved_chunks: [],
        },
      },
    }
  }

  if (status === 'PENDING') {
    return {
      status: 200,
      body: {
        success: true,
        data: {
          question: trimmedQuestion,
          answer: 'This chapter has not been indexed yet.',
          simple_explanation: 'Textbook PDF required.',
          important_points: [],
          step_by_step: [],
          example: null,
          source: null,
          grounding: {
            isGrounded: false,
            confidence: 0.0,
            sourcePages: [],
            sourceBook: '',
          },
          chapter: dbChapter.chapter_name,
          page_numbers: [],
          confidence: 0.0,
          retrieved_chunks: [],
        },
      },
    }
  }

  if (status === 'FAILED') {
    return {
      status: 200,
      body: {
        success: true,
        data: {
          question: trimmedQuestion,
          answer: 'This chapter could not be processed. Please contact your teacher/admin.',
          simple_explanation: 'Ingestion error encountered.',
          important_points: [],
          step_by_step: [],
          example: null,
          source: null,
          grounding: {
            isGrounded: false,
            confidence: 0.0,
            sourcePages: [],
            sourceBook: '',
          },
          chapter: dbChapter.chapter_name,
          page_numbers: [],
          confidence: 0.0,
          retrieved_chunks: [],
        },
      },
    }
  }

  // 6. Query Textbook Metadata
  const dbTextbook = await db.oneOrNone(
    'SELECT id, book_name, publisher FROM textbooks WHERE subject_id = $1 LIMIT 1',
    [subjectId]
  )
  const memTb = memoryStore.textbooks.find((t) => t.subject_id === subjectId)
  const bookName = dbTextbook ? dbTextbook.book_name : (memTb ? memTb.book_name : `Tamil Nadu State Board ${dbClass ? dbClass.class_name : 'Class 10'} ${dbSubject.subject_name} Textbook (Samacheer Kalvi)`)

  // 7. Generate Query Vector Embedding (OpenAI text-embedding-3-small, 1536-dim)
  const queryVector = generateOpenAIEmbedding(trimmedQuestion)

  // 8. Retrieve Chunks Filtered strictly by class_id, subject_id, chapter_id, and term_id
  let chunks = await db.manyOrNone(
    `SELECT c.id, c.content, c.page_number, c.section_name, c.embedding,
            c.class_id, c.subject_id, c.chapter_id, c.term_id, c.topic_id, c.textbook_id
     FROM book_chunks c
     WHERE c.chapter_id = $1
       AND ($2::VARCHAR IS NULL OR c.class_id = $2)
       AND ($3::VARCHAR IS NULL OR c.subject_id = $3)
       AND ($4::VARCHAR IS NULL OR c.term_id = $4)
       AND ($5::VARCHAR IS NULL OR c.topic_id = $5)`,
    [chapterId, classId || null, subjectId || null, termId || null, topicId || null]
  )

  if (!chunks || chunks.length === 0) {
    const memChunks = memoryStore.bookChunks.filter((c) => {
      if (c.chapter_id !== chapterId) return false
      if (classId && c.class_id && c.class_id !== classId) return false
      if (subjectId && c.subject_id && c.subject_id !== subjectId) return false
      return true
    })
    if (memChunks.length > 0) {
      chunks = memChunks.map((c) => ({
        id: c.id,
        content: c.content,
        page_number: c.page_number,
        section_name: c.section_name,
        embedding: c.embedding || generateOpenAIEmbedding(`${c.section_name} ${c.content}`),
        class_id: c.class_id,
        subject_id: c.subject_id,
        chapter_id: c.chapter_id,
        term_id: c.term_id,
        topic_id: c.topic_id,
        textbook_id: c.textbook_id,
      }))
    }
  }

  // 9. Hybrid Search (1536-dim Vector Cosine Similarity + Keyword/Tamil Concept Expansion)
  const scoredChunks: (RetrievedChunkResult & { raw_chunk: any })[] = []
  const isTamilQuery = /[\u0B80-\u0BFF]/.test(trimmedQuestion)
  const lowerQ = trimmedQuestion.toLowerCase()
  let queryKeywords = lowerQ.split(/[\s,?.!]+/).filter((w) => w.length > 2 && !STOP_WORDS.has(w))

  const tamilDictionary: Record<string, string[]> = {
    'அரசியலமைப்பு': ['constitution', 'preamble', 'fundamental'],
    'சட்டம்': ['law', 'act', 'constitution', 'amendment'],
    'உரிமைகள்': ['rights', 'fundamental', 'article'],
    'கடமைகள்': ['duties', 'directive'],
    'விசை': ['force', 'motion', 'newton'],
    'நிலைமம்': ['inertia', 'mass', 'rest'],
    'இயக்கம்': ['motion', 'velocity', 'acceleration'],
    'இயக்க': ['motion', 'velocity', 'acceleration'],
    'விதி': ['law', 'motion', 'newton'],
    'நியூட்டன்': ['newton', 'motion', 'inertia', 'force'],
    'ஒளி': ['optics', 'light', 'refraction', 'lens', 'mirror'],
    'வெப்பம்': ['thermal', 'heat', 'temperature'],
    'மின்னியல்': ['electricity', 'current', 'voltage', 'circuit', 'resistance'],
    'ஒலியியல்': ['acoustics', 'sound', 'wave', 'frequency', 'echo'],
    'தாவரம்': ['plant', 'anatomy', 'leaf', 'root', 'tissue'],
    'விலங்கு': ['animal', 'tissue', 'structure'],
    'அணு': ['atom', 'structure', 'atomic'],
    'வேதி': ['chemical', 'reaction', 'equation'],
    'அளவீடு': ['measurement', 'unit', 'metre', 'kilogram', 'length', 'mass'],
    'அடர்த்தி': ['density', 'volume', 'mass'],
    'அழுத்தம்': ['pressure', 'pascal', 'liquid'],
    'மின்னோட்டம்': ['current', 'electricity', 'ampere', 'circuit'],
    'மின்னூட்டம்': ['charge', 'coulomb', 'electrostatic'],
  }

  if (isTamilQuery) {
    for (const [taTerm, enWords] of Object.entries(tamilDictionary)) {
      if (trimmedQuestion.includes(taTerm)) {
        queryKeywords.push(...enWords)
      }
    }
  }

  if (chunks && chunks.length > 0) {
    for (const c of chunks) {
      let sim = 0.0
      if (c.embedding && Array.isArray(c.embedding)) {
        sim = computeCosineSimilarity(queryVector, c.embedding)
      }

      const lowerContent = c.content.toLowerCase()
      const lowerSection = (c.section_name || '').toLowerCase()

      const matchingWords = queryKeywords.filter((w) => {
        const regex = new RegExp(`\\b${w}\\b`, 'i')
        return regex.test(lowerContent) || regex.test(lowerSection)
      })

      if (matchingWords.length > 0) {
        sim = Math.max(sim, 0.75 + matchingWords.length * 0.06)
      } else if (sim < 0.65) {
        sim = sim * 0.8
      }

      if (sim > 1.0) sim = 0.98

      scoredChunks.push({
        chunk_id: c.id,
        section_name: c.section_name || 'General Section',
        page_number: c.page_number || 1,
        similarity_score: parseFloat(sim.toFixed(4)),
        content: c.content,
        raw_chunk: c,
      })
    }
  }

  scoredChunks.sort((a, b) => b.similarity_score - a.similarity_score)

  const SIMILARITY_THRESHOLD = 0.60
  const topKChunks = scoredChunks.filter((item) => item.similarity_score >= SIMILARITY_THRESHOLD).slice(0, 3)

  // 10. Hallucination Protection Guard
  if (topKChunks.length === 0) {
    const unindexedMsg = isTamilQuery
      ? 'பாடநூலில் இந்தக் கேள்விக்கான போதுமான தகவல்கள் கிடைக்கவில்லை. சரியான வகுப்பு, பாடம் மற்றும் அத்தியாயத்தைத் தேர்ந்தெடுத்து மீண்டும் முயற்சிக்கவும்.'
      : "I couldn't find enough relevant information in the available textbook content to answer this confidently. Please select the correct class, subject or chapter and try again."

    return {
      status: 200,
      body: {
        success: true,
        data: {
          question: trimmedQuestion,
          answer: unindexedMsg,
          simple_explanation: isTamilQuery ? 'பாடநூலில் தகவல் கிடைக்கவில்லை.' : 'The selected chapter does not contain textbook details regarding this question.',
          important_points: [],
          step_by_step: [],
          example: null,
          source: null,
          grounding: {
            isGrounded: false,
            confidence: 0.0,
            sourcePages: [],
            sourceBook: '',
          },
          chapter: dbChapter.chapter_name,
          page_numbers: [],
          confidence: 0.0,
          retrieved_chunks: [],
        },
      },
    }
  }

  // 11. Context Aggregation & Citations
  const pageNumbersSet = Array.from(new Set(topKChunks.map((c) => c.page_number))).sort((a, b) => a - b)
  const sectionsSet = Array.from(new Set(topKChunks.map((c) => c.section_name)))
  const topConfidence = topKChunks[0].similarity_score
  const primaryChunk = topKChunks[0]
  const classNameResolved = dbClass ? dbClass.class_name : 'Class 10'

  // Structured response formatting following Phase 20 & 22 specification
  const formattedAnswer = isTamilQuery
    ? `## விடை\n${primaryChunk.content}\n\n## முக்கியக் குறிப்புகள்\n${topKChunks.map((c) => `• ${c.section_name} (பக்கம் ${c.page_number}): ${c.content.slice(0, 100)}`).join('\n')}\n\n## பாடநூல் குறிப்பு\nவகுப்பு: ${classNameResolved}\nபாடம்: ${dbSubject.subject_name}\nஅத்தியாயம்: ${dbChapter.chapter_name}\nபக்கம்: ${pageNumbersSet.join(', ')}`
    : `## Answer\n${primaryChunk.content}\n\n## Key Points\n${topKChunks.map((c) => `• ${c.section_name} (Page ${c.page_number}): ${c.content.slice(0, 100)}...`).join('\n')}\n\n## Example\nPractical demonstration: The concepts outlined in ${sectionsSet[0]} directly apply to classroom laboratory observations.\n\n## Textbook Reference\nClass: ${classNameResolved}\nSubject: ${dbSubject.subject_name}\nChapter: ${dbChapter.chapter_name}\nPage: ${pageNumbersSet.join(', ')}`

  const responsePayload: RAGResponseData = {
    question: trimmedQuestion,
    answer: formattedAnswer,
    simple_explanation: `${sectionsSet[0]} (Page ${pageNumbersSet[0]}): ${primaryChunk.content.slice(0, 140)}...`,
    important_points: topKChunks.map((c) => `• ${c.section_name} (Page ${c.page_number}): ${c.content.slice(0, 90)}...`),
    step_by_step: [
      'Step 1: Understand fundamental definitions and physical principles from the textbook.',
      'Step 2: Connect theoretical formulations with quantitative and qualitative examples.',
      'Step 3: State conclusions accurately referencing official syllabus terminology.',
    ],
    example: `Practical application: Fundamental mechanisms defined in ${sectionsSet[0]} govern physical and natural interactions.`,
    source: {
      book: bookName,
      chapter: dbChapter.chapter_name,
      pages: pageNumbersSet,
      sections: sectionsSet,
    },
    grounding: {
      isGrounded: true,
      confidence: topConfidence,
      sourcePages: pageNumbersSet,
      sourceBook: bookName,
    },
    chapter: dbChapter.chapter_name,
    page_numbers: pageNumbersSet,
    confidence: topConfidence,
    retrieved_chunks: topKChunks.map(({ raw_chunk, ...rest }) => rest),
  }

  return {
    status: 201,
    body: {
      success: true,
      data: responsePayload,
      message: 'Question processed. Your AI teacher has generated a grounded lesson response.',
    },
  }
}
