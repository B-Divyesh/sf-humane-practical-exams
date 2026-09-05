import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const examPayload = {
  title: 'Repair a failing inventory API',
  brief: 'Repair the missing-stock response, add a regression test, and explain the checks used to verify the change.',
  duration_minutes: 90,
  deletion_days: 14,
  accommodations: 'Screen readers, breaks, and local reference material are permitted.',
  criteria: [
    { label: 'Correct behavior', description: 'The missing-stock response works.', max_score: 4 },
    { label: 'Verification', description: 'A regression test covers the repair.', max_score: 2 }
  ]
};

async function enterDemo(page: Page) {
  await page.goto('/demo');
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
}

async function createExam(request: APIRequestContext, overrides = {}) {
  const response = await request.post('/api/exams', { data: { ...examPayload, ...overrides } });
  expect(response.status()).toBe(200);
  return response.json() as Promise<{ exam_id: string; candidate_token: string; assessor_token: string }>;
}

async function startSubmission(request: APIRequestContext, alias = 'Riley') {
  const created = await createExam(request);
  const response = await request.post('/api/exams/' + created.exam_id + '/start', {
    data: { token: created.candidate_token, alias }
  });
  expect(response.status()).toBe(200);
  const body = await response.json();
  return { ...created, submission_id: body.submission.id as string, submission: body.submission };
}

test('@claim:demo-sandbox sample is populated, resettable, exportable, and isolated', async ({ page }) => {
  const apiWrites: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/api/') && request.method() !== 'GET') apiWrites.push(request.url());
  });
  await page.addInitScript(() => {
    localStorage.setItem('hpe:last-template', 'REAL-TEMPLATE-MARKER');
    localStorage.setItem('hpe:submission:real-exam', 'REAL-SUBMISSION-MARKER');
  });
  await page.goto('/');
  await page.getByRole('link', { name: 'Try it with sample data' }).click();
  await expect(page).toHaveURL(/\/demo$/);
  await expect(page.getByRole('heading', { name: 'Repair a failing inventory API' })).toBeVisible();
  await expect(page.getByText('inventory-api.tar.gz')).toBeVisible();
  await expect(page.getByText('Regression suite passed')).toBeVisible();

  const feedback = page.getByLabel('Assessor feedback');
  await feedback.fill('Changed sample feedback');
  await page.getByLabel('Overall decision').selectOption({ label: 'Needs evidence-focused follow-up' });
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(feedback).toHaveValue('The repair handles missing stock records and preserves the existing API response shape.');
  await expect(page.getByLabel('Overall decision')).toHaveValue('Meets standard');
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download sample JSON' }).click();
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).toBeTruthy();
  const record = JSON.parse(readFileSync(path!, 'utf8'));
  expect(record).toMatchObject({
    format: 'humane-practical-exam/v1',
    sample: true,
    exam: { title: 'Repair a failing inventory API' },
    submission: {
      alias: 'Riley',
      artifact_name: 'inventory-api.tar.gz',
      assessment: { notes: 'The repair handles missing stock records and preserves the existing API response shape.' }
    }
  });

  expect(await page.evaluate(() => localStorage.getItem('hpe:last-template'))).toBe('REAL-TEMPLATE-MARKER');
  expect(await page.evaluate(() => localStorage.getItem('hpe:submission:real-exam'))).toBe('REAL-SUBMISSION-MARKER');
  expect(apiWrites).toEqual([]);
});

test('@claim:separate-role-links each role link grants only its named role', async ({ page, request }) => {
  await enterDemo(page);
  const created = await createExam(request);
  expect(created.candidate_token).not.toBe(created.assessor_token);
  const candidate = await request.get('/api/exams/' + created.exam_id + '?token=' + created.candidate_token);
  const assessor = await request.get('/api/exams/' + created.exam_id + '?token=' + created.assessor_token);
  expect((await candidate.json()).role).toBe('candidate');
  expect((await assessor.json()).role).toBe('assessor');
  const denied = await request.get('/api/exams/' + created.exam_id + '?token=wrong-role-token');
  expect(denied.status()).toBe(403);
});

