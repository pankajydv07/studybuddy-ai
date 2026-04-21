/**
 * Splits text into overlapping word-based chunks for embedding.
 * Default: 500 words per chunk, 50-word overlap.
 * Returns `{ index, content }[]` objects.
 */
export function chunkText(
  text: string,
  chunkSize = 500,
  overlap = 50
): { index: number; content: string }[] {
  const words = text.split(/\s+/).filter(Boolean)
  const chunks: { index: number; content: string }[] = []

  if (words.length === 0) return []

  let chunkIndex = 0
  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const content = words.slice(i, i + chunkSize).join(' ')
    if (content.trim()) {
      chunks.push({ index: chunkIndex++, content })
    }
    if (i + chunkSize >= words.length) break
  }

  return chunks
}
