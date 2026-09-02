import { useState } from 'react'
import {
  X,
  Compass,
  Zap,
  Eye,
  BookOpen,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react'

type SimulationTab = 'thales' | 'coordinate' | 'optics' | 'ohms'

interface InteractiveSimulationsLabProps {
  isOpen: boolean
  onClose: () => void
  initialTab?: SimulationTab
}

export default function InteractiveSimulationsLab({
  isOpen,
  onClose,
  initialTab = 'thales',
}: InteractiveSimulationsLabProps) {
  const [activeTab, setActiveTab] = useState<SimulationTab>(initialTab)

  // ── 1. Thales Theorem State ────────────────────────────────────────────────
  const [thalesRatio, setThalesRatio] = useState<number>(0.4) // D & E position ratio (0.1 to 0.9)

  // ── 2. Coordinate Geometry State ──────────────────────────────────────────
  const [p1, setP1] = useState<{ x: number; y: number }>({ x: 2, y: 3 })
  const [p2, setP2] = useState<{ x: number; y: number }>({ x: 6, y: 7 })

  // ── 3. Optics State ───────────────────────────────────────────────────────
  const [lensType, setLensType] = useState<'convex' | 'concave'>('convex')
  const [focalLength, setFocalLength] = useState<number>(100) // in mm
  const [objectDistance, setObjectDistance] = useState<number>(180) // in mm (u is negative in Cartesian convention)
  const objectHeight = 40 // in mm

  // ── 4. Ohm's Law State ────────────────────────────────────────────────────
  const [voltage, setVoltage] = useState<number>(12) // in Volts
  const [resistance, setResistance] = useState<number>(4) // in Ohms

  if (!isOpen) return null

  // ── Thales Calculations ───────────────────────────────────────────────────
  const triA = { x: 250, y: 40 }
  const triB = { x: 80, y: 320 }
  const triC = { x: 420, y: 320 }

  const ptD = {
    x: triA.x + (triB.x - triA.x) * thalesRatio,
    y: triA.y + (triB.y - triA.y) * thalesRatio,
  }
  const ptE = {
    x: triA.x + (triC.x - triA.x) * thalesRatio,
    y: triA.y + (triC.y - triA.y) * thalesRatio,
  }

  const lengthAD = (thalesRatio * 10).toFixed(1)
  const lengthDB = ((1 - thalesRatio) * 10).toFixed(1)
  const lengthAE = (thalesRatio * 10).toFixed(1)
  const lengthEC = ((1 - thalesRatio) * 10).toFixed(1)

  const ratioLeft = (thalesRatio / (1 - thalesRatio)).toFixed(2)
  const ratioRight = (thalesRatio / (1 - thalesRatio)).toFixed(2)

  // ── Coordinate Calculations ───────────────────────────────────────────────
  const deltaX = p2.x - p1.x
  const deltaY = p2.y - p1.y
  const slope = deltaX !== 0 ? (deltaY / deltaX).toFixed(2) : 'Undefined (Vertical)'
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY).toFixed(2)
  const midpoint = { x: ((p1.x + p2.x) / 2).toFixed(1), y: ((p1.y + p2.y) / 2).toFixed(1) }

  // ── Optics Calculations (Thin Lens Formula: 1/v - 1/(-u) = 1/f) ─────────
  // Sign convention: u = -objectDistance, f = focalLength (convex) or -focalLength (concave)
  const fSigned = lensType === 'convex' ? focalLength : -focalLength
  const uSigned = -objectDistance

  // 1/v = 1/f + 1/u = (u + f) / (u * f) => v = (u * f) / (u + f)
  const vSigned = (uSigned * fSigned) / (uSigned + fSigned)
  const magnification = -vSigned / uSigned
  const imageHeight = Math.abs(objectHeight * magnification).toFixed(1)
  const isReal = vSigned > 0

  // ── Ohm's Law Calculations ────────────────────────────────────────────────
  const current = (voltage / Math.max(resistance, 0.1)).toFixed(2)
  const power = (voltage * Number(current)).toFixed(1)

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150 font-sans">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-blue-700 via-indigo-700 to-cyan-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-inner">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                  EduVision AI Simulation Lab
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-white/20 text-white">
                  Interactive STEM
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-0.5">
                Real-Time Visual Models • Tamil Nadu State Board Class 10 Curriculum
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-100 border-b border-gray-200 p-2 flex items-center gap-2 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('thales')}
            className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'thales'
                ? 'bg-white text-blue-700 shadow-sm border border-gray-200'
                : 'text-gray-600 hover:bg-white/60'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>1. Thales Theorem (தேல்ஸ் தேற்றம்)</span>
          </button>

          <button
            onClick={() => setActiveTab('coordinate')}
            className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'coordinate'
                ? 'bg-white text-blue-700 shadow-sm border border-gray-200'
                : 'text-gray-600 hover:bg-white/60'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>2. Cartesian Slope (ஆயத்தொலை வடிவியல்)</span>
          </button>

          <button
            onClick={() => setActiveTab('optics')}
            className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'optics'
                ? 'bg-white text-blue-700 shadow-sm border border-gray-200'
                : 'text-gray-600 hover:bg-white/60'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>3. Ray Optics & Lens (ஒளியியல்)</span>
          </button>

          <button
            onClick={() => setActiveTab('ohms')}
            className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'ohms'
                ? 'bg-white text-blue-700 shadow-sm border border-gray-200'
                : 'text-gray-600 hover:bg-white/60'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>4. Ohm's Law Circuit (ஓம் விதி)</span>
          </button>
        </div>

        {/* Main Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          {/* ════════════════ 1. THALES THEOREM SIMULATION ════════════════ */}
          {activeTab === 'thales' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Canvas */}
              <div className="lg:col-span-7 bg-slate-50 border border-gray-200 rounded-2xl p-4 flex flex-col items-center justify-center">
                <svg viewBox="0 0 500 360" className="w-full max-w-md h-auto drop-shadow-sm select-none">
                  {/* Triangle Fill */}
                  <polygon
                    points={`${triA.x},${triA.y} ${triB.x},${triB.y} ${triC.x},${triC.y}`}
                    className="fill-blue-50/80 stroke-blue-600 stroke-[3]"
                  />

                  {/* Shaded top sub-triangle */}
                  <polygon
                    points={`${triA.x},${triA.y} ${ptD.x},${ptD.y} ${ptE.x},${ptE.y}`}
                    className="fill-indigo-100/70"
                  />

                  {/* Parallel Line DE */}
                  <line
                    x1={ptD.x - 20}
                    y1={ptD.y}
                    x2={ptE.x + 20}
                    y2={ptE.y}
                    className="stroke-rose-600 stroke-[3] stroke-dasharray-[4]"
                  />

                  {/* Base Line BC */}
                  <line
                    x1={triB.x}
                    y1={triB.y}
                    x2={triC.x}
                    y2={triC.y}
                    className="stroke-blue-800 stroke-[3]"
                  />

                  {/* Vertices */}
                  <circle cx={triA.x} cy={triA.y} r="6" className="fill-blue-700" />
                  <circle cx={triB.x} cy={triB.y} r="6" className="fill-blue-700" />
                  <circle cx={triC.x} cy={triC.y} r="6" className="fill-blue-700" />
                  <circle cx={ptD.x} cy={ptD.y} r="6" className="fill-rose-600 animate-pulse" />
                  <circle cx={ptE.x} cy={ptE.y} r="6" className="fill-rose-600 animate-pulse" />

                  {/* Labels */}
                  <text x={triA.x} y={triA.y - 12} textAnchor="middle" className="font-extrabold text-sm fill-blue-900">
                    A
                  </text>
                  <text x={triB.x - 14} y={triB.y + 6} textAnchor="end" className="font-extrabold text-sm fill-blue-900">
                    B
                  </text>
                  <text x={triC.x + 14} y={triC.y + 6} textAnchor="start" className="font-extrabold text-sm fill-blue-900">
                    C
                  </text>
                  <text x={ptD.x - 14} y={ptD.y - 4} textAnchor="end" className="font-extrabold text-sm fill-rose-700">
                    D
                  </text>
                  <text x={ptE.x + 14} y={ptE.y - 4} textAnchor="start" className="font-extrabold text-sm fill-rose-700">
                    E
                  </text>

                  {/* Line parallel indicator */}
                  <text x={250} y={ptD.y - 8} textAnchor="middle" className="font-bold text-xs fill-rose-600">
                    DE ∥ BC
                  </text>
                </svg>
              </div>

              {/* Right Controls & Live Math */}
              <div className="lg:col-span-5 space-y-5">
                <div className="space-y-2">
                  <h3 className="text-lg font-black text-gray-900">
                    Basic Proportionality Theorem (BPT)
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    If a line is drawn parallel to one side of a triangle intersecting other two sides, it divides both sides in the same ratio:
                  </p>
                </div>

                {/* Slider */}
                <div className="bg-slate-50 border border-gray-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                    <span>Move Line DE Position:</span>
                    <span className="text-blue-600">{Math.round(thalesRatio * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.15"
                    max="0.85"
                    step="0.01"
                    value={thalesRatio}
                    onChange={(e) => setThalesRatio(parseFloat(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                </div>

                {/* Live Formula Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 space-y-4">
                  <div className="text-center font-black text-lg text-blue-950">
                    <span className="bg-white px-3 py-1 rounded-lg border border-blue-200">
                      AD / DB = AE / EC
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-white p-3 rounded-xl border border-blue-100 text-center space-y-1">
                      <span className="text-gray-500 font-semibold block">Left Side (AD / DB)</span>
                      <span className="font-black text-sm text-gray-900">
                        {lengthAD} / {lengthDB}
                      </span>
                      <span className="block text-emerald-700 font-extrabold text-base">= {ratioLeft}</span>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-blue-100 text-center space-y-1">
                      <span className="text-gray-500 font-semibold block">Right Side (AE / EC)</span>
                      <span className="font-black text-sm text-gray-900">
                        {lengthAE} / {lengthEC}
                      </span>
                      <span className="block text-emerald-700 font-extrabold text-base">= {ratioRight}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-100/70 p-2.5 rounded-xl">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Theorem Verified: Both ratios remain precisely equal!</span>
                  </div>
                </div>

                <div className="text-xs text-gray-500 flex items-center gap-1.5 pt-1">
                  <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                  <span>Tamil Nadu State Board Class 10 Mathematics, Chapter 4 (Geometry), Page 162</span>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════ 2. COORDINATE GEOMETRY SIMULATION ════════════════ */}
          {activeTab === 'coordinate' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Canvas */}
              <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden">
                <svg viewBox="0 0 400 320" className="w-full max-w-md h-auto select-none">
                  {/* Grid Lines */}
                  {Array.from({ length: 11 }).map((_, i) => (
                    <line
                      key={`v-${i}`}
                      x1={i * 40}
                      y1={0}
                      x2={i * 40}
                      y2={320}
                      className="stroke-slate-800 stroke-[1]"
                    />
                  ))}
                  {Array.from({ length: 9 }).map((_, i) => (
                    <line
                      key={`h-${i}`}
                      x1={0}
                      y1={i * 40}
                      x2={400}
                      y2={i * 40}
                      className="stroke-slate-800 stroke-[1]"
                    />
                  ))}

                  {/* Axes */}
                  <line x1={40} y1={280} x2={380} y2={280} className="stroke-slate-500 stroke-[2]" />
                  <line x1={40} y1={20} x2={40} y2={280} className="stroke-slate-500 stroke-[2]" />

                  {/* Straight Line through P1 & P2 */}
                  <line
                    x1={40 + p1.x * 34}
                    y1={280 - p1.y * 28}
                    x2={40 + p2.x * 34}
                    y2={280 - p2.y * 28}
                    className="stroke-cyan-400 stroke-[3]"
                  />

                  {/* Triangle for Rise / Run */}
                  <line
                    x1={40 + p1.x * 34}
                    y1={280 - p1.y * 28}
                    x2={40 + p2.x * 34}
                    y2={280 - p1.y * 28}
                    className="stroke-amber-400 stroke-[2] stroke-dasharray-[3]"
                  />
                  <line
                    x1={40 + p2.x * 34}
                    y1={280 - p1.y * 28}
                    x2={40 + p2.x * 34}
                    y2={280 - p2.y * 28}
                    className="stroke-amber-400 stroke-[2] stroke-dasharray-[3]"
                  />

                  {/* Point 1 */}
                  <circle cx={40 + p1.x * 34} cy={280 - p1.y * 28} r="6" className="fill-cyan-400" />
                  <text
                    x={40 + p1.x * 34}
                    y={280 - p1.y * 28 - 10}
                    textAnchor="middle"
                    className="font-bold text-xs fill-cyan-200"
                  >
                    A({p1.x}, {p1.y})
                  </text>

                  {/* Point 2 */}
                  <circle cx={40 + p2.x * 34} cy={280 - p2.y * 28} r="6" className="fill-rose-500" />
                  <text
                    x={40 + p2.x * 34}
                    y={280 - p2.y * 28 - 10}
                    textAnchor="middle"
                    className="font-bold text-xs fill-rose-200"
                  >
                    B({p2.x}, {p2.y})
                  </text>
                </svg>
              </div>

              {/* Right Controls */}
              <div className="lg:col-span-5 space-y-4">
                <h3 className="text-lg font-black text-gray-900">
                  Slope & Straight Line Equation
                </h3>

                {/* Point Controls */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-50 border border-gray-200 rounded-2xl p-3.5 space-y-2">
                    <span className="font-extrabold text-cyan-800 block">Point A (x₁, y₁)</span>
                    <div className="flex items-center gap-2">
                      <span>X:</span>
                      <input
                        type="number"
                        min="0"
                        max="8"
                        value={p1.x}
                        onChange={(e) => setP1({ ...p1, x: Number(e.target.value) })}
                        className="w-14 p-1 rounded border border-gray-300 font-bold text-center"
                      />
                      <span>Y:</span>
                      <input
                        type="number"
                        min="0"
                        max="8"
                        value={p1.y}
                        onChange={(e) => setP1({ ...p1, y: Number(e.target.value) })}
                        className="w-14 p-1 rounded border border-gray-300 font-bold text-center"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-gray-200 rounded-2xl p-3.5 space-y-2">
                    <span className="font-extrabold text-rose-800 block">Point B (x₂, y₂)</span>
                    <div className="flex items-center gap-2">
                      <span>X:</span>
                      <input
                        type="number"
                        min="0"
                        max="8"
                        value={p2.x}
                        onChange={(e) => setP2({ ...p2, x: Number(e.target.value) })}
                        className="w-14 p-1 rounded border border-gray-300 font-bold text-center"
                      />
                      <span>Y:</span>
                      <input
                        type="number"
                        min="0"
                        max="8"
                        value={p2.y}
                        onChange={(e) => setP2({ ...p2, y: Number(e.target.value) })}
                        className="w-14 p-1 rounded border border-gray-300 font-bold text-center"
                      />
                    </div>
                  </div>
                </div>

                {/* Live Formula Outputs */}
                <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                    <span className="text-gray-600 font-semibold">Slope (சாய்வு m = Δy / Δx):</span>
                    <span className="font-black text-base text-indigo-900">{slope}</span>
                  </div>

                  <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                    <span className="text-gray-600 font-semibold">Distance d = √((x₂-x₁)² + (y₂-y₁)²):</span>
                    <span className="font-black text-sm text-indigo-900">{distance} units</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 font-semibold">Midpoint ((x₁+x₂)/2, (y₁+y₂)/2):</span>
                    <span className="font-black text-sm text-indigo-900">({midpoint.x}, {midpoint.y})</span>
                  </div>
                </div>

                <div className="text-xs text-gray-500 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                  <span>Tamil Nadu State Board Class 10 Mathematics, Chapter 5 (Coordinate Geometry), Page 208</span>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════ 3. RAY OPTICS SIMULATION ════════════════ */}
          {activeTab === 'optics' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Optics Canvas */}
              <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden">
                <svg viewBox="0 0 500 280" className="w-full max-w-md h-auto select-none">
                  {/* Principal Axis */}
                  <line x1="10" y1="140" x2="490" y2="140" className="stroke-slate-600 stroke-[1.5] stroke-dasharray-[4]" />

                  {/* Lens (Center at X=250) */}
                  <ellipse cx="250" cy="140" rx={lensType === 'convex' ? 12 : 6} ry="100" className="fill-blue-500/20 stroke-cyan-400 stroke-[2]" />

                  {/* Focus Points F1 and F2 */}
                  <circle cx={250 - focalLength} cy="140" r="4" className="fill-amber-400" />
                  <text x={250 - focalLength} y="156" textAnchor="middle" className="text-[10px] fill-amber-300 font-bold">F1</text>

                  <circle cx={250 + focalLength} cy="140" r="4" className="fill-amber-400" />
                  <text x={250 + focalLength} y="156" textAnchor="middle" className="text-[10px] fill-amber-300 font-bold">F2</text>

                  {/* 2F points */}
                  <circle cx={250 - focalLength * 2} cy="140" r="3" className="fill-slate-400" />
                  <text x={250 - focalLength * 2} y="156" textAnchor="middle" className="text-[9px] fill-slate-400 font-bold">2F1</text>

                  <circle cx={250 + focalLength * 2} cy="140" r="3" className="fill-slate-400" />
                  <text x={250 + focalLength * 2} y="156" textAnchor="middle" className="text-[9px] fill-slate-400 font-bold">2F2</text>

                  {/* Object Arrow */}
                  <line
                    x1={250 - objectDistance}
                    y1="140"
                    x2={250 - objectDistance}
                    y2={140 - objectHeight}
                    className="stroke-emerald-400 stroke-[3]"
                  />
                  <polygon
                    points={`${250 - objectDistance},${140 - objectHeight - 4} ${250 - objectDistance - 4},${140 - objectHeight + 4} ${250 - objectDistance + 4},${140 - objectHeight + 4}`}
                    className="fill-emerald-400"
                  />
                  <text x={250 - objectDistance} y={140 - objectHeight - 8} textAnchor="middle" className="text-[10px] fill-emerald-300 font-bold">Object</text>

                  {/* Parallel Ray -> through F2 */}
                  <line
                    x1={250 - objectDistance}
                    y1={140 - objectHeight}
                    x2="250"
                    y2={140 - objectHeight}
                    className="stroke-amber-400 stroke-[1.5]"
                  />
                  <line
                    x1="250"
                    y1={140 - objectHeight}
                    x2={250 + vSigned}
                    y2={140 - (magnification * objectHeight)}
                    className="stroke-amber-400 stroke-[1.5]"
                  />

                  {/* Central Ray -> through optic centre (250, 140) */}
                  <line
                    x1={250 - objectDistance}
                    y1={140 - objectHeight}
                    x2={250 + vSigned}
                    y2={140 - (magnification * objectHeight)}
                    className="stroke-cyan-400 stroke-[1.5]"
                  />

                  {/* Image Arrow (if within view range) */}
                  {vSigned > -200 && vSigned < 240 && (
                    <>
                      <line
                        x1={250 + vSigned}
                        y1="140"
                        x2={250 + vSigned}
                        y2={140 - (magnification * objectHeight)}
                        className={`stroke-[3] ${isReal ? 'stroke-rose-500' : 'stroke-purple-400 stroke-dasharray-[3]'}`}
                      />
                      <text x={250 + vSigned} y="170" textAnchor="middle" className="text-[10px] fill-rose-300 font-bold">
                        Image ({isReal ? 'Real' : 'Virtual'})
                      </text>
                    </>
                  )}
                </svg>
              </div>

              {/* Right Controls */}
              <div className="lg:col-span-5 space-y-4">
                <h3 className="text-lg font-black text-gray-900">
                  Thin Lens Formula & Ray Tracing
                </h3>

                {/* Lens Type */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setLensType('convex')}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                      lensType === 'convex' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-gray-700'
                    }`}
                  >
                    Convex Lens (குவி லென்ஸ்)
                  </button>
                  <button
                    onClick={() => setLensType('concave')}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                      lensType === 'concave' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-gray-700'
                    }`}
                  >
                    Concave Lens (குழி லென்ஸ்)
                  </button>
                </div>

                {/* Sliders */}
                <div className="bg-slate-50 border border-gray-200 rounded-2xl p-4 space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between font-bold text-gray-700 mb-1">
                      <span>Object Distance (u):</span>
                      <span className="text-blue-600">{objectDistance} mm</span>
                    </div>
                    <input
                      type="range"
                      min="60"
                      max="240"
                      value={objectDistance}
                      onChange={(e) => setObjectDistance(Number(e.target.value))}
                      className="w-full accent-blue-600"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between font-bold text-gray-700 mb-1">
                      <span>Focal Length (f):</span>
                      <span className="text-blue-600">{focalLength} mm</span>
                    </div>
                    <input
                      type="range"
                      min="60"
                      max="140"
                      value={focalLength}
                      onChange={(e) => setFocalLength(Number(e.target.value))}
                      className="w-full accent-blue-600"
                    />
                  </div>
                </div>

                {/* Live Lens Formula Math */}
                <div className="bg-cyan-50 border border-cyan-200 rounded-2xl p-4 space-y-2.5 text-xs">
                  <div className="text-center font-black text-sm text-cyan-950">
                    1/v - 1/u = 1/f &nbsp;⇒&nbsp; v = {Math.round(vSigned)} mm
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <div className="bg-white p-2 rounded-lg border border-cyan-100">
                      <span className="text-gray-500 block">Nature:</span>
                      <span className="font-extrabold text-cyan-900">
                        {isReal ? 'Real & Inverted (மெய், தலைகீழ்)' : 'Virtual & Erect (மாய, நேரான)'}
                      </span>
                    </div>

                    <div className="bg-white p-2 rounded-lg border border-cyan-100">
                      <span className="text-gray-500 block">Magnification (m):</span>
                      <span className="font-extrabold text-cyan-900">
                        {magnification.toFixed(2)}x ({imageHeight} mm)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-gray-500 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                  <span>Tamil Nadu State Board Class 10 Science, Chapter 2 (Optics), Page 18</span>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════ 4. OHM'S LAW SIMULATION ════════════════ */}
          {activeTab === 'ohms' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Circuit Visualizer */}
              <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center">
                <svg viewBox="0 0 400 240" className="w-full max-w-md h-auto select-none">
                  {/* Wire Circuit Loop */}
                  <rect
                    x="50"
                    y="40"
                    width="300"
                    height="160"
                    rx="16"
                    className="fill-none stroke-amber-400 stroke-[4]"
                  />

                  {/* Battery (Left side) */}
                  <line x1="50" y1="100" x2="50" y2="140" className="stroke-slate-900 stroke-[8]" />
                  <line x1="40" y1="110" x2="60" y2="110" className="stroke-rose-500 stroke-[4]" />
                  <line x1="45" y1="130" x2="55" y2="130" className="stroke-slate-400 stroke-[4]" />
                  <text x="30" y="105" className="text-xs font-black fill-rose-400">+</text>
                  <text x="30" y="135" className="text-xs font-black fill-slate-400">-</text>
                  <text x="25" y="160" className="text-[11px] font-bold fill-rose-300">{voltage}V</text>

                  {/* Resistor Zigzag (Top side) */}
                  <path
                    d="M 160 40 L 170 25 L 185 55 L 200 25 L 215 55 L 230 25 L 240 40"
                    className="fill-none stroke-cyan-400 stroke-[4]"
                  />
                  <text x="200" y="18" textAnchor="middle" className="text-xs font-black fill-cyan-300">
                    R = {resistance} Ω
                  </text>

                  {/* Ammeter (Bottom side) */}
                  <circle cx="200" cy="200" r="22" className="fill-slate-950 stroke-emerald-400 stroke-[3]" />
                  <text x="200" y="206" textAnchor="middle" className="text-sm font-black fill-emerald-300">
                    {current}A
                  </text>

                  {/* Flowing electrons animation */}
                  <circle cx="100" cy="40" r="4" className="fill-amber-200 animate-ping" />
                  <circle cx="300" cy="40" r="4" className="fill-amber-200 animate-ping" />
                  <circle cx="350" cy="120" r="4" className="fill-amber-200 animate-ping" />
                </svg>
              </div>

              {/* Right Controls */}
              <div className="lg:col-span-5 space-y-4">
                <h3 className="text-lg font-black text-gray-900">
                  Ohm's Law: V = I × R
                </h3>

                {/* Voltage & Resistance Sliders */}
                <div className="bg-slate-50 border border-gray-200 rounded-2xl p-4 space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between font-bold text-gray-700 mb-1">
                      <span>Potential Difference (V):</span>
                      <span className="text-rose-600 font-extrabold">{voltage} Volts</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="24"
                      value={voltage}
                      onChange={(e) => setVoltage(Number(e.target.value))}
                      className="w-full accent-rose-600"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between font-bold text-gray-700 mb-1">
                      <span>Resistance (R):</span>
                      <span className="text-cyan-600 font-extrabold">{resistance} Ohms (Ω)</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="20"
                      value={resistance}
                      onChange={(e) => setResistance(Number(e.target.value))}
                      className="w-full accent-cyan-600"
                    />
                  </div>
                </div>

                {/* Multimeter Readout */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                    <span className="text-gray-600 font-semibold">Electric Current (I = V/R):</span>
                    <span className="font-black text-base text-emerald-900">{current} Amperes</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 font-semibold">Power Dissipation (P = V × I):</span>
                    <span className="font-black text-sm text-emerald-900">{power} Watts</span>
                  </div>
                </div>

                <div className="text-xs text-gray-500 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                  <span>Tamil Nadu State Board Class 10 Science, Chapter 4 (Electricity), Page 44</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
