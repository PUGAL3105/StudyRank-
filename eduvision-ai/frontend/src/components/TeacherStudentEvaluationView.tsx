import React, { useState } from 'react'
import {
  Trophy,
  CheckCircle2,
  XCircle,
  Eye,
  Search,
  Check,
  Save,
  Sparkles,
  BookOpen,
  Award,
  Clock,
  User as UserIcon,
  X,
} from 'lucide-react'

export interface StudentSubmission {
  id: string
  studentId: string
  studentName: string
  studentEmail: string
  classId: 'c-9' | 'c-10' | 'c-11' | 'c-12'
  className: string
  subjectId: string
  subjectName: string
  examType: 'MCQ' | 'DESCRIPTIVE' | 'MODEL_PAPER'
  examTitle: string
  submittedAt: string
  timeTakenMinutes: number
  totalQuestions: number
  score: number
  maxMarks: number
  percentage: number
  grade: string
  status: 'EVALUATED' | 'PENDING_REVIEW'
  aiEvaluatedScore: number
  teacherOverrideScore?: number
  teacherFeedback?: string
  questions: Array<{
    id: string
    qNo: number
    type: 'MCQ' | '2M' | '3M' | '5M'
    questionText: string
    maxMarks: number
    studentAnswerText?: string
    studentOptionIndex?: number
    correctOptionIndex?: number
    options?: string[]
    correctAnswerText: string
    keyPoints: string[]
    aiMarksAwarded: number
    teacherMarksAwarded?: number
    aiFeedback: string
    isCorrect?: boolean
  }>
}

