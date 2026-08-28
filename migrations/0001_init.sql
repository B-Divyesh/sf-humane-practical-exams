PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS exams (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  brief TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  deletion_days INTEGER NOT NULL,
  accommodations TEXT NOT NULL,
  provider_name TEXT,
  rubric_json TEXT NOT NULL,
  candidate_token_hash TEXT NOT NULL,
  assessor_token_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  exam_id TEXT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  alias_encrypted BLOB NOT NULL,
  work_log_encrypted BLOB NOT NULL,
  command_history_encrypted BLOB NOT NULL,
  artifact_encrypted BLOB,
  artifact_name_encrypted BLOB,
  artifact_size INTEGER,
  status TEXT NOT NULL CHECK(status IN ('in_progress','submitted','assessed')),
  started_at TEXT NOT NULL,
  submitted_at TEXT,
  delete_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_submissions_exam ON submissions(exam_id);
CREATE INDEX IF NOT EXISTS idx_submissions_delete ON submissions(delete_at);

CREATE TABLE IF NOT EXISTS checkpoints (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  content_encrypted BLOB NOT NULL,
  hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS assessments (
  submission_id TEXT PRIMARY KEY REFERENCES submissions(id) ON DELETE CASCADE,
  scores_json TEXT NOT NULL,
  notes_encrypted BLOB NOT NULL,
  outcome TEXT NOT NULL,
  assessed_at TEXT NOT NULL
);
