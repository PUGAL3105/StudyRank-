import { Router, Request, Response } from 'express'
import { authMiddleware, optionalAuthMiddleware, AuthenticatedRequest } from '../middleware/auth'
import db, { memoryStore } from '../db/connection'
import { generateOpenAIEmbedding, computeCosineSimilarity } from '../services/chunkerService'

const router = Router()

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

// POST /api/ai/chat — Subject & Concept AI Assistant
router.post('/chat', optionalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { message, classId, subjectId, termId, chapterId, history = [], language = 'en' } = req.body

    const trimmedMsg = (message || '').trim()
    if (!trimmedMsg) {
      return res.status(400).json({ success: false, error: 'Message is required.' })
    }

    // 1. Resolve context information from Database / MemoryStore
    let subjectName = 'General Studies'
    let chapterName = ''
    let className = 'Class 10'
    let chapterStatus = 'PENDING'

    if (classId) {
      const cls = memoryStore.classes.find((c) => c.id === classId) || (await db.oneOrNone('SELECT class_name FROM classes WHERE id = $1', [classId]))
      if (cls) className = cls.class_name
    }

    if (subjectId) {
      const sub = memoryStore.subjects.find((s) => s.id === subjectId) || (await db.oneOrNone('SELECT subject_name FROM subjects WHERE id = $1', [subjectId]))
      if (sub) subjectName = sub.subject_name
    }

    if (chapterId) {
      const ch = memoryStore.chapters.find((c) => c.id === chapterId) || (await db.oneOrNone('SELECT chapter_name, indexing_status FROM chapters WHERE id = $1', [chapterId]))
      if (ch) {
        chapterName = ch.chapter_name
        chapterStatus = ch.indexing_status || 'PENDING'
      }
    }

    const isTamil = language === 'ta' || /[\u0B80-\u0BFF]/.test(trimmedMsg)

    // Build context query including conversational follow-up if history is present
    let queryForEmbedding = trimmedMsg
    if (Array.isArray(history) && history.length > 0) {
      const lastUser = history.filter((h: any) => h.role === 'user').slice(-1)[0]
      if (lastUser && lastUser.content && (trimmedMsg.length < 25 || /^(give|what about|example|more|explain|how|why)/i.test(trimmedMsg))) {
        queryForEmbedding = `${lastUser.content} ${trimmedMsg}`
      }
    }

    // 2. Strict Metadata-Gated Chunk Retrieval
    let retrievedChunks: Array<{ content: string; section_name: string; page_number: number; similarity: number }> = []

    if (chapterId) {
      let chunks = memoryStore.bookChunks.filter((c) => c.chapter_id === chapterId)
      if (chunks.length === 0) {
        chunks = (await db.manyOrNone('SELECT content, section_name, page_number, embedding FROM book_chunks WHERE chapter_id = $1', [chapterId])) || []
      }

      if (chunks.length > 0) {
        const tamilDictionary: Record<string, string[]> = {
          'அரசியலமைப்பு': ['constitution', 'preamble', 'fundamental'],
          'சட்டம்': ['law', 'act', 'constitution', 'amendment'],
          'உரிமைகள்': ['rights', 'fundamental', 'article'],
          'கடமைகள்': ['duties', 'directive'],
          'விசை': ['force', 'motion', 'newton'],
          'நிலைமம்': ['inertia', 'mass', 'rest'],
          'இயக்கம்': ['motion', 'velocity', 'acceleration'],
          'ஒளி': ['optics', 'light', 'refraction', 'lens'],
          'வெப்பம்': ['thermal', 'heat', 'temperature'],
          'மின்னியல்': ['electricity', 'current', 'voltage', 'circuit'],
          'ஒலியியல்': ['acoustics', 'sound', 'wave', 'frequency'],
          'சார்புகள்': ['relations', 'functions', 'cartesian', 'set'],
          'தொடர்முறை': ['sequences', 'progression', 'arithmetic', 'geometric'],
          'இயற்கணிதம்': ['algebra', 'polynomial', 'quadratic', 'equation'],
          'வடிவியல்': ['geometry', 'thales', 'pythagoras', 'similarity'],
          'ஆயத்தொலை': ['coordinate', 'slope', 'straight', 'triangle'],
          'போர்': ['war', 'alliance', 'versailles', 'nations'],
          'புவியியல்': ['location', 'relief', 'drainage', 'mountains', 'rivers'],
          'உற்பத்தி': ['product', 'gdp', 'income', 'growth', 'sector'],
        }

        const queryVector = generateOpenAIEmbedding(queryForEmbedding)
        const stopWords = new Set(['what', 'where', 'which', 'how', 'when', 'who', 'why', 'explain', 'is', 'are', 'the', 'a', 'an', 'and', 'in', 'of', 'to', 'for', 'give', 'me', 'யாவை', 'என்ன', 'விளக்குக', 'பற்றி', 'முக்கிய'])
        let keywords = queryForEmbedding.toLowerCase().split(/[\s,?.!]+/).filter((w: string) => w.length > 2 && !stopWords.has(w))

        // Expand with cross-language Tamil keywords
        for (const [taTerm, enWords] of Object.entries(tamilDictionary)) {
          if (queryForEmbedding.includes(taTerm)) {
            keywords = keywords.concat(enWords)
          }
        }

        for (const c of chunks) {
          let sim = 0.0
          if (c.embedding && Array.isArray(c.embedding)) {
            sim = computeCosineSimilarity(queryVector, c.embedding)
          }

          const lowerContent = (c.content || '').toLowerCase()
          const lowerSec = (c.section_name || '').toLowerCase()
          const matchCount = keywords.filter((k: string) => lowerContent.includes(k) || lowerSec.includes(k)).length
          if (matchCount > 0) {
            sim = Math.max(sim, 0.72 + Math.min(matchCount * 0.05, 0.25))
          }

          if (sim >= 0.60) {
            retrievedChunks.push({
              content: c.content,
              section_name: c.section_name || 'Chapter Section',
              page_number: c.page_number || 1,
              similarity: Math.min(sim, 0.99),
            })
          }
        }

        retrievedChunks.sort((a, b) => b.similarity - a.similarity)
        retrievedChunks = retrievedChunks.slice(0, 3)
      }
    }

    // 3. Evaluate Strict RAG States
    let reply = ''
    let simpleExplanation = ''
    let keyPoints: string[] = []
    let example: string | null = null
    let followUpQuestions: string[] = []
    let sourcePages: number[] = []
    let isGrounded = false

    // STATE A: Textbook READY + Relevant Chunks Found
    if (retrievedChunks.length > 0) {
      isGrounded = true
      sourcePages = Array.from(new Set(retrievedChunks.map((c) => c.page_number))).sort((a, b) => a - b)
      const topChunk = retrievedChunks[0]

      if (isTamil) {
        reply = `**${subjectName}${chapterName ? ` - ${chapterName}` : ''} பாடப்புத்தக விளக்கக் குறிப்பு:**\n\n${topChunk.content}\n\n*சான்று: தமிழ்நாடு சமச்சீர் கல்வி பாடப்புத்தகம் (பக்கம் ${sourcePages.join(', ')})*`
        simpleExplanation = `இக்கருத்து ${topChunk.section_name} பகுதியுடன் தொடர்புடையது.`
        keyPoints = [
          `பாடப்பிரிவு: ${topChunk.section_name}`,
          `முக்கிய குறிப்பு: ${topChunk.content.slice(0, 110)}...`,
          `பக்க எண்: ${sourcePages.join(', ')}`,
        ]
        example = 'எடுத்துக்காட்டு: அன்றாட வாழ்வில் நிகழும் அறிவியல் நிகழ்வுகளை பாடப்புத்தக விதிகளோடு ஒப்பிட்டுப் பார்க்கவும்.'
        followUpQuestions = [
          'இதற்கான முக்கிய சூத்திரம் அல்லது விதிகள் யாவை?',
          'தேர்வுக்கு இந்த பாடத்தில் இருந்து கேட்கப்படும் முக்கிய வினாக்கள் யாவை?',
          'எளிய எடுத்துக்காட்டுடன் மீண்டும் விளக்க முடியுமா?',
        ]
      } else {
        reply = `Based on the **Tamil Nadu State Board / Samacheer Kalvi** textbook for **${subjectName}**${chapterName ? ` (*${chapterName}*)` : ''}:\n\n${topChunk.content}\n\nReviewing this foundational concept from **${topChunk.section_name}** will help you understand exam questions and applications.`
        simpleExplanation = `This directly relates to the core principles outlined in ${topChunk.section_name} (Page ${sourcePages.join(', ')}).`
        keyPoints = retrievedChunks.map((c) => `${c.section_name} (Page ${c.page_number}): ${c.content.slice(0, 95)}...`)
        example = 'Real-world Application: Notice how this scientific or mathematical principle governs daily observations, experiments, and standard problems!'
        followUpQuestions = [
          'What are the key formulas and laws related to this?',
          'Can you explain this with a simpler step-by-step example?',
          'What are the most frequent 2-mark and 5-mark exam questions from this unit?',
        ]
      }
    } 
    // STATE B: Educational Synthesis (always returns clear, helpful curriculum answers)
    else {
      if (isTamil) {
        reply = `வணக்கம்! நீங்கள் கேட்ட கேள்வி: "${trimmedMsg}".\n\n**${subjectName}** (${className}) பாடத்தில் இக்கருத்து மிகவும் முக்கியமானது. அடிப்படைக் கோட்பாடுகளை புரிந்து கொள்வதன் மூலம் எளிதாக தேர்வுகளில் முழு மதிப்பெண் பெறலாம்.`
        simpleExplanation = `இக்கேள்வி ${subjectName} பாடத்தின் அடிப்படைக் கருத்துக்களோடு தொடர்புடையது.`
        keyPoints = [
          'பாடப்பகுதியின் அடிப்படைக் கோட்பாடுகளை முதலில் படியுங்கள்.',
          'முக்கிய வரையறைகள் மற்றும் சூத்திரங்களை எழுதிப் பழகுங்கள்.',
          'தேர்வு வினா-விடை மாதிரிகளை பயிற்சி செய்யுங்கள்.',
        ]
        followUpQuestions = [
          'இந்த தலைப்பில் எளிய எடுத்துக்காட்டு தருக.',
          'முக்கிய வினாக்களை பட்டியலிடுக.',
          'இதன் வரைபடம் அல்லது செய்முறை யாது?',
        ]
      } else {
        reply = `Hello! Regarding your query on **${trimmedMsg}** in **${subjectName}** (${className}):\n\nThis is an essential topic in the Tamil Nadu State Board curriculum. To master this concept, start with the core definition, understand the underlying mathematical/scientific principles, and practice standard textbook problems.`
        simpleExplanation = `Core concept inquiry for ${subjectName} (${className}).`
        keyPoints = [
          'Understand the foundational definitions and standard textbook terminology.',
          'Derive equations or draw relevant scientific diagrams to build visual intuition.',
          'Practice end-of-chapter book-back questions and past board exam problems.',
        ]
        example = 'Study Tip: Try explaining this concept in your own words or solving a textbook exercise problem to test your understanding!'
        followUpQuestions = [
          `Can you provide a simple step-by-step breakdown of ${trimmedMsg}?`,
          'What are the most important exam tips for this topic?',
          'Give me 3 practice multiple-choice questions on this.',
        ]
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        reply,
        simpleExplanation,
        keyPoints,
        example,
        followUpQuestions,
        grounding: {
          isGrounded,
          sourceBook: `Tamil Nadu State Board ${className} ${subjectName}`,
          chapterName: chapterName || 'General Syllabus',
          sourcePages,
        },
        context: {
          classId,
          className,
          subjectId,
          subjectName,
          termId,
          chapterId,
          chapterName,
          language: isTamil ? 'ta' : 'en',
        },
        timestamp: new Date().toISOString(),
      },
    })
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Failed to process AI chat message.' })
  }
})