const MOCK_SUBMISSIONS: StudentSubmission[] = [
  {
    id: 'sub-2024-001',
    studentId: 'stu-101',
    studentName: 'Pugalarasan K.',
    studentEmail: 'student@demo.com',
    classId: 'c-12',
    className: 'Class 12',
    subjectId: 'sub-12-bio',
    subjectName: 'Biology',
    examType: 'DESCRIPTIVE',
    examTitle: 'Class 12 Biology — 2M / 3M / 5M Centum Drill',
    submittedAt: 'Today, 10:45 AM',
    timeTakenMinutes: 38,
    totalQuestions: 5,
    score: 18,
    maxMarks: 20,
    percentage: 90,
    grade: 'Centum A+',
    status: 'EVALUATED',
    aiEvaluatedScore: 18,
    teacherFeedback: 'Very neat point-by-point presentation with accurate biological terminology.',
    questions: [
      {
        id: 'q-bio-1',
        qNo: 1,
        type: '2M',
        questionText: 'What is Tapetum? State its primary physiological function.',
        maxMarks: 2,
        studentAnswerText: 'Tapetum is the innermost wall layer of microsporangium. It nourishes the developing microspores / pollen grains and secretes ubisch granules.',
        correctAnswerText: 'Tapetum is the innermost nourishing wall layer of the microsporangium that synthesizes sporopollenin precursors and nourishes developing pollen grains.',
        keyPoints: ['Innermost layer of microsporangium', 'Nourishment of developing pollen grains / microspores'],
        aiMarksAwarded: 2,
        aiFeedback: '100% accurate. Covered all primary points with exact botanical terms.',
      },
      {
        id: 'q-bio-2',
        qNo: 2,
        type: '2M',
        questionText: 'Differentiate between Hydrophytes and Xerophytes with examples.',
        maxMarks: 2,
        studentAnswerText: 'Hydrophytes grow in water (e.g. Hydrilla, Nelumbo). Xerophytes grow in dry/arid deserts with thick cuticle and sunken stomata (e.g. Opuntia).',
        correctAnswerText: 'Hydrophytes are aquatic plants with aerenchyma (Hydrilla, Lotus). Xerophytes are desert plants with sunken stomata and thick cuticle (Opuntia, Aloe).',
        keyPoints: ['Hydrophytes: aquatic habitat with examples', 'Xerophytes: arid adaptations with sunken stomata'],
        aiMarksAwarded: 2,
        aiFeedback: 'Both definitions and plant examples are correct.',
      },
      {
        id: 'q-bio-3',
        qNo: 3,
        type: '3M',
        questionText: 'Explain the structure and role of Secretory Immunoglobulin A (IgA) in human colostrum.',
        maxMarks: 3,
        studentAnswerText: 'Secretory IgA is a dimeric antibody found abundantly in yellow colostrum milk produced during initial days of lactation. It provides natural passive immunity protecting the newborn gut against bacterial and viral infections.',
        correctAnswerText: 'IgA is a dimeric secretory antibody abundant in maternal colostrum, providing natural passive mucosal immunity against gastrointestinal and respiratory pathogens.',
        keyPoints: ['Colostrum / early breast milk presence', 'Dimeric secretory immunoglobulin', 'Provides natural passive immunity to newborn'],
        aiMarksAwarded: 3,
        aiFeedback: 'Excellent explanation. Accurately highlighted passive immunity and colostrum context.',
      },
      {
        id: 'q-bio-4',
        qNo: 4,
        type: '3M',
        questionText: 'State the 10 Percent Law of Energy Flow in an ecosystem proposed by Raymond Lindeman.',
        maxMarks: 3,
        studentAnswerText: 'Lindeman 10% law states that only 10% of energy entering a trophic level is transferred to the next higher level. Remaining 90% is lost as metabolic heat.',
        correctAnswerText: 'According to Lindeman 10% law (1942), during transfer of organic food from one trophic level to the next, only about 10% of the energy is stored as flesh; 90% is lost during respiration and excretion.',
        keyPoints: ['Only 10% transferred to subsequent trophic level', '90% lost as heat / respiration', 'Proposed by Raymond Lindeman'],
        aiMarksAwarded: 3,
        aiFeedback: 'Complete statement and mathematical percentage loss explained.',
      },
      {
        id: 'q-bio-5',
        qNo: 5,
        type: '5M',
        questionText: 'Explain the process of Double Fertilization and Triple Fusion in Angiosperms with a neat flowchart.',
        maxMarks: 5,
        studentAnswerText: 'Pollen tube enters embryo sac via micropyle releasing two male gametes. 1. Syngamy: One male gamete (n) fuses with Egg cell (n) to form diploid Zygote (2n). 2. Triple Fusion: Second male gamete (n) fuses with diploid Secondary Nucleus (2n) to form Triploid Primary Endosperm Nucleus (PEN, 3n). This unique event in flowering plants is called Double Fertilization.',
        correctAnswerText: 'Double fertilization comprises: (1) Syngamy forming 2n zygote that develops into embryo, (2) Triple fusion where second haploid sperm fuses with central diploid secondary nucleus forming 3n PEN. Provides nutritive endosperm.',
        keyPoints: ['Syngamy: Male gamete (n) + Egg (n) -> Zygote (2n)', 'Triple fusion: Male gamete (n) + Secondary nucleus (2n) -> PEN (3n)', 'Pollen tube entry through micropyle', 'Biological significance in angiosperms'],
        aiMarksAwarded: 4,
        aiFeedback: 'Accurate text and ploidy levels. 1 mark deducted because flowchart sketch was slightly brief.',
      },
    ],
  },
  {
    id: 'sub-2024-002',
    studentId: 'stu-102',
    studentName: 'Ananya Ramesh',
    studentEmail: 'ananya@school.edu',
    classId: 'c-12',
    className: 'Class 12',
    subjectId: 'sub-12-tam',
    subjectName: 'General Tamil (பொதுத்தமிழ்)',
    examType: 'DESCRIPTIVE',
    examTitle: 'Class 12 பொதுத்தமிழ் — செய்யுள் மற்றும் உரைநடை வினாத்தாள்',
    submittedAt: 'Today, 09:30 AM',
    timeTakenMinutes: 45,
    totalQuestions: 4,
    score: 14,
    maxMarks: 15,
    percentage: 93.3,
    grade: 'Centum A+',
    status: 'EVALUATED',
    aiEvaluatedScore: 14,
    teacherFeedback: 'அழகான தமிழ்க்கட்டுரை நடை மற்றும் பிழையற்ற இலக்கண விளக்கம்.',
    questions: [
      {
        id: 'q-tam-1',
        qNo: 1,
        type: '2M',
        questionText: 'செவியறிவுறூஉத் துறை — இலக்கணம் விளக்குக.',
        maxMarks: 2,
        studentAnswerText: 'அரசன் செய்ய வேண்டிய நன்மைகளையும் தவிர்க்க வேண்டிய தீமைகளையும் அவனுக்குப் புரியும் வண்ணம் சான்றோர்கள் செவியிலறிவுறுத்துவது செவியறிவுறூஉத் துறை எனப்படும்.',
        correctAnswerText: 'அரசன் செய்ய வேண்டிய அறநெறிகளையும் ஆட்சி மாண்புகளையும் அவனுக்குப் புரியும் வண்ணம் அறிஞர்கள் செவியிலறிவுறுத்துவது செவியறிவுறூஉத் துறை எனப்படும் (புறநானூறு).',
        keyPoints: ['அரசனுக்குரிய அறநெறி புகட்டுதல்', 'புறநானூற்றுப் பாடாண்திணைத் துறை விளக்கம்'],
        aiMarksAwarded: 2,
        aiFeedback: 'துறை விளக்கம் மற்றும் பயன்பாடு மிகத் துல்லியமாக எழுதப்பட்டுள்ளது.',
      },
      {
        id: 'q-tam-2',
        qNo: 2,
        type: '3M',
        questionText: 'சங்க காலத் தமிழரின் விருந்தோம்பல் பண்பினைப் புறநானூறு வழி நின்று விளக்குக.',
        maxMarks: 3,
        studentAnswerText: 'சங்கத் தமிழர் விருந்தோம்பலைத் தலையாய அறமாகக் கருதினர். விருந்தினர் நடு இரவில் வந்தாலும் முகம் மலர்ந்து உணவளித்தனர். வீட்டில் உணவு இல்லாத நிலையிலும், விதைக்காக வைத்திருந்த திணை நெல்லை உரலில் இட்டுக் குற்றி உணவளித்த தலைவியின் ஈகைப் பண்பை புறநானூறு போற்றுகிறது.',
        correctAnswerText: 'சங்கத் தமிழர் விருந்தோம்பலைத் தலையாய அறமாகக் கருதினர். விதைநெல்லைக் குற்றி உணவளித்த தலைவியின் ஈகைப் பண்பை புறநானூறு போற்றுகிறது.',
        keyPoints: ['இரவிலும் மலர்ந்த முகத்துடன் உபசரித்தல்', 'விதைநெல்லைக் குற்றி விருந்தளித்த ஈகை மாண்பு', 'விருந்தோம்பலின் வாழ்வியல் சிறப்பு'],
        aiMarksAwarded: 3,
        aiFeedback: 'விதைநெல் உவமை மற்றும் சங்க இலக்கிய நயம் முழுமையாக விவரிக்கப்பட்டுள்ளது.',
      },
      {
        id: 'q-tam-3',
        qNo: 3,
        type: '5M',
        questionText: 'பாரதியின் புதிய ஆத்திசூடி இளைய தலைமுறைக்கு உணர்த்தும் வாழ்வியல் விழுமியங்களை விரித்துரைக்க.',
        maxMarks: 5,
        studentAnswerText: 'பாரதியார் இளைஞர்களிடம் புத்துணர்ச்சியையும் சுயமரியாதையையும் தூண்ட புதிய ஆத்திசூடியை இயற்றினார். 1. அச்சமின்மை: ‘அச்சம் தவிர்’, ‘ஆண்மை தவறேல்’ என்று எதற்கும் அஞ்சாமல் நீதியை நிலைநாட்டக் கூறுகிறார். 2. உழைப்பும் உடற்கல்வியும்: ‘இளைத்தல் இகழ்ச்சி’, ‘உடலினை உறுதிசெய்’ என வலியுறுத்துகிறார். 3. சமூக சமத்துவம்: ‘சாதிப் பிரிவுகள் சொல்லுதல் பாவம்’ என சமுதாய ஒற்றுமையை நிலைநாட்டுகிறார்.',
        correctAnswerText: 'பாரதியாரின் புதிய ஆத்திசூடி அச்சமின்மை, உழைப்பு, உடற்பயிற்சி, அறிவியல் சிந்தனை, சமூக ஒற்றுமை ஆகியவற்றை இளைய தலைமுறைக்கு வாழ்வியல் விழுமியங்களாகப் புகட்டுகிறது.',
        keyPoints: ['பாரதியின் சமூகப் பார்வை', 'அச்சமின்மை, உடல் நலம், அறிவியல் நாட்டம்', 'முக்கிய ஆத்திசூடி அடிகளின் விளக்கம்', 'இளையோர் எழுச்சி மற்றும் முடிவுரை'],
        aiMarksAwarded: 5,
        aiFeedback: 'முன்னுரை, உட்தலைப்புகள் மற்றும் பாரதியின் மேற்கோள்கள் சரியான முறையில் இடம் பெற்றுள்ளன.',
      },
      {
        id: 'q-tam-4',
        qNo: 4,
        type: '5M',
        questionText: 'உங்கள் பகுதியில் பொது நூலகம் ஒன்று அமைத்துத் தர வேண்டி மாவட்ட நூலக அலுவலருக்கு விண்ணப்பக் கடிதம் வரைக.',
        maxMarks: 5,
        studentAnswerText: 'அனுப்புநர்: அனன்யா ரமேஷ், 12-ஆம் வகுப்பு, காந்தி நகர். பெறுநர்: மாவட்ட நூலக அலுவலர், மாவட்ட மைய நூலகம். ஐயா, எங்கள் பகுதியில் 500 குடும்பங்கள் உள்ளன. மாணவ மாணவியர் கல்வி கற்க நூலகம் இல்லாததால் 5 கி.மீ. செல்ல வேண்டியுள்ளது. எனவே கிளை நூலகம் அமைத்துத் தருமாறு வேண்டுகிறேன். நன்றி.',
        correctAnswerText: 'அனுப்புநர், பெறுநர், பொருள், உரிய விளிப்பு, நூலகத்தின் தேவைக்கான காரணங்கள், இடம், தேதி, கையொப்பம் ஆகிய முறைப்படி அமைந்த விண்ணப்பம்.',
        keyPoints: ['சரியான கடிதக் கட்டமைப்பு (அனுப்புநர், பெறுநர்)', 'தெளிவான பொருள் மற்றும் விளிப்பு', 'நூலகத்தின் தேவைக்கான காரணங்கள்', 'இடம், தேதி மற்றும் கையொப்பம்'],
        aiMarksAwarded: 4,
        aiFeedback: 'கடிதக் கட்டமைப்பு சரி. இடம், தேதி விடுபட்டதால் 1 மதிப்பெண் குறைக்கப்பட்டுள்ளது.',
      },
    ],
  },
  {
    id: 'sub-2024-003',
    studentId: 'stu-103',
    studentName: 'Karthik Selvan',
    studentEmail: 'karthik@school.edu',
    classId: 'c-10',
    className: 'Class 10',
    subjectId: 'sub-10-sci',
    subjectName: 'Science',
    examType: 'MCQ',
    examTitle: 'Class 10 Science — 1-Mark Board Speed Quiz (Set 3)',
    submittedAt: 'Yesterday, 04:15 PM',
    timeTakenMinutes: 15,
    totalQuestions: 5,
    score: 4,
    maxMarks: 5,
    percentage: 80,
    grade: 'A Grade',
    status: 'EVALUATED',
    aiEvaluatedScore: 4,
    questions: [
      {
        id: 'q-mcq-1',
        qNo: 1,
        type: 'MCQ',
        questionText: 'Inertia of a body depends directly on its:',
        maxMarks: 1,
        studentOptionIndex: 2,
        correctOptionIndex: 2,
        options: ['Weight of the body', 'Acceleration due to gravity', 'Mass of the body', 'Velocity of the body'],
        correctAnswerText: 'Mass of the body',
        keyPoints: ['Mass is the measure of inertia.'],
        aiMarksAwarded: 1,
        aiFeedback: 'Correct answer.',
        isCorrect: true,
      },
      {
        id: 'q-mcq-2',
        qNo: 2,
        type: 'MCQ',
        questionText: 'The power of a lens is -2 D. Its focal length is:',
        maxMarks: 1,
        studentOptionIndex: 0,
        correctOptionIndex: 0,
        options: ['-0.5 m', '+0.5 m', '-2 m', '+2 m'],
        correctAnswerText: '-0.5 m',
        keyPoints: ['f = 1/P = 1/(-2) = -0.5 m'],
        aiMarksAwarded: 1,
        aiFeedback: 'Correct calculation.',
        isCorrect: true,
      },
      {
        id: 'q-mcq-3',
        qNo: 3,
        type: 'MCQ',
        questionText: 'The SI unit of electrical resistivity is:',
        maxMarks: 1,
        studentOptionIndex: 2,
        correctOptionIndex: 2,
        options: ['ohm', 'ohm / metre', 'ohm metre (Ω·m)', 'ohm / metre²'],
        correctAnswerText: 'ohm metre (Ω·m)',
        keyPoints: ['Resistivity unit is ohm-metre'],
        aiMarksAwarded: 1,
        aiFeedback: 'Correct.',
        isCorrect: true,
      },
      {
        id: 'q-mcq-4',
        qNo: 4,
        type: 'MCQ',
        questionText: 'Which hormone regulates carbohydrate, protein, and fat metabolism in human body?',
        maxMarks: 1,
        studentOptionIndex: 1,
        correctOptionIndex: 0,
        options: ['Thyroxine', 'Insulin', 'Adrenaline', 'Growth Hormone'],
        correctAnswerText: 'Thyroxine',
        keyPoints: ['Thyroxine regulates basal metabolic rate.'],
        aiMarksAwarded: 0,
        aiFeedback: 'Student chose Insulin (option 1). Correct answer is Thyroxine (option 0).',
        isCorrect: false,
      },
      {
        id: 'q-mcq-5',
        qNo: 5,
        type: 'MCQ',
        questionText: 'The value of Universal Gravitational Constant G in SI units is:',
        maxMarks: 1,
        studentOptionIndex: 0,
        correctOptionIndex: 0,
        options: ['6.674 x 10⁻¹¹ N m² kg⁻²', '9.8 m s⁻²', '6.674 x 10¹¹ N m² kg⁻²', '3 x 10⁸ m s⁻¹'],
        correctAnswerText: '6.674 x 10⁻¹¹ N m² kg⁻²',
        keyPoints: ['Standard G constant value'],
        aiMarksAwarded: 1,
        aiFeedback: 'Correct.',
        isCorrect: true,
      },
    ],
  },
]

