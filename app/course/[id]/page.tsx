'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  ArrowLeft, FileText, File, Presentation,
  Loader2, Zap, CheckSquare, Square, Brain, AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'
import type { Course } from '@/types'

interface MaterialRecord {
  id: string
  course_id: string
  user_id: string
  file_name: string
  file_type: string
  drive_file_id: string | null
  extracted_text_status: 'pending' | 'done' | 'error'
}

const FILE_ICONS: Record<string, React.ElementType> = {
  pdf: FileText,
  docx: File,
  pptx: Presentation,
  unknown: File,
}

export default function CoursePage() {
  const { data: authSession, status } = useSession()
  const params = useParams()
  const router = useRouter()
  const courseId = params.id as string

  const [course, setCourse] = useState<Course | null>(null)
  const [materials, setMaterials] = useState<MaterialRecord[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [ingesting, setIngesting] = useState(false)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (status !== 'authenticated') return

    async function load() {
      try {
        const [coursesRes, materialsRes] = await Promise.all([
          fetch('/api/courses'),
          fetch(`/api/materials/${courseId}`),
        ])
        const { courses } = await coursesRes.json()
        const { materials: mats } = await materialsRes.json()

        const found = (courses ?? []).find((c: Course) => c.id === courseId)
        setCourse(found ?? { id: courseId, name: 'Course' })
        setMaterials(mats ?? [])
      } catch {
        toast.error('Failed to load materials')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [status, courseId])

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selected.size === materials.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(materials.map((m) => m.id)))
    }
  }

  async function handleStartStudy() {
    if (selected.size === 0) {
      toast.warning('Select at least one material')
      return
    }

    const selectedIds = [...selected]
    setIngesting(true)

    try {
      // Ingest un-processed files first
      const toIngest = materials
        .filter((m) => selectedIds.includes(m.id) && m.extracted_text_status !== 'done')
        .map((m) => m.id)

      if (toIngest.length > 0) {
        toast.info(`Processing ${toIngest.length} file${toIngest.length > 1 ? 's' : ''}...`)
        const ingestRes = await fetch('/api/ingest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ materialIds: toIngest }),
        })
        const { results } = await ingestRes.json()
        const failed = results.filter((r: { status: string }) => r.status === 'error').length
        if (failed > 0) toast.warning(`${failed} file(s) couldn't be processed`)
      }

      setIngesting(false)
      setCreating(true)

      // Create study session
      const sessionRes = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          materialIds: selectedIds,
          title: `${course?.name} — ${new Date().toLocaleDateString()}`,
        }),
      })
      const { session: studySession } = await sessionRes.json()

      router.push(`/study/${studySession.id}`)
    } catch (err) {
      toast.error('Something went wrong. Please try again.')
      setIngesting(false)
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    )
  }

  const isProcessing = ingesting || creating

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
            <Brain className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-foreground">StudyBuddy AI</span>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="text-sm text-muted-foreground mb-1">Google Classroom</div>
          <h1 className="text-2xl font-bold text-foreground mb-2">{course?.name}</h1>
          <p className="text-muted-foreground">
            Select the materials you want to study with your AI tutor.
          </p>
        </div>

        {/* Material List */}
        <div className="bg-card border border-border/60 rounded-3xl overflow-hidden mb-6">
          {/* Header row */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/40 bg-muted/30">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleAll}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                {selected.size === materials.length && materials.length > 0
                  ? <CheckSquare className="w-4 h-4" />
                  : <Square className="w-4 h-4" />}
              </button>
              <span className="text-sm font-medium text-foreground">
                {materials.length} material{materials.length !== 1 ? 's' : ''} found
              </span>
            </div>
            {selected.size > 0 && (
              <span className="text-xs text-primary font-medium">
                {selected.size} selected
              </span>
            )}
          </div>

          {/* Materials */}
          {materials.length === 0 ? (
            <div className="py-16 text-center">
              <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No supported files found in this course.</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                We support PDF, DOCX, PPTX and Google Docs/Slides.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {materials.map((m) => {
                const Icon = FILE_ICONS[m.file_type] ?? File
                const isSelected = selected.has(m.id)
                return (
                  <button
                    key={m.id}
                    onClick={() => toggleSelect(m.id)}
                    className={`w-full flex items-center gap-4 px-5 py-3.5 text-left transition-colors
                      ${isSelected ? 'bg-primary/5 hover:bg-primary/8' : 'hover:bg-muted/50'}`}
                  >
                    <div className={`w-5 h-5 flex-shrink-0 transition-colors ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                      {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                    </div>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
                      ${m.file_type === 'pdf' ? 'bg-red-100 dark:bg-red-900/20' :
                        m.file_type === 'docx' ? 'bg-blue-100 dark:bg-blue-900/20' :
                        m.file_type === 'pptx' ? 'bg-orange-100 dark:bg-orange-900/20' :
                        'bg-muted'}`}>
                      <Icon className={`w-4 h-4
                        ${m.file_type === 'pdf' ? 'text-red-600' :
                          m.file_type === 'docx' ? 'text-blue-600' :
                          m.file_type === 'pptx' ? 'text-orange-600' :
                          'text-muted-foreground'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                        {m.file_name}
                      </p>
                      <p className="text-xs text-muted-foreground uppercase">{m.file_type}</p>
                    </div>
                    {m.extracted_text_status === 'done' && (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                        Ready
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* CTA */}
        <button
          id="start-studying-btn"
          onClick={handleStartStudy}
          disabled={selected.size === 0 || isProcessing}
          className="w-full flex items-center justify-center gap-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground font-semibold rounded-2xl px-6 py-4 transition-all duration-200 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 disabled:hover:translate-y-0 disabled:hover:shadow-none text-base"
        >
          {isProcessing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Zap className="w-5 h-5" />
          )}
          {ingesting
            ? 'Processing files...'
            : creating
            ? 'Starting session...'
            : selected.size === 0
            ? 'Select materials to start'
            : `Start Studying (${selected.size} file${selected.size > 1 ? 's' : ''})`}
        </button>
      </main>
    </div>
  )
}
