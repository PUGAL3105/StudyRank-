import { useState, useEffect, useRef } from 'react'
import {
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Sparkles,
  X,
  Languages,
  BookOpen,
  ChevronRight,
} from 'lucide-react'

export interface TermItem {
  id: string
  tamilTerm: string
  englishTerm: string
  transliteration: string
  syllables: string[]
  subject: 'Science' | 'Mathematics' | 'Social Science'
  chapter: string
  definitionTamil: string
  definitionEnglish: string
  difficulty: 'Easy' | 'Medium' | 'Advanced'
}

export const TAMIL_TERMS_GLOSSARY: TermItem[] = [
  // Science
  {
    id: 'term-sci-1',
    tamilTerm: 'நிலைமம்',
    englishTerm: 'Inertia',
    transliteration: 'Ni-lai-mam',
    syllables: ['நி', 'லை', 'மம்'],
    subject: 'Science',
    chapter: 'Laws of Motion (விசையும் இயக்கமும்)',
    definitionTamil: 'ஒரு பொருள் தனது ஓய்வு நிலையையோ அல்லது சீரான இயக்க நிலையையோ மாற்றிக்கொள்ள இயலாத தன்மை.',
    definitionEnglish: 'The inherent property of a body to resist any change in its state of rest or uniform motion.',
    difficulty: 'Easy',
  },
  {
    id: 'term-sci-2',
    tamilTerm: 'உந்தம்',
    englishTerm: 'Momentum',
    transliteration: 'Un-dham',
    syllables: ['உந்', 'தம்'],
    subject: 'Science',
    chapter: 'Laws of Motion (விசையும் இயக்கமும்)',
    definitionTamil: 'பொருளின் நிறை மற்றும் திசைவேகத்தின் பெருக்கற்பலன் உந்தம் எனப்படும் (p = mv).',
    definitionEnglish: 'The product of mass and velocity of a moving body (p = mv).',
    difficulty: 'Easy',
  },
  {
    id: 'term-sci-3',
    tamilTerm: 'ஒளிவிலகல்',
    englishTerm: 'Refraction of Light',
    transliteration: 'O-li-vi-la-gal',
    syllables: ['ஒ', 'ளி', 'வி', 'ல', 'கல்'],
    subject: 'Science',
    chapter: 'Optics (ஒளியியல்)',
    definitionTamil: 'ஒளிக்கதிர் ஓர் ஊடகத்திலிருந்து மற்றொரு அடர்வு மாறுபட்ட ஊடகத்திற்குச் செல்லும்போது திசை மாறுபடும் நிகழ்வு.',
    definitionEnglish: 'The bending of light rays when passing obliquely from one transparent medium to another.',
    difficulty: 'Medium',
  },
  {
    id: 'term-sci-4',
    tamilTerm: 'மின்னழுத்த வேறுபாடு',
    englishTerm: 'Potential Difference',
    transliteration: 'Min-na-zhuth-tha Vey-ru-paa-du',
    syllables: ['மின்', 'னழுத்', 'த', 'வேறு', 'பாடு'],
    subject: 'Science',
    chapter: 'Electricity (மின்னியல்)',
    definitionTamil: 'ஓரலகு நேர்மின்னூட்டத்தை ஒரு புள்ளியிலிருந்து மற்றொரு புள்ளிக்கு நகர்த்த செய்யப்படும் வேலை (V = W/Q).',
    definitionEnglish: 'Work done in moving a unit positive charge from one point to another in an electric field.',
    difficulty: 'Advanced',
  },
  {
    id: 'term-sci-5',
    tamilTerm: 'ஒலியியல்',
    englishTerm: 'Acoustics',
    transliteration: 'O-li-yi-yal',
    syllables: ['ஒ', 'லி', 'யி', 'யல்'],
    subject: 'Science',
    chapter: 'Acoustics (ஒலியியல்)',
    definitionTamil: 'ஒலியின் உருவாக்கம், பரவுதல் மற்றும் அதன் பயன்பாடுகளைப் பற்றி ஆராயும் இயற்பியல் பிரிவு.',
    definitionEnglish: 'The branch of physics that deals with the study of production, transmission, and effects of sound.',
    difficulty: 'Easy',
  },

  // Mathematics
  {
    id: 'term-math-1',
    tamilTerm: 'கார்ட்டீசியன் பெருக்கல்',
    englishTerm: 'Cartesian Product',
    transliteration: 'Car-tee-si-yan Pe-ruk-kal',
    syllables: ['கார்', 'ட்டீ', 'சி', 'யன்', 'பெ', 'ருக்', 'கல்'],
    subject: 'Mathematics',
    chapter: 'Relations and Functions (உறவுகளும் சார்புகளும்)',
    definitionTamil: 'A மற்றும் B ஆகிய வெற்றில்லா கணங்களின் அனைத்து வரிசைச் சோடிகளின் கணம் (A x B).',
    definitionEnglish: 'The set of all possible ordered pairs (a, b) from non-empty sets A and B.',
    difficulty: 'Medium',
  },
  {
    id: 'term-math-2',
    tamilTerm: 'சார்புகள்',
    englishTerm: 'Functions',
    transliteration: 'Saar-bu-gal',
    syllables: ['சார்', 'பு', 'கள்'],
    subject: 'Mathematics',
    chapter: 'Relations and Functions (உறவுகளும் சார்புகளும்)',
    definitionTamil: 'மதிப்பகத்திலுள்ள ஒவ்வொரு உறுப்பிற்கும் துணை மதிப்பகத்தில் ஒரே ஒரு நிழல் உரு மட்டுமே உள்ள உறவு.',
    definitionEnglish: 'A relation where each element in the domain has exactly one unique image in the co-domain.',
    difficulty: 'Easy',
  },
  {
    id: 'term-math-3',
    tamilTerm: 'கூட்டுத்தொடர் வரிசை',
    englishTerm: 'Arithmetic Progression (AP)',
    transliteration: 'Koottu-th-tho-dar Va-ri-sai',
    syllables: ['கூட்', 'டுத்', 'தொ', 'டர்', 'வரி', 'சை'],
    subject: 'Mathematics',
    chapter: 'Numbers and Sequences (எண்களும் தொடர்வரிசைகளும்)',
    definitionTamil: 'ஒவ்வொரு உறுப்பும் அதன் முந்தைய உறுப்புடன் ஒரு குறிப்பிட்ட மாறா எண்ணைக் கூட்டுவதன் மூலம் பெறப்படும் தொடர்.',
    definitionEnglish: 'A sequence in which each term is obtained by adding a fixed constant difference to the preceding term.',
    difficulty: 'Medium',
  },
  {
    id: 'term-math-4',
    tamilTerm: 'தேல்ஸ் தேற்றம்',
    englishTerm: 'Thales Theorem (BPT)',
    transliteration: 'Thales They-t-ram',
    syllables: ['தேல்ஸ்', 'தேற்', 'றம்'],
    subject: 'Mathematics',
    chapter: 'Geometry (வடிவியல்)',
    definitionTamil: 'ஒரு முக்கோணத்தின் ஒரு பக்கத்திற்கு இணையாக வரையப்படும் கோடு மற்ற இரு பக்கங்களையும் சம விகிதத்தில் பிரிக்கும்.',
    definitionEnglish: 'A straight line drawn parallel to a side of a triangle divides the other two sides in the same ratio.',
    difficulty: 'Medium',
  },
  {
    id: 'term-math-5',
    tamilTerm: 'இருபடிச் சமன்பாடு',
    englishTerm: 'Quadratic Equation',
    transliteration: 'I-ru-ba-di-ch Sa-man-paa-du',
    syllables: ['இரு', 'ப', 'டிச்', 'சமன்', 'பாடு'],
    subject: 'Mathematics',
    chapter: 'Algebra (இயற்கணிதம்)',
    definitionTamil: 'ax^2 + bx + c = 0 (a ≠ 0) வடிவில் அமையும் படி இரண்டு கொண்ட பல்லுறுப்புக் கோவை சமன்பாடு.',
    definitionEnglish: 'A polynomial equation of degree two in the form ax^2 + bx + c = 0 where a ≠ 0.',
    difficulty: 'Medium',
  },

  // Social Science
  {
    id: 'term-soc-1',
    tamilTerm: 'அரசியலமைப்பு',
    englishTerm: 'Constitution',
    transliteration: 'A-ra-si-ya-la-mai-ppu',
    syllables: ['அ', 'ர', 'சி', 'ய', 'ல', 'மைப்', 'பு'],
    subject: 'Social Science',
    chapter: 'Indian Constitution (இந்திய அரசியலமைப்பு)',
    definitionTamil: 'ஒரு நாட்டின் நிர்வாகத்தை வழிநடத்தும் அடிப்படை கொள்கைகள் மற்றும் சட்டங்களின் தொகுப்பு.',
    definitionEnglish: 'The fundamental law and supreme legal document governing the state and citizen rights.',
    difficulty: 'Easy',
  },
  {
    id: 'term-soc-2',
    tamilTerm: 'முகவுரை',
    englishTerm: 'Preamble',
    transliteration: 'Mu-ga-vu-rai',
    syllables: ['மு', 'க', 'வு', 'ரை'],
    subject: 'Social Science',
    chapter: 'Indian Constitution (இந்திய அரசியலமைப்பு)',
    definitionTamil: 'அரசியலமைப்பின் அறிமுகம் அல்லது முன்னுரை; அரசியலமைப்பின் திறவுகோல் என அழைக்கப்படுகிறது.',
    definitionEnglish: 'The introductory statement outlining the core philosophy, ideals, and objectives of the Constitution.',
    difficulty: 'Easy',
  },
  {
    id: 'term-soc-3',
    tamilTerm: 'உள்நாட்டு உற்பத்தி',
    englishTerm: 'Gross Domestic Product (GDP)',
    transliteration: 'Ul-naattu Ur-path-thi',
    syllables: ['உள்', 'நாட்', 'டு', 'உற்', 'பத்', 'தி'],
    subject: 'Social Science',
    chapter: 'Gross Domestic Product (மொத்த உள்நாட்டு உற்பத்தி)',
    definitionTamil: 'ஒரு குறிப்பிட்ட காலத்தில் ஒரு நாட்டில் உற்பத்தி செய்யப்பட்ட அனைத்து இறுதிப் பண்டங்கள் மற்றும் பணிகளின் மொத்த சந்தை மதிப்பு.',
    definitionEnglish: 'The total monetary value of all finished goods and services produced within a country in a specific time.',
    difficulty: 'Medium',
  },
  {
    id: 'term-soc-4',
    tamilTerm: 'அடிப்படை உரிமைகள்',
    englishTerm: 'Fundamental Rights',
    transliteration: 'A-di-p-pa-dai U-ri-mai-gal',
    syllables: ['அ', 'டிப்', 'ப', 'டை', 'உரி', 'மை', 'கள்'],
    subject: 'Social Science',
    chapter: 'Indian Constitution (இந்திய அரசியலமைப்பு)',
    definitionTamil: 'இந்திய அரசியலமைப்பு பகுதி III-ல் (சரத்துகள் 12-35) குடிமக்களுக்கு உறுதிப்படுத்தப்பட்ட அடிப்படை உரிமைகள்.',
    definitionEnglish: 'Guaranteed civil rights in Part III (Articles 12-35) enforceable directly by the Supreme Court.',
    difficulty: 'Easy',
  },
]

