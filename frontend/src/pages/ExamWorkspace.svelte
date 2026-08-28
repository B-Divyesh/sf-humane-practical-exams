<script lang="ts">
  import { onMount } from 'svelte';
  import Header from '../components/Header.svelte';
  import Footer from '../components/Footer.svelte';
  import { api, type Exam, type Submission, type SubmissionSummary } from '../lib/api';

  export let examId: string;
  const token = new URLSearchParams(window.location.search).get('token') || '';
  let loading = true;
  let error = '';
  let role: 'candidate' | 'assessor' | '' = '';
  let exam: Exam | null = null;
  let submission: Submission | null = null;
  let submissions: SubmissionSummary[] = [];
  let alias = '';
  let workLog = '';
  let commandHistory = '';
  let checkpointLabel = '';
  let checkpointContent = '';
  let artifact: File | null = null;
  let busy = '';
  let statusMessage = '';
  let online = navigator.onLine;
  let remaining = '';
  let scores: Record<string, number> = {};
  let notes = '';
  let outcome = 'meets';
  let timer: number;

  const submissionKey = `hpe:submission:${examId}`;
  const draftKey = `hpe:draft:${examId}`;

  onMount(() => {
    void load();
    const onlineHandler = () => online = navigator.onLine;
    window.addEventListener('online', onlineHandler);
    window.addEventListener('offline', onlineHandler);
    timer = window.setInterval(updateTimer, 1000);
    return () => { window.removeEventListener('online', onlineHandler); window.removeEventListener('offline', onlineHandler); clearInterval(timer); };
  });

  async function load() {
    if (!token) { error = 'This capability link is missing its access token. Ask the exam owner for the complete link.'; loading = false; return; }
    try {
      const view = await api.viewExam(examId, token);
      exam = view.exam; role = view.role;
      document.title = `${exam.title} — Humane Practical Exams`;
      if (role === 'candidate') {
        const draft = JSON.parse(localStorage.getItem(draftKey) || 'null');
        if (draft) ({ workLog = '', commandHistory = '' } = draft);
        const id = localStorage.getItem(submissionKey);
        if (id) {
          try { submission = (await api.getSubmission(id, token)).submission; hydrateSubmission(); }
          catch { localStorage.removeItem(submissionKey); }
        }
      } else await refreshSubmissions();
    } catch (caught) { error = (caught as Error).message; }
    finally { loading = false; }
  }

  function hydrateSubmission() {
    if (!submission) return;
    workLog = submission.work_log;
    commandHistory = submission.command_history;
    scores = submission.assessment?.scores || {};
    notes = submission.assessment?.notes || '';
    outcome = submission.assessment?.outcome || 'meets';
    updateTimer();
  }
  function saveDraft() {
    localStorage.setItem(draftKey, JSON.stringify({ workLog, commandHistory, saved: new Date().toISOString() }));
    statusMessage = 'Draft saved on this device.';
  }
  function updateTimer() {
    if (!submission || !exam) return;
    const end = new Date(submission.started_at).getTime() + exam.duration_minutes * 60_000;
    const seconds = Math.max(0, Math.floor((end - Date.now()) / 1000));
    remaining = seconds === 0 ? 'Timebox ended' : `${String(Math.floor(seconds / 3600)).padStart(2, '0')}:${String(Math.floor((seconds % 3600) / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  }
  async function startSubmission() {
    error = ''; busy = 'start';
    try {
      const result = await api.start(examId, token, alias.trim() || 'Candidate');
      submission = result.submission;
      localStorage.setItem(submissionKey, submission.id);
      hydrateSubmission();
    } catch (caught) { error = (caught as Error).message; }
    finally { busy = ''; }
  }
  async function saveEvidence() {
    if (!submission) return;
    saveDraft(); error = ''; busy = 'save';
    try {
      await api.saveEvidence(submission.id, token, workLog, commandHistory);
      statusMessage = 'Evidence encrypted and saved to the submission.';
    } catch (caught) { error = (caught as Error).message; }
    finally { busy = ''; }
  }
  async function addCheckpoint() {
    if (!submission || !checkpointLabel.trim() || !checkpointContent.trim()) { error = 'Give the checkpoint a label and paste the exact text or value to seal.'; return; }
    error = ''; busy = 'checkpoint';
    try {
      const result = await api.addCheckpoint(submission.id, token, checkpointLabel, checkpointContent);
      submission = { ...submission, checkpoints: [...submission.checkpoints, result.checkpoint], checkpoint_count: submission.checkpoint_count + 1 };
      checkpointLabel = ''; checkpointContent = '';
      statusMessage = 'Checkpoint sealed. The exact content was encrypted; its SHA-256 hash is visible below.';
    } catch (caught) { error = (caught as Error).message; }
    finally { busy = ''; }
  }
  async function upload() {
    if (!submission || !artifact) return;
    error = ''; busy = 'upload';
    try {
      const result = await api.uploadArtifact(submission.id, token, artifact);
      submission = { ...submission, artifact_name: result.name, artifact_size: result.size };
      statusMessage = `${result.name} encrypted and uploaded.`;
    } catch (caught) { error = (caught as Error).message; }
    finally { busy = ''; }
  }
  async function submitEvidence() {
    if (!submission) return;
    if (!submission.artifact_name && !workLog.trim()) { error = 'Add a work log or an artifact before submitting.'; return; }
    if (!confirm('Submit this evidence now? You can still view it, but you will not be able to change it.')) return;
    busy = 'submit';
    try {
      await saveEvidence();
      const result = await api.submit(submission.id, token);
      submission = { ...submission, status: 'submitted', submitted_at: result.submitted_at, work_log: workLog, command_history: commandHistory };
      localStorage.removeItem(draftKey);
      statusMessage = 'Evidence submitted. You can close this page safely.';
    } catch (caught) { error = (caught as Error).message; }
    finally { busy = ''; }
  }
  async function refreshSubmissions() {
    try { submissions = (await api.listSubmissions(examId, token)).submissions; }
    catch (caught) { error = (caught as Error).message; }
  }
  async function selectSubmission(id: string) {
    busy = 'detail'; error = '';
    try { submission = (await api.getSubmission(id, token)).submission; hydrateSubmission(); }
    catch (caught) { error = (caught as Error).message; }
    finally { busy = ''; }
  }
  async function saveAssessment() {
    if (!submission || !exam) return;
    if (exam.rubric.some((criterion) => scores[criterion.id] == null || scores[criterion.id] < 0 || scores[criterion.id] > criterion.max_score)) { error = 'Enter a score within the allowed range for every criterion.'; return; }
    busy = 'assess'; error = '';
    try {
      const result = await api.assess(submission.id, token, scores, notes, outcome);
      submission = { ...submission, status: 'assessed', outcome, assessment: { scores, notes, outcome, assessed_at: result.assessed_at } };
      statusMessage = 'Assessment saved. The exported record now includes this decision.';
      await refreshSubmissions();
    } catch (caught) { error = (caught as Error).message; }
    finally { busy = ''; }
  }
  async function removeSubmission() {
    if (!submission || !confirm(`Permanently delete the submission from “${submission.alias}”? The encrypted artifact and assessment cannot be recovered.`)) return;
    busy = 'delete';
    try { await api.deleteSubmission(submission.id, token); submission = null; await refreshSubmissions(); statusMessage = 'Submission permanently deleted.'; }
    catch (caught) { error = (caught as Error).message; }
    finally { busy = ''; }
  }
  function bytes(value?: number) { return value == null ? '' : value < 1024 * 1024 ? `${Math.ceil(value / 1024)} KB` : `${(value / 1024 / 1024).toFixed(1)} MB`; }
</script>

<Header compact />
<main id="main" class="exam-workspace">
  {#if !online}<div class="offline-banner" role="status">Offline — keep working; your typed draft is saved on this device.</div>{/if}
  {#if loading}
    <section class="loading-state" aria-live="polite"><div class="loading-mark"></div><h1>Opening the evidence trail…</h1><p>Checking this capability link.</p></section>
  {:else if error && !exam}
    <section class="empty-page"><p class="eyebrow"><span></span> Link unavailable</p><h1>We couldn’t open this exam.</h1><p>{error}</p><button class="button quiet" type="button" onclick={load}>Try again</button></section>
  {:else if exam}
    <section class="exam-topline">
      <div><span class:assessor={role === 'assessor'} class="role-badge">{role}</span>{#if exam.provider_name}<span class="provider">{exam.provider_name}</span>{/if}<h1>{exam.title}</h1></div>
      <div class="exam-meta"><p><span>Timebox</span><strong>{exam.duration_minutes} min</strong></p><p><span>Auto-delete</span><strong>{exam.deletion_days} days</strong></p></div>
    </section>
    {#if error}<div class="form-error" role="alert">{error}<button type="button" aria-label="Dismiss error" onclick={() => error = ''}>×</button></div>{/if}
    {#if statusMessage}<div class="notice success" role="status">{statusMessage}</div>{/if}

    {#if role === 'candidate'}
      {#if !submission}
        <section class="candidate-brief">
          <article><p class="section-kicker">Task brief</p><div class="brief-text">{exam.brief}</div></article>
          <aside><h2>Before you begin</h2><dl><div><dt>Evidence collected</dt><dd>Your alias, written log, chosen command excerpts, checkpoints, and one artifact.</dd></div><div><dt>Not collected</dt><dd>Camera, screen, keystrokes, browsing, identity, or background behavior.</dd></div><div><dt>Accommodations</dt><dd>{exam.accommodations || 'No additional notes were supplied. Contact your assessor before starting if you need an adjustment.'}</dd></div></dl>
            <label for="alias">Candidate name or alias <span>avoid unnecessary personal data</span></label><input id="alias" bind:value={alias} maxlength="80" autocomplete="off" />
            <button class="button primary full" type="button" disabled={busy === 'start'} onclick={startSubmission}>{busy === 'start' ? 'Starting…' : `Start ${exam.duration_minutes}-minute task →`}</button><small>The timer is a visible timebox. It never locks your writing.</small>
          </aside>
        </section>
        <section class="rubric-preview"><p class="section-kicker">Visible from the start</p><h2>How this work will be assessed</h2><div class="rubric-grid">{#each exam.rubric as criterion}<article><strong>{criterion.label}</strong><span>{criterion.max_score} points</span><p>{criterion.description}</p></article>{/each}</div></section>
      {:else if submission.status === 'submitted' || submission.status === 'assessed'}
        <section class="submitted-state">
          <div class="completion-mark" aria-hidden="true">✓</div><p class="eyebrow"><span></span> Evidence received</p><h2>Your work has been submitted.</h2><p>The record is encrypted and scheduled for deletion on <strong>{new Date(submission.delete_at).toLocaleDateString()}</strong>.</p>
          <div class="submission-receipt"><p><span>Status</span><strong>{submission.status === 'assessed' ? 'Assessed' : 'Awaiting assessment'}</strong></p><p><span>Artifact</span><strong>{submission.artifact_name || 'No artifact'}</strong></p><p><span>Checkpoints</span><strong>{submission.checkpoint_count}</strong></p></div>
          {#if submission.assessment}<section class="candidate-result"><h3>Assessor decision: {submission.assessment.outcome.replace('_', ' ')}</h3><p>{submission.assessment.notes || 'No written feedback was added.'}</p></section>{/if}
          <a class="button quiet" href={`/api/submissions/${submission.id}/export?token=${encodeURIComponent(token)}`}>Download assessment record</a>
        </section>
      {:else}
        <section class="workbench">
          <div class="workbench-header"><div><p class="section-kicker">Candidate workspace</p><h2>Build your evidence trail</h2></div><div class:ended={remaining === 'Timebox ended'} class="timer"><span>Time remaining</span><strong>{remaining}</strong></div></div>
          <div class="workbench-layout">
            <div class="evidence-editor">
              <section><label for="work-log">Work log <span>Explain decisions, tests, and changes in your own words.</span></label><textarea id="work-log" bind:value={workLog} oninput={saveDraft} rows="12" placeholder="I began by…"></textarea></section>
              <section><label for="commands">Chosen command history <span>Paste only the commands that help explain your work. Optional.</span></label><textarea id="commands" class="mono" bind:value={commandHistory} oninput={saveDraft} rows="7" placeholder="$ npm test"></textarea></section>
              <div class="save-row"><button class="button quiet" type="button" disabled={busy === 'save'} onclick={saveEvidence}>{busy === 'save' ? 'Saving…' : 'Save encrypted evidence'}</button><small>Typing draft is also stored locally in this browser.</small></div>
            </div>
            <aside class="evidence-tools">
              <section><p class="tool-number">01</p><h3>Seal a checkpoint</h3><p>Record a milestone. The exact text is encrypted; its SHA-256 fingerprint proves whether it changed.</p><label for="checkpoint-label">Checkpoint label</label><input id="checkpoint-label" bind:value={checkpointLabel} maxlength="100" placeholder="Tests passing" /><label for="checkpoint-content">Exact value or note to hash</label><textarea id="checkpoint-content" bind:value={checkpointContent} rows="3" maxlength="4000"></textarea><button class="button quiet full" type="button" onclick={addCheckpoint} disabled={busy === 'checkpoint'}>{busy === 'checkpoint' ? 'Sealing…' : 'Seal checkpoint'}</button>
                {#if submission.checkpoints.length}<ul class="checkpoint-list">{#each submission.checkpoints as checkpoint}<li><strong>{checkpoint.label}</strong><code>{checkpoint.hash.slice(0, 16)}…</code><time>{new Date(checkpoint.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time></li>{/each}</ul>{/if}
              </section>
              <section><p class="tool-number">02</p><h3>Attach your artifact</h3><p>Upload one ZIP, source file, document, or image up to 15 MB. A later upload replaces it.</p><label class="file-drop" for="artifact"><span>{artifact?.name || submission.artifact_name || 'Choose artifact'}</span><small>{artifact ? bytes(artifact.size) : submission.artifact_size ? bytes(submission.artifact_size) : 'Maximum 15 MB'}</small></label><input class="visually-hidden" id="artifact" type="file" onchange={(event) => artifact = event.currentTarget.files?.[0] || null} />{#if artifact}<button class="button quiet full" type="button" disabled={busy === 'upload'} onclick={upload}>{busy === 'upload' ? 'Encrypting and uploading…' : 'Upload artifact'}</button>{/if}</section>
            </aside>
          </div>
          <div class="submit-evidence"><div><strong>Ready to hand over?</strong><span>You can review everything above before submitting.</span></div><button class="button primary" type="button" disabled={busy === 'submit'} onclick={submitEvidence}>{busy === 'submit' ? 'Submitting…' : 'Submit evidence →'}</button></div>
        </section>
      {/if}
    {:else}
      <section class="assessor-layout">
        <aside class="submission-sidebar"><div><p class="section-kicker">Submissions</p><button type="button" class="icon-button" onclick={refreshSubmissions} aria-label="Refresh submissions">↻</button></div>
          {#if submissions.length === 0}<div class="mini-empty"><strong>No submissions yet</strong><p>Share the candidate capability link. New work will appear here.</p></div>{:else}<ul>{#each submissions as item}<li><button class:active={submission?.id === item.id} type="button" onclick={() => selectSubmission(item.id)}><span><strong>{item.alias}</strong><small>{new Date(item.started_at).toLocaleDateString()} · {item.checkpoint_count} checkpoints</small></span><span class={`status-dot ${item.status}`}>{item.status.replace('_', ' ')}</span></button></li>{/each}</ul>{/if}
        </aside>
        <div class="assessment-pane">
          {#if busy === 'detail'}<div class="loading-inline">Opening encrypted evidence…</div>
          {:else if !submission}<div class="assessor-empty"><div class="landscape-icon" aria-hidden="true"></div><h2>Select a submission</h2><p>Evidence, artifact metadata, and the rubric decision will appear here.</p></div>
          {:else}<div class="assessment-header"><div><span class={`status-pill ${submission.status}`}>{submission.status.replace('_', ' ')}</span><h2>{submission.alias}</h2><p>Started {new Date(submission.started_at).toLocaleString()} · deletes {new Date(submission.delete_at).toLocaleDateString()}</p></div><div class="assessment-actions"><a class="button quiet small" href={`/api/submissions/${submission.id}/export?token=${encodeURIComponent(token)}`}>Export JSON</a><button class="text-button danger" type="button" onclick={removeSubmission}>Delete</button></div></div>
            <div class="evidence-readout"><section><p class="section-kicker">Candidate work log</p><div class="preserved-text">{submission.work_log || 'No work log supplied.'}</div></section><section><p class="section-kicker">Chosen command history</p><pre>{submission.command_history || 'No command history supplied.'}</pre></section></div>
            <div class="artifact-readout"><div><span>Artifact</span><strong>{submission.artifact_name || 'No artifact supplied'}</strong>{#if submission.artifact_size}<small>{bytes(submission.artifact_size)}</small>{/if}</div>{#if submission.artifact_name}<a class="button quiet small" href={`/api/submissions/${submission.id}/artifact?token=${encodeURIComponent(token)}`}>Download artifact</a>{/if}</div>
            <section class="checkpoint-readout"><p class="section-kicker">Checkpoint fingerprints</p>{#if submission.checkpoints.length}<ol>{#each submission.checkpoints as checkpoint}<li><div><strong>{checkpoint.label}</strong><time>{new Date(checkpoint.created_at).toLocaleString()}</time></div><code>{checkpoint.hash}</code></li>{/each}</ol>{:else}<p>No checkpoints were recorded.</p>{/if}</section>
            <section class="scoring"><div class="scoring-heading"><p class="section-kicker">Transparent decision</p><h3>Score the rubric</h3></div>{#each exam.rubric as criterion}<div class="score-row"><div><label for="assess-{criterion.id}">{criterion.label}</label><p>{criterion.description}</p></div><div><input id="assess-{criterion.id}" type="number" min="0" max={criterion.max_score} value={scores[criterion.id] ?? ''} oninput={(event) => scores = { ...scores, [criterion.id]: Number(event.currentTarget.value) }} /><span>/ {criterion.max_score}</span></div></div>{/each}
              <label for="outcome">Overall decision</label><select id="outcome" bind:value={outcome}><option value="meets">Meets standard</option><option value="partially_meets">Partially meets</option><option value="does_not_meet">Does not meet</option><option value="needs_follow_up">Needs evidence-focused follow-up</option></select>
              <label for="notes">Assessor feedback</label><textarea id="notes" bind:value={notes} rows="6" maxlength="8000"></textarea><button class="button primary" type="button" disabled={busy === 'assess'} onclick={saveAssessment}>{busy === 'assess' ? 'Saving assessment…' : 'Save assessment →'}</button>
            </section>
          {/if}
        </div>
      </section>
    {/if}
  {/if}
</main>
<Footer />
