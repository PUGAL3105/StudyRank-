import React, { useState, useEffect, useRef } from 'react'
import {
  Radio,
  Sparkles,
  X,
  Trash2,
  BookOpen,
  Vote,
  Layers,
} from 'lucide-react'
import axios from 'axios'

interface TeacherLiveClassroomModalProps {
  isOpen: boolean
  onClose: () => void
  teacherName?: string
  classLevel?: string
  subjectName?: string
  chapterId?: string
  chapterName?: string
}

export const TeacherLiveClassroomModal: React.FC<TeacherLiveClassroomModalProps> = ({
  isOpen,
  onClose,
  teacherName = 'Demo Teacher',
  classLevel = 'Class 10',
  subjectName = 'Science',
  chapterId = 'ch-10sci-t1-1',
  chapterName = 'Laws of Motion',
}) => {
  const [session, setSession] = useState<any>(null)
  const [selectedTool, setSelectedTool] = useState<'pen' | 'highlighter' | 'eraser' | 'line'>('pen')
  const [strokeColor, setStrokeColor] = useState('#2563eb')
  const [strokeWidth] = useState(3)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[]>([])

  // Doubts & AI Clusters
  const [clusters, setClusters] = useState<any[]>([])
  const [newDoubtText, setNewDoubtText] = useState('')
  const [activeTab, setActiveTab] = useState<'doubts' | 'clusters' | 'pulse'>('clusters')

  // Live Pulse Check
  const [pulseQuestion, setPulseQuestion] = useState('What is the SI unit of Force?')
  const [pulseOptions, setPulseOptions] = useState(['Newton (N)', 'Joule (J)', 'Watt (W)', 'Pascal (Pa)'])
  const [pulseStats, setPulseStats] = useState<any>(null)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    if (isOpen) {
      startLiveClass()
    }
  }, [isOpen])

  const startLiveClass = async () => {
    try {
      const res = await axios.post('/api/classroom/create', {
        title: `Live ${subjectName} Class — ${chapterName}`,
        classLevel,
        subjectName,
        chapterId,
      })

      if (res.data?.success) {
        setSession(res.data.data)
        // Seed sample student doubts
        await axios.post('/api/classroom/doubt', {
          roomId: res.data.data.roomId,
          questionText: 'Sir, how do we derive F = ma from rate of change of momentum?',
        })
        await axios.post('/api/classroom/doubt', {
          roomId: res.data.data.roomId,
          questionText: 'Can you give a practical example for inertia of rest?',
        })
        fetchClusteredDoubts(res.data.data.roomId)
      }
    } catch (err: any) {
      console.error('Failed to create classroom session:', err)
    }
  }

  const fetchClusteredDoubts = async (roomId: string) => {
    try {
      const res = await axios.get(`/api/classroom/${roomId}/doubts/clustered`)
      if (res.data?.success) {
        setClusters(res.data.data)
      }
    } catch (e) {
      console.error('Failed to fetch doubts:', e)
    }
  }

  // Canvas Drawing Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setIsDrawing(true)
    setCurrentPoints([{ x, y }])

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.strokeStyle = selectedTool === 'eraser' ? '#ffffff' : strokeColor
      ctx.lineWidth = selectedTool === 'highlighter' ? 12 : strokeWidth
      ctx.globalAlpha = selectedTool === 'highlighter' ? 0.3 : 1.0
      ctx.lineCap = 'round'
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setCurrentPoints((prev) => [...prev, { x, y }])

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.lineTo(x, y)
      ctx.stroke()
    }
  }

  const handleMouseUp = async () => {
    if (!isDrawing || currentPoints.length === 0 || !session) return
    setIsDrawing(false)

    try {
      await axios.post('/api/classroom/draw', {
        roomId: session.roomId,
        color: selectedTool === 'eraser' ? '#ffffff' : strokeColor,
        width: strokeWidth,
        points: currentPoints,
        tool: selectedTool,
      })
    } catch {}
    setCurrentPoints([])
  }

  const handleClearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  }

  const handlePostDoubt = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDoubtText.trim() || !session) return

    try {
      await axios.post('/api/classroom/doubt', {
        roomId: session.roomId,
        questionText: newDoubtText.trim(),
      })
      setNewDoubtText('')
      fetchClusteredDoubts(session.roomId)
    } catch (err: any) {
      console.error('Failed to post doubt:', err)
    }
  }

  const handleLaunchPulse = async () => {
    if (!session) return
    try {
      const res = await axios.post('/api/classroom/pulse-check/launch', {
        roomId: session.roomId,
        question: pulseQuestion,
        options: pulseOptions,
        correctOptionIndex: 0,
      })
      if (res.data?.success) {
        // Simulate immediate student responses
        const respRes = await axios.post('/api/classroom/pulse-check/respond', {
          roomId: session.roomId,
          selectedOption: 0,
        })
        setPulseStats(respRes.data?.data)
      }
    } catch (e) {
      console.error('Failed to launch pulse check:', e)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-white">
        {/* Live Classroom Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
              <Radio className="w-5 h-5 text-red-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">
                  Teacher Live Classroom & Interactive Whiteboard
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30 animate-pulse">
                  ● LIVE BROADCAST
                </span>
              </div>
              <p className="text-xs text-blue-200">
                {classLevel} • {subjectName} ({chapterName}) • Teacher: {teacherName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Room Code Badge */}
            {session && (
              <div className="bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 text-xs flex items-center gap-2">
                <span className="text-slate-400 font-semibold">Join Code:</span>
                <span className="font-mono font-extrabold text-amber-300 tracking-wider text-sm">
                  {session.roomCode}
                </span>
              </div>
            )}

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Workspace Area: Whiteboard on Left + AI Doubt Clustering on Right */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* LEFT: HTML5 Canvas Whiteboard */}
          <div className="flex-1 flex flex-col bg-slate-950 p-4 border-r border-slate-800">
            {/* Whiteboard Tool Ribbon */}
            <div className="bg-slate-900 border border-slate-800 p-2 rounded-2xl mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setSelectedTool('pen')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    selectedTool === 'pen' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  ✏️ Pen
                </button>
                <button
                  onClick={() => setSelectedTool('highlighter')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    selectedTool === 'highlighter' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  🖍️ Highlight
                </button>
                <button
                  onClick={() => setSelectedTool('eraser')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    selectedTool === 'eraser' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  🧹 Eraser
                </button>
              </div>

              {/* Color Palette */}
              <div className="flex items-center gap-1.5">
                {['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ffffff'].map((color) => (
                  <button
                    key={color}
                    onClick={() => setStrokeColor(color)}
                    style={{ backgroundColor: color }}
                    className={`w-5 h-5 rounded-full border-2 transition-transform ${
                      strokeColor === color ? 'scale-125 border-white' : 'border-transparent'
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleClearCanvas}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear
                </button>
              </div>
            </div>

            {/* Drawing Canvas Container */}
            <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl relative overflow-hidden flex items-center justify-center">
              <canvas
                ref={canvasRef}
                width={680}
                height={460}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                className="bg-slate-950 w-full h-full cursor-crosshair"
              />
              <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-slate-800 text-[10px] text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Live Whiteboard Stream Synchronized
              </div>
            </div>
          </div>

          {/* RIGHT: AI Doubt Clustering & Live Pulse Check */}
          <div className="w-full md:w-96 flex flex-col bg-slate-900">
            {/* Tab Selector */}
            <div className="flex border-b border-slate-800 p-2 gap-1 bg-slate-950">
              <button
                onClick={() => setActiveTab('clusters')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors ${
                  activeTab === 'clusters'
                    ? 'bg-purple-600 text-white shadow'
                    : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                AI Clusters ({clusters.length})
              </button>

              <button
                onClick={() => setActiveTab('pulse')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors ${
                  activeTab === 'pulse'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Vote className="w-3.5 h-3.5" />
                Pulse Poll
              </button>
            </div>

            {/* TAB 1: AI DOUBT CLUSTERS */}
            {activeTab === 'clusters' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <div className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Smart Doubts Clustering</span>
                  <span className="text-purple-400 font-bold">Auto-Categorized</span>
                </div>

                {clusters.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500">
                    No active student doubts submitted yet.
                  </div>
                ) : (
                  clusters.map((cl: any, idx: number) => (
                    <div key={idx} className="bg-slate-950 border border-purple-900/40 rounded-2xl p-3 space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="font-bold text-xs text-purple-300 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-purple-400" />
                          {cl.theme}
                        </div>
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          {cl.doubtCount} doubt{cl.doubtCount > 1 ? 's' : ''}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-300 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                        <div className="text-[10px] font-bold text-amber-300 mb-0.5 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> AI Recommended Teaching Tip:
                        </div>
                        {cl.aiSuggestedExplanation}
                        {cl.aiSuggestedTamil && (
                          <div className="text-[10px] font-tamil text-slate-400 mt-1">
                            {cl.aiSuggestedTamil}
                          </div>
                        )}
                        <div className="mt-1.5 pt-1.5 border-t border-slate-800 text-[10px] text-cyan-400 flex items-center gap-1">
                          <BookOpen className="w-3 h-3" /> Samacheer Kalvi Page {cl.keyPageCitation}
                        </div>
                      </div>
                    </div>
                  ))
                )}

                {/* Add Test Student Doubt Form */}
                <form onSubmit={handlePostDoubt} className="pt-2 border-t border-slate-800 flex gap-2">
                  <input
                    type="text"
                    value={newDoubtText}
                    onChange={(e) => setNewDoubtText(e.target.value)}
                    placeholder="Simulate student doubt question..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
                  >
                    Post
                  </button>
                </form>
              </div>
            )}

            {/* TAB 2: LIVE PULSE CHECK */}
            {activeTab === 'pulse' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300">Pulse Check Question:</label>
                  <input
                    type="text"
                    value={pulseQuestion}
                    onChange={(e) => setPulseQuestion(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400">Options:</label>
                  {pulseOptions.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500">{String.fromCharCode(65 + idx)}.</span>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const newOpts = [...pulseOptions]
                          newOpts[idx] = e.target.value
                          setPulseOptions(newOpts)
                        }}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleLaunchPulse}
                  className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2"
                >
                  <Vote className="w-4 h-4 text-amber-300" />
                  Launch Instant Pulse Poll
                </button>

                {/* Pulse Results */}
                {pulseStats && (
                  <div className="bg-slate-950 border border-emerald-500/30 rounded-2xl p-4 space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold text-emerald-400">
                      <span>Live Poll Results</span>
                      <span>{pulseStats.accuracyPercentage}% Accuracy</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${pulseStats.accuracyPercentage}%` }}
                        className="bg-emerald-500 h-full transition-all duration-500"
                      />
                    </div>
                    <div className="text-[11px] text-slate-400 text-right">
                      {pulseStats.totalResponses} student response recorded
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
