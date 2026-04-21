import { google } from 'googleapis'
import type { Course, Material } from '@/types'

function getOAuthClient(accessToken: string) {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  )
  auth.setCredentials({ access_token: accessToken })
  return auth
}

// ─── Classroom ───────────────────────────────────────────────

export async function getClassroomCourses(accessToken: string): Promise<Course[]> {
  const auth = getOAuthClient(accessToken)
  const classroom = google.classroom({ version: 'v1', auth })

  const res = await classroom.courses.list({
    studentId: 'me',
    courseStates: ['ACTIVE'],
    pageSize: 30,
  })

  return (res.data.courses ?? []).map((c) => ({
    id: c.id!,
    name: c.name!,
    section: c.section ?? undefined,
    room: c.room ?? undefined,
    description: c.descriptionHeading ?? undefined,
    courseState: c.courseState ?? undefined,
  }))
}

export async function getCourseMaterials(
  accessToken: string,
  courseId: string
): Promise<Material[]> {
  const auth = getOAuthClient(accessToken)
  const classroom = google.classroom({ version: 'v1', auth })

  const materials: Material[] = []

  // Fetch coursework materials
  try {
    const cwMaterials = await classroom.courses.courseWorkMaterials.list({
      courseId,
      pageSize: 50,
    })
    for (const item of cwMaterials.data.courseWorkMaterial ?? []) {
      for (const mat of item.materials ?? []) {
        if (mat.driveFile) {
          materials.push({
            id: '', // will be set after DB insert
            courseId,
            fileName: mat.driveFile.driveFile?.title ?? 'Untitled',
            fileType: inferFileType(mat.driveFile.driveFile?.title ?? ''),
            driveFileId: mat.driveFile.driveFile?.id ?? undefined,
            classroomMaterialId: item.id ?? undefined,
            extractedTextStatus: 'pending',
            createdAt: new Date().toISOString(),
          })
        }
      }
    }
  } catch (_) {
    // courseWorkMaterials may not exist for all courses
  }

  // Fetch coursework (assignments may have attachments too)
  try {
    const coursework = await classroom.courses.courseWork.list({
      courseId,
      pageSize: 50,
    })
    for (const item of coursework.data.courseWork ?? []) {
      for (const mat of item.materials ?? []) {
        if (mat.driveFile) {
          materials.push({
            id: '',
            courseId,
            fileName: mat.driveFile.driveFile?.title ?? 'Untitled',
            fileType: inferFileType(mat.driveFile.driveFile?.title ?? ''),
            driveFileId: mat.driveFile.driveFile?.id ?? undefined,
            classroomMaterialId: item.id ?? undefined,
            extractedTextStatus: 'pending',
            createdAt: new Date().toISOString(),
          })
        }
      }
    }
  } catch (_) {}

  // Deduplicate by driveFileId
  const seen = new Set<string>()
  return materials.filter((m) => {
    if (!m.driveFileId) return true
    if (seen.has(m.driveFileId)) return false
    seen.add(m.driveFileId)
    return true
  })
}

// ─── Drive ───────────────────────────────────────────────────

export async function downloadDriveFile(
  accessToken: string,
  fileId: string,
  mimeType: string
): Promise<Buffer> {
  const auth = getOAuthClient(accessToken)
  const drive = google.drive({ version: 'v3', auth })

  // For Google Docs/Slides/Sheets — export as PDF
  const googleMimeTypes = [
    'application/vnd.google-apps.document',
    'application/vnd.google-apps.presentation',
    'application/vnd.google-apps.spreadsheet',
  ]

  if (googleMimeTypes.includes(mimeType)) {
    const res = await drive.files.export(
      { fileId, mimeType: 'application/pdf' },
      { responseType: 'arraybuffer' }
    )
    return Buffer.from(res.data as ArrayBuffer)
  }

  // For binary files (PDF, DOCX, PPTX)
  const res = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'arraybuffer' }
  )
  return Buffer.from(res.data as ArrayBuffer)
}

export async function getDriveFileMimeType(
  accessToken: string,
  fileId: string
): Promise<string> {
  const auth = getOAuthClient(accessToken)
  const drive = google.drive({ version: 'v3', auth })
  const res = await drive.files.get({ fileId, fields: 'mimeType' })
  return res.data.mimeType ?? 'application/octet-stream'
}

// ─── Helpers ──────────────────────────────────────────────────

export function inferFileType(fileName: string): Material['fileType'] {
  const lower = fileName.toLowerCase()
  const ext = lower.split('.').pop()

  if (ext === 'pdf') return 'pdf'
  if (ext === 'docx' || ext === 'doc') return 'docx'
  if (ext === 'pptx' || ext === 'ppt') return 'pptx'

  // Google Workspace files have no extension — treat by name patterns
  // They'll be exported as PDF during ingest
  if (lower.includes('slide') || lower.includes('presentation')) return 'pptx'
  if (lower.includes('sheet') || lower.includes('spreadsheet')) return 'pdf'

  // Anything else from Google Drive — treat as docx (exported as PDF in ingest)
  return 'docx'
}
