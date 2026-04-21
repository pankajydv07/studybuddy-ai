import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

// POST /api/session — create new session
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { courseId, materialIds, title } = await req.json()

  const { data, error } = await supabaseAdmin
    .from('study_sessions')
    .insert({
      user_id: session.user.id,
      course_id: courseId,
      selected_material_ids: materialIds,
      title: title ?? `Session ${new Date().toLocaleDateString()}`,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Increment total sessions in learning profile
  const { data: existingProfile } = await supabaseAdmin
    .from('learning_profiles')
    .select('total_sessions')
    .eq('user_id', session.user.id)
    .eq('course_id', courseId)
    .single()

  await supabaseAdmin.from('learning_profiles').upsert(
    {
      user_id: session.user.id,
      course_id: courseId,
      total_sessions: (existingProfile?.total_sessions ?? 0) + 1,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'user_id,course_id',
      ignoreDuplicates: false,
    }
  )

  return NextResponse.json({ session: data })
}

// GET /api/session?courseId=xxx — list sessions for a course
export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const courseId = searchParams.get('courseId')

  let query = supabaseAdmin
    .from('study_sessions')
    .select('*')
    .eq('user_id', session.user.id)
    .order('last_active_at', { ascending: false })
    .limit(20)

  if (courseId) {
    query = query.eq('course_id', courseId)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ sessions: data })
}
