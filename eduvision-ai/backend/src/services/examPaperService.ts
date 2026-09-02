import crypto from 'crypto'
import db, { memoryStore } from '../db/connection'

export interface ExamBlueprint {
  classLevel: string
  subjectName: string
  examType: 'Quarterly' | 'Half-Yearly' | 'Revision' | 'Board' | 'Unit-Test'
  maxMarks: number
  durationHours: number
  parts: {
    partNumber: string
    title: string
    tamilTitle: string
    marksPerQuestion: number
    totalQuestionsToAnswer: number
    totalQuestionsProvided: number
    hasCompulsory: boolean
    compulsoryQuestionNumber?: number
    hasInternalChoice?: boolean
    instructions: string
    tamilInstructions: string
  }[]
}

export interface ExamQuestion {
  questionNumber: number
  subNumber?: string // 'a' or 'b' for internal choice
  questionText: string
  tamilQuestionText?: string
  marks: number
  chapterId: string
  chapterName: string
  topicName?: string
  isCompulsory?: boolean
  isInternalChoice?: boolean
  orQuestion?: {
    subNumber: string
    questionText: string
    tamilQuestionText?: string
    chapterId: string
    chapterName: string
  }
  options?: string[] // For Part I MCQs
  tamilOptions?: string[]
  correctOptionIndex?: number
  markingSchemeSteps: {
    stepNumber: number
    description: string
    tamilDescription?: string
    marksAllocated: number
  }[]
  sourceTextbook: string
  sourcePage: number
}

export interface ExamPaper {
  id: string
  title: string
  tamilTitle: string
  academicYear: string
  standard: string
  subject: string
  medium: string
  examType: string
  maxMarks: number
  timeAllowed: string
  generalInstructions: string[]
  tamilGeneralInstructions: string[]
  parts: {
    partNumber: string
    title: string
    tamilTitle: string
    marks: number
    instructions: string
    tamilInstructions: string
    questions: ExamQuestion[]
  }[]
  totalMarksCalculated: number
  createdAt: string
}

// In-Memory Exam Paper Store
const examPaperStore = new Map<string, ExamPaper>()

