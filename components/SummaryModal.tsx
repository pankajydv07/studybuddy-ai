'use client'

import { useEffect, useState } from 'react'
import { X, Loader2, FileText, Copy, Check } from 'lucide-react'
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
      const { summary: s } = await res.json()
      setSummary(s ?? '')
    } catch {
      toast.error('Failed to generate summary')
    } finally {
      setLoading(false)
    }
  }

  async function copySummary() {
    await navigator.clipboard.writeText(summary)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function renderMarkdown(text: string): string {
    return text
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
      .replace(/^[-*] (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
      .replace(/\n\n/g, '</p><p>')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border/60 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl shadow-primary/10">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 flex-shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground">Study Summary</h2>
          </div>
          <div className="flex items-center gap-2">
            {!loading && summary && (
              <button
                onClick={copySummary}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
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
              placeholder="Focus on a specific topic (optional)..."
              className="flex-1 text-sm bg-muted rounded-xl px-3 py-2 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              onClick={() => generateSummary(focus || undefined)}
              disabled={loading}
              className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-xl disabled:opacity-50 hover:bg-primary/90 transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Regenerate'}
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
          ) : (
            <div
              className="prose-chat text-sm leading-relaxed animate-fade-in-up"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(summary) }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