test('@claim:rubric-visible candidate sees the scored rubric before starting', async ({ page, request }) => {
  await enterDemo(page);
  const created = await createExam(request);
  await page.goto('/exam/' + created.exam_id + '?token=' + created.candidate_token);
  await expect(page.getByRole('heading', { name: 'How this work will be assessed' })).toBeVisible();
  await expect(page.getByText('Correct behavior')).toBeVisible();
  await expect(page.getByText('4 points')).toBeVisible();
  await expect(page.getByRole('button', { name: /Start 90-minute task/ })).toBeVisible();
});

test('@claim:candidate-handoff assessor cannot score before the candidate submits', async ({ page, request }) => {
  await enterDemo(page);
  const setup = await startSubmission(request);
  const blocked = await request.post('/api/submissions/' + setup.submission_id + '/assessment', {
    data: { token: setup.assessor_token, scores: {}, notes: 'Too soon', outcome: 'meets' }
  });
  expect(blocked.status()).toBe(400);
  const saved = await request.post('/api/submissions/' + setup.submission_id + '/evidence', {
    data: { token: setup.candidate_token, work_log: 'The candidate can still add evidence.', command_history: '' }
  });
  expect(saved.status()).toBe(200);
  await request.post('/api/submissions/' + setup.submission_id + '/submit', {
    data: { token: setup.candidate_token }
  });
  const locked = await request.post('/api/submissions/' + setup.submission_id + '/evidence', {
    data: { token: setup.candidate_token, work_log: 'This change is too late.', command_history: '' }
  });
  expect(locked.status()).toBe(400);
});

test('@claim:written-work-log assessor receives the submitted written work log', async ({ page, request }) => {
  await enterDemo(page);
  const setup = await startSubmission(request);
  const evidence = 'I reproduced the response bug, wrote a failing test, and repaired the repository query.';
  await request.post('/api/submissions/' + setup.submission_id + '/evidence', {
    data: { token: setup.candidate_token, work_log: evidence, command_history: '' }
  });
  const detail = await request.get('/api/submissions/' + setup.submission_id + '?token=' + setup.assessor_token);
  expect((await detail.json()).submission.work_log).toBe(evidence);
});

test('@claim:chosen-commands assessor receives only commands the candidate enters', async ({ page, request }) => {
  await enterDemo(page);
  const setup = await startSubmission(request);
  const commands = 'cargo test inventory_missing_stock\ncurl -i localhost:8080/items/sku-104/stock';
  await request.post('/api/submissions/' + setup.submission_id + '/evidence', {
    data: { token: setup.candidate_token, work_log: 'Verified the repair.', command_history: commands }
  });
  const detail = await request.get('/api/submissions/' + setup.submission_id + '?token=' + setup.assessor_token);
  expect((await detail.json()).submission.command_history).toBe(commands);
});

test('@claim:sha256-checkpoints checkpoint output is the SHA-256 of the chosen content', async ({ page, request }) => {
  await enterDemo(page);
  const setup = await startSubmission(request);
  const content = 'inventory_missing_stock: test result ok';
  const response = await request.post('/api/submissions/' + setup.submission_id + '/checkpoints', {
    data: { token: setup.candidate_token, label: 'Regression passed', content }
  });
  expect(response.status()).toBe(200);
  expect((await response.json()).checkpoint.hash).toBe(createHash('sha256').update(content).digest('hex'));
});

