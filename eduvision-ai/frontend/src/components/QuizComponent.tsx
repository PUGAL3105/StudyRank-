import { useState } from 'react'
import { CheckCircle2, XCircle, Trophy, RotateCcw, HelpCircle, ArrowRight } from 'lucide-react'

interface QuizQuestion {
  id: number
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

export default function QuizComponent({ chapterTitle = 'Photosynthesis' }: { chapterTitle?: string }) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [showResults, setShowResults] = useState(false)
  const [answered, setAnswered] = useState<boolean[]>(new Array(5).fill(false))

  const questions: QuizQuestion[] = [
    {
      id: 1,
      question: 'What is the main pigment responsible for capturing solar light energy during photosynthesis?',
      options: ['Hemoglobin', 'Chlorophyll', 'Carotene', 'Xanthophyll'],
      correctIndex: 1,
      explanation: 'Chlorophyll is the green pigment in chloroplasts that absorbs sunlight energy.'
    },
    {
      id: 2,
      question: 'Which microscopic pores on leaves allow carbon dioxide to enter for photosynthesis?',
      options: ['Stomata', 'Xylem', 'Phloem', 'Cuticle'],
      correctIndex: 0,
      explanation: 'Stomata are tiny openings regulated by guard cells for gas exchange.'
    },
    {
      id: 3,
      question: 'What vital gas is produced and released into the atmosphere as a byproduct?',
      options: ['Nitrogen', 'Carbon Dioxide', 'Oxygen', 'Methane'],
      correctIndex: 2,
      explanation: 'Oxygen gas (O2) is generated when water molecules are split in light reactions.'
    },
    {
      id: 4,
      question: 'Where inside plant cells does photosynthesis take place?',
      options: ['Mitochondria', 'Chloroplast', 'Ribosome', 'Golgi Apparatus'],
      correctIndex: 1,
      explanation: 'Chloroplasts contain the thylakoid membranes where light activation occurs.'
    },
    {
      id: 5,
      question: 'What form of chemical sugar energy do plants create to store power for growth?',
      options: ['Sucrose', 'Glucose', 'Lactose', 'Starch'],
      correctIndex: 1,
      explanation: 'Glucose (C6H12O6) is synthesized during light-independent Calvin cycle reactions.'
    }
  ]

  const handleSelectOption = (index: number) => {
    if (selectedOption !== null) return // Already answered
    setSelectedOption(index)
    
    const isCorrect = index === questions[currentQuestion].correctIndex
    if (isCorrect) {
      setScore((prev) => prev + 1)
    }

    const nextAnswered = [...answered]
    nextAnswered[currentQuestion] = true
    setAnswered(nextAnswered)
  }

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1)
      setSelectedOption(null)
    } else {
      setShowResults(true)
    }
  }

  const handleRestart = () => {
    setCurrentQuestion(0)
    setSelectedOption(null)
    setScore(0)
    setShowResults(false)
    setAnswered(new Array(5).fill(false))
  }

  const q = questions[currentQuestion]

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      {/* Quiz Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-primary-200" />
          <h3 className="font-bold text-base">Chapter Practice Quiz: {chapterTitle}</h3>
        </div>
        {!showResults && (
          <span className="text-xs font-semibold px-2.5 py-1 bg-white/20 rounded-full">
            Question {currentQuestion + 1} of {questions.length}
          </span>
        )}
      </div>

      {!showResults ? (
        <div className="p-6">
          {/* Question Title */}
          <h4 className="text-base font-semibold text-gray-900 mb-6">
            {q.id}. {q.question}
          </h4>

          {/* Options Grid */}
          <div className="space-y-3 mb-6">
            {q.options.map((opt, idx) => {
              let optionStyle = 'border-gray-200 hover:border-primary-300 hover:bg-primary-50/50 text-gray-800'
              if (selectedOption !== null) {
                if (idx === q.correctIndex) {
                  optionStyle = 'border-secondary-500 bg-secondary-50 text-secondary-900 font-semibold'
                } else if (idx === selectedOption) {
                  optionStyle = 'border-red-400 bg-red-50 text-red-900 font-semibold'
                } else {
                  optionStyle = 'border-gray-200 opacity-50 text-gray-500'
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  disabled={selectedOption !== null}
                  className={`w-full p-4 text-left border rounded-lg flex items-center justify-between transition-all ${optionStyle}`}
                >
                  <span className="text-sm">{opt}</span>
                  {selectedOption !== null && idx === q.correctIndex && (
                    <CheckCircle2 className="w-5 h-5 text-secondary-600 flex-shrink-0" />
                  )}
                  {selectedOption !== null && idx === selectedOption && idx !== q.correctIndex && (
                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Answer Explanation Banner */}
          {selectedOption !== null && (
            <div className={`p-4 rounded-lg border mb-6 ${selectedOption === q.correctIndex ? 'bg-secondary-50 border-secondary-200 text-secondary-900' : 'bg-red-50 border-red-200 text-red-900'}`}>
              <p className="text-xs font-bold uppercase tracking-wider mb-1">
                {selectedOption === q.correctIndex ? 'Correct Answer! 🎉' : 'Review Explanation:'}
              </p>
              <p className="text-sm">{q.explanation}</p>
            </div>
          )}

          {/* Next Button */}
          {selectedOption !== null && (
            <div className="flex justify-end">
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium text-sm transition-colors"
              >
                {currentQuestion < questions.length - 1 ? 'Next Question' : 'View Quiz Results'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Results View */
        <div className="p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 text-primary-600 rounded-full mb-4">
            <Trophy className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Quiz Completed!</h3>
          <p className="text-gray-600 mb-6">
            You scored <span className="font-bold text-primary-600">{score}</span> out of <span className="font-bold text-gray-900">{questions.length}</span> ({Math.round((score / questions.length) * 100)}%)
          </p>

          <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg max-w-md mx-auto mb-6 text-sm text-primary-900">
            {score >= 4
              ? '🌟 Excellent work! You have mastered the key concepts in this chapter.'
              : '👍 Good effort! Review the step-by-step points in the lesson view before retrying.'}
          </div>

          <button
            onClick={handleRestart}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium text-sm shadow-sm"
          >
            <RotateCcw className="w-4 h-4" /> Retry Quiz
          </button>
        </div>
      )}
    </div>
  )
}
