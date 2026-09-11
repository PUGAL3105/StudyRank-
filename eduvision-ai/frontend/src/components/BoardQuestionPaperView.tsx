import React, { useState, useEffect } from 'react'
import {
  generateBoardQuestionPaper,
  OFFICIAL_QUESTION_PAPERS_REGISTRY,
  BoardModelQuestionPaper,
} from '../data/boardQuestionBank'
import {
  FileText,
  Printer,
  Eye,
  EyeOff,
  Copy,
  Check,
  BookOpen,
  Sparkles,
} from 'lucide-react'

interface Props {
  selectedClassId: 'c-9' | 'c-10' | 'c-11' | 'c-12'
  selectedSubjectId: string
}

type PaperCategory = 'ALL' | 'PUBLIC' | 'CENTUM' | 'HALFYEARLY' | 'QUARTERLY' | 'PTA' | 'REVISION'

const CLASS_SUBJECTS_MAP: Record<string, Array<{ id: string; name: string; icon: string }>> = {
  'c-12': [
    { id: 'sub-12-bio', name: 'Biology', icon: '🧬' },
    { id: 'sub-12-phy', name: 'Physics', icon: '⚡' },
    { id: 'sub-12-chem', name: 'Chemistry', icon: '🧪' },
    { id: 'sub-12-math', name: 'Mathematics', icon: '📐' },
    { id: 'sub-12-cs', name: 'Computer Science', icon: '💻' },
    { id: 'sub-12-tam', name: 'General Tamil', icon: '📜' },
    { id: 'sub-12-eng', name: 'General English', icon: '📖' },
    { id: 'sub-12-acc', name: 'Accountancy', icon: '📊' },
    { id: 'sub-12-com', name: 'Commerce', icon: '💼' },
    { id: 'sub-12-eco', name: 'Economics', icon: '📈' },
  ],
  'c-11': [
    { id: 'sub-11-bio', name: 'Biology', icon: '🧬' },
    { id: 'sub-11-phy', name: 'Physics', icon: '⚡' },
    { id: 'sub-11-chem', name: 'Chemistry', icon: '🧪' },
    { id: 'sub-11-math', name: 'Mathematics', icon: '📐' },
    { id: 'sub-11-cs', name: 'Computer Science', icon: '💻' },
    { id: 'sub-11-tam', name: 'General Tamil', icon: '📜' },
    { id: 'sub-11-eng', name: 'General English', icon: '📖' },
    { id: 'sub-11-acc', name: 'Accountancy', icon: '📊' },
    { id: 'sub-11-com', name: 'Commerce', icon: '💼' },
    { id: 'sub-11-eco', name: 'Economics', icon: '📈' },
  ],
  'c-10': [
    { id: 'sub-10-sci', name: 'Science', icon: '🔬' },
    { id: 'sub-10-math', name: 'Mathematics', icon: '📐' },
    { id: 'sub-10-soc', name: 'Social Science', icon: '🌍' },
    { id: 'sub-10-tam', name: 'Tamil', icon: '📜' },
    { id: 'sub-10-eng', name: 'English', icon: '📖' },
  ],
  'c-9': [
    { id: 'sub-9-sci', name: 'Science', icon: '🔬' },
    { id: 'sub-9-math', name: 'Mathematics', icon: '📐' },
    { id: 'sub-9-soc', name: 'Social Science', icon: '🌍' },
    { id: 'sub-9-tam', name: 'Tamil', icon: '📜' },
    { id: 'sub-9-eng', name: 'English', icon: '📖' },
  ],
}