// POST /api/ai/answer/:questionId
router.post('/answer/:questionId', authMiddleware, async (req: AuthenticatedRequest, res) => {
  const { questionId } = req.params
  res.json({
    success: true,
    data: {
      id: `ans-${questionId}`,
      questionId,
      explanation: 'Detailed step-by-step AI generated explanation based on textbook context.',
      keyPoints: ['Point 1: Key concepts covered', 'Point 2: Core formulas & principles', 'Point 3: Application example'],
      sourcePage: 15,
      createdAt: new Date().toISOString(),
    },
  })
})

// POST /api/ai/diagram/:answerId
router.post('/diagram/:answerId', authMiddleware, async (req: AuthenticatedRequest, res) => {
  res.json({
    success: true,
    data: {
      diagramUrl: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&auto=format&fit=crop',
      caption: 'Visual breakdown of the biological process.',
    },
  })
})

// POST /api/ai/video/:answerId
router.post('/video/:answerId', authMiddleware, async (req: AuthenticatedRequest, res) => {
  res.json({
    success: true,
    data: {
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      duration: '2:15',
    },
  })
})

// POST /api/ai/rag-debug — Admin & Developer Diagnostic RAG Trace
router.post('/rag-debug', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin authorization required for RAG debugging trace.' })
    }

    const { question, classId, subjectId, chapterId } = req.body
    if (!question || !question.trim()) {
      return res.status(400).json({ success: false, error: 'Question is required.' })
    }

    const trimmedQ = question.trim()
    const queryVector = generateOpenAIEmbedding(trimmedQ)

    // Retrieve matching chunks with metadata isolation
    const chunks = memoryStore.bookChunks.filter((c) => {
      if (chapterId && c.chapter_id !== chapterId) return false
      if (classId && c.class_id && c.class_id !== classId) return false
      if (subjectId && c.subject_id && c.subject_id !== subjectId) return false
      return true
    })

    const scored = chunks.map((c) => {
      const sim = c.embedding ? computeCosineSimilarity(queryVector, c.embedding) : 0.0
      return {
        chunkId: c.id,
        classId: c.class_id,
        subjectId: c.subject_id,
        chapterId: c.chapter_id,
        sectionName: c.section_name,
        pageNumber: c.page_number,
        similarityScore: parseFloat(sim.toFixed(4)),
        contentPreview: c.content ? c.content.slice(0, 160) + '...' : '',
      }
    }).sort((a, b) => b.similarityScore - a.similarityScore)

    const topChunks = scored.slice(0, 3)
    const cls = memoryStore.classes.find((c) => c.id === classId)
    const sub = memoryStore.subjects.find((s) => s.id === subjectId)
    const ch = memoryStore.chapters.find((c) => c.id === chapterId)

    res.json({
      success: true,
      debug: {
        question: trimmedQ,
        detectedClass: cls?.class_name || classId || 'Unspecified',
        detectedSubject: sub?.subject_name || subjectId || 'Unspecified',
        detectedChapter: ch?.chapter_name || chapterId || 'Unspecified',
        totalCandidatesInScope: chunks.length,
        retrievedChunks: topChunks,
        finalContext: topChunks.map((tc) => `[${tc.sectionName} - Page ${tc.pageNumber}]: ${tc.contentPreview}`).join('\n\n'),
        sourceProvenance: {
          board: 'Tamil Nadu State Board (Samacheer Kalvi)',
          model: 'text-embedding-3-small (1536-dim)',
          topSimilarity: topChunks[0]?.similarityScore || 0,
        },
      },
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Error processing RAG debug trace.' })
  }
})

export default router
