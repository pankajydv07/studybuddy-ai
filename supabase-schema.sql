-- ============================================================
-- StudyBuddy AI — Database Schema (Safe Version)
-- No vector index — works on all pgvector versions
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS users (
  id                   TEXT PRIMARY KEY,
  email                TEXT UNIQUE NOT NULL,
  name                 TEXT NOT NULL DEFAULT '',
  image                TEXT,
  google_access_token  TEXT,
  google_refresh_token TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS courses (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  section      TEXT,
  room         TEXT,
  description  TEXT,
  course_state TEXT,
  cached_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS courses_user_id_idx ON courses(user_id);

CREATE TABLE IF NOT EXISTS materials (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id              TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  user_id                TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name              TEXT NOT NULL,
  file_type              TEXT NOT NULL DEFAULT 'unknown',
  drive_file_id          TEXT,
  classroom_material_id  TEXT,
  extracted_text_status  TEXT NOT NULL DEFAULT 'pending',
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS materials_course_id_idx ON materials(course_id);
CREATE INDEX IF NOT EXISTS materials_user_id_idx ON materials(user_id);

CREATE TABLE IF NOT EXISTS material_chunks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content     TEXT NOT NULL,
  embedding   VECTOR(4096),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS material_chunks_material_id_idx ON material_chunks(material_id);

-- NOTE: No vector index here — the RPC below handles similarity search without one.
-- After the app works, you can optionally add: 
--   CREATE INDEX ON material_chunks USING hnsw (embedding vector_cosine_ops);

CREATE TABLE IF NOT EXISTS study_sessions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id             TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  selected_material_ids UUID[] NOT NULL DEFAULT '{}',
  title                 TEXT NOT NULL DEFAULT 'Study Session',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS study_sessions_user_id_idx ON study_sessions(user_id);

CREATE TABLE IF NOT EXISTS chat_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content    TEXT NOT NULL,
  sources    JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS chat_messages_session_id_idx ON chat_messages(session_id);

CREATE TABLE IF NOT EXISTS quiz_results (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   UUID NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  questions    JSONB NOT NULL,
  user_answers JSONB NOT NULL,
  score        FLOAT NOT NULL,
  weak_topics  TEXT[] NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS quiz_results_user_id_idx ON quiz_results(user_id);

CREATE TABLE IF NOT EXISTS learning_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id       TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  weak_topics     TEXT[] NOT NULL DEFAULT '{}',
  frequent_doubts TEXT[] NOT NULL DEFAULT '{}',
  total_sessions  INTEGER NOT NULL DEFAULT 0,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_profiles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION match_material_chunks(
  query_embedding VECTOR(4096),
  material_ids    UUID[],
  match_count     INT DEFAULT 5
)
RETURNS TABLE (
  id          UUID,
  material_id UUID,
  file_name   TEXT,
  chunk_index INTEGER,
  content     TEXT,
  similarity  FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    mc.id,
    mc.material_id,
    m.file_name,
    mc.chunk_index,
    mc.content,
    1 - (mc.embedding <=> query_embedding) AS similarity
  FROM material_chunks mc
  JOIN materials m ON m.id = mc.material_id
  WHERE mc.material_id = ANY(material_ids)
    AND mc.embedding IS NOT NULL
  ORDER BY mc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
