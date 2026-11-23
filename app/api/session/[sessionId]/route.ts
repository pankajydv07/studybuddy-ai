import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

// GET /api/session/[sessionId] — get single session with its chat history
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { sessionId } = await params

  const { data, error } = await supabaseAdmin
    .from('study_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', session.user.id)
    .single()

  if (error) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  // Chat history was previously written to `chat_messages` (see
  // app/api/chat/route.ts) but never read back here, so reopening a
  // session always rendered as an empty / brand-new chat. Return the
  // stored messages in chronological order so the study page can
  // restore them.
  const { data: messages, error: messagesError } = await supabaseAdmin
    .from('chat_messages')
    .select('id, role, content, sources, created_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
    .limit(500)

  if (messagesError) {
    return NextResponse.json({ error: messagesError.message }, { status: 500 })
  }

  return NextResponse.json({ session: data, messages: messages ?? [] })
}
