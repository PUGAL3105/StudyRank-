import { useState, useEffect } from 'react'
import { Play, Pause, Volume2, VolumeX, Film, Sparkles, SkipForward, CheckCircle } from 'lucide-react'

interface VideoPlayerProps {
  topic?: string
  questionText?: string
}

export default function VideoPlayer({ topic = 'Photosynthesis', questionText }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0)
  const [progress, setProgress] = useState(0)

  // Topic-tailored scenes
  const getScenesForTopic = () => {
    const t = (topic + ' ' + (questionText || '')).toLowerCase()

    if (t.includes('respirat')) {
      return [
        {
          title: 'Scene 1: Glucose Breakdown',
          duration: '0:30',
          narration: 'Glucose molecules from digested food enter cells to be broken down during cellular respiration.',
          bg: 'from-amber-900 to-orange-950',
          visualType: 'respiration_1'
        },
        {
          title: 'Scene 2: Oxygen Absorption & Mitochondria',
          duration: '0:45',
          narration: 'Oxygen drawn from breathing enters mitochondria to react with glucose fragments.',
          bg: 'from-red-950 to-amber-900',
          visualType: 'respiration_2'
        },
        {
          title: 'Scene 3: ATP Energy & CO2 Release',
          duration: '1:00',
          narration: 'ATP energy is released to power body activities, while carbon dioxide and water are expelled.',
          bg: 'from-orange-900 to-amber-950',
          visualType: 'respiration_3'
        }
      ]
    }

    if (t.includes('algebra') || t.includes('math') || t.includes('equation')) {
      return [
        {
          title: 'Scene 1: Variable Identification',
          duration: '0:30',
          narration: 'We identify unknown variables and write down the algebraic expression.',
          bg: 'from-indigo-950 to-blue-900',
          visualType: 'math_1'
        },
        {
          title: 'Scene 2: Balancing the Equation',
          duration: '0:45',
          narration: 'Both sides of the equation must remain balanced by performing inverse mathematical operations.',
          bg: 'from-blue-900 to-indigo-950',
          visualType: 'math_2'
        },
        {
          title: 'Scene 3: Final Solution',
          duration: '1:00',
          narration: 'The unknown variable is isolated to yield the correct numerical solution.',
          bg: 'from-slate-900 to-blue-950',
          visualType: 'math_3'
        }
      ]
    }

    // Default: Photosynthesis
    return [
      {
        title: 'Scene 1: Solar Energy Capture',
        duration: '0:30',
        narration: 'Sunlight strikes green leaves. Chlorophyll pigments inside chloroplasts absorb photons from solar radiation.',
        bg: 'from-green-950 to-emerald-900',
        visualType: 'photo_1'
      },
      {
        title: 'Scene 2: Water & Gas Intake',
        duration: '0:45',
        narration: 'Water absorbed by roots flows up xylem vessels while stomata open to intake atmospheric carbon dioxide.',
        bg: 'from-teal-950 to-emerald-900',
        visualType: 'photo_2'
      },
      {
        title: 'Scene 3: Glucose & Oxygen Output',
        duration: '1:00',
        narration: 'Light reactions split water molecules, generating rich glucose energy and releasing vital oxygen gas.',
        bg: 'from-emerald-900 to-green-950',
        visualType: 'photo_3'
      }
    ]
  }

  const scenes = getScenesForTopic()
  const activeScene = scenes[currentSceneIndex]

  // Playback timer loop
  useEffect(() => {
    let timer: any
    if (isPlaying) {
      timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            if (currentSceneIndex < scenes.length - 1) {
              setCurrentSceneIndex((idx) => idx + 1)
              return 0
            } else {
              setIsPlaying(false)
              return 100
            }
          }
          return prev + 4
        })
      }, 300)
    }
    return () => clearInterval(timer)
  }, [isPlaying, currentSceneIndex, scenes.length])

  // Optional Voice Narration using Web Speech API
  useEffect(() => {
    if (isPlaying && !isMuted && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(activeScene.narration)
      utterance.rate = 0.9
      window.speechSynthesis.speak(utterance)
    } else if (!isPlaying && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
  }, [currentSceneIndex, isPlaying, isMuted, activeScene])

  const handleTogglePlay = () => {
    if (progress >= 100 && currentSceneIndex === scenes.length - 1) {
      setCurrentSceneIndex(0)
      setProgress(0)
    }
    setIsPlaying(!isPlaying)
  }

  const handleSelectScene = (idx: number) => {
    setCurrentSceneIndex(idx)
    setProgress(0)
    setIsPlaying(true)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-primary-600" />
          <h4 className="text-sm font-semibold text-gray-900">AI Visual Lesson: {topic}</h4>
        </div>
        <span className="text-xs px-2.5 py-0.5 bg-secondary-100 text-secondary-800 rounded font-bold flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> Grounded AI Animation
        </span>
      </div>

      {/* Video Demonstration Viewport */}
      <div className={`relative aspect-video bg-gradient-to-br ${activeScene.bg} flex flex-col justify-between p-6 text-white overflow-hidden select-none`}>
        {/* Animated Keyframe Visual Canvas */}
        <div className="relative flex-1 flex items-center justify-center">
          {/* Scene 1 Visual: Solar Photons */}
          {activeScene.visualType.startsWith('photo_1') && (
            <div className="relative w-full h-full flex items-center justify-around">
              <div className="flex flex-col items-center animate-pulse">
                <div className="w-20 h-20 rounded-full bg-amber-400 blur-sm flex items-center justify-center text-amber-900 font-extrabold shadow-2xl">
                  SUNLIGHT
                </div>
                <span className="text-xs text-amber-200 font-mono mt-2">Solar Photons</span>
              </div>
              <div className="w-48 h-28 rounded-3xl bg-emerald-500/80 border-4 border-emerald-300 flex items-center justify-center text-center p-3 shadow-lg">
                <span className="text-xs font-bold text-emerald-950">Chloroplast & Chlorophyll Cell</span>
              </div>
            </div>
          )}

          {/* Scene 2 Visual: H2O & CO2 Absorption */}
          {activeScene.visualType.startsWith('photo_2') && (
            <div className="relative w-full h-full flex items-center justify-around">
              <div className="p-3 bg-blue-500/80 rounded-xl border border-blue-300 text-center animate-bounce">
                <span className="text-xs font-bold">H₂O (Water Absorption)</span>
                <span className="block text-[10px] text-blue-100 mt-0.5">Xylem Transport</span>
              </div>
              <div className="p-3 bg-teal-500/80 rounded-xl border border-teal-300 text-center animate-pulse">
                <span className="text-xs font-bold">CO₂ (Carbon Dioxide)</span>
                <span className="block text-[10px] text-teal-100 mt-0.5">Stomata Micro-Pores</span>
              </div>
            </div>
          )}

          {/* Scene 3 Visual: Glucose & Oxygen Synthesis */}
          {activeScene.visualType.startsWith('photo_3') && (
            <div className="relative w-full h-full flex items-center justify-around">
              <div className="p-4 bg-amber-400 text-amber-950 font-bold rounded-2xl border-2 border-amber-200 text-center shadow-2xl scale-110">
                <span className="text-sm">C₆H₁₂O₆ (Glucose Energy)</span>
                <span className="block text-[10px] text-amber-900">Stored Plant Energy</span>
              </div>
              <div className="p-4 bg-emerald-400 text-emerald-950 font-bold rounded-2xl border-2 border-emerald-200 text-center shadow-xl">
                <span className="text-sm">O₂ (Oxygen Gas Out)</span>
                <span className="block text-[10px] text-emerald-900">Vital Atmosphere Oxygen</span>
              </div>
            </div>
          )}

          {/* Fallback Visual for Math / Respiration */}
          {!activeScene.visualType.startsWith('photo') && (
            <div className="p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-center max-w-md">
              <Sparkles className="w-8 h-8 mx-auto text-amber-300 mb-2 animate-spin" />
              <h5 className="text-base font-bold text-white">{activeScene.title}</h5>
              <p className="text-xs text-gray-200 mt-1">{activeScene.narration}</p>
            </div>
          )}
        </div>

        {/* Captions Overlay Bar */}
        <div className="bg-black/60 backdrop-blur-md p-3 rounded-lg border border-white/10 mb-2">
          <p className="text-xs text-amber-200 font-semibold flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-amber-400" /> AI Teacher Narration:
          </p>
          <p className="text-xs text-white mt-0.5 font-medium leading-relaxed">{activeScene.narration}</p>
        </div>

        {/* Controls Overlay */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-3">
            <button
              onClick={handleTogglePlay}
              className="p-2 bg-primary-600 hover:bg-primary-500 rounded-full text-white shadow-md transition-transform hover:scale-105"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>
            <button onClick={() => setIsMuted(!isMuted)} className="p-1.5 text-gray-300 hover:text-white">
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <span className="text-xs font-mono text-gray-300">
              Scene {currentSceneIndex + 1} of {scenes.length}
            </span>
          </div>

          <button
            onClick={() => {
              if (currentSceneIndex < scenes.length - 1) {
                setCurrentSceneIndex(currentSceneIndex + 1)
                setProgress(0)
              } else {
                setCurrentSceneIndex(0)
                setProgress(0)
              }
            }}
            className="flex items-center gap-1 text-xs px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded text-white font-medium"
          >
            <SkipForward className="w-3.5 h-3.5" /> Next Scene
          </button>
        </div>

        {/* Scene Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
          <div className="h-full bg-primary-400 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Lesson Scenes & Storyboard Breakdown */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <h5 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">Lesson Scenes & Storyboard</h5>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {scenes.map((sc, idx) => {
            const isActive = currentSceneIndex === idx
            return (
              <button
                key={idx}
                onClick={() => handleSelectScene(idx)}
                className={`p-3 text-left rounded-lg border transition-all ${
                  isActive ? 'bg-primary-50 border-primary-400 shadow-sm ring-2 ring-primary-200' : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${isActive ? 'text-primary-800' : 'text-gray-900'}`}>{sc.title}</span>
                  {isActive && <CheckCircle className="w-3.5 h-3.5 text-primary-600" />}
                </div>
                <p className="text-xs text-gray-600 mt-1.5 line-clamp-2">{sc.narration}</p>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
