import { useState, useEffect, useRef } from 'react'
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  X,
  Sparkles,
  BookOpen,
  Film,
  ChevronRight,
  ChevronLeft,
  FastForward,
} from 'lucide-react'
import { VideoStatusData } from '../api/client'

interface VideoLessonPlayerProps {
  isOpen: boolean
  onClose: () => void
  videoData: VideoStatusData | null
  chapterName?: string
}

export default function VideoLessonPlayer({
  isOpen,
  onClose,
  videoData,
  chapterName = 'Lesson Video',
}: VideoLessonPlayerProps) {
  const [currentSceneIndex, setCurrentSceneIndex] = useState<number>(0)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [playbackRate, setPlaybackRate] = useState<number>(1.0)
  const [isMuted, setIsMuted] = useState<boolean>(false)
  const [sceneProgress, setSceneProgress] = useState<number>(0)

  const timerRef = useRef<any>(null)
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null)

  const scenes = videoData?.script?.scenes || [
    {
      sceneNumber: 1,
      duration: 8,
      narration: `Welcome to this animated lesson on ${chapterName}. In this lesson, we explore foundational concepts grounded in the Tamil Nadu State Board curriculum.`,
      visualType: 'concept',
      visualDescription: `Overview schematic of ${chapterName}`,
      onScreenText: `${chapterName} — Overview`,
      sourcePages: [1],
    },
    {
      sceneNumber: 2,
      duration: 10,
      narration: 'Core physical definitions, operational laws, and experimental models as outlined in the textbook.',
      visualType: 'process',
      visualDescription: 'Process flow and governing formulas',
      onScreenText: 'Governing Laws & Process Flow',
      sourcePages: [1, 2],
    },
    {
      sceneNumber: 3,
      duration: 8,
      narration: 'Summary of formulas, practical applications, and exam review notes.',
      visualType: 'comparison',
      visualDescription: 'Summary comparison and key takeaways',
      onScreenText: 'Summary & Key Formulas',
      sourcePages: [2],
    },
  ]

  const currentScene = scenes[currentSceneIndex] || scenes[0]

  // Reset player when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentSceneIndex(0)
      setSceneProgress(0)
      setIsPlaying(false)
    } else {
      stopSpeech()
    }
  }, [isOpen])

  // Play narration via Web Speech API
  const speakCurrentScene = (sceneText: string) => {
    if (isMuted || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(sceneText)
    utterance.rate = playbackRate
    utterance.lang = 'en-IN'
    synthRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }

  const stopSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
  }

  // Animation timeline ticker
  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current)
      stopSpeech()
      return
    }

    speakCurrentScene(currentScene.narration)

    const intervalMs = 100
    const durationMs = (currentScene.duration || 8) * 1000 / playbackRate
    let elapsed = 0

    timerRef.current = setInterval(() => {
      elapsed += intervalMs
      const pct = Math.min(100, (elapsed / durationMs) * 100)
      setSceneProgress(pct)

      if (elapsed >= durationMs) {
        clearInterval(timerRef.current)
        if (currentSceneIndex < scenes.length - 1) {
          setCurrentSceneIndex((prev) => prev + 1)
          setSceneProgress(0)
        } else {
          setIsPlaying(false)
          setSceneProgress(100)
        }
      }
    }, intervalMs)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      stopSpeech()
    }
  }, [isPlaying, currentSceneIndex, playbackRate])

  const handleTogglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false)
    } else {
      if (sceneProgress >= 100 && currentSceneIndex === scenes.length - 1) {
        setCurrentSceneIndex(0)
        setSceneProgress(0)
      }
      setIsPlaying(true)
    }
  }

  const handleNextScene = () => {
    if (currentSceneIndex < scenes.length - 1) {
      setCurrentSceneIndex((prev) => prev + 1)
      setSceneProgress(0)
    }
  }

  const handlePrevScene = () => {
    if (currentSceneIndex > 0) {
      setCurrentSceneIndex((prev) => prev - 1)
      setSceneProgress(0)
    }
  }

  const handleRestart = () => {
    setCurrentSceneIndex(0)
    setSceneProgress(0)
    setIsPlaying(true)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150 font-sans">
      <div className="bg-slate-950 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-800 text-white">
        {/* Top Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-white">
                  {videoData?.script?.title || `${chapterName} Visual Lesson`}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  AI Whiteboard
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Scene {currentSceneIndex + 1} of {scenes.length} • Grounded Textbook Walkthrough
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopSpeech()
              onClose()
            }}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video Canvas Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 flex flex-col items-center justify-center bg-slate-950">
          <div className="w-full max-w-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-inner flex flex-col justify-between min-h-[320px] relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

            {/* Scene Header Badges */}
            <div className="flex items-center justify-between z-10">
              <span className="px-3 py-1 bg-blue-950/80 border border-blue-800/60 rounded-lg text-xs font-black text-blue-300 uppercase tracking-wide flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>{currentScene.visualType || 'Concept Model'}</span>
              </span>

              {currentScene.sourcePages && currentScene.sourcePages.length > 0 && (
                <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
                  <BookOpen className="w-3 h-3 text-blue-400" />
                  <span>Textbook Page: {currentScene.sourcePages.join(', ')}</span>
                </span>
              )}
            </div>

            {/* Main Visual Blackboard Display */}
            <div className="my-6 text-center space-y-4 z-10">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight animate-in fade-in zoom-in duration-200">
                {currentScene.onScreenText}
              </h2>
              <div className="p-4 bg-slate-800/50 border border-slate-700/60 rounded-xl text-slate-300 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed italic">
                "{currentScene.visualDescription}"
              </div>
            </div>

            {/* Narration Subtitle Box */}
            <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-3.5 z-10">
              <div className="text-xs text-amber-300 font-medium leading-relaxed flex items-start gap-2">
                <Volume2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{currentScene.narration}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Video Player Controls Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-3">
          {/* Progress Bar */}
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
            {scenes.map((_item: any, i: number) => (
              <div
                key={i}
                className="flex-1 h-full mx-0.5 rounded-full overflow-hidden bg-slate-700"
              >
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all"
                  style={{
                    width:
                      i < currentSceneIndex
                        ? '100%'
                        : i === currentSceneIndex
                        ? `${sceneProgress}%`
                        : '0%',
                  }}
                />
              </div>
            ))}
          </div>

          {/* Controls Toolbar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevScene}
                disabled={currentSceneIndex === 0}
                className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded-xl text-white transition-colors"
                title="Previous Scene"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={handleTogglePlay}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                <span>{isPlaying ? 'Pause' : 'Play Lesson'}</span>
              </button>

              <button
                onClick={handleNextScene}
                disabled={currentSceneIndex === scenes.length - 1}
                className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded-xl text-white transition-colors"
                title="Next Scene"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={handleRestart}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 transition-colors"
                title="Restart from Scene 1"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              {/* Speed Controller */}
              <button
                onClick={() => {
                  const rates = [0.75, 1.0, 1.25, 1.5]
                  const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length
                  setPlaybackRate(rates[nextIdx])
                }}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-300 transition-colors flex items-center gap-1"
                title="Change Playback Speed"
              >
                <FastForward className="w-3.5 h-3.5" />
                <span>{playbackRate}x</span>
              </button>

              {/* Mute Toggle */}
              <button
                onClick={() => {
                  if (!isMuted) stopSpeech()
                  setIsMuted(!isMuted)
                }}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"
                title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-slate-300" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
