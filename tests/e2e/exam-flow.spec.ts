import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('landing and exam builder have no serious accessibility violations', async ({ page }) => {
  await page.goto('/');
  let results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact || ''))).toEqual([]);
  await page.goto('/demo');
  results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact || ''))).toEqual([]);
  await page.goto('/create');
  results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact || ''))).toEqual([]);
});

test('routes expose distinct metadata, a sitemap, and real browser and API 404 responses', async ({ page, request }) => {
  const routes = [
    ['/', 'Humane Practical Exams — Run practical exams'],
    ['/demo', 'Demo — Humane Practical Exams'],
    ['/create', 'Create an exam — Humane Practical Exams'],
    ['/privacy', 'Privacy — Humane Practical Exams'],
    ['/terms', 'Terms — Humane Practical Exams']
  ] as const;
  for (const [path, title] of routes) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(title);
    await expect(page.locator('main h1')).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://humane-practical-exams.sociobot.in' + path);
  }
  const missing = await page.goto('/not-a-real-page');
  expect(missing?.status()).toBe(404);
  await expect(page).toHaveTitle('Page not found — Humane Practical Exams');
  await expect(page.getByRole('heading', { name: 'We could not find this page' })).toBeVisible();
  const apiMissing = await request.get('/api/not-a-real-route');
  expect(apiMissing.status()).toBe(404);
  expect(apiMissing.headers()['content-type']).toContain('application/json');
  await expect(apiMissing.json()).resolves.toEqual({ error: 'That API route does not exist.' });
  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).toContain('/demo');
});

test('client navigation and browser history move focus to the new page heading', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Try it with sample data' }).click();
  await expect(page.getByRole('heading', { name: 'Review a completed practical exam' })).toBeFocused();
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Run practical exams without surveillance' })).toBeFocused();
});

test('demo sample resets without API writes or real-data changes', async ({ page }) => {
  const writes: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/api/') && request.method() !== 'GET') writes.push(request.url());
  });
  await page.addInitScript(() => localStorage.setItem('hpe:last-template', 'real-data-marker'));
  await page.goto('/');
  await page.getByRole('link', { name: 'Try it with sample data' }).click();
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page.getByText('inventory-api.tar.gz')).toBeVisible();
  await page.getByLabel('Assessor feedback').fill('temporary demo change');
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.getByLabel('Assessor feedback')).toHaveValue('The repair handles missing stock records and preserves the existing API response shape.');
  expect(await page.evaluate(() => localStorage.getItem('hpe:last-template'))).toBe('real-data-marker');
  expect(writes).toEqual([]);
});

test('reduced motion, 200% text, and touch targets preserve the mobile demo', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/demo');
  const animationDuration = await page.locator('.demo-banner').evaluate((element) => getComputedStyle(element).animationDuration);
  expect(Number.parseFloat(animationDuration)).toBeLessThanOrEqual(0.01);
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  await expect(page.getByRole('heading', { name: 'Review a completed practical exam' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
  const smallTargets = await page.locator('a:visible, button:visible, input:visible, select:visible, textarea:visible').evaluateAll((elements) =>
    elements
      .map((element) => ({ label: element.getAttribute('aria-label') || element.textContent?.trim() || element.tagName, box: element.getBoundingClientRect() }))
      .filter(({ box }) => box.width < 44 || box.height < 44)
      .map(({ label, box }) => ({ label, width: box.width, height: box.height }))
  );
  expect(smallTargets).toEqual([]);
});

test('theme changes never animate primary buttons through low-contrast colors', async ({ page }) => {
  await page.goto('/');
  const primary = page.getByRole('link', { name: 'Try it with sample data' }).first();
  await expect(primary).toBeVisible();
  await expect(page.locator('a[href*="/checkout"]')).toHaveCount(0);
  await expect(page.getByText(/New provider tool purchases are temporarily unavailable/)).toBeVisible();
  expect(await primary.evaluate((element) => getComputedStyle(element).transitionProperty))
    .not.toContain('background');

  await page.getByRole('button', { name: 'Use light theme' }).click();
  let results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact || ''))).toEqual([]);

  await page.getByRole('button', { name: 'Use dark theme' }).click();
  results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact || ''))).toEqual([]);
});

