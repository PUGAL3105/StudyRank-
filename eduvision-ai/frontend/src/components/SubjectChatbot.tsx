import { useState, useEffect, useRef } from 'react'
import {
  Send,
  Sparkles,
  X,
  Minimize2,
  Maximize2,
  Trash2,
  BookOpen,
  Copy,
  Check,
  Languages,
  Lightbulb,
  ChevronDown,
  Bot,
  User,
  GraduationCap,
  ExternalLink,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
} from 'lucide-react'
import { apiClient } from '../api/client'
import { ClassItem, SubjectItem, ChapterItem, TermItem } from '../types/index'

export interface ChatMessageItem {
  id: string
  role: 'user' | 'assistant'
  content: string
  simpleExplanation?: string
  keyPoints?: string[]
  example?: string | null
  followUpQuestions?: string[]
  grounding?: {
    isGrounded: boolean
    sourceBook: string
    chapterName: string
    sourcePages: number[]
  }
  timestamp: string
}

interface SubjectChatbotProps {
  currentClass?: ClassItem | null
  currentSubject?: SubjectItem | null
  currentTerm?: TermItem | null
  currentChapter?: ChapterItem | null
  onOpenPdfViewer?: (chapterId: string, chapterTitle: string) => void
}

export default function SubjectChatbot({
  currentClass,
  currentSubject,
  currentTerm,
  currentChapter,
  onOpenPdfViewer,
}: SubjectChatbotProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [isExpanded, setIsExpanded] = useState<boolean>(false)
  const [inputMessage, setInputMessage] = useState<string>('')
  const [language, setLanguage] = useState<'en' | 'ta'>('en')
  const [loading, setLoading] = useState<boolean>(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessageItem[]>([])
  const [isListeningVoice, setIsListeningVoice] = useState<boolean>(false)
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [isOpen])

  const starterPrompts = [
    {
      label: language === 'ta' ? '💡 அடிப்படைக் கருத்துக்கள்' : '💡 Explain Core Concept',
      prompt: language === 'ta' 
        ? `${currentSubject?.subject_name || 'இப்பாடத்தின்'} அடிப்படைக் கருத்துக்களை எளிய தமிழில் விளக்குக.` 
        : `Explain the fundamental concept of ${currentChapter?.chapter_name || currentSubject?.subject_name || 'this topic'} in simple student-friendly terms.`,
    },
    {
      label: language === 'ta' ? '📝 முக்கிய தேர்வு வினாக்கள்' : '📝 Key Exam Questions',
      prompt: language === 'ta'
        ? 'இந்த அத்தியாயத்தில் கேட்கப்படும் முக்கிய 2-மதிப்பெண் மற்றும் 5-மதிப்பெண் வினாக்கள் யாவை?'
        : `What are the most important 2-mark and 5-mark board exam questions from ${currentChapter?.chapter_name || currentSubject?.subject_name || 'this chapter'}?`,
    },
    {
      label: language === 'ta' ? '🔬 நிஜ வாழ்க்கை உதாரணம்' : '🔬 Real-world Examples',
      prompt: language === 'ta'
        ? 'இதனை அன்றாட வாழ்க்கை உதாரணங்களுடன் விளக்குக.'
        : `Give me 2 real-world applications or everyday examples for ${currentChapter?.chapter_name || currentSubject?.subject_name || 'this concept'}.`,
    },
    {
      label: language === 'ta' ? '📖 சுருக்கக் குறிப்பு' : '📖 Quick Revision Summary',
      prompt: language === 'ta'
        ? 'தேர்வுக்கான விரைவு திருப்புதல் குறிப்புகளை தருக.'
        : `Provide a quick bullet-point revision summary for ${currentChapter?.chapter_name || currentSubject?.subject_name || 'this unit'}.`,
    },
  ]

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim()
    if (!query || loading) return

    const userMsgId = `user-${Date.now()}`
    const userMsg: ChatMessageItem = {
      id: userMsgId,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMsg])
    setInputMessage('')
    setLoading(true)

    const historyPayload = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }))

    try {
      const response = await apiClient.sendChatMessage({
        message: query,
        classId: currentClass?.id,
        subjectId: currentSubject?.id,
        termId: currentTerm?.id,
        chapterId: currentChapter?.id,
        history: historyPayload,
        language,
      })

      const botMsg: ChatMessageItem = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: response.reply,
        simpleExplanation: response.simpleExplanation,
        keyPoints: response.keyPoints,
        example: response.example,
        followUpQuestions: response.followUpQuestions,
        grounding: response.grounding,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }

      setMessages((prev) => [...prev, botMsg])
    } catch {
      const errorBotMsg: ChatMessageItem = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content:
          language === 'ta'
            ? 'மன்னிக்கவும், பதிலை உருவாக்குவதில் சிக்கல் ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.'
            : 'Sorry, I encountered an issue generating a response. Please check your connection and try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages((prev) => [...prev, errorBotMsg])
    } finally {
      setLoading(false)
    }
  }

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleToggleSpeech = (msgId: string, text: string) => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser.')
      return
    }

    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel()
      setSpeakingMsgId(null)
      return
    }

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = language === 'ta' ? 'ta-IN' : 'en-IN'
    utterance.rate = language === 'ta' ? 0.9 : 1.0

    const voices = window.speechSynthesis.getVoices()
    const matchingVoice = voices.find((v) =>
      language === 'ta'
        ? v.lang.includes('ta') || v.name.toLowerCase().includes('tamil')
        : v.lang.includes('en')
    )
    if (matchingVoice) utterance.voice = matchingVoice

    utterance.onstart = () => setSpeakingMsgId(msgId)
    utterance.onend = () => setSpeakingMsgId(null)
    utterance.onerror = () => setSpeakingMsgId(null)

    window.speechSynthesis.speak(utterance)
  }

  const handleToggleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in your browser. Please use Google Chrome or Chromium.')
      return
    }

    if (isListeningVoice && recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListeningVoice(false)
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.lang = language === 'ta' ? 'ta-IN' : 'en-IN'
      recognition.continuous = false
      recognition.interimResults = false

      recognition.onstart = () => {
        setIsListeningVoice(true)
      }

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.trim()
        if (transcript) {
          setInputMessage(transcript)
          handleSendMessage(transcript)
        }
      }

      recognition.onerror = () => {
        setIsListeningVoice(false)
      }

      recognition.onend = () => {
        setIsListeningVoice(false)
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch {
      setIsListeningVoice(false)
    }
  }

  const handleClearChat = () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    setSpeakingMsgId(null)
    setMessages([])
  }

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-full shadow-2xl hover:shadow-indigo-500/50 hover:scale-105 transition-all duration-300 group border border-white/20"
          title="Ask AI Study Assistant"
        >
          <div className="relative">
            <Bot className="w-6 h-6 text-white animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-indigo-700"></span>
          </div>
          <span className="text-sm font-semibold tracking-wide">
            {language === 'ta' ? 'AI உதவி ஆசிரியர்' : 'AI Study Assistant'}
          </span>
          <Sparkles className="w-4 h-4 text-amber-300 group-hover:rotate-12 transition-transform" />
        </button>
      )}

      {isOpen && (
        <div
          className={`fixed z-50 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col transition-all duration-300 overflow-hidden ${
            isExpanded
              ? 'inset-4 md:inset-10 w-auto h-auto'
              : 'bottom-4 right-4 md:bottom-6 md:right-6 w-[92vw] sm:w-[420px] h-[580px] max-h-[85vh]'
          }`}
        >
          <div className="px-4 py-3 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-600/30 border border-indigo-500/40 rounded-xl text-indigo-400">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white tracking-wide">
                    {language === 'ta' ? 'தமிழ்நாடு AI பாட ஆசிரியர்' : 'Subject AI Assistant'}
                  </h3>
                  <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded">
                    RAG Grounded
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate max-w-[220px]">
                  {currentChapter
                    ? `${currentSubject?.subject_name} • ${currentChapter.chapter_name}`
                    : currentSubject
                    ? `${currentClass?.class_name || 'Class 10'} • ${currentSubject.subject_name}`
                    : 'Tamil Nadu Samacheer Kalvi Guide'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setLanguage(language === 'en' ? 'ta' : 'en')}
                className="px-2 py-1 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-600/60 rounded-lg transition-colors flex items-center gap-1"
                title="Toggle Language / மொழியை மாற்றுக"
              >
                <Languages className="w-3.5 h-3.5 text-indigo-400" />
                <span>{language === 'en' ? 'தமிழ்' : 'EN'}</span>
              </button>

              {messages.length > 0 && (
                <button
                  onClick={handleClearChat}
                  className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                  title="Clear conversation"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors hidden sm:block"
                title={isExpanded ? 'Restore size' : 'Expand window'}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                title="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {currentSubject && (
            <div className="px-3.5 py-1.5 bg-indigo-950/40 border-b border-indigo-900/40 flex items-center justify-between text-xs text-indigo-200">
              <div className="flex items-center gap-1.5 truncate">
                <GraduationCap className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                <span className="truncate">
                  {`${currentClass?.class_name || 'Class 10'} > ${currentSubject.subject_name}${currentChapter ? ` > ${currentChapter.chapter_name}` : ''}`}
                </span>
              </div>
              {currentChapter?.indexing_status === 'READY' && (
                <span className="flex-shrink-0 text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
                  Textbook Indexed
                </span>
              )}
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm bg-slate-950/60 custom-scrollbar">
            {messages.length === 0 && (
              <div className="py-6 flex flex-col items-center text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-semibold text-white text-base">
                    {language === 'ta' ? 'வணக்கம்! நான் உங்கள் AI பாட ஆசிரியர்' : 'Hello! I am your AI Study Tutor'}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-[280px]">
                    {language === 'ta'
                      ? 'உங்கள் பாடங்கள், அத்தியாயங்கள் மற்றும் தேர்வுகளுக்கான சந்தேகங்களை உடனே கேளுங்கள்.'
                      : 'Ask any questions about your subject, clarify difficult formulas, or get step-by-step textbook explanations.'}
                  </p>
                </div>

                <div className="w-full pt-3 space-y-2 text-left">
                  <span className="text-[11px] font-semibold text-indigo-300 uppercase tracking-wider px-1">
                    {language === 'ta' ? 'விரைவு தலைப்புகள்:' : 'Suggested Questions:'}
                  </span>
                  <div className="grid grid-cols-1 gap-1.5">
                    {starterPrompts.map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(p.prompt)}
                        className="w-full text-left px-3 py-2 bg-slate-800/80 hover:bg-indigo-900/40 border border-slate-700/60 hover:border-indigo-500/50 rounded-xl text-xs text-slate-200 transition-all flex items-center justify-between group"
                      >
                        <span>{p.label}</span>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-500 -rotate-90 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 flex-shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 shadow-sm space-y-2 ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-none'
                      : 'bg-slate-800/95 text-slate-100 border border-slate-700/70 rounded-tl-none'
                  }`}
                >
                  <div className="whitespace-pre-wrap leading-relaxed text-xs sm:text-sm">
                    {msg.content}
                  </div>

                  {msg.keyPoints && msg.keyPoints.length > 0 && (
                    <div className="pt-2 border-t border-slate-700/60 space-y-1">
                      <span className="text-[11px] font-semibold text-amber-300 flex items-center gap-1">
                        <Lightbulb className="w-3 h-3" />
                        {language === 'ta' ? 'முக்கிய குறிப்புகள்:' : 'Key Takeaways:'}
                      </span>
                      <ul className="text-xs space-y-1 text-slate-300 pl-4 list-disc marker:text-amber-400">
                        {msg.keyPoints.map((pt, i) => (
                          <li key={i}>{pt}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {msg.example && (
                    <div className="p-2 bg-indigo-950/40 border border-indigo-500/30 rounded-lg text-xs text-indigo-200">
                      <span className="font-semibold text-indigo-300">💡 Example: </span>
                      {msg.example}
                    </div>
                  )}

                  {msg.grounding && msg.grounding.isGrounded && (
                    <div className="pt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-emerald-300">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-950/60 border border-emerald-500/30 rounded-md font-medium">
                        <BookOpen className="w-3 h-3 text-emerald-400" />
                        {msg.grounding.sourceBook}
                        {msg.grounding.sourcePages.length > 0 && ` (p. ${msg.grounding.sourcePages.join(', ')})`}
                      </span>

                      {onOpenPdfViewer && currentChapter && (
                        <button
                          onClick={() => onOpenPdfViewer(currentChapter.id, currentChapter.chapter_name)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-950/60 hover:bg-blue-900/60 border border-blue-500/30 rounded-md text-blue-300 hover:text-blue-200 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View in PDF
                        </button>
                      )}
                    </div>
                  )}

                  {msg.followUpQuestions && msg.followUpQuestions.length > 0 && (
                    <div className="pt-2 border-t border-slate-700/60 space-y-1.5">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        {language === 'ta' ? 'தொடர்புடைய கேள்விகள்:' : 'Suggested Follow-ups:'}
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {msg.followUpQuestions.map((q, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSendMessage(q)}
                            className="text-left text-[11px] px-2.5 py-1 bg-slate-900/80 hover:bg-indigo-950/60 border border-slate-700 hover:border-indigo-500/50 rounded-lg text-indigo-200 hover:text-indigo-100 transition-colors"
                          >
                            + {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                    <span>{msg.timestamp}</span>
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleToggleSpeech(msg.id, msg.content)}
                          className="hover:text-indigo-300 flex items-center gap-1 transition-colors text-slate-400"
                          title={speakingMsgId === msg.id ? "Stop voice audio" : "Listen to answer aloud"}
                        >
                          {speakingMsgId === msg.id ? (
                            <>
                              <VolumeX className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                              <span className="text-amber-400 font-semibold">Stop</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3.5 h-3.5" />
                              <span>Listen</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyText(msg.id, msg.content)}
                          className="hover:text-slate-200 flex items-center gap-1 transition-colors"
                          title="Copy text"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-green-400" />
                              <span className="text-green-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-300 flex-shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 flex-shrink-0">
                  <Bot className="w-4 h-4 animate-bounce" />
                </div>
                <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-none p-3.5 text-xs text-slate-300 flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span>
                  </div>
                  <span className="text-slate-400 text-xs">
                    {language === 'ta' ? 'பாடப்புத்தகத்தில் தேடுகிறது...' : 'Searching authentic textbook & generating explanation...'}
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 bg-slate-900 border-t border-slate-800">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSendMessage()
              }}
              className="flex items-center gap-2"
            >
              <button
                type="button"
                onClick={handleToggleVoiceInput}
                className={`p-2.5 rounded-xl transition-all flex items-center justify-center shrink-0 ${
                  isListeningVoice
                    ? 'bg-rose-600 text-white animate-pulse shadow-md'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'
                }`}
                title={
                  isListeningVoice
                    ? 'Listening... Click to stop'
                    : language === 'ta'
                    ? 'குரல் மூலம் கேள்வி கேட்க மைக்ரோஃபோனை அழுத்தவும்'
                    : 'Click to speak question using microphone'
                }
              >
                {isListeningVoice ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={
                  isListeningVoice
                    ? (language === 'ta' ? 'கேட்கிறது... தமிழில் பேசவும்...' : 'Listening... Speak your question now...')
                    : language === 'ta'
                    ? 'உங்கள் கேள்வியை அல்லது சந்தேகத்தை இங்கு தட்டச்சு செய்யவும்...'
                    : currentChapter
                    ? `Ask anything about ${currentChapter.chapter_name}...`
                    : 'Ask any question about your subject...'
                }
                disabled={loading}
                className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 transition-all"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || loading}
                className="px-3.5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-800 disabled:to-slate-800 text-white disabled:text-slate-500 rounded-xl font-medium text-xs sm:text-sm shadow-md transition-all flex items-center justify-center"
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}