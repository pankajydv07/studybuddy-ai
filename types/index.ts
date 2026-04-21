export type UserRole = 'student' | 'teacher'

export interface User {
  id: string
  email: string
  name: string
  image?: string
  googleAccessToken?: string
  googleRefreshToken?: string
}

export interface Course {
  id: string
  name: string
  section?: string
  room?: string
  description?: string
  courseState?: string
}

export interface Material {
  id: string
  courseId: string
  fileName: string
  fileType: 'pdf' | 'docx' | 'pptx' | 'link' | 'unknown'
  driveFileId?: string
  classroomMaterialId?: string
  extractedTextStatus: 'pending' | 'done' | 'error'
  createdAt: string
}

export interface StudySession {
  id: string
  userId: string
  courseId: string
  selectedMaterialIds: string[]
  title: string
  createdAt: string
  lastActiveAt: string
}

// Raw DB shape returned from Supabase REST (snake_case)
export interface DBStudySession {
  id: string
  user_id: string
  course_id: string
  selected_material_ids: string[]
  title: string
  created_at: string
  last_active_at: string
}

export interface ChatMessage {
  id: string
  sessionId: string
  role: 'user' | 'assistant'
  content: string
  sources?: ChunkSource[]
  createdAt: string
}

export interface ChunkSource {
  materialId: string
  fileName: string
  chunkIndex: number
  content: string
}

export interface QuizQuestion {
  q: string
  options: string[]
  correct: number
  explanation: string
}

export interface QuizResult {
  id: string
  sessionId: string
  userId: string
  questions: QuizQuestion[]
  userAnswers: number[]
  score: number
  weakTopics: string[]
  createdAt: string
}

export interface LearningProfile {
  id: string
  userId: string
  courseId: string
  weakTopics: string[]
  frequentDoubts: string[]
  totalSessions: number
  updatedAt: string
}

export interface MaterialChunk {
  id: string
  materialId: string
  chunkIndex: number
  content: string
  embedding?: number[]
  similarity?: number
}

export interface IngestRequest {
  materialIds: string[]
  sessionId: string
}

export interface ChatRequest {
  sessionId: string
  message: string
  materialIds: string[]
}

export interface SummaryRequest {
  materialIds: string[]
  focus?: string
}

export interface QuizRequest {
  materialIds: string[]
  numQuestions?: number
  weakTopics?: string[]
}
