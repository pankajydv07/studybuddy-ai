import { auth } from '@/lib/auth'
import { retrieveChunks, formatChunksAsContext } from '@/lib/rag'
import { nebiusLLM, LLM_MODEL } from '@/lib/nebius'
import { NextResponse } from 'next/server'

export const maxDuration = 60

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { materialIds, focus } = await req.json()

  if (!materialIds?.length) {
    return NextResponse.json({ error: 'No materialIds provided' }, { status: 400 })
  }

  try {
    const query = focus
      ? `Summarize the key concepts related to: ${focus}`
      : 'Summarize all the key concepts, definitions, and important points covered in these materials'

    const chunks = await retrieveChunks(query, materialIds, 10)
    const context = formatChunksAsContext(chunks)

    const completion = await nebiusLLM.chat.completions.create({
      model: LLM_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are StudyBuddy AI. Generate a comprehensive, well-structured study summary.
Use markdown formatting with:
- ## Section headers for each major topic
- **Bold** for key terms and definitions
- Bullet points for lists and examples
- > Blockquotes for important statements or formulas

Be thorough but concise. Focus on what a student needs to know for exams.`,
        },
        {
          role: 'user',
          content: `${focus ? `Focus area: ${focus}\n\n` : ''}Based on these course materials:\n\n${context}\n\nGenerate a comprehensive study summary.`,
        },
      ],
      temperature: 0.3,
      max_tokens: 3000,
    })

    const summary = completion.choices[0].message.content ?? ''

    return NextResponse.json({ summary, sourcesUsed: chunks.length })
  } catch (err) {
    console.error('Summary error:', err)
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 })
  }
}