test('@claim:one-artifact a later artifact replaces the first and the 15 MB boundary is enforced', async ({ page, request }) => {
  await enterDemo(page);
  const setup = await startSubmission(request);
  const maximum = Buffer.alloc(15 * 1024 * 1024, 7);
  const accepted = await request.post('/api/submissions/' + setup.submission_id + '/artifact?token=' + setup.candidate_token, {
    multipart: { artifact: { name: 'maximum.bin', mimeType: 'application/octet-stream', buffer: maximum } }
  });
  expect(accepted.status()).toBe(200);
  const replacement = Buffer.from('replacement artifact');
  const replaced = await request.post('/api/submissions/' + setup.submission_id + '/artifact?token=' + setup.candidate_token, {
    multipart: { artifact: { name: 'replacement.txt', mimeType: 'text/plain', buffer: replacement } }
  });
  expect(replaced.status()).toBe(200);
  const downloaded = await request.get('/api/submissions/' + setup.submission_id + '/artifact?token=' + setup.assessor_token);
  expect(Buffer.from(await downloaded.body())).toEqual(replacement);
  const oversized = await request.post('/api/submissions/' + setup.submission_id + '/artifact?token=' + setup.candidate_token, {
    multipart: { artifact: { name: 'too-large.bin', mimeType: 'application/octet-stream', buffer: Buffer.alloc(15 * 1024 * 1024 + 1) } }
  });
  expect(oversized.status()).toBe(400);
});

test('@claim:portable-json exported JSON contains the task, evidence, scores, and decision', async ({ page, request }) => {
  await enterDemo(page);
  const setup = await startSubmission(request);
  await request.post('/api/submissions/' + setup.submission_id + '/evidence', {
    data: { token: setup.candidate_token, work_log: 'Regression test passed.', command_history: 'cargo test' }
  });
  await request.post('/api/submissions/' + setup.submission_id + '/submit', {
    data: { token: setup.candidate_token }
  });
  const exam = await (await request.get('/api/exams/' + setup.exam_id + '?token=' + setup.assessor_token)).json();
  const scores = Object.fromEntries(exam.exam.rubric.map((criterion: { id: string }) => [criterion.id, 1]));
  await request.post('/api/submissions/' + setup.submission_id + '/assessment', {
    data: { token: setup.assessor_token, scores, notes: 'Evidence supports the decision.', outcome: 'meets' }
  });
  const exported = await request.get('/api/submissions/' + setup.submission_id + '/export?token=' + setup.assessor_token);
  expect(exported.status()).toBe(200);
  const record = await exported.json();
  expect(record).toMatchObject({
    format: 'humane-practical-exam/v1',
    exam: { title: examPayload.title },
    submission: {
      work_log: 'Regression test passed.',
      command_history: 'cargo test',
      assessment: { notes: 'Evidence supports the decision.', outcome: 'meets' }
    }
  });
  expect(record.submission.assessment.scores).toEqual(scores);
});

test('@claim:encrypted-at-rest submitted text and artifact bytes are absent from SQLite files', async ({ page, request }) => {
  await enterDemo(page);
  const setup = await startSubmission(request);
  const textSentinel = 'ENCRYPTED-TEXT-' + Date.now() + '-SENTINEL';
  const artifactSentinel = 'ENCRYPTED-ARTIFACT-' + Date.now() + '-SENTINEL';
  await request.post('/api/submissions/' + setup.submission_id + '/evidence', {
    data: { token: setup.candidate_token, work_log: textSentinel, command_history: '' }
  });
  await request.post('/api/submissions/' + setup.submission_id + '/artifact?token=' + setup.candidate_token, {
    multipart: { artifact: { name: 'proof.txt', mimeType: 'text/plain', buffer: Buffer.from(artifactSentinel) } }
  });
  const persisted = ['data/claims.db', 'data/claims.db-wal']
    .filter(existsSync)
    .map((path) => readFileSync(path).toString('latin1'))
    .join('');
  expect(persisted).not.toContain(textSentinel);
  expect(persisted).not.toContain(artifactSentinel);
  const detail = await request.get('/api/submissions/' + setup.submission_id + '?token=' + setup.assessor_token);
  expect((await detail.json()).submission.work_log).toBe(textSentinel);
});

test('@claim:token-hashes raw candidate and assessor tokens are absent from SQLite files', async ({ page, request }) => {
  await enterDemo(page);
  const created = await createExam(request);
  const persisted = ['data/claims.db', 'data/claims.db-wal']
    .filter(existsSync)
    .map((path) => readFileSync(path).toString('latin1'))
    .join('');
  expect(persisted).not.toContain(created.candidate_token);
  expect(persisted).not.toContain(created.assessor_token);
  expect(persisted).toContain(createHash('sha256').update(created.candidate_token).digest('hex'));
});

