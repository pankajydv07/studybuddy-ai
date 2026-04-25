'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  ArrowLeft, Brain, Send, Loader2, Sparkles,
  BookOpen, Zap, RotateCcw, Copy, Check, FileText
} from 'lucide-react'
import { toast } from 'sonner'
import type { QuizQuestion, ChunkSource } from '@/types'
import QuizModal from '@/components/QuizModal'
import SummaryModal from '@/components/SummaryModal'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: { fileName: string; chunkIndex: number }[]
  isStreaming?: boolean
}

interface SessionRecord {
  id: string
  course_id: string
  selected_material_ids: string[]  // stored as UUID[]
  title: string
  last_active_at: string
  created_at: string
}

export default function StudyPage() {
  const { data: authSession, status } = useSession()
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId as string

  const [sessionData, setSessionData] = useState<SessionRecord | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [showQuiz, setShowQuiz] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (status !== 'authenticated') return
    loadSession()
  }, [status, sessionId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadSession() {
    try {
      const res = await fetch(`/api/session/${sessionId}`)
      if (res.ok) {
        const { session: s } = await res.json()
        if (s) setSessionData(s)
      }
    } catch {
      // ignore - session data will be null
    }
  }

  async function sendMessage() {
    if (!input.trim() || isStreaming || !sessionData) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsStreaming(true)

    const assistantId = crypto.randomUUID()
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: 'assistant', content: '', isStreaming: true },
    ])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: userMessage.content,
          materialIds: sessionData.selected_material_ids,
        }),
      })

      const sourcesHeader = res.headers.get('X-Sources')
      const sources = sourcesHeader ? JSON.parse(decodeURIComponent(sourcesHeader)) : []

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        fullText += chunk
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: fullText, isStreaming: true }
              : m
          )
        )
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: fullText, isStreaming: false, sources }
            : m
        )
      )
    } catch {
      toast.error('Failed to get a response. Please try again.')
      setMessages((prev) => prev.filter((m) => m.id !== assistantId))
    } finally {
      setIsStreaming(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  async function copyMessage(id: string, content: string) {
    await navigator.clipboard.writeText(content)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <nav className="flex-shrink-0 bg-background/80 backdrop-blur-lg border-b border-border/50 z-50">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link
            href={sessionData ? `/course/${sessionData.course_id}` : '/dashboard'}
            className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Brain className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {sessionData?.title ?? 'Study Session'}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              id="summary-btn"
              onClick={() => setShowSummary(true)}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:block">Summary</span>
            </button>
            <button
              id="quiz-btn"
              onClick={() => setShowQuiz(true)}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
            >
              <Zap className="w-3.5 h-3.5" />
              <span className="hidden sm:block">Quiz Me</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
          {/* Welcome */}
          {messages.length === 0 && (
            <div className="text-center py-16 animate-fade-in-up">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-foreground mb-2">Ready to study! 🎓</h2>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                Ask me anything about your selected materials. I can explain concepts, quiz you, or create summaries.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 justify-center">
                {[
                  'Explain the main concepts',
                  'What are the key definitions?',
                  'Summarize the most important points',
                  'Quiz me on this material',
                ].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => { setInput(prompt); inputRef.current?.focus() }}
                    className="text-xs font-medium px-3 py-2 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 text-muted-foreground hover:text-primary transition-all"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`animate-fade-in-up flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Brain className="w-4 h-4 text-primary-foreground" />
                </div>
              )}

              <div className={`max-w-[78%] ${msg.role === 'user' ? 'order-first' : ''}`}>
                <div
                  className={`rounded-2xl px-4 py-3 text-sm leading-relaxed
                    ${msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-tr-sm'
                      : 'bg-card border border-border/60 text-foreground rounded-tl-sm'}`}
                >
                  {msg.isStreaming && !msg.content ? (
                    <div className="flex items-center gap-1 h-5">
                      <span className="w-2 h-2 rounded-full bg-muted-foreground typing-dot" />
                      <span className="w-2 h-2 rounded-full bg-muted-foreground typing-dot" />
                      <span className="w-2 h-2 rounded-full bg-muted-foreground typing-dot" />
                    </div>
                  ) : msg.role === 'assistant' ? (
                    <div className="prose-chat">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>

                {/* Footer: sources + copy */}
                {msg.role === 'assistant' && !msg.isStreaming && (
                  <div className="flex items-center gap-2 mt-1.5 px-1">
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap">
                        {msg.sources.slice(0, 3).map((s, i) => (
                          <span
                            key={i}
                            className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full"
                          >
                            📄 {truncate(s.fileName, 20)}
                          </span>
                        ))}
                      </div>
                    )}
                    <button
                      onClick={() => copyMessage(msg.id, msg.content)}
                      className="ml-auto p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {copiedId === msg.id
                        ? <Check className="w-3 h-3 text-emerald-500" />
                        : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-muted-foreground">You</span>
                </div>
              )}
            </div>
          ))}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-border/50 bg-background/80 backdrop-blur-lg p-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-3 bg-card border border-border/60 rounded-2xl px-4 py-3 focus-within:border-primary/50 focus-within:shadow-md focus-within:shadow-primary/5 transition-all">
            <textarea
              ref={inputRef}
              id="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your materials..."
              rows={1}
              disabled={isStreaming}
              className="flex-1 bg-transparent resize-none text-sm text-foreground placeholder:text-muted-foreground outline-none max-h-32 leading-relaxed"
              style={{ minHeight: '24px' }}
            />
            <button
              id="send-btn"
              onClick={sendMessage}
              disabled={!input.trim() || isStreaming}
              className="w-9 h-9 rounded-xl bg-primary disabled:opacity-40 hover:bg-primary/90 flex items-center justify-center transition-all hover:shadow-md hover:shadow-primary/30 flex-shrink-0"
            >
              {isStreaming
                ? <Loader2 className="w-4 h-4 text-primary-foreground animate-spin" />
                : <Send className="w-4 h-4 text-primary-foreground" />}
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Enter</kbd> to send,{' '}
            <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Shift+Enter</kbd> for new line
          </p>
        </div>
      </div>

      {/* Modals */}
      {showQuiz && sessionData && (
        <QuizModal
          sessionId={sessionId}
          materialIds={sessionData.selected_material_ids}
          onClose={() => setShowQuiz(false)}
        />
      )}
      {showSummary && sessionData && (
        <SummaryModal
          materialIds={sessionData.selected_material_ids}
          onClose={() => setShowSummary(false)}
        />
      )}
    </div>
  )
}



function truncate(str: string, n: number) {
  return str.length > n ? str.slice(0, n) + '…' : str
}
