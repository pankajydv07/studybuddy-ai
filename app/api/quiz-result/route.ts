import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import type { QuizQuestion } from '@/types'

// POST /api/quiz-result — save quiz result and update learning profile
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { sessionId, questions, userAnswers } = await req.json() as {
    sessionId: string
    questions: QuizQuestion[]
    userAnswers: number[]
  }

  // Calculate score
  let correct = 0
  const weakTopics: string[] = []

  questions.forEach((q, i) => {
    if (userAnswers[i] === q.correct) {
      correct++
    } else {
      // Extract topic from question text (first 60 chars)
      weakTopics.push(q.q.substring(0, 60))
    }
  })

  const score = questions.length > 0 ? correct / questions.length : 0

  // Save quiz result
  const { data: result } = await supabaseAdmin
    .from('quiz_results')
    .insert({
      session_id: sessionId,
      user_id: session.user.id,
      questions,
      user_answers: userAnswers,
      score,
      weak_topics: weakTopics,
    })
    .select()
    .single()

  // Get session's course_id to update learning profile
  const { data: studySession } = await supabaseAdmin
    .from('study_sessions')
    .select('course_id')
    .eq('id', sessionId)
    .single()

  if (studySession) {
    // Merge new weak topics with existing ones (keep last 10)
    const { data: profile } = await supabaseAdmin
      .from('learning_profiles')
      .select('weak_topics')
      .eq('user_id', session.user.id)
      .eq('course_id', studySession.course_id)
      .single()

    const existingWeak = profile?.weak_topics ?? []
    const mergedWeak = [...new Set([...weakTopics, ...existingWeak])].slice(0, 10)

    await supabaseAdmin.from('learning_profiles').upsert(
      {
        user_id: session.user.id,
        course_id: studySession.course_id,
        weak_topics: mergedWeak,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,course_id' }
    )
  }

  return NextResponse.json({ result, score, weakTopics })
}