test('@claim:scheduled-deletion expired evidence is purged and assessors can delete sooner', async ({ page, request }) => {
  await enterDemo(page);
  const setup = await startSubmission(request);
  const deleted = await request.post('/api/submissions/' + setup.submission_id + '/delete', {
    data: { token: setup.assessor_token }
  });
  expect(deleted.status()).toBe(200);
  const gone = await request.get('/api/submissions/' + setup.submission_id + '?token=' + setup.assessor_token);
  expect(gone.status()).toBe(404);
  const output = execFileSync(
    'cargo',
    ['test', 'tests::claim_scheduled_deletion_purges_records_that_expire_while_service_is_running', '--', '--exact'],
    { cwd: process.cwd(), encoding: 'utf8' }
  );
  expect(output).toContain('1 passed');
});

test('@claim:nonblocking-timer an ended timebox does not lock candidate writing', async ({ page }) => {
  await enterDemo(page);
  const output = execFileSync(
    'cargo',
    ['test', 'tests::claim_nonblocking_timer_keeps_evidence_writable_after_timebox_ends', '--', '--exact'],
    { cwd: process.cwd(), encoding: 'utf8' }
  );
  expect(output).toContain('1 passed');
});

test('@claim:offline-drafts typed candidate work remains in its own browser context while offline', async ({ browser, request }) => {
  const created = await createExam(request);
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    await enterDemo(page);
    await page.goto('/exam/' + created.exam_id + '?token=' + created.candidate_token);
    await page.getByLabel(/Candidate name or alias/).fill('Offline Riley');
    await page.getByRole('button', { name: /Start 90-minute task/ }).click();
    await context.setOffline(true);
    await page.getByLabel(/Work log/).fill('This draft remains available without a connection.');
    await expect.poll(() => page.evaluate(() => Object.keys(localStorage).some((key) => key.startsWith('hpe:draft:')))).toBe(true);
    await expect(page.getByLabel(/Work log/)).toHaveValue('This draft remains available without a connection.');
  } finally {
    await context.setOffline(false);
    await context.close();
  }
});

test('@claim:no-webcam the sample flow never requests camera, microphone, or screen access', async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { mediaCalls: number }).mediaCalls = 0;
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: () => {
          (window as unknown as { mediaCalls: number }).mediaCalls += 1;
          return Promise.reject(new Error('blocked in claim test'));
        },
        getDisplayMedia: () => {
          (window as unknown as { mediaCalls: number }).mediaCalls += 1;
          return Promise.reject(new Error('blocked in claim test'));
        }
      }
    });
  });
  await enterDemo(page);
  await page.getByLabel('Assessor feedback').fill('Human review only.');
  expect(await page.evaluate(() => (window as unknown as { mediaCalls: number }).mediaCalls)).toBe(0);
});

test('@claim:no-browser-lock the sample stays navigable without fullscreen or pointer lock', async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { lockCalls: number }).lockCalls = 0;
    Element.prototype.requestFullscreen = () => {
      (window as unknown as { lockCalls: number }).lockCalls += 1;
      return Promise.resolve();
    };
    HTMLElement.prototype.requestPointerLock = () => {
      (window as unknown as { lockCalls: number }).lockCalls += 1;
    };
  });
  await enterDemo(page);
  await page.getByRole('link', { name: 'Start for real' }).click();
  await expect(page).toHaveURL(/\/create$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/demo$/);
  expect(await page.evaluate(() => (window as unknown as { lockCalls: number }).lockCalls)).toBe(0);
});

