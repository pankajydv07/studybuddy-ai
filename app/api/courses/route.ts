import { auth } from '@/lib/auth'
import { getClassroomCourses } from '@/lib/google'
import { supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id || !session.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Ensure user row exists before any FK-dependent inserts
    await supabaseAdmin.from('users').upsert(
      {
        id: session.user.id,
        email: session.user.email!,
        name: session.user.name ?? '',
        image: session.user.image ?? null,
      },
      { onConflict: 'id' }
    )

    // Fetch fresh courses from Google Classroom
    const courses = await getClassroomCourses(session.accessToken)

    // Cache in Supabase (batch upsert)
    if (courses.length > 0) {
      await supabaseAdmin.from('courses').upsert(
        courses.map((course) => ({
          id: course.id,
          user_id: session.user!.id,
          name: course.name,
          section: course.section ?? null,
          room: course.room ?? null,
          description: course.description ?? null,
          course_state: course.courseState ?? null,
          cached_at: new Date().toISOString(),
        })),
        { onConflict: 'id' }
      )
    }

    return NextResponse.json({ courses })
  } catch (err) {
    console.error('Courses API error:', err)
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 })
  }
}
