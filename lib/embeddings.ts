import OpenAI from 'openai'

// Nebius Embedding client — Qwen3-Embedding-8B
const embedClient = new OpenAI({
  baseURL: process.env.NEBIUS_EMBED_BASE_URL,
  apiKey: process.env.NEBIUS_EMBED_API_KEY,
})

const EMBED_MODEL = process.env.NEBIUS_EMBED_MODEL ?? 'Qwen/Qwen3-Embedding-8B'
const EMBED_DIMENSIONS = parseInt(process.env.NEBIUS_EMBED_DIMENSIONS ?? '4096')

/**
 * Embed a single string and return the vector.
 */
export async function embedText(text: string): Promise<number[]> {
  const res = await embedClient.embeddings.create({
    model: EMBED_MODEL,
    input: text,
    dimensions: EMBED_DIMENSIONS,
  })
  return res.data[0].embedding
}

/**
 * Embed multiple texts in batches. Returns vectors in the same order as inputs.
 * Alias: embedTexts (used by ingest route).
 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  return embedBatch(texts)
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  const BATCH_SIZE = 10
  const results: number[][] = []

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE)
    const res = await embedClient.embeddings.create({
      model: EMBED_MODEL,
      input: batch,
      dimensions: EMBED_DIMENSIONS,
    })
    const sorted = res.data.sort((a, b) => a.index - b.index)
    results.push(...sorted.map((d) => d.embedding))
  }

  return results
}
