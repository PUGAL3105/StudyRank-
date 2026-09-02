import React, { useState, useEffect } from 'react'
import {
  GraduationCap,
  Sparkles,
  Compass,
  Award,
  CheckCircle2,
  X,
  FileCheck
} from 'lucide-react'
import axios from 'axios'

interface CareerGuidanceModalProps {
  isOpen: boolean
  onClose: () => void
  studentName?: string
}

export const CareerGuidanceModal: React.FC<CareerGuidanceModalProps> = ({
  isOpen,
  onClose,
  studentName = 'Student',
}) => {
  const [activeTab, setActiveTab] = useState<'streams' | 'pathways' | 'scholarships' | 'quota'>('streams')

  // Stream Quiz Form State
  const [mathScore, setMathScore] = useState(88)
  const [scienceScore, setScienceScore] = useState(92)
  const [socialScore, setSocialScore] = useState(85)
  const [careerInterest, setCareerInterest] = useState('Artificial Intelligence & Medicine')
  const [recommendations, setRecommendations] = useState<any[]>([])

  // Pathways & Scholarships Data
  const [pathways, setPathways] = useState<any[]>([])
  const [scholarships, setScholarships] = useState<any[]>([])
  const [selectedPathway, setSelectedPathway] = useState<any>(null)

  // 7.5% Quota Calculator
  const [schoolType, setSchoolType] = useState<'government' | 'aided' | 'private'>('government')
  const [studiedFrom6To12, setStudiedFrom6To12] = useState(true)
  const [gender, setGender] = useState<'female' | 'male'>('female')
  const [quotaResult, setQuotaResult] = useState<any>(null)

  useEffect(() => {
    if (isOpen) {
      fetchRecommendations()
      fetchPathwaysAndScholarships()
    }
  }, [isOpen])

  const fetchRecommendations = async () => {
    try {
      const res = await axios.post('/api/career/stream-recommendation', {
        mathScore,
        scienceScore,
        socialScore,
        careerInterest,
      })
      if (res.data?.success) {
        setRecommendations(res.data.data)
      }
    } catch (e) {
      console.error('Failed to fetch stream recommendations:', e)
    }
  }

  const fetchPathwaysAndScholarships = async () => {
    try {
      const pRes = await axios.get('/api/career/pathways')
      if (pRes.data?.success) {
        setPathways(pRes.data.data)
        if (pRes.data.data.length > 0) {
          setSelectedPathway(pRes.data.data[0])
        }
      }
      const sRes = await axios.get('/api/career/scholarships')
      if (sRes.data?.success) {
        setScholarships(sRes.data.data)
      }
    } catch (e) {
      console.error('Failed to fetch pathways:', e)
    }
  }

  const handleEvaluateQuota = async () => {
    try {
      const res = await axios.post('/api/career/quota-eligibility', {
        schoolType,
        studiedFromClass6To12InGovt: studiedFrom6To12,
        gender,
      })
      if (res.data?.success) {
        setQuotaResult(res.data.data)
      }
    } catch (e) {
      console.error('Failed to evaluate quota:', e)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-white">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">
                  Tamil Nadu Career & Higher Education Guidance Engine
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  TN State Board Counselor
                </span>
              </div>
              <p className="text-xs text-emerald-200">
                உயர் கல்வி மற்றும் வேலைவாய்ப்பு வழிகாட்டுதல் • Stream Selection & Roadmaps
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950 px-6 gap-2">
          {[
            { id: 'streams', label: '🎯 Class 11 Stream Recommender', icon: Sparkles },
            { id: 'pathways', label: '🗺️ Career & Entrance Pathways', icon: Compass },
            { id: 'quota', label: '🏛️ 7.5% Govt Quota Calculator', icon: Award },
            { id: 'scholarships', label: '💰 State Scholarships', icon: FileCheck },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-900/60">
          {/* TAB 1: STREAM RECOMMENDER */}
          {activeTab === 'streams' && (
            <div className="space-y-6">
              {/* Profile Config Card */}
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Maths Score (%)</label>
                    <input
                      type="number"
                      value={mathScore}
                      onChange={(e) => setMathScore(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Science Score (%)</label>
                    <input
                      type="number"
                      value={scienceScore}
                      onChange={(e) => setScienceScore(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Social Score (%)</label>
                    <input
                      type="number"
                      value={socialScore}
                      onChange={(e) => setSocialScore(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 items-end">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Dream Career / Field of Interest:</label>
                    <input
                      type="text"
                      value={careerInterest}
                      onChange={(e) => setCareerInterest(e.target.value)}
                      placeholder="e.g. Artificial Intelligence, Medicine, CA, Robotics, IAS..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <button
                    onClick={fetchRecommendations}
                    className="w-full sm:w-auto px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-lg flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    Calculate Match
                  </button>
                </div>
              </div>

              {/* Recommendations List */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Recommended Higher Secondary Groups for {studentName}
                </h4>

                {recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className={`bg-slate-950 border rounded-2xl p-5 space-y-3 transition-all ${
                      idx === 0
                        ? 'border-emerald-500/60 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500/40'
                        : 'border-slate-800'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-extrabold text-sm text-white">{rec.recommendedGroup}</h5>
                          {idx === 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              TOP MATCH
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-tamil text-slate-400 mt-0.5">{rec.tamilGroupName}</p>
                      </div>

                      <div className="text-right">
                        <span className="text-lg font-black text-emerald-400">{rec.matchPercentage}%</span>
                        <div className="text-[10px] text-slate-400">Aptitude Match</div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">{rec.rationale}</p>
                    <p className="text-[11px] font-tamil text-slate-400">{rec.tamilRationale}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-900 text-xs">
                      <div>
                        <span className="text-slate-400 font-semibold block mb-1">Career Pathways:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {rec.suitableCareers.map((c: string, cIdx: number) => (
                            <span key={cIdx} className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-200">
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold block mb-1">Key Entrance Exams:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {rec.recommendedEntranceExams.map((e: string, eIdx: number) => (
                            <span key={eIdx} className="px-2 py-0.5 rounded-lg bg-emerald-950/60 border border-emerald-800/40 text-[11px] text-emerald-300 font-bold">
                              {e}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: CAREER PATHWAYS */}
          {activeTab === 'pathways' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Pathway List Selector */}
              <div className="space-y-2">
                {pathways.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPathway(p)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all text-xs ${
                      selectedPathway?.id === p.id
                        ? 'bg-emerald-950/40 border-emerald-500/60 text-white shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
                    }`}
                  >
                    <div className="font-bold text-sm text-slate-100">{p.title}</div>
                    <div className="text-[11px] text-emerald-400 font-semibold mt-1">{p.entranceExam}</div>
                  </button>
                ))}
              </div>

              {/* Pathway Detail Card */}
              {selectedPathway && (
                <div className="md:col-span-2 bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <div className="border-b border-slate-800 pb-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {selectedPathway.category}
                    </span>
                    <h3 className="text-base font-bold text-white mt-1.5">{selectedPathway.title}</h3>
                    <p className="text-xs font-tamil text-slate-400">{selectedPathway.tamilTitle}</p>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="font-semibold text-slate-400 block mb-1">Required Stream:</span>
                      <span className="text-slate-200 font-bold">{selectedPathway.higherSecondaryGroup}</span>
                    </div>

                    <div>
                      <span className="font-semibold text-slate-400 block mb-1">Duration & Degree:</span>
                      <span className="text-slate-200 font-medium">{selectedPathway.typicalDuration}</span>
                    </div>

                    <div>
                      <span className="font-semibold text-slate-400 block mb-1">Top Institutions in Tamil Nadu:</span>
                      <ul className="list-disc pl-4 space-y-0.5 text-slate-300">
                        {selectedPathway.topTamilNaduInstitutions.map((inst: string, idx: number) => (
                          <li key={idx}>{inst}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <span className="font-semibold text-slate-400 block mb-1">Study Milestones:</span>
                      <div className="space-y-1.5">
                        {selectedPathway.keyMilestones.map((m: string, idx: number) => (
                          <div key={idx} className="flex items-start gap-2 bg-slate-900 p-2 rounded-xl border border-slate-800 text-[11px] text-slate-300">
                            <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[10px]">
                              {idx + 1}
                            </span>
                            <span>{m}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: 7.5% QUOTA CALCULATOR */}
          {activeTab === 'quota' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl space-y-4">
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-300" />
                  Tamil Nadu 7.5% Government School Preferential Quota Calculator
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Under the Tamil Nadu Government legislation, students who studied from Class 6 to Class 12 in State Government Schools receive a 7.5% dedicated horizontal reservation in Medical, Engineering, Agriculture, Veterinary, and Law colleges, with <strong>100% of Tuition and Hostel fees funded by the State Government</strong>.
                </p>

                <div className="space-y-3 pt-2 border-t border-slate-800 text-xs">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">School Category:</label>
                    <select
                      value={schoolType}
                      onChange={(e) => setSchoolType(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                    >
                      <option value="government">Government School (அரசுப் பள்ளி)</option>
                      <option value="aided">Government-Aided School (அரசு உதவிபெறும் பள்ளி)</option>
                      <option value="private">Matriculation / Private School (தனியார் பள்ளி)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="studied6to12"
                      checked={studiedFrom6To12}
                      onChange={(e) => setStudiedFrom6To12(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-800 text-emerald-600"
                    />
                    <label htmlFor="studied6to12" className="text-slate-300 font-medium">
                      Studied continuously from Class 6 to Class 12 in Government School
                    </label>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Student Gender:</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                    >
                      <option value="female">Female (பெண்)</option>
                      <option value="male">Male (ஆண்)</option>
                    </select>
                  </div>

                  <button
                    onClick={handleEvaluateQuota}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-lg transition-colors"
                  >
                    Check Quota & Scholarship Eligibility
                  </button>
                </div>
              </div>

              {/* Quota Evaluation Result */}
              {quotaResult && (
                <div className={`p-5 rounded-2xl border space-y-3 ${
                  quotaResult.is7Point5QuotaEligible
                    ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-100'
                    : 'bg-slate-950 border-slate-800 text-slate-300'
                }`}>
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>
                      {quotaResult.is7Point5QuotaEligible
                        ? 'Eligible for 7.5% Tamil Nadu Government Quota & 100% Free Higher Education!'
                        : 'Standard Merit / General Counseling Eligibility'}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <span className="font-semibold text-slate-400 block">Eligible Schemes & Concessions:</span>
                    <ul className="list-disc pl-5 space-y-1">
                      {quotaResult.applicableSchemes.map((sch: string, idx: number) => (
                        <li key={idx} className="text-slate-200">{sch}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SCHOLARSHIPS */}
          {activeTab === 'scholarships' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scholarships.map((sch) => (
                <div key={sch.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div>
                    <h4 className="font-bold text-sm text-white">{sch.schemeName}</h4>
                    <p className="text-xs font-tamil text-emerald-400 mt-0.5">{sch.tamilSchemeName}</p>
                    <span className="text-[10px] text-slate-500 block mt-1">Offered by: {sch.offeredBy}</span>
                  </div>

                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-xs text-slate-200 font-semibold">
                    🎁 {sch.benefitDetails}
                  </div>

                  <div className="space-y-1 text-xs text-slate-300">
                    <span className="font-bold text-slate-400 block">Eligibility:</span>
                    <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                      {sch.eligibilityCriteria.map((c: string, idx: number) => (
                        <li key={idx}>{c}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-2 border-t border-slate-900 flex justify-between items-center text-xs">
                    <span className="text-[11px] text-slate-400">{sch.howToApply}</span>
                    <a
                      href={sch.portalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-400 hover:underline font-bold text-[11px]"
                    >
                      Visit Portal ↗
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
