import { extractText } from 'unpdf'
import mammoth from 'mammoth'
import JSZip from 'jszip'
import WordExtractor from 'word-extractor'

/**
 * Extract text from a PDF buffer using unpdf (serverless-compatible).
 */
async function extractPdfText(buffer: Buffer): Promise<string> {
  const { text } = await extractText(new Uint8Array(buffer))
  return text.join('\n').trim()
}

/**
 * Extract text from a DOCX buffer using mammoth.
 */
async function extractDocxText(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer })
  return result.value.trim()
}

/**
 * Extract text from a legacy .doc (OLE) buffer using word-extractor.
 * mammoth only handles .docx, so .doc files previously threw here and
 * the whole ingest failed.
 */
async function extractDocText(buffer: Buffer): Promise<string> {
  const extractor = new WordExtractor()
  const doc = await extractor.extract(buffer)
  return doc.getBody().trim()
}

/**
 * Extract text from a PPTX buffer. A .pptx file is a ZIP of XML parts;
 * slide text lives in <a:t> runs inside ppt/slides/slideN.xml. The old
 * code just ran the PDF parser over the ZIP bytes, which always failed,
 * so native .pptx files could never be ingested (only Google Slides
 * exported as PDF worked).
 */
async function extractPptxText(buffer: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer)
  const slideNames = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)\.xml$/)?.[1] ?? '0', 10)
      const numB = parseInt(b.match(/slide(\d+)\.xml$/)?.[1] ?? '0', 10)
      return numA - numB
    })

  if (slideNames.length === 0) {
    throw new Error('No slides found in PPTX file')
  }

  const slides: string[] = []
  for (const name of slideNames) {
    const xml = await zip.files[name].async('string')
    // Split into paragraphs (<a:p>…</a:p>), join the text runs (<a:t>)
    // inside each paragraph, then join paragraphs with newlines.
    const paragraphs = xml
      .split('</a:p>')
      .map((para) =>
        [...para.matchAll(/<a:t>(.*?)<\/a:t>/gs)]
          .map((m) => decodeXmlEntities(m[1]))
          .join('')
          .trim()
      )
      .filter(Boolean)
    if (paragraphs.length > 0) slides.push(paragraphs.join('\n'))
  }

  return slides.join('\n\n').trim()
}

function decodeXmlEntities(text: string): string {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
}

/**
 * Extract text from a plain-text buffer (.md, .txt, .csv, …).
 */
function extractPlainText(buffer: Buffer): string {
  return buffer.toString('utf-8').trim()
}

/**
 * Parse a file buffer to text.
 * fileType is 'pdf' | 'docx' | 'doc' | 'pptx' | 'ppt' | 'md' | 'txt' |
 * 'csv' | 'unknown'. Every branch returns a string — parse failures are
 * reported as a '[… parsing failed]' marker instead of throwing, so one
 * bad file cannot fail the whole ingest run.
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

  // DOCX
  if (fileType === 'docx') {
    try {
      return await extractDocxText(buffer)
    } catch (err) {
      console.error('DOCX Parse Error:', err)
      // Google Docs are exported as PDF by Drive but may be stored
      // with file_type 'docx' (see inferFileType) — try PDF before
      // giving up so those cached materials still ingest.
      try {
        const pdfText = await extractPdfText(buffer)
        if (pdfText) return pdfText
      } catch { /* fall through to the failure marker */ }
      return '[DOCX parsing failed]'
    }
  }

  // Legacy .doc (OLE) — not readable by mammoth
  if (fileType === 'doc') {
    try {
      return await extractDocText(buffer)
    } catch (err) {
      console.error('DOC Parse Error:', err)
      return '[DOC parsing failed — file may be encrypted or corrupt]'
    }
  }

  // PPTX — real extraction from the slide XML (see extractPptxText)
  if (fileType === 'pptx') {
    try {
      return await extractPptxText(buffer)
    } catch (err) {
      console.error('PPTX Parse Error:', err)
      // Google Slides are exported as PDF by Drive but may be stored
      // with file_type 'pptx' — try PDF before giving up so those
      // cached materials still ingest.
      try {
        const pdfText = await extractPdfText(buffer)
        if (pdfText) return pdfText
      } catch { /* fall through to the failure marker */ }
      return '[PPTX parsing failed — file may be encrypted or corrupt]'
    }
  }

  // Legacy .ppt (OLE) — no pure-JS extractor is bundled; fail loudly
  // with a clear message instead of feeding the binary to another
  // parser and producing garbage.
  if (fileType === 'ppt') {
    return '[Legacy .ppt files are not supported — please convert the file to .pptx]'
  }

  // Markdown / plain text / CSV — the text is the content
  if (fileType === 'md' || fileType === 'txt' || fileType === 'csv') {
    return extractPlainText(buffer)
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
