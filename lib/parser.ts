// pdf-parse and mammoth are server-external packages (CJS)
// They are excluded from bundling via serverExternalPackages in next.config.ts
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse') as (buffer: Buffer) => Promise<{ text: string }>
import mammoth from 'mammoth'

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
      const result = await pdfParse(buffer)
      return result.text.trim()
    } catch {
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
      const result = await pdfParse(buffer)
      return result.text.trim()
    } catch {
      return '[PPTX parsing failed — file may be encrypted or corrupt]'
    }
  }

  // Fallback: try PDF parse
  try {
    const result = await pdfParse(buffer)
    return result.text.trim()
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