test('@claim:no-biometrics candidate entry uses an alias and makes no identity or authorship claim', async ({ page, request }) => {
  const created = await createExam(request);
  await page.addInitScript(() => {
    (window as unknown as { credentialCalls: number }).credentialCalls = 0;
    if (navigator.credentials) {
      Object.defineProperty(navigator.credentials, 'get', {
        configurable: true,
        value: () => {
          (window as unknown as { credentialCalls: number }).credentialCalls += 1;
          return Promise.reject(new Error('blocked in claim test'));
        }
      });
    }
  });
  await enterDemo(page);
  await page.goto('/exam/' + created.exam_id + '?token=' + created.candidate_token);
  await page.getByLabel(/Candidate name or alias/).fill('Alias only');
  await expect(page.getByRole('button', { name: /Start 90-minute task/ })).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { credentialCalls: number }).credentialCalls)).toBe(0);
  const started = await request.post('/api/exams/' + created.exam_id + '/start', {
    data: { token: created.candidate_token, alias: 'Alias only' }
  });
  expect(started.status()).toBe(200);
  const submissionId = (await started.json()).submission.id as string;
  const exported = await request.get('/api/submissions/' + submissionId + '/export?token=' + created.candidate_token);
  expect((await exported.json()).integrity_note).toContain('do not prove identity or authorship');
});

test('@claim:no-ai-score rubric scores remain assessor-entered and make no model request', async ({ page }) => {
  const modelRequests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/v1/responses') || request.url().includes('openai')) modelRequests.push(request.url());
  });
  await enterDemo(page);
  const score = page.getByLabel(/Technical reasoning/);
  await score.fill('2');
  await expect(score).toHaveValue('2');
  expect(modelRequests).toEqual([]);
});

test('@claim:no-tracking sample use sends requests only to the product origin and sets no product cookie', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const origins = new Set<string>();
  await page.addInitScript(() => {
    (window as unknown as { beaconCalls: number }).beaconCalls = 0;
    navigator.sendBeacon = () => {
      (window as unknown as { beaconCalls: number }).beaconCalls += 1;
      return false;
    };
  });
  page.on('request', (request) => origins.add(new URL(request.url()).origin));
  try {
    await enterDemo(page);
    await page.getByRole('button', { name: 'Reset demo' }).click();
    expect([...origins]).toEqual(['http://127.0.0.1:18083']);
    expect(await context.cookies()).toEqual([]);
    expect(await page.evaluate(() => (window as unknown as { beaconCalls: number }).beaconCalls)).toBe(0);
  } finally {
    await context.close();
  }
});

test('@claim:free-core a complete create, submit, assess, and export flow makes no billing request', async ({ page }) => {
  const externalRequests: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== 'http://127.0.0.1:18083') externalRequests.push(request.url());
  });
  await enterDemo(page);
  await page.getByRole('link', { name: 'Start for real' }).click();
  await page.getByLabel(/Exam title/).fill('Free workflow check');
  await page.getByLabel(/Task brief/).fill(examPayload.brief);
  await page.getByRole('button', { name: /Create exam/ }).click();
  const candidateLink = await page.getByLabel('Candidate capability link').inputValue();
  const assessorLink = await page.getByLabel('Assessor capability link').inputValue();
  await page.goto(candidateLink);
  await page.getByLabel(/Candidate name or alias/).fill('Riley');
  await page.getByRole('button', { name: /Start 90-minute task/ }).click();
  await page.getByLabel(/Work log/).fill('The repair and regression test both pass.');
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: /Submit evidence/ }).click();
  await expect(page.getByRole('heading', { name: 'Your work has been submitted.' })).toBeVisible();
  await page.goto(assessorLink);
  await page.getByRole('button', { name: /Riley/ }).click();
  for (const input of await page.locator('.score-row input').all()) await input.fill('1');
  await page.getByLabel('Assessor feedback').fill('Evidence supports this decision.');
  await page.getByRole('button', { name: /Save assessment/ }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Export JSON' }).click();
  expect((await downloadPromise).suggestedFilename()).toMatch(/^assessment-.*\.json$/);
  expect(externalRequests).toEqual([]);
});

async function setValidProviderLicense(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('sb_license:humane-practical-exams', 'cached-valid-license');
    localStorage.setItem(
      'sb_license:humane-practical-exams:verdict',
      JSON.stringify({ valid: true, checked: Date.now() })
    );
  });
}

