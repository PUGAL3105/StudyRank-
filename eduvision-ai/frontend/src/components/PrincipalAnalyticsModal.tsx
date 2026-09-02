import { useState, useEffect } from 'react'
import {
  GraduationCap,
  Award,
  AlertTriangle,
  FileText,
  Printer,
  X,
  TrendingUp,
  UserCheck,
  Building,
  Sparkles,
} from 'lucide-react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

interface PrincipalAnalyticsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function PrincipalAnalyticsModal({ isOpen, onClose }: PrincipalAnalyticsModalProps) {
  const { user } = useAuth()
  const [summaryData, setSummaryData] = useState<any | null>(null)
  const [selectedStudentReport, setSelectedStudentReport] = useState<any | null>(null)
  const [showReportCardModal, setShowReportCardModal] = useState<boolean>(false)
  const [, setLoading] = useState<boolean>(false)

  useEffect(() => {
    if (isOpen) {
      loadPrincipalData()
    }
  }, [isOpen])

  const loadPrincipalData = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('eduvision_token') || localStorage.getItem('token')
      const res = await axios.get('http://localhost:5000/api/admin/principal/school-summary', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.data?.success) {
        setSummaryData(res.data.data)
      }
    } catch {
      // Fallback data
      setSummaryData({
        schoolName: 'Government Model Higher Secondary School (Samacheer Kalvi)',
        academicYear: '2024-2025',
        totalEnrollment: 342,
        totalFaculty: 28,
        schoolAvgMastery: 82,
        schoolAvgAttendance: 95,
        totalQuizzesTaken: 1274,
        totalAssignmentsCreated: 34,
        gradeBreakdown: [
          { grade: 'Class 6', studentCount: 42, avgMastery: 78, attendanceRate: 94, quizzesCompleted: 124, topSubject: 'Science' },
          { grade: 'Class 7', studentCount: 38, avgMastery: 76, attendanceRate: 92, quizzesCompleted: 110, topSubject: 'Mathematics' },
          { grade: 'Class 8', studentCount: 45, avgMastery: 81, attendanceRate: 95, quizzesCompleted: 145, topSubject: 'Science' },
          { grade: 'Class 9', studentCount: 50, avgMastery: 74, attendanceRate: 91, quizzesCompleted: 160, topSubject: 'English' },
          { grade: 'Class 10', studentCount: 65, avgMastery: 85, attendanceRate: 96, quizzesCompleted: 310, topSubject: 'Science' },
          { grade: 'Class 11', studentCount: 48, avgMastery: 82, attendanceRate: 93, quizzesCompleted: 185, topSubject: 'Physics' },
          { grade: 'Class 12', studentCount: 54, avgMastery: 88, attendanceRate: 97, quizzesCompleted: 240, topSubject: 'Chemistry' },
        ],
        atRiskStudents: [
          { id: 'usr-student-3', name: 'Karthik R.', class: 'Class 10 A', riskLevel: 'HIGH', avgScore: 42, weakSubject: 'Mathematics', missedQuizzes: 4, actionPlan: 'Remedial coaching in Algebra assigned' },
          { id: 'usr-student-4', name: 'Deepa S.', class: 'Class 9 B', riskLevel: 'MEDIUM', avgScore: 54, weakSubject: 'Science', missedQuizzes: 2, actionPlan: 'Interactive simulations recommended' },
          { id: 'usr-student-5', name: 'Vignesh M.', class: 'Class 11 A', riskLevel: 'MEDIUM', avgScore: 58, weakSubject: 'Physics', missedQuizzes: 3, actionPlan: 'Chapter video lesson review scheduled' },
        ],
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFetchReportCard = async (studentId: string) => {
    try {
      const token = localStorage.getItem('eduvision_token') || localStorage.getItem('token')
      const res = await axios.get(`http://localhost:5000/api/admin/students/${studentId}/report-card`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.data?.success) {
        setSelectedStudentReport(res.data.data)
        setShowReportCardModal(true)
      }
    } catch {
      // Mock Fallback Report Card
      setSelectedStudentReport({
        studentName: 'Prakash S.',
        studentEmail: 'prakash@school.edu',
        class: 'Class 10',
        section: 'A',
        rollNumber: 'TN-2024-1008',
        board: 'Tamil Nadu State Board (Samacheer Kalvi)',
        academicYear: '2024-2025',
        percentage: 89,
        gpa: '8.9',
        overallGrade: 'A1',
        rank: 3,
        attendancePercentage: 96,
        subjectMarks: [
          { subject: 'Science (அறிவியல்)', marks: 92, maxMarks: 100, grade: 'A1', masteryLevel: 'EXCELLENT', remarks: 'Exceptional conceptual understanding in Laws of Motion.' },
          { subject: 'Mathematics (கணிதம்)', marks: 88, maxMarks: 100, grade: 'A2', masteryLevel: 'VERY GOOD', remarks: 'Good grasp of Algebra and Geometry.' },
          { subject: 'Social Science (சமூக அறிவியல்)', marks: 85, maxMarks: 100, grade: 'A2', masteryLevel: 'VERY GOOD', remarks: 'Thorough knowledge of Indian History.' },
          { subject: 'English', marks: 90, maxMarks: 100, grade: 'A1', masteryLevel: 'EXCELLENT', remarks: 'Strong reading comprehension.' },
          { subject: 'Tamil (தமிழ்)', marks: 94, maxMarks: 100, grade: 'A1', masteryLevel: 'OUTSTANDING', remarks: 'Superb command over Tamil grammar.' },
        ],
        strengths: ['Analytical problem solving', 'Physics laws application', 'Tamil grammar accuracy'],
        growthAreas: ['Regular multi-step geometry proofs practice'],
        teacherFeedback: 'Outstanding dedication to learning. Actively utilizes AI visual simulations and textbook practice quizzes.',
        principalSignature: 'Dr. M. Soundararajan, M.Sc., M.Ed., Ph.D. (Principal)',
      })
      setShowReportCardModal(true)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150 font-sans">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-lg flex items-center gap-2">
                <span>{summaryData?.schoolName || 'School Performance Dashboard'}</span>
                <span className="px-2 py-0.5 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full text-[10px] font-bold">
                  Principal & Parent Portal
                </span>
              </h2>
              <p className="text-xs text-blue-200">
                Academic Year {summaryData?.academicYear || '2024-2025'} • Multi-Grade Learning Analytics
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 bg-slate-50">
          {/* Top 4 KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-bold uppercase">School Mastery</span>
                <Award className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">{summaryData?.schoolAvgMastery || 82}%</div>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> +4.2% from last term
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-bold uppercase">Average Attendance</span>
                <UserCheck className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">{summaryData?.schoolAvgAttendance || 95}%</div>
              <p className="text-[11px] text-blue-600 font-semibold mt-1">High Daily Engagement</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-bold uppercase">Total Students</span>
                <GraduationCap className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">{summaryData?.totalEnrollment || 342}</div>
              <p className="text-[11px] text-slate-500 font-semibold mt-1">Classes 6 to 12</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-bold uppercase">Quizzes Taken</span>
                <Sparkles className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">{summaryData?.totalQuizzesTaken || 1274}</div>
              <p className="text-[11px] text-purple-600 font-semibold mt-1">AI Adaptive Assessments</p>
            </div>
          </div>

          {/* Grade-wise Performance Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide mb-4 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-blue-600" />
              <span>Multi-Grade Performance Matrix (Classes 6 to 12)</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="pb-3">Grade</th>
                    <th className="pb-3">Students</th>
                    <th className="pb-3">Average Mastery</th>
                    <th className="pb-3">Attendance</th>
                    <th className="pb-3">Quizzes Completed</th>
                    <th className="pb-3">Top Subject</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {(summaryData?.gradeBreakdown || []).map((row: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 font-bold text-slate-900">{row.grade}</td>
                      <td className="py-3">{row.studentCount} Students</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-blue-600 h-full rounded-full"
                              style={{ width: `${row.avgMastery}%` }}
                            />
                          </div>
                          <span className="font-bold text-slate-900">{row.avgMastery}%</span>
                        </div>
                      </td>
                      <td className="py-3 font-semibold text-emerald-600">{row.attendanceRate}%</td>
                      <td className="py-3 font-semibold text-indigo-600">{row.quizzesCompleted}</td>
                      <td className="py-3">
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md font-bold text-[11px] border border-blue-200">
                          {row.topSubject}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* At-Risk Students & Early Intervention Tracker */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>At-Risk Students & Early Remedial Interventions</span>
              </h3>
              <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                {summaryData?.atRiskStudents?.length || 0} Alerts Active
              </span>
            </div>

            <div className="space-y-3">
              {(summaryData?.atRiskStudents || []).map((st: any, i: number) => (
                <div
                  key={i}
                  className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-4 flex-wrap"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs">{st.name}</span>
                      <span className="text-[11px] text-slate-500 font-semibold">({st.class})</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          st.riskLevel === 'HIGH'
                            ? 'bg-rose-100 text-rose-700 border border-rose-200'
                            : 'bg-amber-100 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {st.riskLevel} Risk
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Average Score: <strong className="text-rose-600">{st.avgScore}%</strong> • Weak Area:{' '}
                      <strong className="text-slate-800">{st.weakSubject}</strong>
                    </p>
                    <p className="text-[11px] text-indigo-700 font-semibold flex items-center gap-1">
                      💡 Action Plan: {st.actionPlan}
                    </p>
                  </div>

                  <button
                    onClick={() => handleFetchReportCard(st.id)}
                    className="px-3.5 py-2 bg-white hover:bg-slate-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold shadow-2xs transition-all flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>📄 View Report Card</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Official Tamil Nadu State Board (Samacheer Kalvi) Assessment Platform</span>
          <button
            onClick={() => handleFetchReportCard((user as any)?.userId || user?.id || 'usr-student-1')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Generate Sample Student Report Card</span>
          </button>
        </div>
      </div>

      {/* Printable Report Card Modal */}
      {showReportCardModal && selectedStudentReport && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-60 flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-300 text-slate-900">
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg">
                    Official Student Progress Report
                  </h3>
                  <p className="text-xs text-blue-200">
                    Tamil Nadu State Board • Samacheer Kalvi Curriculum
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button
                  onClick={() => setShowReportCardModal(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Report Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-white text-xs">
              {/* Student Metadata Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl grid grid-cols-2 sm:grid-cols-4 gap-3 font-medium">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Student Name</span>
                  <span className="font-bold text-slate-900 text-sm">{selectedStudentReport.studentName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Class & Section</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {selectedStudentReport.class} - {selectedStudentReport.section}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Roll / Reg Number</span>
                  <span className="font-bold text-slate-900 text-sm">{selectedStudentReport.rollNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Overall Grade</span>
                  <span className="font-extrabold text-emerald-600 text-sm">
                    {selectedStudentReport.overallGrade} ({selectedStudentReport.percentage}%)
                  </span>
                </div>
              </div>

              {/* Subject Marks Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                      <th className="p-3">Subject Name</th>
                      <th className="p-3">Marks (100)</th>
                      <th className="p-3">Grade</th>
                      <th className="p-3">Mastery Level</th>
                      <th className="p-3">Teacher Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(selectedStudentReport.subjectMarks || []).map((sub: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-900">{sub.subject}</td>
                        <td className="p-3 font-extrabold text-blue-700">{sub.marks}</td>
                        <td className="p-3 font-bold text-emerald-600">{sub.grade}</td>
                        <td className="p-3 font-semibold text-slate-700">{sub.masteryLevel}</td>
                        <td className="p-3 text-slate-500 italic">{sub.remarks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Strengths & Growth Areas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl">
                  <h4 className="font-bold text-emerald-800 text-xs mb-1.5">🌟 Demonstrated Strengths</h4>
                  <ul className="list-disc list-inside text-emerald-700 space-y-1 text-[11px]">
                    {(selectedStudentReport.strengths || []).map((st: string, idx: number) => (
                      <li key={idx}>{st}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-xl">
                  <h4 className="font-bold text-amber-800 text-xs mb-1.5">🎯 Recommended Focus Areas</h4>
                  <ul className="list-disc list-inside text-amber-700 space-y-1 text-[11px]">
                    {(selectedStudentReport.growthAreas || []).map((ga: string, idx: number) => (
                      <li key={idx}>{ga}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-slate-600 text-[11px]">
                <div>
                  <p className="font-semibold">{selectedStudentReport.teacherFeedback}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900">{selectedStudentReport.principalSignature}</p>
                  <p className="text-slate-400 text-[10px]">Head of Institution</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
