export type RubricCriterion = { id: string; label: string; description: string; max_score: number };
export type Exam = {
  id: string;
  title: string;
  brief: string;
  duration_minutes: number;
  deletion_days: number;
  accommodations: string;
  provider_name?: string;
  rubric: RubricCriterion[];
  created_at: string;
};
export type Checkpoint = { id: string; label: string; hash: string; created_at: string };
export type SubmissionSummary = {
  id: string;
  alias: string;
  status: 'in_progress' | 'submitted' | 'assessed';
  started_at: string;
  submitted_at?: string;
  delete_at: string;
  artifact_name?: string;
  checkpoint_count: number;
  outcome?: string;
};
export type Submission = SubmissionSummary & {
  work_log: string;
  command_history: string;
  artifact_size?: number;
  checkpoints: Checkpoint[];
  assessment?: { scores: Record<string, number>; notes: string; outcome: string; assessed_at: string };
};
export type ExamView = { role: 'candidate' | 'assessor'; exam: Exam };

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch {
    throw new Error('You appear to be offline. Your draft remains on this device; reconnect and try again.');
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'The server could not complete that request. Try again.');
  return body as T;
}

const json = (value: unknown): RequestInit => ({
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(value)
});

export const api = {
  createExam: (payload: unknown) => request<{ exam_id: string; candidate_token: string; assessor_token: string }>('/api/exams', json(payload)),
  viewExam: (id: string, token: string) => request<ExamView>(`/api/exams/${id}?token=${encodeURIComponent(token)}`),
  start: (id: string, token: string, alias: string) => request<{ submission: Submission }>(`/api/exams/${id}/start`, json({ token, alias })),
  saveEvidence: (id: string, token: string, work_log: string, command_history: string) => request<{ saved_at: string }>(`/api/submissions/${id}/evidence`, json({ token, work_log, command_history })),
  addCheckpoint: (id: string, token: string, label: string, content: string) => request<{ checkpoint: Checkpoint }>(`/api/submissions/${id}/checkpoints`, json({ token, label, content })),
  uploadArtifact: async (id: string, token: string, file: File) => {
    const body = new FormData();
    body.append('artifact', file);
    return request<{ name: string; size: number }>(`/api/submissions/${id}/artifact?token=${encodeURIComponent(token)}`, { method: 'POST', body });
  },
  submit: (id: string, token: string) => request<{ submitted_at: string }>(`/api/submissions/${id}/submit`, json({ token })),
  listSubmissions: (examId: string, token: string) => request<{ submissions: SubmissionSummary[] }>(`/api/exams/${examId}/submissions?token=${encodeURIComponent(token)}`),
  getSubmission: (id: string, token: string) => request<{ submission: Submission }>(`/api/submissions/${id}?token=${encodeURIComponent(token)}`),
  assess: (id: string, token: string, scores: Record<string, number>, notes: string, outcome: string) => request<{ assessed_at: string }>(`/api/submissions/${id}/assessment`, json({ token, scores, notes, outcome })),
  deleteSubmission: (id: string, token: string) => request<{ deleted: boolean }>(`/api/submissions/${id}/delete`, json({ token })),
};

export function absoluteLink(path: string, params: Record<string, string>) {
  const url = new URL(path, window.location.origin);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return url.toString();
}