interface TamilPronunciationCoachProps {
  isOpen: boolean
  onClose: () => void
}

export default function TamilPronunciationCoach({ isOpen, onClose }: TamilPronunciationCoachProps) {
  const [selectedSubject, setSelectedSubject] = useState<'All' | 'Science' | 'Mathematics' | 'Social Science'>('All')
  const [selectedTerm, setSelectedTerm] = useState<TermItem>(TAMIL_TERMS_GLOSSARY[0])
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false)
  const [isRecording, setIsRecording] = useState<boolean>(false)
  const [spokenTranscript, setSpokenTranscript] = useState<string>('')
  const [practiceResult, setPracticeResult] = useState<{ score: number; status: 'excellent' | 'good' | 'retry'; message: string } | null>(null)
  const [speechSpeed, setSpeechSpeed] = useState<number>(0.85)

  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    setPracticeResult(null)
    setSpokenTranscript('')
  }, [selectedTerm])

  // Text to Speech Function (Tamil synthesis)
  const handleSpeakTerm = (textToSpeak: string, rate: number = 0.85) => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser.')
      return
    }

    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(textToSpeak)
    utterance.lang = 'ta-IN'
    utterance.rate = rate

    // Look for Tamil voice if available
    const voices = window.speechSynthesis.getVoices()
    const tamilVoice = voices.find((v) => v.lang.includes('ta') || v.name.toLowerCase().includes('tamil'))
    if (tamilVoice) {
      utterance.voice = tamilVoice
    }

    utterance.onstart = () => setIsPlayingAudio(true)
    utterance.onend = () => setIsPlayingAudio(false)
    utterance.onerror = () => setIsPlayingAudio(false)

    window.speechSynthesis.speak(utterance)
  }

  const handleStopAudio = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      setIsPlayingAudio(false)
    }
  }

  // Practice Speaking (Speech to Text in Tamil)
  const handleStartPractice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in your browser. Please use Google Chrome or Chromium.')
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.lang = 'ta-IN'
      recognition.continuous = false
      recognition.interimResults = false

      recognition.onstart = () => {
        setIsRecording(true)
        setPracticeResult(null)
        setSpokenTranscript('')
      }

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.trim()
        setSpokenTranscript(transcript)
        evaluatePronunciation(transcript, selectedTerm.tamilTerm)
      }

      recognition.onerror = () => {
        setIsRecording(false)
      }

      recognition.onend = () => {
        setIsRecording(false)
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch {
      setIsRecording(false)
    }
  }

  const handleStopPractice = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsRecording(false)
    }
  }

  // Evaluate pronunciation similarity
  const evaluatePronunciation = (spoken: string, target: string) => {
    const cleanSpoken = spoken.toLowerCase().replace(/[\s\-_,.]/g, '')
    const cleanTarget = target.toLowerCase().replace(/[\s\-_,.]/g, '')

    let score = 0
    if (cleanSpoken === cleanTarget) {
      score = 100
    } else if (cleanSpoken.includes(cleanTarget) || cleanTarget.includes(cleanSpoken)) {
      score = 85
    } else {
      // Character overlap score
      let match = 0
      for (const char of cleanTarget) {
        if (cleanSpoken.includes(char)) match++
      }
      score = Math.min(80, Math.round((match / Math.max(cleanTarget.length, 1)) * 100))
    }

    if (score >= 90) {
      setPracticeResult({
        score,
        status: 'excellent',
        message: '🎉 மிகச்சிறந்த உச்சரிப்பு! (Excellent Pronunciation! Accurate and clear.)',
      })
    } else if (score >= 60) {
      setPracticeResult({
        score,
        status: 'good',
        message: '👍 நன்று! (Good try! Practice the syllable breakdown to achieve perfection.)',
      })
    } else {
      setPracticeResult({
        score: Math.max(score, 35),
        status: 'retry',
        message: '🔄 மீண்டும் முயற்சி செய்க. (Listen to the audio slowly and try pronouncing each syllable.)',
      })
    }
  }

  const filteredTerms = TAMIL_TERMS_GLOSSARY.filter((t) =>
    selectedSubject === 'All' ? true : t.subject === selectedSubject
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150 font-sans">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-inner">
              <Languages className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                  தமிழ் உச்சரிப்பு வழிகாட்டி
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-white/20 text-white">
                  Tamil Voice Coach
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-0.5">
                Tamil Nadu State Board Curriculum • Technical Pronunciation & Audio Practice
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              handleStopAudio()
              handleStopPractice()
              onClose()
            }}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Layout */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-gray-200">
          {/* Left Sidebar: Term List */}
          <div className="md:col-span-5 flex flex-col h-full bg-slate-50 overflow-hidden">
            {/* Subject Filter Tabs */}
            <div className="p-3 border-b border-gray-200 flex items-center gap-1.5 overflow-x-auto shrink-0">
              {(['All', 'Science', 'Mathematics', 'Social Science'] as const).map((sub) => (
                <button
                  key={sub}
                  onClick={() => setSelectedSubject(sub)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
                    selectedSubject === sub
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-gray-700 hover:bg-gray-200/70 border border-gray-200'
                  }`}
                >
                  {sub === 'All' ? 'அனைத்தும் (All)' : sub}
                </button>
              ))}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {filteredTerms.map((term) => {
                const isSelected = selectedTerm.id === term.id
                return (
                  <button
                    key={term.id}
                    onClick={() => {
                      setSelectedTerm(term)
                      handleStopAudio()
                      handleStopPractice()
                    }}
                    className={`w-full p-3.5 rounded-2xl text-left transition-all border flex items-center justify-between group ${
                      isSelected
                        ? 'bg-white border-blue-600 shadow-md ring-2 ring-blue-500/20'
                        : 'bg-white/80 border-gray-200 hover:border-gray-300 hover:bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-gray-900">{term.tamilTerm}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            term.difficulty === 'Easy'
                              ? 'bg-emerald-50 text-emerald-700'
                              : term.difficulty === 'Medium'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-purple-50 text-purple-700'
                          }`}
                        >
                          {term.difficulty}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-gray-500 mt-0.5">{term.englishTerm}</p>
                      <p className="text-[11px] text-blue-600 font-semibold">{term.subject}</p>
                    </div>

                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-gray-400 group-hover:text-blue-600'
                      }`}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Right Main Pane: Interactive Coach Player */}
          <div className="md:col-span-7 flex flex-col h-full bg-white overflow-y-auto p-5 sm:p-7 space-y-6">
            {/* Header info */}
            <div className="border-b border-gray-100 pb-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                  {selectedTerm.chapter}
                </span>

                {/* Speed Toggle */}
                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
                  <span>Speed:</span>
                  {[0.75, 0.85, 1.0].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => setSpeechSpeed(rate)}
                      className={`px-2 py-0.5 rounded-md text-[11px] ${
                        speechSpeed === rate ? 'bg-blue-600 text-white font-bold' : 'bg-slate-100 hover:bg-slate-200'
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Big Tamil Word Display */}
              <div className="pt-2">
                <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
                  {selectedTerm.tamilTerm}
                </h1>
                <p className="text-sm font-bold text-gray-500 mt-1">
                  {selectedTerm.englishTerm} •{' '}
                  <span className="text-indigo-600 italic">/{selectedTerm.transliteration}/</span>
                </p>
              </div>
            </div>

            {/* Syllable Breakdown */}
            <div className="bg-slate-50 border border-gray-200 rounded-2xl p-4 sm:p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>அசை வாரியாகப் பிரித்தல் (Syllable Breakdown)</span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {selectedTerm.syllables.map((syl, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSpeakTerm(syl, 0.7)}
                    className="px-4 py-2 bg-white hover:bg-blue-50 border-2 border-blue-200 hover:border-blue-500 rounded-xl font-black text-lg sm:text-xl text-blue-900 shadow-xs transition-all active:scale-95 flex items-center gap-1.5 group"
                    title={`Click to listen to syllable: ${syl}`}
                  >
                    <span>{syl}</span>
                    <Volume2 className="w-3.5 h-3.5 text-blue-400 group-hover:text-blue-600" />
                  </button>
                ))}
              </div>
            </div>

            {/* Audio Listen & Practice Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Listen Button */}
              <button
                onClick={() => (isPlayingAudio ? handleStopAudio() : handleSpeakTerm(selectedTerm.tamilTerm, speechSpeed))}
                className={`p-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2.5 shadow-sm ${
                  isPlayingAudio
                    ? 'bg-amber-600 hover:bg-amber-700 text-white animate-pulse'
                    : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-md'
                }`}
              >
                {isPlayingAudio ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                <span>{isPlayingAudio ? 'நிறுத்துக (Stop Audio)' : 'உச்சரிப்பைக் கேட்க (Listen Pronunciation)'}</span>
              </button>

              {/* Speak & Test Button */}
              <button
                onClick={() => (isRecording ? handleStopPractice() : handleStartPractice())}
                className={`p-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2.5 shadow-sm border ${
                  isRecording
                    ? 'bg-rose-600 text-white border-rose-700 animate-pulse'
                    : 'bg-white hover:bg-emerald-50 text-emerald-700 border-emerald-300 hover:border-emerald-500'
                }`}
              >
                {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                <span>{isRecording ? 'பேசுவதை நிறுத்துக (Stop)' : 'பேசிப் பழக (Practice Speaking)'}</span>
              </button>
            </div>

            {/* Live Feedback Score Banner */}
            {practiceResult && (
              <div
                className={`p-4 rounded-2xl border flex items-start gap-3.5 animate-in fade-in duration-200 ${
                  practiceResult.status === 'excellent'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : practiceResult.status === 'good'
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-extrabold text-sm ${
                    practiceResult.status === 'excellent'
                      ? 'bg-emerald-600 text-white'
                      : practiceResult.status === 'good'
                      ? 'bg-amber-600 text-white'
                      : 'bg-rose-600 text-white'
                  }`}
                >
                  {practiceResult.score}%
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm">
                      {practiceResult.status === 'excellent'
                        ? 'Excellent Match!'
                        : practiceResult.status === 'good'
                        ? 'Good Attempt'
                        : 'Practice Needed'}
                    </span>
                    {spokenTranscript && (
                      <span className="text-xs text-gray-500 italic">
                        (Detected: "{spokenTranscript}")
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-medium leading-relaxed">{practiceResult.message}</p>
                </div>
              </div>
            )}

            {/* Definitions & Textbook Context */}
            <div className="bg-slate-50 border border-gray-200 rounded-2xl p-5 space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-gray-600 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span>பாடநூல் விளக்கம் (Textbook Definition)</span>
              </h4>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-900 leading-relaxed">
                  {selectedTerm.definitionTamil}
                </p>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {selectedTerm.definitionEnglish}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