export const TeacherStudentEvaluationView: React.FC = () => {
  const [submissions, setSubmissions] = useState<StudentSubmission[]>(MOCK_SUBMISSIONS)
  const [selectedSubmission, setSelectedSubmission] = useState<StudentSubmission | null>(null)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [classFilter, setClassFilter] = useState<string>('ALL')
  const [subjectFilter, setSubjectFilter] = useState<string>('ALL')
  const [examTypeFilter, setExamTypeFilter] = useState<string>('ALL')

  // Evaluation editing state
  const [tempOverrides, setTempOverrides] = useState<Record<string, number>>({})
  const [teacherRemarks, setTeacherRemarks] = useState<string>('')
  const [showSavedToast, setShowSavedToast] = useState<boolean>(false)

  const handleOpenReview = (submission: StudentSubmission) => {
    setSelectedSubmission(submission)
    setTeacherRemarks(submission.teacherFeedback || '')
    const initialOverrides: Record<string, number> = {}
    submission.questions.forEach((q) => {
      initialOverrides[q.id] = q.teacherMarksAwarded !== undefined ? q.teacherMarksAwarded : q.aiMarksAwarded
    })
    setTempOverrides(initialOverrides)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleScoreChange = (qId: string, value: number, maxMarks: number) => {
    const safeVal = Math.max(0, Math.min(maxMarks, value))
    setTempOverrides((prev) => ({
      ...prev,
      [qId]: safeVal,
    }))
  }

  const handleSaveEvaluation = () => {
    if (!selectedSubmission) return

    let newTotalScore = 0
    const updatedQuestions = selectedSubmission.questions.map((q) => {
      const teacherMark = tempOverrides[q.id] !== undefined ? tempOverrides[q.id] : q.aiMarksAwarded
      newTotalScore += teacherMark
      return {
        ...q,
        teacherMarksAwarded: teacherMark,
      }
    })

    const newPercentage = Math.round((newTotalScore / selectedSubmission.maxMarks) * 100)
    let newGrade = 'A Grade'
    if (newPercentage >= 90) newGrade = 'Centum A+'
    else if (newPercentage >= 75) newGrade = 'Distinction A'
    else if (newPercentage >= 60) newGrade = 'First Class B'
    else if (newPercentage >= 35) newGrade = 'Pass C'
    else newGrade = 'Needs Practice'

    const updatedSub: StudentSubmission = {
      ...selectedSubmission,
      score: newTotalScore,
      percentage: newPercentage,
      grade: newGrade,
      teacherFeedback: teacherRemarks,
      status: 'EVALUATED',
      questions: updatedQuestions,
    }

    setSubmissions((prev) => prev.map((s) => (s.id === updatedSub.id ? updatedSub : s)))
    setSelectedSubmission(updatedSub)
    setShowSavedToast(true)
    setTimeout(() => setShowSavedToast(false), 3000)
  }

  const filteredSubmissions = submissions.filter((sub) => {
    const matchSearch =
      sub.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.studentEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.examTitle.toLowerCase().includes(searchTerm.toLowerCase())

    const matchClass = classFilter === 'ALL' || sub.classId === classFilter
    const matchSubject = subjectFilter === 'ALL' || sub.subjectId.includes(subjectFilter.toLowerCase())
    const matchType = examTypeFilter === 'ALL' || sub.examType === examTypeFilter

    return matchSearch && matchClass && matchSubject && matchType
  })

  return (
    <div className="space-y-6">
      {/* ───────────────────────────────────────────────────────────────── */}
      {/* HEADER BANNER */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-[#191735] via-[#241F52] to-[#3B3388] rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-900/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-bold">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>State Board Teacher Evaluation Center • விடைத்தாள் ஆய்வு</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Student Answer & Result Review
          </h2>
          <p className="text-xs sm:text-sm text-indigo-200/80 max-w-2xl">
            Inspect question-by-question student answers, verify AI scoring with official marking rubrics, adjust marks, and provide constructive feedback.
          </p>
        </div>

        {/* Quick Summary Badges */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-3 text-center min-w-[100px]">
            <span className="block text-2xl font-black text-white">{submissions.length}</span>
            <span className="text-[10px] font-semibold text-indigo-300 uppercase tracking-wider">Submissions</span>
          </div>
          <div className="bg-emerald-500/20 border border-emerald-400/30 rounded-2xl px-4 py-3 text-center min-w-[100px]">
            <span className="block text-2xl font-black text-emerald-300">
              {submissions.filter((s) => s.status === 'EVALUATED').length}
            </span>
            <span className="text-[10px] font-semibold text-emerald-200 uppercase tracking-wider">Evaluated</span>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* SUBMISSION DETAIL MODAL / ACTIVE INSPECTOR */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {selectedSubmission ? (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden animate-in fade-in duration-200">
          {/* Inspector Header */}
          <div className="bg-[#191735] text-white p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-indigo-900/60">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelectedSubmission(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition text-white cursor-pointer"
                title="Back to submissions list"
              >
                <X className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-white">{selectedSubmission.studentName}</h3>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 font-bold">
                    {selectedSubmission.className} • {selectedSubmission.subjectName}
                  </span>
                </div>
                <p className="text-xs text-indigo-200/70 mt-0.5">
                  {selectedSubmission.examTitle} • Submitted {selectedSubmission.submittedAt}
                </p>
              </div>
            </div>

            {/* Score & Actions */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
              <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 border border-white/10">
                <Trophy className="w-5 h-5 text-amber-400" />
                <div>
                  <div className="text-sm font-black text-white">
                    {Object.values(tempOverrides).reduce((a, b) => a + b, 0)} / {selectedSubmission.maxMarks} Marks
                  </div>
                  <div className="text-[10px] text-indigo-300 font-semibold">{selectedSubmission.grade}</div>
                </div>
              </div>

              <button
                onClick={handleSaveEvaluation}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#5B4DFB] hover:bg-[#4939f8] text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Evaluation</span>
              </button>
            </div>
          </div>

          {/* Success Toast */}
          {showSavedToast && (
            <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-3 flex items-center justify-between text-xs font-bold text-emerald-800 animate-in fade-in">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Evaluation and remarks saved successfully for {selectedSubmission.studentName}!</span>
              </div>
              <button onClick={() => setShowSavedToast(false)} className="text-emerald-600 hover:text-emerald-800">
                Dismiss
              </button>
            </div>
          )}

          {/* Question-by-Question Detailed Inspector */}
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#5B4DFB]" />
                <span>Question-by-Question Student Answers & Marking Breakdown</span>
              </h4>
              <span className="text-xs text-gray-500 font-medium">
                {selectedSubmission.questions.length} Questions Evaluated
              </span>
            </div>

            {selectedSubmission.questions.map((q, idx) => {
              const currentScore = tempOverrides[q.id] !== undefined ? tempOverrides[q.id] : q.aiMarksAwarded

              return (
                <div
                  key={q.id}
                  className="p-5 rounded-2xl border border-gray-200 bg-gray-50/60 hover:bg-white transition shadow-2xs space-y-4"
                >
                  {/* Question Header */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-xl bg-[#191735] text-white flex items-center justify-center text-xs font-bold">
                        {idx + 1}
                      </span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-[#5B4DFB] font-bold">
                        {q.type} Question
                      </span>
                    </div>

                    {/* Teacher Score Override Control */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600 font-medium">Marks Awarded:</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={0}
                          max={q.maxMarks}
                          step={q.maxMarks === 1 ? 1 : 0.5}
                          value={currentScore}
                          onChange={(e) => handleScoreChange(q.id, parseFloat(e.target.value) || 0, q.maxMarks)}
                          className="w-16 px-2.5 py-1 text-center font-bold text-xs bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                        <span className="text-xs font-bold text-gray-500">/ {q.maxMarks}</span>
                      </div>
                    </div>
                  </div>

                  {/* Question Text */}
                  <div className="text-sm font-bold text-gray-900 leading-relaxed">{q.questionText}</div>

                  {/* Student Answer Box */}
                  <div className="bg-white rounded-xl p-4 border border-gray-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                        <UserIcon className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Student's Submitted Answer:</span>
                      </span>
                      {q.type === 'MCQ' && (
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                            q.isCorrect ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {q.isCorrect ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                          {q.isCorrect ? 'Correct Option' : 'Incorrect Option'}
                        </span>
                      )}
                    </div>

                    {q.type === 'MCQ' ? (
                      <div className="space-y-1.5 pt-1">
                        {q.options?.map((opt, optIdx) => {
                          const isStudentSelected = q.studentOptionIndex === optIdx
                          const isCorrectOpt = q.correctOptionIndex === optIdx

                          return (
                            <div
                              key={optIdx}
                              className={`p-2.5 rounded-xl text-xs flex items-center justify-between border ${
                                isCorrectOpt
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                                  : isStudentSelected
                                  ? 'bg-rose-50 border-rose-300 text-rose-900 font-bold'
                                  : 'bg-gray-50 border-gray-100 text-gray-600'
                              }`}
                            >
                              <span>
                                {String.fromCharCode(65 + optIdx)}) {opt}
                              </span>
                              {isCorrectOpt && (
                                <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">
                                  Official Correct
                                </span>
                              )}
                              {isStudentSelected && !isCorrectOpt && (
                                <span className="text-[10px] bg-rose-600 text-white px-2 py-0.5 rounded-full font-bold">
                                  Student Choice
                                </span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-normal bg-indigo-50/40 p-3 rounded-xl border border-indigo-100/80">
                        {q.studentAnswerText || '(No answer provided by student)'}
                      </p>
                    )}
                  </div>

                  {/* Official Answer & Key Marking Points */}
                  {q.type !== 'MCQ' && (
                    <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-4 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Official Marking Key & State Board Model Answer:</span>
                      </div>
                      <p className="text-xs text-emerald-950 leading-relaxed">{q.correctAnswerText}</p>
                      <div className="pt-2 border-t border-emerald-200/60">
                        <span className="text-[11px] font-bold text-emerald-800 block mb-1">
                          Required Rubric Points:
                        </span>
                        <ul className="list-disc list-inside space-y-0.5 text-xs text-emerald-900">
                          {q.keyPoints.map((pt, pIdx) => (
                            <li key={pIdx}>{pt}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* AI Evaluation Analysis */}
                  <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3 flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-[#5B4DFB] shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold text-indigo-950 block">AI Evaluation Note:</span>
                      <p className="text-xs text-indigo-900/80 mt-0.5">{q.aiFeedback}</p>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Teacher Remarks Box */}
            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 space-y-3">
              <label className="text-xs font-bold text-gray-800 uppercase tracking-wider block">
                Teacher Overall Remarks & Feedback:
              </label>
              <textarea
                rows={3}
                value={teacherRemarks}
                onChange={(e) => setTeacherRemarks(e.target.value)}
                placeholder="Add constructive feedback, presentation tips, or appreciation for the student..."
                className="w-full p-3 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition"
              />
              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  onClick={handleSaveEvaluation}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#5B4DFB] hover:bg-[#4939f8] text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save & Notify Student</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ───────────────────────────────────────────────────────────── */
        /* SUBMISSION LIST TABLE */
        /* ───────────────────────────────────────────────────────────── */
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by student name, roll ID, or exam title..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="ALL">All Classes (9–12)</option>
                <option value="c-12">Class 12</option>
                <option value="c-11">Class 11</option>
                <option value="c-10">Class 10</option>
                <option value="c-9">Class 9</option>
              </select>

              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="ALL">All Subjects</option>
                <option value="bio">Biology</option>
                <option value="phy">Physics</option>
                <option value="chem">Chemistry</option>
                <option value="math">Mathematics</option>
                <option value="tam">Tamil (தமிழ்)</option>
                <option value="eng">English</option>
                <option value="cs">Computer Science</option>
                <option value="sci">Science</option>
              </select>

              <select
                value={examTypeFilter}
                onChange={(e) => setExamTypeFilter(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="ALL">All Exam Types</option>
                <option value="DESCRIPTIVE">2M/3M/5M Descriptive</option>
                <option value="MCQ">1-Mark MCQ Arena</option>
                <option value="MODEL_PAPER">Full Model Paper</option>
              </select>
            </div>
          </div>

          {/* Submissions Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="pb-3 px-3">Student</th>
                  <th className="pb-3 px-3">Class & Subject</th>
                  <th className="pb-3 px-3">Exam Title</th>
                  <th className="pb-3 px-3">Score & Percentage</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs sm:text-sm">
                {filteredSubmissions.length > 0 ? (
                  filteredSubmissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-gray-50/80 transition">
                      <td className="py-4 px-3 font-bold text-gray-900">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center text-xs font-bold shadow-2xs">
                            {sub.studentName.charAt(0)}
                          </div>
                          <div>
                            <span className="block">{sub.studentName}</span>
                            <span className="text-[11px] text-gray-400 font-normal">{sub.studentEmail}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-3 text-gray-700">
                        <span className="font-semibold block">{sub.className}</span>
                        <span className="text-[11px] text-gray-500">{sub.subjectName}</span>
                      </td>

                      <td className="py-4 px-3 text-gray-700 max-w-xs truncate">
                        <span className="font-medium block truncate">{sub.examTitle}</span>
                        <span className="text-[11px] text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {sub.submittedAt}
                        </span>
                      </td>

                      <td className="py-4 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-gray-900">
                            {sub.score} / {sub.maxMarks}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              sub.percentage >= 90
                                ? 'bg-emerald-100 text-emerald-800'
                                : sub.percentage >= 70
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {sub.percentage}%
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Evaluated</span>
                        </span>
                      </td>

                      <td className="py-4 px-3 text-right">
                        <button
                          onClick={() => handleOpenReview(sub)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#5B4DFB] hover:bg-[#4939f8] text-white text-xs font-bold transition shadow-2xs cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View & Evaluate</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400 text-xs">
                      No student submissions match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
