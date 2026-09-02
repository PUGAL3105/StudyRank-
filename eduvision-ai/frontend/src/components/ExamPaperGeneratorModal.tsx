import React, { useState, useEffect } from 'react'
import {
  FileText,
  Printer,
  CheckCircle2,
  X,
  Sparkles,
} from 'lucide-react'
import axios from 'axios'

interface ExamPaperGeneratorModalProps {
  isOpen: boolean
  onClose: () => void
}

export const ExamPaperGeneratorModal: React.FC<ExamPaperGeneratorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedClass, setSelectedClass] = useState('c-10')
  const [selectedSubject, setSelectedSubject] = useState('sub-10-sci')
  const [examType, setExamType] = useState('Public Board Examination')
  const [academicYear] = useState('2024-2025')
  const [activeTab, setActiveTab] = useState<'paper' | 'marking_scheme'>('paper')
  const [loading, setLoading] = useState(false)
  const [generatedPaper, setGeneratedPaper] = useState<any>(null)
  const [markingScheme, setMarkingScheme] = useState<any>(null)
  const [classesList, setClassesList] = useState<any[]>([])
  const [subjectsList, setSubjectsList] = useState<any[]>([])

  useEffect(() => {
    if (isOpen) {
      fetchCurriculum()
    }
  }, [isOpen])

  useEffect(() => {
    if (selectedClass && classesList.length > 0) {
      fetchSubjects(selectedClass)
    }
  }, [selectedClass, classesList])

  const fetchCurriculum = async () => {
    try {
      const res = await axios.get('/api/curriculum/classes')
      if (res.data?.success) {
        setClassesList(res.data.data)
      }
    } catch (e) {
      // Fallback
      setClassesList([
        { id: 'c-6', class_name: 'Class 6' },
        { id: 'c-7', class_name: 'Class 7' },
        { id: 'c-8', class_name: 'Class 8' },
        { id: 'c-9', class_name: 'Class 9' },
        { id: 'c-10', class_name: 'Class 10' },
        { id: 'c-11', class_name: 'Class 11' },
        { id: 'c-12', class_name: 'Class 12' },
      ])
    }
  }

  const fetchSubjects = async (clsId: string) => {
    try {
      const res = await axios.get(`/api/curriculum/classes/${clsId}/subjects`)
      if (res.data?.success) {
        setSubjectsList(res.data.data)
        if (res.data.data.length > 0) {
          setSelectedSubject(res.data.data[0].id)
        }
      }
    } catch (e) {
      setSubjectsList([
        { id: `sub-${clsId}-sci`, subject_name: 'Science' },
        { id: `sub-${clsId}-math`, subject_name: 'Mathematics' },
      ])
    }
  }

  const handleGeneratePaper = async () => {
    setLoading(true)
    try {
      const res = await axios.post('/api/exams/generate', {
        classId: selectedClass,
        subjectId: selectedSubject,
        examType,
        academicYear,
      })

      if (res.data?.success) {
        setGeneratedPaper(res.data.data)
        // Also fetch marking scheme
        const msRes = await axios.get(`/api/exams/${res.data.data.id}/marking-scheme`)
        if (msRes.data?.success) {
          setMarkingScheme(msRes.data.data)
        }
      }
    } catch (err: any) {
      console.error('Failed to generate exam paper:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <FileText className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">Tamil Nadu DGE Exam Paper & Blueprint Generator</h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-400/20 text-amber-200 border border-amber-300/30">
                  Official Samacheer Kalvi
                </span>
              </div>
              <p className="text-xs text-blue-100/90 font-tamil">
                அரசுத் தேர்வுகள் இயக்ககம் — மாதிரி வினாத்தாள் & மதிப்பெண் பங்கீடு
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Configuration Bar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Standard / Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-2 font-medium text-slate-800 dark:text-slate-100"
            >
              {classesList.map((c) => (
                <option key={c.id} value={c.id}>{c.class_name || `Class ${c.class_number}`}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-2 font-medium text-slate-800 dark:text-slate-100"
            >
              {subjectsList.map((s) => (
                <option key={s.id} value={s.id}>{s.subject_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Exam Category</label>
            <select
              value={examType}
              onChange={(e) => setExamType(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-2 font-medium text-slate-800 dark:text-slate-100"
            >
              <option value="Public Board Examination">Public Board Examination</option>
              <option value="Quarterly Examination">Quarterly Examination (காலாண்டு)</option>
              <option value="Half-Yearly Examination">Half-Yearly Examination (அரையாண்டு)</option>
              <option value="First Revision Test">First Revision Test (முதல் திருப்புதல்)</option>
              <option value="Second Revision Test">Second Revision Test (இரண்டாம் திருப்புதல்)</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleGeneratePaper}
              disabled={loading}
              className="w-full py-2 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-xs font-bold shadow-md hover:shadow-lg flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  Generate Exam Paper
                </>
              )}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100 dark:bg-slate-950">
          {!generatedPaper ? (
            <div className="py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4 border border-blue-200 dark:border-blue-800">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
                Configure & Generate Official State Board Exam Papers
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
                Generates authentic 100-mark and 70-mark question papers strictly adhering to the Directorate of Government Examinations (DGE) Tamil Nadu blueprints with step-by-step marking schemes.
              </p>
              <button
                onClick={handleGeneratePaper}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-lg"
              >
                Generate Model Exam Paper Now
              </button>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-4">
              {/* Paper Actions & Tabs */}
              <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm print:hidden">
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setActiveTab('paper')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                      activeTab === 'paper'
                        ? 'bg-blue-600 text-white shadow'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Question Paper (வினாத்தாள்)
                  </button>
                  <button
                    onClick={() => setActiveTab('marking_scheme')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                      activeTab === 'marking_scheme'
                        ? 'bg-purple-600 text-white shadow'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-300" />
                    Marking Scheme & Keys (விடைக்குறிப்பு)
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print / Export PDF
                  </button>
                </div>
              </div>

              {/* Printable Paper Canvas */}
              <div className="bg-white text-slate-900 p-8 rounded-2xl border border-slate-300 shadow-md print:border-0 print:shadow-none print:p-0">
                {/* DGE Exam Header */}
                <div className="text-center pb-4 border-b-2 border-slate-900 mb-6">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-2">
                    <span>Roll No. / பதிவெண் : ________________</span>
                    <span>No. of Printed Pages : 4</span>
                  </div>
                  <h1 className="text-base font-extrabold tracking-wide uppercase">{generatedPaper.title}</h1>
                  <h2 className="text-sm font-bold font-tamil text-slate-800 mb-2">{generatedPaper.tamilTitle}</h2>
                  <div className="text-sm font-extrabold uppercase bg-slate-100 py-1 rounded border border-slate-300 my-2">
                    {generatedPaper.examType} — {generatedPaper.academicYear}
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold px-2 pt-2">
                    <span>{generatedPaper.standard} — {generatedPaper.subject}</span>
                    <span>Time Allowed: {generatedPaper.timeAllowed}</span>
                    <span>Maximum Marks: {generatedPaper.maxMarks}</span>
                  </div>
                </div>

                {/* Instructions */}
                <div className="mb-6 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-700 space-y-1">
                  <p className="font-bold text-slate-900">General Instructions / பொதுவான வழிமுறைகள்:</p>
                  <ol className="list-decimal pl-4 space-y-1">
                    {generatedPaper.generalInstructions.map((inst: string, idx: number) => (
                      <li key={idx}>
                        <span>{inst}</span>
                        <div className="text-[11px] text-slate-600 font-tamil mt-0.5">{generatedPaper.tamilGeneralInstructions[idx]}</div>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* TAB 1: QUESTION PAPER */}
                {activeTab === 'paper' && (
                  <div className="space-y-8">
                    {generatedPaper.parts.map((part: any, pIdx: number) => (
                      <div key={pIdx} className="space-y-4">
                        <div className="bg-slate-100 p-2.5 rounded border border-slate-300 flex justify-between items-center">
                          <div>
                            <span className="font-extrabold text-sm text-slate-900 mr-2">{part.partNumber}</span>
                            <span className="text-xs font-bold text-slate-700">{part.title}</span>
                            <div className="text-[11px] font-tamil text-slate-600">{part.tamilTitle}</div>
                          </div>
                          <span className="font-extrabold text-xs bg-white px-2 py-1 rounded border border-slate-300">
                            Marks: {part.marks}
                          </span>
                        </div>

                        <p className="text-xs italic text-slate-600 font-medium">
                          {part.instructions}
                          <span className="block text-[11px] font-tamil text-slate-500 mt-0.5">{part.tamilInstructions}</span>
                        </p>

                        <div className="space-y-3.5 pl-1">
                          {part.questions.map((q: any) => (
                            <div key={q.questionNumber} className="text-xs space-y-1.5">
                              <div className="flex justify-between items-start gap-4">
                                <div className="font-medium text-slate-900 leading-relaxed">
                                  <span className="font-bold mr-1.5">{q.questionNumber}.</span>
                                  {q.questionText}
                                  {q.isCompulsory && (
                                    <span className="ml-2 px-1.5 py-0.5 bg-red-100 text-red-700 font-bold text-[10px] rounded border border-red-200">
                                      COMPULSORY
                                    </span>
                                  )}
                                  <div className="text-[11px] font-tamil text-slate-700 mt-0.5 ml-4">
                                    {q.tamilQuestionText}
                                  </div>
                                </div>
                                <span className="font-bold text-slate-700 text-xs shrink-0">[{q.marks}]</span>
                              </div>

                              {/* MCQ Options */}
                              {q.options && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-4 pt-1">
                                  {q.options.map((opt: string, optIdx: number) => {
                                    const letter = String.fromCharCode(97 + optIdx)
                                    return (
                                      <div key={optIdx} className="text-[11px] text-slate-800">
                                        <span className="font-bold mr-1">({letter})</span> {opt}
                                        {q.tamilOptions && q.tamilOptions[optIdx] && (
                                          <div className="text-[10px] font-tamil text-slate-600 ml-4">
                                            {q.tamilOptions[optIdx]}
                                          </div>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              )}

                              {/* Internal Choice ("Either / Or") */}
                              {q.orQuestion && (
                                <div className="pl-4 pt-2 space-y-2">
                                  <div className="text-center font-bold text-xs text-slate-500 uppercase tracking-widest my-1">
                                    [ OR / அல்லது ]
                                  </div>
                                  <div className="font-medium text-slate-900 leading-relaxed">
                                    {q.orQuestion.questionText}
                                    <div className="text-[11px] font-tamil text-slate-700 mt-0.5 ml-4">
                                      {q.orQuestion.tamilQuestionText}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* TAB 2: STEP-BY-STEP MARKING SCHEME */}
                {activeTab === 'marking_scheme' && markingScheme && (
                  <div className="space-y-6">
                    <div className="bg-purple-50 border border-purple-200 p-3 rounded-lg text-xs text-purple-900 font-medium">
                      <div className="font-bold text-sm text-purple-950 mb-0.5">Official Directorate Marking Scheme & Step Allocation</div>
                      This scheme outlines point-by-point valuation keys and exact Samacheer Kalvi textbook source citations for examiners.
                    </div>

                    {markingScheme.parts.map((part: any, pIdx: number) => (
                      <div key={pIdx} className="space-y-3">
                        <h4 className="font-bold text-xs bg-slate-100 p-2 rounded border border-slate-200 text-slate-800">
                          {part.partNumber}: {part.title} (Marks: {part.marks})
                        </h4>

                        <div className="space-y-3">
                          {part.questions.map((q: any) => (
                            <div key={q.questionNumber} className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-2">
                              <div className="flex justify-between items-start">
                                <div className="font-bold text-slate-900">
                                  Q.{q.questionNumber} — {q.chapterName}
                                  <span className="ml-2 text-[11px] text-blue-700 font-normal">
                                    ({q.sourceTextbook}, Page {q.sourcePage})
                                  </span>
                                </div>
                                <span className="font-bold text-purple-700">Total: {q.marks} Mark{q.marks > 1 ? 's' : ''}</span>
                              </div>

                              <div className="space-y-1.5 pt-1 border-t border-slate-200">
                                {q.steps.map((st: any) => (
                                  <div key={st.stepNumber} className="flex justify-between items-center text-[11px] text-slate-700">
                                    <div>
                                      <span className="font-semibold text-slate-800">Step {st.stepNumber}:</span> {st.description}
                                      {st.tamilDescription && (
                                        <span className="text-[10px] text-slate-500 font-tamil block ml-4">{st.tamilDescription}</span>
                                      )}
                                    </div>
                                    <span className="font-bold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-300 ml-2">
                                      {st.marksAllocated} Mark{st.marksAllocated > 1 ? 's' : ''}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