export function getDGEBlueprint(classLevel: string, subjectName: string, examType: string = 'Board'): ExamBlueprint {
  const isHigherSecScience = (classLevel.includes('11') || classLevel.includes('12')) && 
    (subjectName.includes('Physics') || subjectName.includes('Chemistry') || subjectName.includes('Biology'))

  if (isHigherSecScience) {
    // 70 Marks format for Physics / Chemistry / Biology (30 marks practicals)
    return {
      classLevel,
      subjectName,
      examType: examType as any,
      maxMarks: 70,
      durationHours: 3.0,
      parts: [
        {
          partNumber: 'PART - I',
          title: 'Objective Multiple Choice Questions',
          tamilTitle: 'பகுதி - I (சரியான விடையைத் தேர்ந்தெடுத்து எழுதுக)',
          marksPerQuestion: 1,
          totalQuestionsToAnswer: 15,
          totalQuestionsProvided: 15,
          hasCompulsory: false,
          instructions: 'Answer all questions. Each question carries 1 mark.',
          tamilInstructions: 'அனைத்து வினாக்களுக்கும் விடையளிக்கவும். ஒவ்வொரு வினாவிற்கும் 1 மதிப்பெண்.',
        },
        {
          partNumber: 'PART - II',
          title: 'Very Short Answer Questions',
          tamilTitle: 'பகுதி - II (குறுகிய விடையளிக்கும் வினாக்கள்)',
          marksPerQuestion: 2,
          totalQuestionsToAnswer: 6,
          totalQuestionsProvided: 9,
          hasCompulsory: true,
          compulsoryQuestionNumber: 24,
          instructions: 'Answer any 6 questions. Question No. 24 is compulsory.',
          tamilInstructions: 'எவையேனும் 6 வினாக்களுக்கு விடையளிக்கவும். வினா எண் 24 கட்டாய வினாவாகும்.',
        },
        {
          partNumber: 'PART - III',
          title: 'Short Answer Questions',
          tamilTitle: 'பகுதி - III (சுருக்கமான விடையளிக்கும் வினாக்கள்)',
          marksPerQuestion: 3,
          totalQuestionsToAnswer: 6,
          totalQuestionsProvided: 9,
          hasCompulsory: true,
          compulsoryQuestionNumber: 33,
          instructions: 'Answer any 6 questions. Question No. 33 is compulsory.',
          tamilInstructions: 'எவையேனும் 6 வினாக்களுக்கு விடையளிக்கவும். வினா எண் 33 கட்டாய வினாவாகும்.',
        },
        {
          partNumber: 'PART - IV',
          title: 'Long Answer / Derivations',
          tamilTitle: 'பகுதி - IV (விரிவான விடையளிக்கும் வினாக்கள்)',
          marksPerQuestion: 5,
          totalQuestionsToAnswer: 5,
          totalQuestionsProvided: 5,
          hasCompulsory: false,
          hasInternalChoice: true,
          instructions: 'Answer all questions, choosing either (a) or (b) in each question.',
          tamilInstructions: 'அனைத்து வினாக்களுக்கும் (a) அல்லது (b) என்ற அமைப்பில் விடையளிக்கவும்.',
        },
      ],
    }
  }

  // Standard 100 Marks format for Classes 6-10 and Class 11/12 Math & CS
  return {
    classLevel,
    subjectName,
    examType: examType as any,
    maxMarks: 100,
    durationHours: 3.0,
    parts: [
      {
        partNumber: 'PART - I',
        title: 'Choose the Correct Answer',
        tamilTitle: 'பகுதி - I (சரியான விடையைத் தேர்வு செய்க)',
        marksPerQuestion: 1,
        totalQuestionsToAnswer: 14,
        totalQuestionsProvided: 14,
        hasCompulsory: false,
        instructions: 'Answer all the 14 questions. Choose the most appropriate answer from the given four alternatives.',
        tamilInstructions: 'அனைத்து 14 வினாக்களுக்கும் விடையளிக்கவும். கொடுக்கப்பட்டுள்ள நான்கு விடைகளில் மிகவும் பொருத்தமான விடையைத் தேர்வு செய்க.',
      },
      {
        partNumber: 'PART - II',
        title: 'Short Answer Questions',
        tamilTitle: 'பகுதி - II (எவையேனும் 10 வினாக்களுக்கு விடையளிக்கவும்)',
        marksPerQuestion: 2,
        totalQuestionsToAnswer: 10,
        totalQuestionsProvided: 14,
        hasCompulsory: true,
        compulsoryQuestionNumber: 28,
        instructions: 'Answer any 10 questions. Question No. 28 is compulsory.',
        tamilInstructions: 'எவையேனும் 10 வினாக்களுக்கு விடையளிக்கவும். வினா எண் 28 கட்டாய வினாவாகும்.',
      },
      {
        partNumber: 'PART - III',
        title: 'Brief Answer Questions',
        tamilTitle: 'பகுதி - III (எவையேனும் 10 வினாக்களுக்கு விடையளிக்கவும்)',
        marksPerQuestion: 5,
        totalQuestionsToAnswer: 10,
        totalQuestionsProvided: 14,
        hasCompulsory: true,
        compulsoryQuestionNumber: 42,
        instructions: 'Answer any 10 questions. Question No. 42 is compulsory.',
        tamilInstructions: 'எவையேனும் 10 வினாக்களுக்கு விடையளிக்கவும். வினா எண் 42 கட்டாய வினாவாகும்.',
      },
      {
        partNumber: 'PART - IV',
        title: 'Detailed Essay & Problem Solving',
        tamilTitle: 'பகுதி - IV (அனைத்து வினாக்களுக்கும் விடையளிக்கவும்)',
        marksPerQuestion: 8,
        totalQuestionsToAnswer: 2,
        totalQuestionsProvided: 2,
        hasCompulsory: false,
        hasInternalChoice: true,
        instructions: 'Answer both questions. Each question has internal choice (a) OR (b).',
        tamilInstructions: 'இரு வினாக்களுக்கும் விடையளிக்கவும். ஒவ்வொரு வினாவிலும் (a) அல்லது (b) என்ற முறையில் தேர்வு செய்து எழுதுக.',
      },
    ],
  }
}

