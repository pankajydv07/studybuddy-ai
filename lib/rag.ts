import { supabaseAdmin } from './supabase'
import { embedText } from './embeddings'
import type { ChunkSource } from '@/types'

/**
 * Retrieves top-k relevant chunks for a query, filtered by materialIds.
 */
export async function retrieveChunks(
  query: string,
  materialIds: string[],
  topK = 5
): Promise<ChunkSource[]> {
  if (materialIds.length === 0) return []

  const queryEmbedding = await embedText(query)

  // Call a Supabase RPC function for vector similarity search
  const { data, error } = await supabaseAdmin.rpc('match_material_chunks', {
    query_embedding: queryEmbedding,
    material_ids: materialIds,
    match_count: topK,
  })

  if (error) {
    console.error('RAG retrieval error:', error)
    return []
  }

  return (data ?? []).map((row: {
    id: string
    material_id: string
    file_name: string
    chunk_index: number
    content: string
    similarity: number
  }) => ({
    materialId: row.material_id,
    fileName: row.file_name,
    chunkIndex: row.chunk_index,
    content: row.content,
  }))
}

/**
 * Formats a list of chunks into a readable context string for the LLM.
 */
export function formatChunksAsContext(chunks: ChunkSource[]): string {
  if (chunks.length === 0) return 'No relevant content found in selected materials.'

  return chunks
    .map(
      (c, i) =>
        `[Source ${i + 1}: ${c.fileName}, chunk ${c.chunkIndex + 1}]\n${c.content}`
    )
    .join('\n\n---\n\n')
}
