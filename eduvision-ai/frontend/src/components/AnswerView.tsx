import { useState } from 'react'
import { BookOpen, Sparkles, CheckCircle, Globe, Lightbulb, ListOrdered, FileText, ArrowLeft, Image as ImageIcon, Film, HelpCircle } from 'lucide-react'
import DiagramViewer from './DiagramViewer'
import VideoPlayer from './VideoPlayer'
import QuizComponent from './QuizComponent'

interface AnswerData {
  question: string
  explanation: string
  keyPoints: string[]
  stepByStep?: string[]
  realLifeExample?: string
  source: {
    book: string
    class: string
    subject: string
    chapter: string
    page: number
  }
}

interface AnswerViewProps {
  data: AnswerData
  onBackToDashboard?: () => void
}

export default function AnswerView({ data, onBackToDashboard }: AnswerViewProps) {
  const [lang, setLang] = useState<'en' | 'ta' | 'hi'>('en')
  const [activeTab, setActiveTab] = useState<'explanation' | 'diagram' | 'video' | 'quiz'>('explanation')

  // Multilingual Explanations for demo
  const getExplanation = () => {
    if (lang === 'ta') {
      return {
        exp: `தாவரங்கள் சூரிய ஒளி, நீர் மற்றும் கார்ப்பன் டை ஆக்சைடு ஆகியவற்றைப் பயன்படுத்தி உணவைத் தயாரிக்கின்றன. இந்த உயிரியல் செயல்முறை 'ஒளிச்சேர்க்கை' என அழைக்கப்படுகிறது. இலைகளில் உள்ள பச்சையம் சூரிய ஒளியைக் கவர்கிறது.`,
        points: [
          'சூரிய ஒளி மற்றும் பச்சையம் இலைகளில் உணவை உருவாக்குகின்றன.',
          'வேர்கள் நீரை உறிஞ்சி இலைகளுக்கு அனுப்புகின்றன.',
          'ஒளிச்சேர்க்கையின் போது மனிதர்களுக்கு தேவையான ஆக்சிஜன் வெளியாகிறது.'
        ],
        steps: [
          'படி 1: வேர்கள் மண்ணிலிருந்து நீரை உறிஞ்சுகின்றன.',
          'படி 2: இலைகள் காற்றிலிருந்து கார்ப்பன் டை ஆக்சைடை நுண் துளைகள் வழியே பெறுகின்றன.',
          'படி 3: சூரிய ஒளி இலைகளின் பச்சையத்தால் உணவாக மாற்றப்படுகிறது.'
        ],
        example: 'நாம் சமையலறையில் உணவு சமைப்பது போல, தாவரங்கள் தங்கள் இலைகளை சமையலறையாகப் பயன்படுத்தி சூரிய ஒளியில் உணவு தயாரிக்கின்றன.'
      }
    }
    if (lang === 'hi') {
      return {
        exp: `पौधे सूर्य के प्रकाश, पानी और कार्बन डाइऑक्साइड का उपयोग करके अपना भोजन स्वयं बनाते हैं। इस प्रक्रिया को प्रकाश संश्लेषण (Photosynthesis) कहा जाता है। पत्तियों में मौजूद क्लोरोफिल सूर्य के प्रकाश को अवशोषित करता है।`,
        points: [
          'क्लोरोफिल सूर्य के प्रकाश की ऊर्जा को कैप्चर करता है।',
          'जड़ें मिट्टी से जल अवशोषित कर पत्तियों तक पहुंचाती हैं।',
          'इस प्रक्रिया के दौरान पर्यावरण में ऑक्सीजन गैस निकलती है।'
        ],
        steps: [
          'चरण 1: जड़ें मिट्टी से जल अवशोषित करती हैं।',
          'चरण 2: पत्तियां हवा से कार्बन डाइऑक्साइड लेती हैं।',
          'चरण 3: सूर्य का प्रकाश भोजन ऊर्जा में बदल जाता है।'
        ],
        example: 'जैसे हमारे घरों में सौर ऊर्जा से खाना बनता है, वैसे ही पौधे सूरज की किरणों से अपनी रसोई यानी पत्तियों में भोजन बनाते हैं।'
      }
    }

    return {
      exp: data.explanation || `Plants convert sunlight, carbon dioxide, and water into food energy. This fundamental process takes place inside the chloroplasts of green leaves, where chlorophyll pigments absorb solar radiation.`,
      points: data.keyPoints || [
        'Chlorophyll in green leaves captures radiant energy from sunlight.',
        'Water absorbed by roots combines with carbon dioxide absorbed by stomata.',
        'Glucose is created for growth and oxygen is released as a vital byproduct.'
      ],
      steps: data.stepByStep || [
        'Step 1: Water absorption by roots and capillary transport up the stem.',
        'Step 2: Carbon dioxide intake through microscopic pores called stomata.',
        'Step 3: Solar light activation of chlorophyll leading to glucose synthesis.'
      ],
      example: data.realLifeExample || 'Think of a green leaf like a solar-powered kitchen: sunlight acts as the stove power, water and CO2 are ingredients, and glucose is the prepared meal!'
    }
  }

  const currentContent = getExplanation()

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Header Controls */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToDashboard}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Ask Question
        </button>

        {/* Language Switcher */}
        <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg p-1">
          <Globe className="w-4 h-4 text-gray-500 ml-2" />
          <span className="text-xs text-gray-500 font-medium">Language:</span>
          {(['en', 'ta', 'hi'] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                lang === l ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {l === 'en' ? 'English' : l === 'ta' ? 'தமிழ்' : 'हिंदी'}
            </button>
          ))}
        </div>
      </div>

      {/* Student Question Card */}
      <div className="bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary-600 text-white rounded-lg flex-shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-primary-700 uppercase tracking-wider">Student Question</span>
            <h2 className="text-lg font-bold text-gray-900 mt-0.5">{data.question}</h2>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 bg-white rounded-t-xl px-4 pt-2">
        <button
          onClick={() => setActiveTab('explanation')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'explanation' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <FileText className="w-4 h-4" /> Textbook Explanation
        </button>
        <button
          onClick={() => setActiveTab('diagram')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'diagram' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <ImageIcon className="w-4 h-4" /> Interactive Diagram
        </button>
        <button
          onClick={() => setActiveTab('video')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'video' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Film className="w-4 h-4" /> Lesson Video
        </button>
        <button
          onClick={() => setActiveTab('quiz')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'quiz' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <HelpCircle className="w-4 h-4" /> Practice Quiz
        </button>
      </div>

      {/* Tab Content 1: Explanation */}
      {activeTab === 'explanation' && (
        <div className="space-y-6">
          {/* Simple Humanized Explanation */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-3">
              <BookOpen className="w-5 h-5 text-primary-600" /> Simple Natural Explanation
            </h3>
            <p className="text-gray-700 leading-relaxed text-sm">{currentContent.exp}</p>
          </div>

          {/* Key Points Grid */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-secondary-600" /> Key Takeaway Points
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              {currentContent.points.map((pt, idx) => (
                <div key={idx} className="p-4 bg-secondary-50/60 border border-secondary-200 rounded-lg">
                  <span className="inline-block w-6 h-6 rounded-full bg-secondary-600 text-white text-xs font-bold text-center leading-6 mb-2">
                    {idx + 1}
                  </span>
                  <p className="text-xs text-secondary-900 font-medium leading-normal">{pt}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Step-by-Step Breakdown */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-4">
              <ListOrdered className="w-5 h-5 text-primary-600" /> Step-by-Step Breakdown
            </h3>
            <div className="space-y-3">
              {currentContent.steps.map((st, idx) => (
                <div key={idx} className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 flex items-start gap-3">
                  <span className="px-2 py-0.5 bg-primary-100 text-primary-800 text-xs font-bold rounded flex-shrink-0 mt-0.5">
                    Step {idx + 1}
                  </span>
                  <p>{st}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Real Life Relatable Example */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-amber-900 flex items-center gap-2 mb-2">
              <Lightbulb className="w-5 h-5 text-amber-600" /> Real-Life Relatable Example
            </h3>
            <p className="text-sm text-amber-800 leading-relaxed">{currentContent.example}</p>
          </div>

          {/* Verifiable Textbook Source Citation */}
          <div className="bg-gray-900 text-white rounded-xl p-5 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-primary-400" />
              <div>
                <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Verifiable Textbook Citation</span>
                <p className="text-sm font-semibold text-white">
                  {data.source.book} — {data.source.class} ({data.source.subject})
                </p>
                <p className="text-xs text-gray-300 mt-0.5">
                  {data.source.chapter} · <span className="text-primary-300 font-mono font-bold">Page {data.source.page}</span>
                </p>
              </div>
            </div>
            <span className="text-xs px-3 py-1 bg-gray-800 text-primary-300 border border-gray-700 rounded-full font-mono">
              Grounded Citation
            </span>
          </div>
        </div>
      )}

      {/* Tab Content 2: Diagram */}
      {activeTab === 'diagram' && <DiagramViewer topic={data.source.chapter} />}

      {/* Tab Content 3: Video */}
      {activeTab === 'video' && <VideoPlayer topic={`${data.source.chapter} Visual Demonstration`} />}

      {/* Tab Content 4: Quiz */}
      {activeTab === 'quiz' && <QuizComponent chapterTitle={data.source.chapter} />}
    </div>
  )
}
