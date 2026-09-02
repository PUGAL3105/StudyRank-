import { useState } from 'react'
import { Camera, Mic, Upload, X, CheckCircle, RefreshCw, Volume2 } from 'lucide-react'

interface MultimodalInputProps {
  mode: 'image' | 'voice'
  onClose: () => void
  onSubmitQuestion: (extractedText: string) => void
}

export default function MultimodalInput({ mode, onClose, onSubmitQuestion }: MultimodalInputProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [extractedText, setExtractedText] = useState('')
  const [isRecording, setIsRecording] = useState(false)

  const handleSimulateImageUpload = () => {
    setIsProcessing(true)
    setTimeout(() => {
      setExtractedText('How do chlorophyll molecules absorb light energy and convert it into chemical energy during photosynthesis?')
      setIsProcessing(false)
    }, 1200)
  }

  const handleToggleRecord = () => {
    if (isRecording) {
      setIsRecording(false)
      setIsProcessing(true)
      setTimeout(() => {
        setExtractedText('What is the difference between light-dependent reactions and the Calvin cycle in plant leaves?')
        setIsProcessing(false)
      }, 1000)
    } else {
      setIsRecording(true)
    }
  }

  const handleSubmit = () => {
    if (extractedText.trim()) {
      onSubmitQuestion(extractedText)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-xl border border-gray-200 animate-in fade-in zoom-in duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            {mode === 'image' ? (
              <>
                <Camera className="w-5 h-5 text-primary-600" />
                <h3 className="font-bold text-gray-900 text-base">Upload Textbook Photo (OCR)</h3>
              </>
            ) : (
              <>
                <Mic className="w-5 h-5 text-secondary-600" />
                <h3 className="font-bold text-gray-900 text-base">Voice Question Input</h3>
              </>
            )}
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 text-center">
          {mode === 'image' ? (
            <div>
              {!extractedText ? (
                <div
                  onClick={handleSimulateImageUpload}
                  className="border-2 border-dashed border-primary-300 bg-primary-50/50 hover:bg-primary-50 rounded-xl p-8 cursor-pointer transition-all flex flex-col items-center justify-center"
                >
                  <Upload className="w-10 h-10 text-primary-500 mb-3" />
                  <p className="font-semibold text-gray-900 text-sm">Click to upload textbook page or photo</p>
                  <p className="text-xs text-gray-500 mt-1">Supports PNG, JPG, JPEG (OCR auto-detect)</p>
                  {isProcessing && (
                    <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-primary-700">
                      <RefreshCw className="w-4 h-4 animate-spin" /> Scanning textbook image with AI OCR...
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-left bg-gray-50 p-4 border border-gray-200 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-secondary-700 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-secondary-500" /> OCR Text Extracted
                    </span>
                    <button onClick={() => setExtractedText('')} className="text-xs text-primary-600 hover:underline">Re-scan</button>
                  </div>
                  <textarea
                    value={extractedText}
                    onChange={(e) => setExtractedText(e.target.value)}
                    rows={3}
                    className="w-full p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none bg-white"
                  />
                </div>
              )}
            </div>
          ) : (
            <div>
              {!extractedText ? (
                <div className="py-8 flex flex-col items-center">
                  <button
                    onClick={handleToggleRecord}
                    className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                      isRecording
                        ? 'bg-red-500 text-white animate-pulse shadow-lg ring-8 ring-red-100'
                        : 'bg-primary-600 text-white hover:bg-primary-700 shadow-md'
                    }`}
                  >
                    <Mic className="w-8 h-8" />
                  </button>
                  <p className="mt-4 text-sm font-semibold text-gray-800">
                    {isRecording ? 'Listening... Speak your question clearly' : 'Tap the mic to start speaking'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Example: "What is the difference between photosynthesis and respiration?"</p>
                  {isProcessing && (
                    <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-secondary-700">
                      <RefreshCw className="w-4 h-4 animate-spin" /> Converting speech to text...
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-left bg-gray-50 p-4 border border-gray-200 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-secondary-700 flex items-center gap-1">
                      <Volume2 className="w-4 h-4 text-secondary-500" /> Speech Transcribed
                    </span>
                    <button onClick={() => setExtractedText('')} className="text-xs text-primary-600 hover:underline">Re-record</button>
                  </div>
                  <textarea
                    value={extractedText}
                    onChange={(e) => setExtractedText(e.target.value)}
                    rows={3}
                    className="w-full p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none bg-white"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 rounded-lg font-medium">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!extractedText.trim()}
            className="px-5 py-2 text-sm bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
          >
            Ask AI Teacher
          </button>
        </div>
      </div>
    </div>
  )
}