export const BoardQuestionPaperView: React.FC<Props> = ({
  selectedClassId,
  selectedSubjectId,
}) => {
  const [selectedSetNumber, setSelectedSetNumber] = useState<number>(1)
  const [totalMarks, setTotalMarks] = useState<50 | 100>(100)
  const [showAnswerKey, setShowAnswerKey] = useState<boolean>(false)
  const [copied, setCopied] = useState<boolean>(false)
  const [activeCategory, setActiveCategory] = useState<PaperCategory>('ALL')

  const availableSubjects = CLASS_SUBJECTS_MAP[selectedClassId] || CLASS_SUBJECTS_MAP['c-12']
  
  const [currentSubjectId, setCurrentSubjectId] = useState<string>(() => {
    if (selectedSubjectId && selectedSubjectId !== 'ALL') return selectedSubjectId
    return availableSubjects[0]?.id || 'sub-12-bio'
  })

  useEffect(() => {
    if (selectedSubjectId && selectedSubjectId !== 'ALL') {
      setCurrentSubjectId(selectedSubjectId)
    }
  }, [selectedSubjectId])

  useEffect(() => {
    const subjects = CLASS_SUBJECTS_MAP[selectedClassId] || []
    if (!subjects.some(s => s.id === currentSubjectId)) {
      setCurrentSubjectId(subjects[0]?.id || 'sub-12-bio')
    }
  }, [selectedClassId])

  const paper: BoardModelQuestionPaper = generateBoardQuestionPaper(
    selectedClassId,
    currentSubjectId,
    totalMarks,
    selectedSetNumber
  )

  const handlePrint = () => {
    window.print()
  }

  const handleCopyPaper = () => {
    let text = `${paper.examHeader}\n${paper.title}\nTime: ${paper.timeAllowed} | Max Marks: ${paper.totalMarks}\n\n`
    text += `GENERAL INSTRUCTIONS:\n`
    paper.generalInstructions.forEach((inst, i) => {
      text += `${i + 1}. ${inst}\n`
    })

    text += `\n${paper.part1.sectionTitle}\n${paper.part1.instruction}\n\n`
    paper.part1.questions.forEach((q) => {
      text += `${q.qNo}. ${q.question}\n`
      q.options.forEach((opt, oi) => {
        text += `   (${String.fromCharCode(97 + oi)}) ${opt}\n`
      })
      text += `\n`
    })

    text += `\n${paper.part2.sectionTitle}\n${paper.part2.instruction}\n\n`
    paper.part2.questions.forEach((q) => {
      text += `${q.qNo}. ${q.question}\n\n`
    })

    text += `\n${paper.part3.sectionTitle}\n${paper.part3.instruction}\n\n`
    paper.part3.questions.forEach((q) => {
      text += `${q.qNo}. ${q.question}\n\n`
    })

    text += `\n${paper.part4.sectionTitle}\n${paper.part4.instruction}\n\n`
    paper.part4.questions.forEach((q) => {
      text += `${q.qNo}. (a) ${q.choiceA.question}\n       [OR]\n   (b) ${q.choiceB.question}\n\n`
    })

    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Filter papers based on category tab
  const filteredPapers = OFFICIAL_QUESTION_PAPERS_REGISTRY.filter((p) => {
    if (activeCategory === 'ALL') return true
    if (activeCategory === 'PUBLIC') return p.badge === 'Public Exam' || p.badge === 'Supplementary'
    if (activeCategory === 'CENTUM') return p.badge === 'DGE Centum'
    if (activeCategory === 'HALFYEARLY') return p.badge === 'Half-Yearly'
    if (activeCategory === 'QUARTERLY') return p.badge === 'Quarterly'
    if (activeCategory === 'PTA') return p.badge === 'PTA Model'
    if (activeCategory === 'REVISION') return p.badge === 'Pre-Public' || p.badge === 'Master Set'
    return true
  })

  return (
    <div className="space-y-6">
      {/* Non-printable Control Toolbar & Paper Catalog */}
      <div className="print:hidden bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-sm space-y-5">
        
        {/* Hub Header & Action Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-200 shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  Official State Board Question Paper Hub
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                  27+ Sets / Subject
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Authentic DGE Tamil Nadu Model Question Papers (50M & 100M with Rubrics & PDF Print)
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowAnswerKey(!showAnswerKey)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition ${
                showAnswerKey
                  ? 'bg-amber-50 text-amber-700 border-amber-300'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
              }`}
            >
              {showAnswerKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{showAnswerKey ? 'Hide Answer Key' : 'Show Answer Key & Rubrics'}</span>
            </button>

            <button
              onClick={handleCopyPaper}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied!' : 'Copy Paper'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition"
            >
              <Printer className="w-4 h-4" />
              <span>Download PDF / Print</span>
            </button>
          </div>
        </div>

        {/* ── SUBJECT SELECTION BAR (20+ PAPERS PER SUBJECT) ── */}
        <div className="space-y-2 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Select Subject for 27+ Model Question Papers:
            </span>
            <span className="text-[11px] text-indigo-600 font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {availableSubjects.length} Subjects with 27 Sets Each
            </span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
            {availableSubjects.map((sub) => {
              const isSelected = sub.id === currentSubjectId
              return (
                <button
                  key={sub.id}
                  onClick={() => setCurrentSubjectId(sub.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <span>{sub.icon}</span>
                  <span>{sub.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    27 Sets
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Paper Pattern & Subject Info Bar */}
        <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-gray-700">Marks Pattern:</span>
            <div className="inline-flex rounded-xl bg-gray-100 p-1">
              <button
                onClick={() => setTotalMarks(50)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                  totalMarks === 50
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                50 Marks (1h 30m Unit / Midterm)
              </button>
              <button
                onClick={() => setTotalMarks(100)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                  totalMarks === 100
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                100 Marks (3h 00m Public Board Pattern)
              </button>
            </div>
          </div>

          <div className="text-xs text-gray-500 font-medium">
            Active Subject: <strong className="text-indigo-700">{paper.className} — {paper.subjectName}</strong> (Set {selectedSetNumber} of 27)
          </div>
        </div>

        {/* ───────────────────────────────────────────────────────────────── */}
        {/* 27+ QUESTION PAPER SELECTOR CATALOG                               */}
        {/* ───────────────────────────────────────────────────────────────── */}
        <div className="space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                Select Model Question Paper Set ({OFFICIAL_QUESTION_PAPERS_REGISTRY.length} Available)
              </h3>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-[11px] font-semibold">
              <button
                onClick={() => setActiveCategory('ALL')}
                className={`px-2.5 py-1 rounded-lg transition shrink-0 ${
                  activeCategory === 'ALL'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All Sets (27)
              </button>
              <button
                onClick={() => setActiveCategory('PUBLIC')}
                className={`px-2.5 py-1 rounded-lg transition shrink-0 ${
                  activeCategory === 'PUBLIC'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Public Exams (1–5)
              </button>
              <button
                onClick={() => setActiveCategory('CENTUM')}
                className={`px-2.5 py-1 rounded-lg transition shrink-0 ${
                  activeCategory === 'CENTUM'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                DGE Centum (6–10)
              </button>
              <button
                onClick={() => setActiveCategory('HALFYEARLY')}
                className={`px-2.5 py-1 rounded-lg transition shrink-0 ${
                  activeCategory === 'HALFYEARLY'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Half-Yearly (11–15)
              </button>
              <button
                onClick={() => setActiveCategory('QUARTERLY')}
                className={`px-2.5 py-1 rounded-lg transition shrink-0 ${
                  activeCategory === 'QUARTERLY'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Quarterly (16–20)
              </button>
              <button
                onClick={() => setActiveCategory('PTA')}
                className={`px-2.5 py-1 rounded-lg transition shrink-0 ${
                  activeCategory === 'PTA'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                PTA Sets (21–25)
              </button>
              <button
                onClick={() => setActiveCategory('REVISION')}
                className={`px-2.5 py-1 rounded-lg transition shrink-0 ${
                  activeCategory === 'REVISION'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Revision (26–27)
              </button>
            </div>
          </div>

          {/* Paper Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto pr-1 p-1 border border-gray-100 rounded-xl bg-gray-50/50">
            {filteredPapers.map((p) => {
              const isSelected = selectedSetNumber === p.setNumber
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedSetNumber(p.setNumber)}
                  className={`p-3 rounded-xl text-left border transition flex flex-col justify-between gap-2 ${
                    isSelected
                      ? 'bg-indigo-50/90 border-indigo-500 shadow-xs ring-2 ring-indigo-500/20'
                      : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">
                        Set {p.setNumber}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                          p.badge.includes('Public')
                            ? 'bg-emerald-100 text-emerald-800'
                            : p.badge.includes('Centum')
                            ? 'bg-purple-100 text-purple-800'
                            : p.badge.includes('PTA')
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {p.badge}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-gray-900 line-clamp-1">
                      {p.title}
                    </h4>
                    <p className="text-[11px] text-gray-500 line-clamp-1">
                      {p.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1 border-t border-gray-100">
                    <span>{p.year}</span>
                    <span className="font-semibold text-indigo-600">{p.tag}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* AUTHENTIC STATE BOARD QUESTION PAPER PRINTABLE SHEET               */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-300 shadow-md p-6 sm:p-12 print:p-0 print:border-0 print:shadow-none font-serif text-gray-900 max-w-4xl mx-auto">
        
        {/* Official Header */}
        <div className="border-b-2 border-gray-800 pb-4 mb-6 text-center space-y-1">
          <div className="flex justify-between items-start text-xs font-sans font-bold text-gray-700 mb-2">
            <span>Roll No: [ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ]</span>
            <span>Paper Set: <strong>{paper.setNumber}</strong> / 27</span>
          </div>

          <div className="w-12 h-12 mx-auto mb-1 bg-gray-100 rounded-full flex items-center justify-center border border-gray-300 font-sans font-bold text-xs">
            TN DGE
          </div>
          <p className="text-xs font-sans uppercase tracking-widest font-bold text-gray-600 whitespace-pre-line">
            {paper.examHeader}
          </p>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 uppercase pt-1">
            {paper.className} — {paper.subjectName}
          </h1>
          <p className="text-xs font-sans font-semibold text-indigo-700">
            {paper.title}
          </p>

          <div className="flex justify-between items-center text-xs font-sans font-bold pt-2 border-t border-gray-200 mt-3">
            <span>Time Allowed: {paper.timeAllowed}</span>
            <span>Maximum Marks: {paper.totalMarks}</span>
          </div>
        </div>

        {/* General Instructions */}
        <div className="bg-gray-50 print:bg-transparent border border-gray-200 print:border-gray-400 rounded-xl p-4 mb-8 text-xs font-sans space-y-1.5">
          <p className="font-bold text-gray-800 uppercase tracking-wide">Instructions / விதிகள்:</p>
          {paper.generalInstructions.map((inst, i) => (
            <p key={i} className="text-gray-700 leading-relaxed">
              ({i + 1}) {inst}
            </p>
          ))}
        </div>

        {/* PART – I (1-Mark MCQs) */}
        <div className="mb-10 space-y-4">
          <div className="border-b border-gray-400 pb-1 flex justify-between items-center">
            <h2 className="text-sm font-bold uppercase tracking-wide">{paper.part1.sectionTitle}</h2>
            <span className="text-xs font-sans font-semibold text-gray-600">All questions compulsory</span>
          </div>
          <p className="text-xs font-sans italic text-gray-600">{paper.part1.instruction}</p>

          <div className="space-y-4 pt-2">
            {paper.part1.questions.map((q) => (
              <div key={q.qNo} className="text-sm space-y-1.5">
                <p className="font-semibold text-gray-900 leading-snug">
                  {q.qNo}. {q.question}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 pl-4 text-xs font-sans">
                  {q.options.map((opt, oi) => (
                    <div
                      key={oi}
                      className={`py-0.5 ${
                        showAnswerKey && oi === q.answerIndex
                          ? 'font-bold text-emerald-800 bg-emerald-50 px-1 rounded'
                          : 'text-gray-800'
                      }`}
                    >
                      ({String.fromCharCode(97 + oi)}) {opt}
                    </div>
                  ))}
                </div>
                {showAnswerKey && (
                  <div className="mt-1 pl-4 text-xs font-sans text-emerald-700 bg-emerald-50/70 p-1.5 rounded border border-emerald-200">
                    <strong>Correct Answer:</strong> ({String.fromCharCode(97 + q.answerIndex)}) {q.options[q.answerIndex]} — <em>{q.exp}</em>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* PART – II (2-Mark Questions) */}
        <div className="mb-10 space-y-4">
          <div className="border-b border-gray-400 pb-1 flex justify-between items-center">
            <h2 className="text-sm font-bold uppercase tracking-wide">{paper.part2.sectionTitle}</h2>
            <span className="text-xs font-sans font-semibold text-gray-600">
              Q.No. {paper.part2.compulsoryQNo} is Compulsory
            </span>
          </div>
          <p className="text-xs font-sans italic text-gray-600">{paper.part2.instruction}</p>

          <div className="space-y-4 pt-2">
            {paper.part2.questions.map((q) => (
              <div key={q.qNo} className="text-sm space-y-1.5">
                <p className="font-semibold text-gray-900 leading-snug">
                  {q.qNo}. {q.question}
                  {q.qNo === paper.part2.compulsoryQNo && (
                    <span className="ml-2 px-1.5 py-0.5 bg-amber-100 text-amber-800 font-sans text-[10px] font-bold rounded">
                      Compulsory
                    </span>
                  )}
                </p>
                {showAnswerKey && (
                  <div className="mt-1 pl-4 text-xs font-sans bg-gray-50 p-2.5 rounded-lg border border-gray-200 space-y-1">
                    <p className="text-gray-800">
                      <strong>Model Answer:</strong> {q.answer}
                    </p>
                    {q.keyPoints?.length > 0 && (
                      <p className="text-gray-600 text-[11px]">
                        <strong>Key Rubric Points (1 Mark each):</strong> {q.keyPoints.join(' • ')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* PART – III (3-Mark Questions) */}
        <div className="mb-10 space-y-4">
          <div className="border-b border-gray-400 pb-1 flex justify-between items-center">
            <h2 className="text-sm font-bold uppercase tracking-wide">{paper.part3.sectionTitle}</h2>
            <span className="text-xs font-sans font-semibold text-gray-600">
              Q.No. {paper.part3.compulsoryQNo} is Compulsory
            </span>
          </div>
          <p className="text-xs font-sans italic text-gray-600">{paper.part3.instruction}</p>

          <div className="space-y-4 pt-2">
            {paper.part3.questions.map((q) => (
              <div key={q.qNo} className="text-sm space-y-1.5">
                <p className="font-semibold text-gray-900 leading-snug">
                  {q.qNo}. {q.question}
                  {q.qNo === paper.part3.compulsoryQNo && (
                    <span className="ml-2 px-1.5 py-0.5 bg-amber-100 text-amber-800 font-sans text-[10px] font-bold rounded">
                      Compulsory
                    </span>
                  )}
                </p>
                {showAnswerKey && (
                  <div className="mt-1 pl-4 text-xs font-sans bg-gray-50 p-2.5 rounded-lg border border-gray-200 space-y-1">
                    <p className="text-gray-800">
                      <strong>Model Answer:</strong> {q.answer}
                    </p>
                    {q.keyPoints?.length > 0 && (
                      <p className="text-gray-600 text-[11px]">
                        <strong>Key Rubric Points (1 Mark each):</strong> {q.keyPoints.join(' • ')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* PART – IV (5-Mark Questions with Either/Or choice) */}
        <div className="mb-10 space-y-4">
          <div className="border-b border-gray-400 pb-1 flex justify-between items-center">
            <h2 className="text-sm font-bold uppercase tracking-wide">{paper.part4.sectionTitle}</h2>
            <span className="text-xs font-sans font-semibold text-gray-600">Either / Or Choice</span>
          </div>
          <p className="text-xs font-sans italic text-gray-600">{paper.part4.instruction}</p>

          <div className="space-y-6 pt-2">
            {paper.part4.questions.map((q) => (
              <div key={q.qNo} className="text-sm space-y-3 bg-gray-50/50 print:bg-transparent p-3 rounded-xl border border-gray-200 print:border-0 print:p-0">
                <div>
                  <p className="font-semibold text-gray-900 leading-snug">
                    {q.qNo}. (a) {q.choiceA.question}
                  </p>
                  {showAnswerKey && (
                    <div className="mt-1 pl-4 text-xs font-sans bg-white p-2 rounded border border-gray-200">
                      <p className="text-gray-800"><strong>Answer (a):</strong> {q.choiceA.answer}</p>
                    </div>
                  )}
                </div>

                <div className="text-center font-sans font-bold text-xs text-gray-500 uppercase tracking-widest">
                  — [ OR / அல்லது ] —
                </div>

                <div>
                  <p className="font-semibold text-gray-900 leading-snug">
                    {q.qNo}. (b) {q.choiceB.question}
                  </p>
                  {showAnswerKey && (
                    <div className="mt-1 pl-4 text-xs font-sans bg-white p-2 rounded border border-gray-200">
                      <p className="text-gray-800"><strong>Answer (b):</strong> {q.choiceB.answer}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* End of Question Paper Footer */}
        <div className="border-t border-gray-400 pt-4 text-center text-xs font-sans font-semibold text-gray-500 uppercase tracking-wider">
          ★★★ END OF QUESTION PAPER — ALL THE BEST ★★★
        </div>

      </div>
    </div>
  )
}

export default BoardQuestionPaperView
