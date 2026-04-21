import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { downloadDriveFile, getDriveFileMimeType } from '@/lib/google'
import { parseFileBuffer } from '@/lib/parser'
import { chunkText } from '@/lib/chunker'
import { embedTexts } from '@/lib/embeddings'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 120 // 2 minutes for large files

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id || !session.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { materialIds } = await req.json() as { materialIds: string[] }
  if (!materialIds?.length) {
    return NextResponse.json({ error: 'No material IDs provided' }, { status: 400 })
  }

  const results: { id: string; status: 'done' | 'error'; chunks?: number }[] = []

  for (const materialId of materialIds) {
    try {
      // Get material record
      const { data: material, error: matErr } = await supabaseAdmin
        .from('materials')
        .select('*')
        .eq('id', materialId)
        .eq('user_id', session.user.id)
        .single()

      if (matErr || !material) {
        results.push({ id: materialId, status: 'error' })
        continue
      }

      // Skip if already processed
      if (material.extracted_text_status === 'done') {
        results.push({ id: materialId, status: 'done' })
        continue
      }

      if (!material.drive_file_id) {
        await supabaseAdmin
          .from('materials')
          .update({ extracted_text_status: 'error' })
          .eq('id', materialId)
        results.push({ id: materialId, status: 'error' })
        continue
      }

      // Mark as processing
      await supabaseAdmin
        .from('materials')
        .update({ extracted_text_status: 'pending' })
        .eq('id', materialId)

      // Download from Drive
      const mimeType = await getDriveFileMimeType(session.accessToken, material.drive_file_id)
      const buffer = await downloadDriveFile(session.accessToken, material.drive_file_id, mimeType)

      // Parse text
      const text = await parseFileBuffer(buffer, material.file_type)
      if (!text.trim()) {
        await supabaseAdmin
          .from('materials')
          .update({ extracted_text_status: 'error' })
          .eq('id', materialId)
        results.push({ id: materialId, status: 'error' })
        continue
      }

      // Chunk
      const chunks = chunkText(text)

      // Delete old chunks if any
      await supabaseAdmin
        .from('material_chunks')
        .delete()
        .eq('material_id', materialId)

      // Embed all chunks
      const embeddings = await embedTexts(chunks.map((c) => c.content))

      // Store chunks + embeddings
      const rows = chunks.map((chunk, i) => ({
        material_id: materialId,
        chunk_index: chunk.index,
        content: chunk.content,
        embedding: embeddings[i],
      }))

      // Insert in batches of 10 to avoid payload limits
      const BATCH = 10
      for (let i = 0; i < rows.length; i += BATCH) {
        await supabaseAdmin.from('material_chunks').insert(rows.slice(i, i + BATCH))
      }

      // Mark done
      await supabaseAdmin
        .from('materials')
        .update({ extracted_text_status: 'done' })
        .eq('id', materialId)

      results.push({ id: materialId, status: 'done', chunks: chunks.length })
    } catch (err) {
      console.error(`Ingest error for material ${materialId}:`, err)
      await supabaseAdmin
        .from('materials')
        .update({ extracted_text_status: 'error' })
        .eq('id', materialId)
      results.push({ id: materialId, status: 'error' })
    }
  }

  return NextResponse.json({ results })
}