export async function generateDGEExamPaper(params: {
  classId: string
  subjectId: string
  examType?: string
  academicYear?: string
  medium?: string
}): Promise<ExamPaper> {
  const classItem = memoryStore.classes.find((c) => c.id === params.classId)
  const subjectItem = memoryStore.subjects.find((s) => s.id === params.subjectId)
  const className = classItem?.class_name || 'Class 10'
  const subjectName = subjectItem?.subject_name || 'Science'
  const examType = params.examType || 'Public Board Examination'
  const academicYear = params.academicYear || '2024-2025'
  const medium = params.medium || 'English / தமிழ் (Bilingual)'

  const blueprint = getDGEBlueprint(className, subjectName, examType)
  const readyChapters = memoryStore.chapters.filter(
    (c) => c.subject_id === params.subjectId && c.indexing_status === 'READY'
  )
  const availableChapters = readyChapters.length > 0 ? readyChapters : [
    { id: 'ch-1', chapter_name: `${subjectName} Chapter 1`, chapter_number: 1 },
    { id: 'ch-2', chapter_name: `${subjectName} Chapter 2`, chapter_number: 2 },
    { id: 'ch-3', chapter_name: `${subjectName} Chapter 3`, chapter_number: 3 },
  ]

  let runningQuestionNumber = 1
  const generatedParts = blueprint.parts.map((part) => {
    const questions: ExamQuestion[] = []
    const count = part.totalQuestionsProvided

    for (let i = 0; i < count; i++) {
      const qNum = runningQuestionNumber++
      const chIdx = i % availableChapters.length
      const ch = availableChapters[chIdx]
      const isCompulsory = part.hasCompulsory && qNum === part.compulsoryQuestionNumber
      const isInternalChoice = part.hasInternalChoice || false

      let qText = ''
      let tamText = ''
      let options: string[] | undefined = undefined
      let tamOptions: string[] | undefined = undefined
      let correctIdx: number | undefined = undefined
      let steps: any[] = []
      let orQuestion: any = undefined

      if (part.marksPerQuestion === 1) {
        // 1-Mark MCQ
        qText = `Which of the following statements correctly applies to ${ch.chapter_name}?`
        tamText = `${ch.chapter_name} தொடர்பான கீழ்க்காணும் கூற்றுகளில் எது சரியானது?`
        options = [
          `Fundamental law directly proportional to external applied force`,
          `Constant magnitude with zero change in momentum`,
          `Inverse square relationship under closed thermodynamic equilibrium`,
          `Conserved quantity during isolated physical reactions`,
        ]
        tamOptions = [
          `புறவிசைக்கு நேர்விகிதத்தில் செயல்படும் அடிப்படை விதி`,
          `உந்த மாறுபாடு பூஜ்ஜியமாக உள்ள நிலையான அளவு`,
          `வெப்ப இயக்கவியல் சமநிலையில் எதிர் விகித தொடர்பு`,
          `தனித்த அமைப்பில் மாறாமல் இருக்கும் இயற்பியல் அளவு`,
        ]
        correctIdx = 0
        steps = [
          { stepNumber: 1, description: 'Identification of correct option (a)', tamilDescription: 'சரியான விடை (a) தேர்வு செய்தல்', marksAllocated: 1 },
        ]
      } else if (part.marksPerQuestion === 2) {
        // 2-Mark Short Answer
        qText = isCompulsory 
          ? `[COMPULSORY] State the core mathematical formulation and SI unit for principles in ${ch.chapter_name}.`
          : `Define the primary law in ${ch.chapter_name} and give one practical example.`
        tamText = isCompulsory
          ? `[கட்டாய வினா] ${ch.chapter_name} பாடத்தின் கணிதச் சமன்பாடு மற்றும் SI அலகினை எழுதுக.`
          : `${ch.chapter_name} பாடத்தின் முதன்மை விதியை வரையறுத்து, ஒரு நடைமுறை உதாரணம் தருக.`
        steps = [
          { stepNumber: 1, description: 'Accurate definition / formulation statement', tamilDescription: 'சரியான வரையறை / சூத்திரம்', marksAllocated: 1 },
          { stepNumber: 2, description: 'SI unit / practical real-world example', tamilDescription: 'SI அலகு / நடைமுறை உதாரணம்', marksAllocated: 1 },
        ]
      } else if (part.marksPerQuestion === 3 || part.marksPerQuestion === 5) {
        // 3-Mark or 5-Mark Structured Question
        const m = part.marksPerQuestion
        qText = isCompulsory
          ? `[COMPULSORY] Derive the governing equation for ${ch.chapter_name} and solve for steady-state parameters.`
          : `Explain the experimental verification, diagram, and core concepts of ${ch.chapter_name}.`
        tamText = isCompulsory
          ? `[கட்டாய வினா] ${ch.chapter_name} பாடத்தின் சமன்பாட்டை வருவித்து, அதன் மாறிலிகளை கணக்கிடுக.`
          : `${ch.chapter_name} பாடத்தின் செய்முறை ஆய்வு, படம் மற்றும் அடிப்படைக் கருத்துக்களை விளக்குக.`
        steps = [
          { stepNumber: 1, description: 'Conceptual introduction & formula statement', tamilDescription: 'கோட்பாட்டு விளக்கம் & சூத்திரம்', marksAllocated: 1 },
          { stepNumber: 2, description: 'Neat labeled diagram / derivation steps', tamilDescription: 'தெளிவான பெயரிடப்பட்ட படம் / வருவித்தல் படிகள்', marksAllocated: Math.floor(m / 2) },
          { stepNumber: 3, description: 'Final result, units & key inferences', tamilDescription: 'இறுதி முடிவு, அலகுகள் மற்றும் முடிவுகள்', marksAllocated: m - 1 - Math.floor(m / 2) },
        ]
      } else {
        // 8-Mark / 7-Mark Essay with Internal Choice ("Either / Or")
        const m = part.marksPerQuestion
        const altCh = availableChapters[(chIdx + 1) % availableChapters.length]
        qText = `(a) Describe in detail the comprehensive theoretical framework, principles, and applications of ${ch.chapter_name}.`
        tamText = `(a) ${ch.chapter_name} பாடத்தின் விரிவான கோட்பாடு, விதிகள் மற்றும் பயன்பாடுகளை விவரிக்க.`
        orQuestion = {
          subNumber: 'b',
          questionText: `(b) Detail the complete experimental methodology, observations, precautions, and problem-solving steps in ${altCh.chapter_name}.`,
          tamilQuestionText: `(b) ${altCh.chapter_name} பாடத்தின் முழுமையான ஆய்வு முறை, அவதானிப்புகள் மற்றும் கணக்குகளை விவரிக்க.`,
          chapterId: altCh.id,
          chapterName: altCh.chapter_name,
        }
        steps = [
          { stepNumber: 1, description: 'Definition, principle & background context', tamilDescription: 'வரையறை, தத்துவம் மற்றும் பின்னணி', marksAllocated: 2 },
          { stepNumber: 2, description: 'Neat labeled diagram / schematic model', tamilDescription: 'பெயரிடப்பட்ட வரைபடம் / வரைபடம் வரைதல்', marksAllocated: 2 },
          { stepNumber: 3, description: 'Analytical derivation / experimental procedure', tamilDescription: 'வருவித்தல் படிகள் / ஆய்வு செய்முறை', marksAllocated: 3 },
          { stepNumber: 4, description: 'Final inferences & practical applications', tamilDescription: 'முடிவுகள் மற்றும் பயன்கள்', marksAllocated: m - 7 },
        ]
      }

      questions.push({
        questionNumber: qNum,
        questionText: qText,
        tamilQuestionText: tamText,
        marks: part.marksPerQuestion,
        chapterId: ch.id,
        chapterName: ch.chapter_name,
        isCompulsory,
        isInternalChoice,
        orQuestion,
        options,
        tamilOptions: tamOptions,
        correctOptionIndex: correctIdx,
        markingSchemeSteps: steps,
        sourceTextbook: `Tamil Nadu State Board ${className} ${subjectName} (Samacheer Kalvi)`,
        sourcePage: (i * 3) + 1,
      })
    }

    return {
      partNumber: part.partNumber,
      title: part.title,
      tamilTitle: part.tamilTitle,
      marks: part.totalQuestionsToAnswer * part.marksPerQuestion,
      instructions: part.instructions,
      tamilInstructions: part.tamilInstructions,
      questions,
    }
  })

  const totalMarksCalculated = generatedParts.reduce((acc, p) => acc + p.marks, 0)
  const paperId = `exam-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`

  const examPaper: ExamPaper = {
    id: paperId,
    title: `GOVERNMENT OF TAMIL NADU — DIRECTORATE OF GOVERNMENT EXAMINATIONS`,
    tamilTitle: `தமிழ்நாடு அரசு — அரசுத் தேர்வுகள் இயக்ககம்`,
    academicYear,
    standard: className,
    subject: subjectName,
    medium,
    examType,
    maxMarks: blueprint.maxMarks,
    timeAllowed: `${blueprint.durationHours} Hours (Including 15 Minutes Reading Time)`,
    generalInstructions: [
      'Check the question paper for fairness of printing. If there is any lack of fairness, inform the Hall Supervisor immediately.',
      'Use Blue or Black ink to write and underline, and pencil to draw diagrams.',
      'Candidate must write their Roll Number on the top right corner of the question paper.',
    ],
    tamilGeneralInstructions: [
      'அனைத்து வினாக்களும் சரியாக அச்சிடப்பட்டுள்ளதா என்பதை சரிபார்த்துக் கொள்ளவும். அச்சுப்பதிவில் ஏதேனும் குறைபாடிருப்பின், அறைக் கண்காணிப்பாளரிடம் உடனடியாகத் தெரிவிக்கவும்.',
      'நீலம் அல்லது கருப்பு மையினை மட்டுமே எழுதுவதற்கும் அடிக்கோடிடுவதற்கும் பயன்படுத்த வேண்டும். படங்கள் வரைவதற்கு பென்சில் பயன்படுத்தவும்.',
      'தேர்வர்கள் தங்களது பதிவெண்ணை வினாத்தாளின் வலது மேல் மூலையில் எழுத வேண்டும்.',
    ],
    parts: generatedParts,
    totalMarksCalculated,
    createdAt: new Date().toISOString(),
  }

  examPaperStore.set(paperId, examPaper)
  return examPaper
}

export function getExamPaperById(paperId: string): ExamPaper | undefined {
  return examPaperStore.get(paperId)
}

export function listAllGeneratedExamPapers(): ExamPaper[] {
  return Array.from(examPaperStore.values())
}