test('instructor creates an exam and landing page has no console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Run practical exams without surveillance');
  await expect(page.locator('main')).toBeVisible();
  await expect(page.locator('img[alt]')).toHaveCount(1);
  await page.getByRole('link', { name: 'Create an exam', exact: true }).first().click();
  await page.getByLabel(/Exam title/).fill('Build a health endpoint');
  await page.getByLabel(/Task brief/).fill('Create a small HTTP service with a health endpoint, tests, and a concise explanation of your design choices.');
  await page.getByRole('button', { name: /Create exam/ }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Share separate role links');
  expect(errors).toEqual([]);
});

test('candidate evidence reaches the assessor and can be graded', async ({ page }) => {
  await page.goto('/create');
  await page.getByLabel(/Exam title/).fill('Deploy a tiny service');
  await page.getByLabel(/Task brief/).fill('Build a tiny HTTP service, verify its behavior with tests, and explain the technical decisions you made along the way.');
  await page.getByRole('button', { name: /Create exam/ }).click();
  const candidateLink = await page.getByLabel('Candidate capability link').inputValue();
  const assessorLink = await page.getByLabel('Assessor capability link').inputValue();

  await page.goto(candidateLink);
  await page.getByLabel(/Candidate name or alias/).fill('River');
  await page.getByRole('button', { name: /Start .* task/ }).click();
  await page.getByLabel(/Work log/).fill('Implemented the health route first, then added a failing test and corrected the response status.');
  await page.getByLabel(/Chosen command history/).fill('cargo test\ncurl localhost:8080/health');
  await page.getByLabel('Checkpoint label').fill('Tests passing');
  await page.getByLabel('Exact value or note to hash').fill('3 tests passed; health returned 200');
  await page.getByRole('button', { name: 'Seal checkpoint' }).click();
  await expect(page.getByText('Tests passing')).toBeVisible();
  await page.getByLabel('Choose artifact').setInputFiles({ name: 'solution.txt', mimeType: 'text/plain', buffer: Buffer.from('working solution') });
  await page.getByRole('button', { name: 'Upload artifact' }).click();
  await expect(page.getByText(/encrypted and uploaded/)).toBeVisible();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: /Submit evidence/ }).click();
  await expect(page.getByRole('heading', { name: 'Your work has been submitted.' })).toBeVisible();

  await page.goto(assessorLink);
  await page.getByRole('button', { name: /River/ }).click();
  await expect(page.getByText('Implemented the health route first')).toBeVisible();
  for (const input of await page.locator('.score-row input').all()) await input.fill('1');
  await page.getByLabel('Assessor feedback').fill('The artifact and written evidence are sufficient for this decision.');
  await page.getByRole('button', { name: /Save assessment/ }).click();
  await expect(page.getByText(/Assessment saved/)).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Export JSON' }).click();
  expect((await download).suggestedFilename()).toMatch(/^assessment-.*\.json$/);
});

