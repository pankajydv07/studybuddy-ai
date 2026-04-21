import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { retrieveChunks, formatChunksAsContext } from '@/lib/rag'
import { nebiusLLM, LLM_MODEL } from '@/lib/nebius'
import { NextResponse } from 'next/server'
import type { QuizQuestion } from '@/types'

export const maxDuration = 60

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { materialIds, numQuestions = 5, weakTopics = [], sessionId } = await req.json()

  if (!materialIds?.length) {
    return NextResponse.json({ error: 'No materialIds provided' }, { status: 400 })
  }

  try {
    const query = weakTopics.length > 0
      ? `Quiz questions about: ${weakTopics.join(', ')}`
      : 'Key concepts for a quiz'

    const chunks = await retrieveChunks(query, materialIds, 12)
    const context = formatChunksAsContext(chunks)

    const completion = await nebiusLLM.chat.completions.create({
      model: LLM_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are an expert quiz generator. Generate multiple choice questions from course material.
Always respond with ONLY a valid JSON array, no markdown, no explanation.
Format: [{"q": "question", "options": ["A", "B", "C", "D"], "correct": 0, "explanation": "why A is correct"}]
correct is 0-indexed. Make questions challenging but fair.`,
        },
        {
          role: 'user',
          content: `Generate exactly ${numQuestions} multiple choice questions${weakTopics.length > 0 ? ` focusing on these weak topics: ${weakTopics.join(', ')}` : ''}.

Based on this content:
${context}

Return ONLY the JSON array.`,
        },
      ],
      temperature: 0.5,
      max_tokens: 2000,
    })

    const raw = completion.choices[0].message.content ?? '[]'

    // Strip markdown code fences if present
    const clean = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const questions: QuizQuestion[] = JSON.parse(clean)

    return NextResponse.json({ questions, sessionId })
  } catch (err) {
    console.error('Quiz generation error:', err)
    return NextResponse.json({ error: 'Failed to generate quiz' }, { status: 500 })
  }
}
