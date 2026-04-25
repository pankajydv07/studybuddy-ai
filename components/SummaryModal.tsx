'use client'

import { useEffect, useState } from 'react'
import { X, Loader2, FileText, Copy, Check, RotateCcw } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { toast } from 'sonner'

interface Props {
  materialIds: string[]
  onClose: () => void
}

export default function SummaryModal({ materialIds, onClose }: Props) {
  const [summary, setSummary] = useState('')
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [focus, setFocus] = useState('')
  const [sourcesUsed, setSourcesUsed] = useState(0)

  useEffect(() => {
    generateSummary()
  }, [])

  async function generateSummary(f?: string) {
    setLoading(true)
    setSummary('')
    try {
      const res = await fetch('/api/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ materialIds, focus: f }),
      })
      if (!res.ok) throw new Error('Failed')
      const { summary: s, sourcesUsed: n } = await res.json()
      if (!s) throw new Error('Empty summary')
      setSummary(s)
      setSourcesUsed(n ?? 0)
    } catch {
      toast.error('Failed to generate summary. Make sure materials are ingested.')
    } finally {
      setLoading(false)
    }
  }

  async function copySummary() {
    await navigator.clipboard.writeText(summary)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border/60 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl shadow-primary/10">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 flex-shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground">Study Summary</h2>
            {!loading && sourcesUsed > 0 && (
              <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                {sourcesUsed} chunk{sourcesUsed !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!loading && summary && (
              <button
                onClick={copySummary}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title="Copy summary"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Focus filter */}
        <div className="px-6 py-3 border-b border-border/40 flex-shrink-0">
          <div className="flex gap-2">
            <input
              type="text"
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && generateSummary(focus || undefined)}
              placeholder="Focus on a specific topic (optional)..."
              className="flex-1 text-sm bg-muted rounded-xl px-3 py-2 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              onClick={() => generateSummary(focus || undefined)}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-xl disabled:opacity-50 hover:bg-primary/90 transition-colors"
            >
              {loading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <><RotateCcw className="w-3.5 h-3.5" /> Regenerate</>
              }
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="py-16 text-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Generating comprehensive summary...</p>
            </div>
          ) : summary ? (
            <div className="prose-chat animate-fade-in-up">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {summary}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="py-16 text-center text-muted-foreground text-sm">
              No summary generated. Make sure materials have been ingested.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
