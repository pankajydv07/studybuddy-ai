import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { retrieveChunks, formatChunksAsContext } from '@/lib/rag'
import { nebiusLLM, LLM_MODEL, buildChatSystemPrompt } from '@/lib/nebius'
import { NextResponse } from 'next/server'
import type { ChatRequest } from '@/types'

export const maxDuration = 60

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body: ChatRequest = await req.json()
  const { sessionId, message, materialIds } = body

  if (!message?.trim()) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 })
  }

  try {
    // 1. Retrieve relevant chunks via RAG
    const chunks = await retrieveChunks(message, materialIds ?? [], 5)
    const context = formatChunksAsContext(chunks)

    // 2. Fetch learning profile
    const { data: studySession } = await supabaseAdmin
      .from('study_sessions')
      .select('course_id, user_id')
      .eq('id', sessionId)
      .single()

    let weakTopics: string[] = []
    let frequentDoubts: string[] = []

    if (studySession) {
      const { data: profile } = await supabaseAdmin
        .from('learning_profiles')
        .select('weak_topics, frequent_doubts')
        .eq('user_id', studySession.user_id)
        .eq('course_id', studySession.course_id)
        .single()

      weakTopics = profile?.weak_topics ?? []
      frequentDoubts = profile?.frequent_doubts ?? []
    }

    // 3. Load last 10 messages for context
    const { data: history } = await supabaseAdmin
      .from('chat_messages')
      .select('role, content')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(10)

    const messages = [
      ...(history ?? []).map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: message },
    ]

    // 4. Save user message
    await supabaseAdmin.from('chat_messages').insert({
      session_id: sessionId,
      role: 'user',
      content: message,
    })

    // 5. Stream from Kimi-K2.5-fast
    const systemPrompt = buildChatSystemPrompt(context, weakTopics, frequentDoubts)

    const stream = await nebiusLLM.chat.completions.create({
      model: LLM_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      stream: true,
      temperature: 0.7,
      max_tokens: 2048,
    })

    // 6. Stream response to client while collecting full text
    let fullResponse = ''
    const encoder = new TextEncoder()

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content ?? ''
            if (delta) {
              fullResponse += delta
              controller.enqueue(encoder.encode(delta))
            }
          }

          // Save complete assistant message to DB
          await supabaseAdmin.from('chat_messages').insert({
            session_id: sessionId,
            role: 'assistant',
            content: fullResponse,
          })

          // Update session last_active_at
          await supabaseAdmin
            .from('study_sessions')
            .update({ last_active_at: new Date().toISOString() })
            .eq('id', sessionId)

          controller.close()
        } catch (err) {
          controller.error(err)
        }
      },
    })

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Sources': JSON.stringify(chunks.map((c) => ({
          fileName: c.fileName,
          chunkIndex: c.chunkIndex,
        }))),
      },
    })
  } catch (err) {
    console.error('Chat API error:', err)
    return NextResponse.json({ error: 'Chat failed' }, { status: 500 })
  }
}
