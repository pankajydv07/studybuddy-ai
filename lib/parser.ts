import { PDFParse } from 'pdf-parse'
import mammoth from 'mammoth'

/**
 * Extract text from a PDF buffer using pdf-parse v2 API.
 */
async function extractPdfText(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer })
  await parser.load()
  const result = await parser.getText()
  await parser.destroy()
  return result.text.trim()
}

/**
 * Parse a file buffer to text. fileType is 'pdf' | 'docx' | 'pptx' | 'unknown'.
 */
export async function parseFileBuffer(
  buffer: Buffer,
  fileType: string,
): Promise<string> {
  // PDF — direct files or Google Docs/Slides exported as PDF
  if (fileType === 'pdf' || fileType === 'unknown') {
    try {
      return await extractPdfText(buffer)
    } catch (err) {
      console.error('PDF Parse Error:', err)
      return '[PDF parsing failed]'
    }
  }

  // DOCX / DOC
  if (fileType === 'docx') {
    const result = await mammoth.extractRawText({ buffer })
    return result.value.trim()
  }

  // PPTX — Drive API already exports to PDF before calling this
  if (fileType === 'pptx') {
    try {
      return await extractPdfText(buffer)
    } catch {
      return '[PPTX parsing failed — file may be encrypted or corrupt]'
    }
  }

  // Fallback: try PDF parse
  try {
    return await extractPdfText(buffer)
  } catch {
    return '[Unsupported file format]'
  }
}

/**
 * @deprecated Use parseFileBuffer instead.
 */
export async function parseBuffer(
  buffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<string> {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? 'unknown'
  return parseFileBuffer(buffer, ext)
}
