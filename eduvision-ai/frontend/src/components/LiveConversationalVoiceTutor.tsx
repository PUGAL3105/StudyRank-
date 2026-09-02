import React, { useState, useEffect, useRef } from 'react'
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  X,
  BookOpen,
  Globe,
  Radio
} from 'lucide-react'
import axios from 'axios'

interface LiveConversationalVoiceTutorProps {
  isOpen: boolean
  onClose: () => void
  currentChapterId?: string
  currentChapterName?: string
  classLevel?: string
  subjectName?: string
}

export const LiveConversationalVoiceTutor: React.FC<LiveConversationalVoiceTutorProps> = ({
  isOpen,
  onClose,
  currentChapterId = 'ch-10sci-t1-1',
  currentChapterName = 'Laws of Motion',
  classLevel = 'Class 10',
  subjectName = 'Science',
}) => {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const [language, setLanguage] = useState<'en' | 'ta'>('en')
  const [turns, setTurns] = useState<any[]>([])
  const [interimTranscript, setInterimTranscript] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const recognitionRef = useRef<any>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const transcriptEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      startSession()
    } else {
      stopVoiceEngine()
    }
    return () => {
      stopVoiceEngine()
    }
  }, [isOpen, currentChapterId, language])

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [turns, interimTranscript])

  const startSession = async () => {
    try {
      setErrorMsg(null)
      const res = await axios.post('/api/voice/session/start', {
        classLevel,
        subjectName,
        chapterId: currentChapterId,
        language,
      })

      if (res.data?.success) {
        const sess = res.data.data
        setSessionId(sess.sessionId)
        setTurns(sess.turns || [])

        // Speak initial greeting
        if (sess.turns && sess.turns.length > 0) {
          const initText = language === 'ta' && sess.turns[0].tamilText ? sess.turns[0].tamilText : sess.turns[0].spokenText
          speakTutorResponse(initText)
        }

        startSpeechRecognition()
      }
    } catch (err: any) {
      console.error('Failed to start voice session:', err)
      setErrorMsg('Could not initialize voice session.')
    }
  }

  const startSpeechRecognition = () => {
    if (typeof window === 'undefined') return
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setErrorMsg('Speech recognition is not supported in this browser. Please use Chrome.')
      return
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {}
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = language === 'ta' ? 'ta-IN' : 'en-IN'

    recognition.onstart = () => {
      setIsListening(true)
    }

    recognition.onresult = (event: any) => {
      // If tutor is currently speaking and user speaks -> Interrupt immediately!
      if (isSpeaking) {
        interruptSpeech()
      }

      let currentInterim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          setInterimTranscript('')
          handleFinalUserSpoken(transcript)
        } else {
          currentInterim += transcript
        }
      }
      setInterimTranscript(currentInterim)
    }

    recognition.onerror = (event: any) => {
      if (event.error !== 'no-speech') {
        console.warn('Speech recognition warning:', event.error)
      }
    }

    recognition.onend = () => {
      if (isOpen && !isThinking) {
        try {
          recognition.start()
        } catch {}
      } else {
        setIsListening(false)
      }
    }

    try {
      recognition.start()
      recognitionRef.current = recognition
    } catch (e) {
      console.error('Failed to start recognition:', e)
    }
  }

  const interruptSpeech = () => {
    if (synthRef.current) {
      synthRef.current.cancel()
    }
    setIsSpeaking(false)
  }

  const stopVoiceEngine = () => {
    interruptSpeech()
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {}
      recognitionRef.current = null
    }
    setIsListening(false)
  }

  const handleFinalUserSpoken = async (spokenText: string) => {
    const text = spokenText.trim()
    if (!text || !sessionId) return

    setIsThinking(true)
    setInterimTranscript('')

    // Append student turn immediately to UI
    const tempStudentTurn = {
      turnId: `temp-${Date.now()}`,
      speaker: 'student',
      spokenText: text,
      language,
      timestamp: new Date().toISOString(),
    }
    setTurns((prev) => [...prev, tempStudentTurn])

    try {
      const res = await axios.post('/api/voice/session/turn', {
        sessionId,
        transcript: text,
        language,
      })

      if (res.data?.success) {
        const tutorTurn = res.data.data
        setTurns((prev) => [...prev.filter((t) => t.turnId !== tempStudentTurn.turnId), tempStudentTurn, tutorTurn])

        const textToSpeak = language === 'ta' && tutorTurn.tamilText ? tutorTurn.tamilText : tutorTurn.spokenText
        speakTutorResponse(textToSpeak)
      }
    } catch (err: any) {
      console.error('Failed to process voice turn:', err)
    } finally {
      setIsThinking(false)
    }
  }

  const speakTutorResponse = (text: string) => {
    if (!synthRef.current) return

    synthRef.current.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = language === 'ta' ? 'ta-IN' : 'en-IN'
    utterance.rate = 0.95
    utterance.pitch = 1.05

    utterance.onstart = () => {
      setIsSpeaking(true)
    }

    utterance.onend = () => {
      setIsSpeaking(false)
      // Resume listening
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start()
        } catch {}
      }
    }

    utterance.onerror = () => {
      setIsSpeaking(false)
    }

    activeUtteranceRef.current = utterance
    synthRef.current.speak(utterance)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
      <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col h-[650px] relative text-white">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Radio className="w-5 h-5 text-white animate-pulse" />
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-slate-950" />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">Live AI Conversational Voice Tutor</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  Full-Duplex VAD
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {classLevel} • {subjectName} ({currentChapterName})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Toggle */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'ta' : 'en')}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-700 text-slate-200"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>{language === 'en' ? 'English' : 'தமிழ்'}</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {errorMsg && (
          <div className="bg-rose-500/20 border-b border-rose-500/30 text-rose-200 text-xs px-4 py-2 text-center font-medium">
            {errorMsg}
          </div>
        )}

        {/* Animated Waveform & Active Voice Status Indicator */}
        <div className="py-6 px-6 bg-gradient-to-b from-slate-900/50 to-transparent flex flex-col items-center justify-center border-b border-slate-800/80">
          <div className="flex items-center gap-1.5 h-16 mb-3">
            {[40, 65, 85, 95, 75, 45, 80, 100, 70, 50, 90, 60, 30].map((h, i) => (
              <span
                key={i}
                style={{
                  height: isSpeaking
                    ? `${Math.max(15, h * (0.6 + Math.sin(Date.now() / 200 + i) * 0.4))}%`
                    : isListening
                    ? `${Math.max(10, (h * 0.3) * (0.8 + Math.cos(Date.now() / 300 + i) * 0.2))}%`
                    : '8%',
                }}
                className={`w-1.5 rounded-full transition-all duration-150 ${
                  isSpeaking
                    ? 'bg-gradient-to-t from-cyan-500 to-blue-400 shadow-md shadow-cyan-500/50'
                    : isListening
                    ? 'bg-gradient-to-t from-emerald-500 to-teal-300'
                    : isThinking
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-slate-700'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold">
            {isSpeaking && (
              <span className="text-cyan-300 flex items-center gap-1.5 animate-pulse">
                <Volume2 className="w-4 h-4" /> Speaking textbook lesson... (You can speak anytime to interrupt)
              </span>
            )}
            {isListening && !isSpeaking && !isThinking && (
              <span className="text-emerald-400 flex items-center gap-1.5">
                <Mic className="w-4 h-4" /> Listening naturally... Speak your questions freely!
              </span>
            )}
            {isThinking && (
              <span className="text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 animate-spin" /> Grounding textbook explanation...
              </span>
            )}
            {!isListening && !isSpeaking && !isThinking && (
              <span className="text-slate-400">Microphone paused. Click below to speak.</span>
            )}
          </div>
        </div>

        {/* Live Conversation Transcript Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {turns.map((turn, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${turn.speaker === 'student' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3.5 space-y-1.5 ${
                  turn.speaker === 'student'
                    ? 'bg-blue-600 text-white rounded-tr-xs shadow-md'
                    : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-xs'
                }`}
              >
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-300">
                  <span>{turn.speaker === 'student' ? 'You (Student)' : 'AI Voice Tutor'}</span>
                  <span>•</span>
                  <span>{new Date(turn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                <p className="text-xs leading-relaxed font-medium">
                  {language === 'ta' && turn.tamilText ? turn.tamilText : turn.spokenText}
                </p>

                {/* Grounding Source Citation Chip */}
                {turn.grounding && (
                  <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-cyan-300 font-semibold">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      {turn.grounding.chapterName} (Page {turn.grounding.sourcePage || 1})
                    </span>
                    <span className="bg-cyan-950/60 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-800/40">
                      Grounded
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Interim Real-Time Transcript */}
          {interimTranscript && (
            <div className="flex flex-col items-end">
              <div className="max-w-[85%] rounded-2xl p-3 bg-blue-600/50 text-blue-100 italic rounded-tr-xs border border-blue-400/30 animate-pulse">
                {interimTranscript}...
              </div>
            </div>
          )}

          <div ref={transcriptEndRef} />
        </div>

        {/* Bottom Control Bar */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Hands-free turn taking is ACTIVE</span>
          </div>

          <div className="flex items-center gap-2">
            {isSpeaking ? (
              <button
                onClick={interruptSpeech}
                className="px-3 py-1.5 bg-rose-600/20 text-rose-300 hover:bg-rose-600/30 border border-rose-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <VolumeX className="w-3.5 h-3.5" />
                Interrupt Tutor
              </button>
            ) : null}

            <button
              onClick={isListening ? stopVoiceEngine : startSpeechRecognition}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all ${
                isListening
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white'
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-4 h-4" /> Mute Mic
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" /> Unmute Mic
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
