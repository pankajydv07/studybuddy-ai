import { auth } from '@/lib/auth'
import { getCourseMaterials, getClassroomCourses } from '@/lib/google'
import { supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id || !session.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { courseId } = await params

  try {
    // Check if we have cached materials in Supabase
    const { data: cached } = await supabaseAdmin
      .from('materials')
      .select('*')
      .eq('course_id', courseId)
      .eq('user_id', session.user.id)

    if (cached && cached.length > 0) {
      return NextResponse.json({ materials: cached })
    }

    // --- Ensure course row exists in Supabase (required for FK) ---
    // Fetch all courses from Classroom and upsert the matching one
    const courses = await getClassroomCourses(session.accessToken)
    const matchedCourse = courses.find((c) => c.id === courseId)

    if (matchedCourse) {
      await supabaseAdmin.from('courses').upsert(
        {
          id: matchedCourse.id,
          user_id: session.user.id,
          name: matchedCourse.name,
          section: matchedCourse.section ?? null,
          room: matchedCourse.room ?? null,
          description: matchedCourse.description ?? null,
          course_state: matchedCourse.courseState ?? null,
          cached_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )
    } else {
      // Course not found in Classroom — upsert a minimal record so FK is satisfied
      await supabaseAdmin.from('courses').upsert(
        {
          id: courseId,
          user_id: session.user.id,
          name: 'Unknown Course',
          cached_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )
    }

    // --- Fetch fresh materials from Google Classroom ---
    const materials = await getCourseMaterials(session.accessToken, courseId)

    if (materials.length === 0) {
      return NextResponse.json({ materials: [] })
    }

    // Insert into Supabase
    const toInsert = materials.map((m) => ({
      course_id: courseId,
      user_id: session.user!.id,
      file_name: m.fileName,
      file_type: m.fileType,
      drive_file_id: m.driveFileId ?? null,
      classroom_material_id: m.classroomMaterialId ?? null,
      extracted_text_status: 'pending',
    }))

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('materials')
      .insert(toInsert)
      .select()

    if (insertError) {
      console.error('Materials insert error:', insertError)
      // Return the Google data directly even if DB insert failed
      return NextResponse.json({ materials: toInsert.map((m, i) => ({ ...m, id: `temp-${i}` })) })
    }

    return NextResponse.json({ materials: inserted ?? [] })
  } catch (err) {
    console.error('Materials API error:', err)
    return NextResponse.json({ error: 'Failed to fetch materials' }, { status: 500 })
  }
}
