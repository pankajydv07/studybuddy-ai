'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import {
  Brain, BookOpen, Loader2, LogOut, Plus, Clock,
  GraduationCap, ChevronRight, Sparkles
} from 'lucide-react'
import type { Course, DBStudySession } from '@/types'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [courses, setCourses] = useState<Course[]>([])
  const [recentSessions, setRecentSessions] = useState<DBStudySession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (status !== 'authenticated') return

    async function load() {
      try {
        const [coursesRes, sessionsRes] = await Promise.all([
          fetch('/api/courses'),
          fetch('/api/session'),
        ])

        const coursesData = await coursesRes.json().catch(() => ({}))
        const sessionsData = await sessionsRes.json().catch(() => ({}))

        // Handle expired Google tokens — force re-login
        if (coursesRes.status === 401 && coursesData.error === 'TokenExpired') {
          signOut({ callbackUrl: '/login' })
          return
        }

        setCourses(coursesData.courses ?? [])
        setRecentSessions(sessionsData.sessions ?? [])
      } catch {
        setError('Failed to load your courses. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [status])

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
          <p className="text-muted-foreground text-sm">Loading your courses...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Nav */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
              <Brain className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground">StudyBuddy AI</span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {session?.user?.image && (
                <img
                  src={session.user.image}
                  alt="avatar"
                  className="w-7 h-7 rounded-full ring-2 ring-border"
                />
              )}
              <span className="hidden sm:block font-medium text-foreground">
                {session?.user?.name?.split(' ')[0]}
              </span>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Greeting */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-1">
            Good {getGreeting()}, {session?.user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-muted-foreground">
            {courses.length > 0
              ? `You have ${courses.length} active course${courses.length > 1 ? 's' : ''}. Pick one to start studying.`
              : 'Connect your Google Classroom to get started.'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Courses */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Your Courses</h2>
              <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                Google Classroom
              </span>
            </div>

            {courses.length === 0 ? (
              <div className="border-2 border-dashed border-border rounded-3xl p-12 text-center">
                <GraduationCap className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">No courses found</p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Make sure you have active courses in Google Classroom
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {courses.map((course) => (
                  <Link
                    key={course.id}
                    href={`/course/${course.id}`}
                    className="group flex items-center gap-4 bg-card border border-border/60 rounded-2xl p-4 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 transition-all duration-200"
                  >
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                      <BookOpen className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {course.name}
                      </p>
                      {course.section && (
                        <p className="text-sm text-muted-foreground">{course.section}</p>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recent Sessions sidebar */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">Recent Sessions</h2>

            {recentSessions.length === 0 ? (
              <div className="bg-muted/50 rounded-2xl p-6 text-center">
                <Sparkles className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Sessions appear here after you start studying
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentSessions.slice(0, 6).map((s) => (
                  <Link
                    key={s.id}
                    href={`/study/${s.id}`}
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                        {s.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(s.last_active_at).toLocaleDateString()}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
