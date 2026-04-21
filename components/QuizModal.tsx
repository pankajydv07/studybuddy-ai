'use client'

import { useState } from 'react'
import { X, Loader2, Zap, CheckCircle, XCircle, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import type { QuizQuestion } from '@/types'

interface Props {
  sessionId: string
  materialIds: string[]
  onClose: () => void
}

type Phase = 'config' | 'loading' | 'quiz' | 'results'

export default function QuizModal({ sessionId, materialIds, onClose }: Props) {
  const [phase, setPhase] = useState<Phase>('config')
  const [numQ, setNumQ] = useState(5)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [userAnswers, setUserAnswers] = useState<number[]>([])
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState(0)

  async function generateQuiz() {
    setPhase('loading')
    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ materialIds, numQuestions: numQ, sessionId }),
      })
      const { questions: qs } = await res.json()
      if (!qs?.length) throw new Error('No questions generated')
      setQuestions(qs)
      setUserAnswers(new Array(qs.length).fill(-1))
      setPhase('quiz')
    } catch {
      toast.error('Failed to generate quiz')
      setPhase('config')
    }
  }

  function selectOption(i: number) {
    if (revealed) return
    setSelected(i)
  }

  function reveal() {
    if (selected === null) return
    setRevealed(true)
    const correct = questions[current].correct === selected
    if (correct) setScore((s) => s + 1)
    setUserAnswers((prev) => {
      const next = [...prev]
      next[current] = selected
      return next
    })
  }

  function next() {
    if (current < questions.length - 1) {
      setCurrent((c) => c + 1)
      setSelected(null)
      setRevealed(false)
    } else {
      finishQuiz()
    }
  }

  async function finishQuiz() {
    setPhase('results')
    // Save result
    await fetch('/api/quiz-result', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, questions, userAnswers }),
    }).catch(() => {})
  }

  const pct = Math.round((score / questions.length) * 100)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border/60 rounded-3xl w-full max-w-lg shadow-2xl shadow-primary/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground">
              {phase === 'results' ? 'Quiz Results' : 'Quick Quiz'}
            </h2>
          </div>
          {phase !== 'loading' && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="p-6">
          {/* Config */}
          {phase === 'config' && (
            <div className="space-y-5">
              <p className="text-muted-foreground text-sm">
                Test yourself on your selected materials. The AI generates unique questions each time.
              </p>
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  Number of questions
                </label>
                <div className="flex gap-2">
                  {[3, 5, 10].map((n) => (
                    <button
                      key={n}
                      onClick={() => setNumQ(n)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all
                        ${numQ === n
                          ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/30'
                          : 'border-border text-muted-foreground hover:border-primary/50 hover:text-primary'}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <button
                id="generate-quiz-btn"
                onClick={generateQuiz}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-2xl py-3 transition-all hover:shadow-lg hover:shadow-primary/30"
              >
                Generate Quiz
              </button>
            </div>
          )}

          {/* Loading */}
          {phase === 'loading' && (
            <div className="py-8 text-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Generating your quiz...</p>
            </div>
          )}

          {/* Quiz */}
          {phase === 'quiz' && questions[current] && (
            <div className="space-y-4">
              {/* Progress */}
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Question {current + 1} of {questions.length}</span>
                <span>{score} correct</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5">
                <div
                  className="bg-primary h-1.5 rounded-full transition-all"
                  style={{ width: `${((current) / questions.length) * 100}%` }}
                />
              </div>

              {/* Question */}
              <p className="text-foreground font-medium leading-snug mt-3">
                {questions[current].q}
              </p>

              {/* Options */}
              <div className="space-y-2 mt-4">
                {questions[current].options.map((opt, i) => {
                  const correct = questions[current].correct
                  let cls = 'border-border hover:border-primary/50 hover:bg-primary/5 text-foreground'
                  if (revealed) {
                    if (i === correct) cls = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                    else if (i === selected && i !== correct) cls = 'border-red-400 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                    else cls = 'border-border text-muted-foreground opacity-60'
                  } else if (selected === i) {
                    cls = 'border-primary bg-primary/10 text-primary'
                  }
                  return (
                    <button
                      key={i}
                      onClick={() => selectOption(i)}
                      className={`w-full text-left text-sm px-4 py-3 rounded-xl border-2 transition-all ${cls}`}
                    >
                      <span className="font-semibold mr-2">{String.fromCharCode(65 + i)}.</span>
                      {opt}
                    </button>
                  )
                })}
              </div>

              {/* Explanation */}
              {revealed && (
                <div className="bg-muted rounded-xl p-3 text-sm text-muted-foreground animate-fade-in-up">
                  <span className="font-medium text-foreground">Explanation: </span>
                  {questions[current].explanation}
                </div>
              )}

              <div className="flex gap-2 mt-2">
                {!revealed ? (
                  <button
                    onClick={reveal}
                    disabled={selected === null}
                    className="flex-1 bg-primary disabled:opacity-40 hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl py-2.5 transition-all text-sm"
                  >
                    Check Answer
                  </button>
                ) : (
                  <button
                    onClick={next}
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl py-2.5 transition-all text-sm flex items-center justify-center gap-2"
                  >
                    {current < questions.length - 1 ? 'Next Question' : 'See Results'}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Results */}
          {phase === 'results' && (
            <div className="text-center space-y-4">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto text-2xl font-bold
                ${pct >= 80 ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600' :
                  pct >= 50 ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600' :
                  'bg-red-100 dark:bg-red-900/20 text-red-600'}`}>
                {pct}%
              </div>
              <div>
                <p className="font-semibold text-foreground text-lg">
                  {pct >= 80 ? 'Excellent! 🎉' : pct >= 50 ? 'Good effort! 💪' : 'Keep studying! 📚'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {score} out of {questions.length} correct
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setPhase('config')
                    setScore(0)
                    setCurrent(0)
                    setSelected(null)
                    setRevealed(false)
                  }}
                  className="flex-1 border border-border hover:border-primary/50 text-foreground hover:text-primary rounded-xl py-2.5 text-sm font-medium transition-all"
                >
                  Try Again
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl py-2.5 text-sm font-semibold transition-all"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
