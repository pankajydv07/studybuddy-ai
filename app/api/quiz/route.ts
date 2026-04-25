import { auth } from '@/lib/auth'
import { retrieveChunks, formatChunksAsContext } from '@/lib/rag'
import { nebiusLLM, LLM_MODEL } from '@/lib/nebius'
import { NextResponse } from 'next/server'
import type { QuizQuestion } from '@/types'

export const maxDuration = 60

/** Attempt to salvage a truncated JSON array by closing it properly */
function repairJsonArray(raw: string): string {
  let s = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

  // Already valid?
  try { JSON.parse(s); return s } catch {}

  // Try to find last complete object and close the array
  const lastClose = s.lastIndexOf('}')
  if (lastClose !== -1) {
    s = s.slice(0, lastClose + 1) + ']'
    try { JSON.parse(s); return s } catch {}
  }

  return '[]'
}

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
      : 'Key concepts, definitions, and important topics for a quiz'

    const chunks = await retrieveChunks(query, materialIds, 8)
    const fullContext = formatChunksAsContext(chunks)

    // Limit context to ~4000 chars to leave plenty of room for output tokens
    const context = fullContext.length > 4000
      ? fullContext.slice(0, 4000) + '\n...[content truncated]'
      : fullContext

    const completion = await nebiusLLM.chat.completions.create({
      model: LLM_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are an expert quiz generator. Generate multiple choice questions from course material.
Rules:
- Respond with ONLY a valid JSON array. No markdown, no explanation, no prefix text.
- Each object: {"q": "question text", "options": ["A","B","C","D"], "correct": 0, "explanation": "brief reason"}
- "correct" is the 0-indexed position of the right answer.
- Keep explanations concise (1-2 sentences max).
- Make questions challenging but clearly answerable from the material.`,
        },
        {
          role: 'user',
          content: `Generate exactly ${numQuestions} multiple choice questions${weakTopics.length > 0 ? ` focusing on: ${weakTopics.join(', ')}` : ''}.

Course material:
${context}

Output ONLY the JSON array, starting with [ and ending with ].`,
        },
      ],
      temperature: 0.4,
      max_tokens: 3500,
    })

    const finish_reason = completion.choices[0].finish_reason
    const raw = completion.choices[0].message.content ?? '[]'

    // Warn in logs if the model was cut off
    if (finish_reason === 'length') {
      console.warn('Quiz generation hit token limit — attempting JSON repair')
    }

    const repaired = repairJsonArray(raw)
    const questions: QuizQuestion[] = JSON.parse(repaired)

    if (!questions.length) {
      return NextResponse.json({ error: 'No questions generated — try ingesting materials first' }, { status: 422 })
    }

    return NextResponse.json({ questions, sessionId })
  } catch (err) {
    console.error('Quiz generation error:', err)
    return NextResponse.json({ error: 'Failed to generate quiz' }, { status: 500 })
  }
}