test('assessors cannot finalize an active submission, and candidates retain control until submission', async ({ page }) => {
  await page.goto('/create');
  await page.getByLabel(/Exam title/).fill('Candidate-controlled handoff');
  await page.getByLabel(/Task brief/).fill('Build a small service, keep working until you choose to submit, and explain the evidence that supports your practical decisions.');
  await page.getByRole('button', { name: /Create exam/ }).click();
  const candidateLink = await page.getByLabel('Candidate capability link').inputValue();
  const assessorLink = await page.getByLabel('Assessor capability link').inputValue();
  const assessorToken = new URL(assessorLink).searchParams.get('token');
  const examId = new URL(candidateLink).pathname.split('/').pop();

  await page.goto(candidateLink);
  await page.getByLabel(/Candidate name or alias/).fill('Active River');
  await page.getByRole('button', { name: /Start .* task/ }).click();
  await expect(page.getByLabel(/Work log/)).toBeVisible();
  const submissionId = await page.evaluate((id) => localStorage.getItem(`hpe:submission:${id}`), examId);
  expect(submissionId).toBeTruthy();

  const blocked = await page.request.post(`/api/submissions/${submissionId}/assessment`, {
    data: { token: assessorToken, scores: {}, notes: 'This must not lock the candidate.', outcome: 'meets' }
  });
  expect(blocked.status()).toBe(400);
  await expect(blocked.json()).resolves.toMatchObject({ error: 'Wait for the candidate to submit evidence before assessing it.' });

  await page.getByLabel(/Work log/).fill('SENSITIVE-CACHE-SENTINEL: I can continue documenting decisions after the assessor checks the queue.');
  await page.getByRole('button', { name: 'Save encrypted evidence' }).click();
  await expect(page.getByText('Evidence encrypted and saved to the submission.')).toBeVisible();
  const detail = await page.request.get(`/api/submissions/${submissionId}?token=${assessorToken}`);
  expect(detail.status()).toBe(200);
  expect(detail.headers()['cache-control']).toBe('private, no-store');
  expect(detail.headers()['strict-transport-security']).toBe('max-age=31536000; includeSubDomains');

  await page.goto(assessorLink);
  await page.getByRole('button', { name: /Active River/ }).click();
  await expect(page.getByText('Scoring unlocks after submission')).toBeVisible();
  await expect(page.getByRole('button', { name: /Save assessment/ })).toHaveCount(0);

  await page.goto(candidateLink);
  await page.getByLabel(/Work log/).fill('SENSITIVE-CACHE-SENTINEL: I can continue documenting decisions after the assessor checks the queue and then hand over the complete record.');
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: /Submit evidence/ }).click();
  await expect(page.getByRole('heading', { name: 'Your work has been submitted.' })).toBeVisible();

  await page.goto(assessorLink);
  await page.getByRole('button', { name: /Active River/ }).click();
  await expect(page.getByRole('button', { name: /Save assessment/ })).toBeVisible();
});

test('keyboard error recovery and the 390px shell preserve focus and viewport width', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe('main');

  if (page.viewportSize()?.width === 390) {
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  }

  await page.goto('/create');
  await page.getByLabel(/Exam title/).fill('Focus recovery');
  await page.getByLabel(/Task brief/).fill('Too short');
  await page.getByRole('button', { name: /Create exam/ }).click();
  await expect(page.locator('#form-error')).toBeFocused();
});

test('candidate drafts remain available while offline', async ({ page, context }) => {
  await page.goto('/create');
  await page.getByLabel(/Exam title/).fill('Offline evidence exercise');
  await page.getByLabel(/Task brief/).fill('Write a concise explanation of your approach, save a local draft when disconnected, and reconnect only when you are ready to submit evidence.');
  await page.getByRole('button', { name: /Create exam/ }).click();
  const candidateLink = await page.getByLabel('Candidate capability link').inputValue();

  await page.goto(candidateLink);
  await page.getByLabel(/Candidate name or alias/).fill('Offline River');
  await page.getByRole('button', { name: /Start .* task/ }).click();
  await context.setOffline(true);
  try {
    await expect(page.getByText('Offline — keep working; your typed draft is saved on this device.')).toBeVisible();
    await page.getByLabel(/Work log/).fill('This local draft must remain available while the connection is unavailable.');
    await expect.poll(() => page.evaluate(() => Object.keys(localStorage).some((key) => key.startsWith('hpe:draft:')))).toBe(true);
  } finally {
    await context.setOffline(false);
  }
});
