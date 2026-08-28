import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('landing and exam builder have no serious accessibility violations', async ({ page }) => {
  await page.goto('/');
  let results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact || ''))).toEqual([]);
  await page.goto('/create');
  results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact || ''))).toEqual([]);
});

test('instructor creates an exam and landing page has no console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('See the work.');
  await expect(page.locator('main')).toBeVisible();
  await expect(page.locator('img[alt]')).toHaveCount(1);
  await page.getByRole('link', { name: 'Create an exam', exact: true }).first().click();
  await page.getByLabel(/Exam title/).fill('Build a health endpoint');
  await page.getByLabel(/Task brief/).fill('Create a small HTTP service with a health endpoint, tests, and a concise explanation of your design choices.');
  await page.getByRole('button', { name: /Create exam/ }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Two links. Two clear roles.');
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