test('@claim:provider-template a cached valid license saves and reloads the last exam template', async ({ page }) => {
  await setValidProviderLicense(page);
  await enterDemo(page);
  await page.getByRole('link', { name: 'Start for real' }).click();
  await page.getByLabel(/Exam title/).fill('Reusable licensed template');
  await page.getByLabel(/Task brief/).fill(examPayload.brief);
  await page.getByRole('button', { name: /Create exam/ }).click();
  await page.getByRole('button', { name: 'Create another exam' }).click();
  await page.getByLabel(/Exam title/).fill('Changed after creation');
  await page.getByRole('button', { name: 'Load your last exam template' }).click();
  await expect(page.getByLabel(/Exam title/)).toHaveValue('Reusable licensed template');
});

test('@claim:provider-branding a cached valid license adds the provider name to a new exam', async ({ page }) => {
  await setValidProviderLicense(page);
  await enterDemo(page);
  await page.getByRole('link', { name: 'Start for real' }).click();
  await page.getByLabel(/Exam title/).fill('Provider name check');
  await page.getByLabel(/Task brief/).fill(examPayload.brief);
  await page.getByLabel(/Provider name/).fill('Northbridge Training');
  await page.getByRole('button', { name: /Create exam/ }).click();
  const candidateLink = await page.getByLabel('Candidate capability link').inputValue();
  await page.goto(candidateLink);
  await expect(page.getByText('Northbridge Training')).toBeVisible();
});

test('@claim:license-restore an incoming or pasted valid license enables provider tools', async ({ page }) => {
  const verificationTokens: string[] = [];
  await page.route('https://api.sociobot.in/api/v1/products/humane-practical-exams/verify?*', async (route) => {
    verificationTokens.push(new URL(route.request().url()).searchParams.get('license') || '');
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"valid":true,"reason":"ok","expires_at":null}' });
  });
  await page.goto('/?license=return-license-token');
  await expect(page).toHaveURL('http://127.0.0.1:18083/');
  expect(await page.evaluate(() => localStorage.getItem('sb_license:humane-practical-exams'))).toBe('return-license-token');
  await page.goto('/create');
  await expect(page.getByLabel(/Provider name/)).toBeVisible();
  await page.evaluate(() => {
    localStorage.removeItem('sb_license:humane-practical-exams');
    localStorage.removeItem('sb_license:humane-practical-exams:verdict');
  });
  await page.reload();
  await page.getByText('Have a provider license?').click();
  await page.getByLabel('Paste license token').fill('pasted-license-token');
  await page.getByRole('button', { name: 'Verify and restore' }).click();
  await expect(page.getByLabel(/Provider name/)).toBeVisible();
  expect(verificationTokens).toContain('return-license-token');
  expect(verificationTokens).toContain('pasted-license-token');
});

test('@claim:license-revocation a revoked license disables provider tools after verification', async ({ page }) => {
  await page.route('https://api.sociobot.in/api/v1/products/humane-practical-exams/verify?*', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"valid":false,"reason":"revoked","expires_at":null}' });
  });
  await page.goto('/?license=revoked-license-token');
  await page.goto('/create');
  await expect(page.getByText(/License no longer active/)).toBeVisible();
  await expect(page.getByLabel(/Provider name/)).toHaveCount(0);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('sb_license:humane-practical-exams:verdict') || 'null')?.valid)).toBe(false);
});

test('@claim:zero-config-runtime the built service starts with only PORT and persists its generated key', async ({ page }) => {
  await enterDemo(page);
  const output = execFileSync('npm', ['run', 'test:runtime'], {
    cwd: process.cwd(),
    encoding: 'utf8',
    timeout: 80_000
  });
  expect(output).toContain('test:runtime');
});

test('@claim:checkout-unavailable visitors are not sent to the unavailable provider checkout', async ({ page }) => {
  const externalRequests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/checkout')) externalRequests.push(request.url());
  });
  await page.goto('/');
  await expect(page.getByText(/new provider tool purchases are temporarily unavailable/i).first()).toBeVisible();
  await expect(page.locator('a[href*="/checkout"]')).toHaveCount(0);
  await page.getByRole('link', { name: 'Try it with sample data' }).click();
  expect(externalRequests).toEqual([]);
});
