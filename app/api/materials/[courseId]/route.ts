import { auth } from '@/lib/auth'
import { getCourseMaterials } from '@/lib/google'
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
    // First check if we have cached materials in Supabase
    const { data: cached } = await supabaseAdmin
      .from('materials')
      .select('*')
      .eq('course_id', courseId)
      .eq('user_id', session.user.id)

    if (cached && cached.length > 0) {
      return NextResponse.json({ materials: cached })
    }

    // Fetch fresh from Google Classroom
    const materials = await getCourseMaterials(session.accessToken, courseId)

    // Store in Supabase
    const toInsert = materials.map((m) => ({
      course_id: courseId,
      user_id: session.user!.id,
      file_name: m.fileName,
      file_type: m.fileType,
      drive_file_id: m.driveFileId ?? null,
      classroom_material_id: m.classroomMaterialId ?? null,
      extracted_text_status: 'pending',
    }))

    const { data: inserted } = await supabaseAdmin
      .from('materials')
      .insert(toInsert)
      .select()

    return NextResponse.json({ materials: inserted ?? [] })
  } catch (err) {
    console.error('Materials API error:', err)
    return NextResponse.json({ error: 'Failed to fetch materials' }, { status: 500 })
  }
}
