import { useState } from 'react'
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Minimize2, Download, CheckCircle2 } from 'lucide-react'

interface DiagramViewerProps {
  topic?: string
  diagramUrl?: string
}

export default function DiagramViewer({ topic = 'Photosynthesis' }: DiagramViewerProps) {
  const [zoom, setZoom] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [activeLabel, setActiveLabel] = useState<string | null>('Sunlight Absorption')

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 2.5))
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.75))
  const handleResetZoom = () => setZoom(1)

  const labels = [
    { id: 'sun', text: 'Sunlight Absorption', desc: 'Chlorophyll captures blue and red light wavelengths.', x: '25%', y: '20%' },
    { id: 'co2', text: 'CO2 Intake (Stomata)', desc: 'Carbon dioxide enters through leaf micro-pores.', x: '15%', y: '55%' },
    { id: 'water', text: 'H2O Absorption (Roots)', desc: 'Water transported from root xylem vessels.', x: '50%', y: '85%' },
    { id: 'oxygen', text: 'Oxygen Release (O2)', desc: 'Oxygen produced as a byproduct of water splitting.', x: '75%', y: '45%' },
    { id: 'glucose', text: 'Glucose Production', desc: 'Chemical energy stored for plant cellular growth.', x: '60%', y: '60%' },
  ]

  return (
    <div className={`bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm ${isFullscreen ? 'fixed inset-4 z-50 flex flex-col bg-white shadow-2xl border-primary-500' : ''}`}>
      {/* Header toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2 py-1 bg-primary-100 text-primary-700 rounded-full">Interactive Diagram</span>
          <h4 className="text-sm font-semibold text-gray-900">{topic} Process Model</h4>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleZoomOut} className="p-1.5 hover:bg-gray-200 rounded text-gray-700" title="Zoom Out">
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs text-gray-600 font-mono w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={handleZoomIn} className="p-1.5 hover:bg-gray-200 rounded text-gray-700" title="Zoom In">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button onClick={handleResetZoom} className="p-1.5 hover:bg-gray-200 rounded text-gray-700" title="Reset Zoom">
            <RotateCcw className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-gray-300 mx-1" />
          <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-1.5 hover:bg-gray-200 rounded text-gray-700" title="Toggle Fullscreen">
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <a
            href="data:text/plain;charset=utf-8,EduVision%20Diagram"
            download={`${topic}_diagram.png`}
            className="flex items-center gap-1 text-xs px-2.5 py-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-md font-medium"
          >
            <Download className="w-3.5 h-3.5" /> Save
          </a>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="relative bg-gradient-to-b from-blue-50/40 to-green-50/40 p-6 flex justify-center items-center overflow-auto min-h-[340px]">
        <div
          className="transition-transform duration-200 relative max-w-full"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
        >
          {/* Photosynthesis SVG Illustration */}
          <svg viewBox="0 0 700 400" className="w-[650px] h-[360px] drop-shadow-md">
            {/* Sun */}
            <circle cx="120" cy="80" r="45" fill="#FCE7F3" stroke="#F59E0B" strokeWidth="4" className="animate-pulse" />
            <circle cx="120" cy="80" r="35" fill="#FBBF24" />
            <path d="M120 20 L120 5 M120 140 L120 155 M60 80 L45 80 M180 80 L195 80 M75 35 L65 25 M165 125 L175 135 M75 125 L65 135 M165 35 L175 25" stroke="#F59E0B" strokeWidth="4" strokeLinecap="round" />

            {/* Sunlight Rays to Leaf */}
            <path d="M160 105 L300 180" stroke="#FBBF24" strokeWidth="3" strokeDasharray="6,6" />
            <polygon points="300,180 290,172 292,185" fill="#FBBF24" />

            {/* Plant Stem & Roots */}
            <path d="M350 250 L350 380" stroke="#047857" strokeWidth="14" strokeLinecap="round" />
            <path d="M350 340 Q310 370 270 380 M350 350 Q380 370 420 380 M350 360 Q340 385 330 395" stroke="#92400E" strokeWidth="4" strokeLinecap="round" />

            {/* Leaf Body */}
            <path d="M350 250 Q200 180 280 120 Q440 100 480 220 Q420 270 350 250 Z" fill="#10B981" stroke="#047857" strokeWidth="4" />
            <path d="M280 120 Q350 180 480 220" stroke="#047857" strokeWidth="3" fill="none" />
            <path d="M320 155 Q360 150 390 140 M350 180 Q390 185 430 180 M370 210 Q400 220 440 215" stroke="#059669" strokeWidth="2" fill="none" />

            {/* CO2 Inflow */}
            <path d="M60 220 Q150 230 240 210" stroke="#3B82F6" strokeWidth="3" strokeDasharray="4,4" />
            <text x="70" y="210" fill="#1E40AF" fontWeight="bold" fontSize="14">CO₂ (Carbon Dioxide)</text>

            {/* H2O Upflow */}
            <path d="M330 380 L330 280" stroke="#0284C7" strokeWidth="4" strokeDasharray="5,5" />
            <text x="240" y="340" fill="#0369A1" fontWeight="bold" fontSize="14">H₂O (Water)</text>

            {/* O2 Outflow */}
            <path d="M460 160 Q550 130 620 120" stroke="#10B981" strokeWidth="3" />
            <polygon points="620,120 610,115 612,125" fill="#10B981" />
            <text x="530" y="110" fill="#047857" fontWeight="bold" fontSize="14">O₂ (Oxygen Out)</text>

            {/* Glucose Output */}
            <rect x="470" y="240" width="140" height="40" rx="8" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="2" />
            <text x="485" y="265" fill="#B45309" fontWeight="bold" fontSize="13">C₆H₁₂O₆ (Glucose)</text>
          </svg>

          {/* Interactive Label Pins */}
          {labels.map((lbl) => (
            <button
              key={lbl.id}
              onClick={() => setActiveLabel(lbl.text)}
              style={{ left: lbl.x, top: lbl.y }}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold shadow-md transition-all ${
                activeLabel === lbl.text ? 'bg-primary-600 text-white scale-110 ring-4 ring-primary-200' : 'bg-white text-gray-800 hover:bg-gray-100'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${activeLabel === lbl.text ? 'bg-white' : 'bg-primary-500'}`} />
              {lbl.text}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Label Explainer Footer */}
      {activeLabel && (
        <div className="p-4 bg-primary-50/70 border-t border-gray-200 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
          <div>
            <h5 className="text-sm font-semibold text-primary-900">{activeLabel}</h5>
            <p className="text-xs text-primary-800 mt-0.5">
              {labels.find((l) => l.text === activeLabel)?.desc || 'Click any pin on the diagram to see how it works.'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
