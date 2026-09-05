# Review 2 — Run practical exams without surveillance

Reviewed: 2026-09-05

Live URL: <https://humane-practical-exams.sociobot.in>

Implementation candidate: `56a8ff0a6d6b8d925e90eaab75d9e0a15f0a88fe`

Deployed documentation SHA: `5e8b7a2ef516b553b00dfe97234d73827036c78f`

Review baseline SHA: `f49023b34716326143bbb239a7dc161b1a88acd0`

## Verdict

**PASS — 0 findings and 0 untested public claims.**

The live product completes the stated job. Instructors and training providers can create a timed practical exam, give separate capability links to candidates and assessors, collect candidate-chosen evidence, score a visible rubric, export the assessment, and delete submissions without surveillance tools.

The expected Sociobot checkout response is HTTP 404. The product clearly says that new provider-tool purchases are unavailable and presents no purchase action. The free workflow and existing-license controls remain usable. This deliberate external catalog state is not a product defect.

## First screen and sample

Fresh Chromium contexts opened the live landing page at 1440×1000 and 390×844 before scrolling. Both showed all required information inside the viewport:

- Job: **Run practical exams without surveillance**.
- Audience: instructors and training providers who need assessable technical work.
- First action: **Try it with sample data**.
- Result: the sample opens a completed assessment and does not change real exam data.
- Facts: no webcam or browser lock, offline browser drafts, and the unavailable $39 provider purchase state.

The action opened `/demo` in one click. The populated **Repair a failing inventory API** sample showed candidate Riley, a 90-minute task, accommodations, a work log, two chosen commands, an 842 KB artifact, two full checkpoint hashes, three rubric scores, feedback, and an assessment decision.

The **Demo — sample data, nothing is saved** label stayed visible after scrolling on desktop and phone. Changing the decision and feedback, selecting **Reset demo**, downloading `sample-assessment.json`, and selecting **Start for real** all worked. Reset restored the original values. The JSON contained the sample flag, task, alias, evidence, scores, feedback, and decision.

Two planted real-data markers remained unchanged throughout the sample and after leaving it. The sample made no exam API writes, contacted only the product origin, set no cookies, and made no media, credential, fullscreen, pointer-lock, model, or beacon call. There were no console errors, page errors, failed requests, or horizontal overflow.

Evidence: `/work/.evidence/review-2-live/browser-summary.json` and the desktop/phone landing and demo screenshots in the same directory.

## Clean checkout and quality checks

A fresh remote clone at `f49023b34716326143bbb239a7dc161b1a88acd0` was used. `npm ci` installed 148 packages with 0 reported vulnerabilities. The documented Node 22 and current stable Rust prerequisites were present.

All required commands passed:

```sh
npm run check
npm test
npm run build
cargo fmt --check
cargo clippy --all-targets --locked -- -D warnings
npm run test:runtime
npm run test:e2e
npm run test:claims
```

Results:

- Svelte reported 0 errors and 0 warnings.
- 3 Vitest tests and 14 Rust tests passed; the Dockerfile contract passed.
- The production build created `dist/` with 104.76 KB raw / 37.61 KB gzip JavaScript and 29.32 KB raw / 6.89 KB gzip CSS.
- The runtime test started with only `PORT`, generated a mode-0600 key, restarted, and reused it.
- Playwright passed 22/22 desktop and 390×844 browser tests.
- The combined claim run passed 26/26 tests.

The browser suite covers the normal create → candidate evidence → submission → assessor score → JSON export path. It also covers invalid form recovery, wrong capabilities, premature assessment, post-submit immutability, whitespace-only evidence, exact artifact boundaries, offline drafts, ended timeboxes, scheduled and early deletion, theme changes, keyboard focus, mobile width, and 200% text.

Evidence: `/work/.evidence/review-2-local/`.

## Declared claims

The claims registry contains 26 unique IDs. Each ID appears in exactly one `@claim:<id>` test. The combined suite passed, and every declared focused command was run separately from the clean clone. Each focused command selected one test and passed.

| Claim ID | Result |
|---|---|
| `demo-sandbox` | Pass |
| `separate-role-links` | Pass |
| `rubric-visible` | Pass |
| `candidate-handoff` | Pass |
| `written-work-log` | Pass |
| `chosen-commands` | Pass |
| `sha256-checkpoints` | Pass |
| `one-artifact` | Pass |
| `portable-json` | Pass |
| `encrypted-at-rest` | Pass |
| `token-hashes` | Pass |
| `scheduled-deletion` | Pass |
| `nonblocking-timer` | Pass |
| `offline-drafts` | Pass |
| `no-webcam` | Pass |
| `no-browser-lock` | Pass |
| `no-biometrics` | Pass |
| `no-ai-score` | Pass |
| `no-tracking` | Pass |
| `free-core` | Pass |
| `provider-template` | Pass |
| `provider-branding` | Pass |
| `license-restore` | Pass |
| `license-revocation` | Pass |
| `zero-config-runtime` | Pass |
| `checkout-unavailable` | Pass |

Landing, workspace, legal, README, and operational copy were compared with the registry and supporting quality tests. No missing, false, incomplete, duplicated, or untested public claim was found.

Evidence: `/work/.evidence/review-2-local/claim-registry-audit.json`, `claims-combined.txt`, and `individual-claim-commands.txt`.

## Live routes, accessibility, privacy, and performance

- `/`, `/demo`, `/create`, `/privacy`, `/terms`, `/sitemap.xml`, and `/robots.txt` returned 200.
- An unknown page returned the designed HTML 404 with a return-home action. An unknown API route returned a JSON 404.
- Each page route had its required distinct title, one h1, one main landmark, and the expected canonical URL.
- The public-link crawl found no broken links or missing in-page targets.
- Playwright Axe found 0 serious or critical violations on the landing, demo, create, privacy, terms, and 404 routes.
- `verify-url.sh` passed title, `lang=en`, h1, main, image alt, button-label, and console checks.
- Keyboard checks passed: the skip link was first, Enter focused `main`, and the focused landmark had a visible 3 px ring.
- Reduced-motion mode reported the reduced animation duration. The demo stayed usable at 200% text with no horizontal overflow at 390 px.
- Live traffic during the sample stayed on the product origin. No analytics, remote font, remote script, cookie, or invasive browser request was observed.
- CSP, HSTS, permissions policy, referrer policy, nosniff, private API caching, and immutable hashed-asset caching were present where expected.
- Lighthouse mobile scored Performance 100, Accessibility 100, Best Practices 100, and SEO 100. FCP and LCP were 1.08 s, TBT was 4 ms, CLS was 0, and transferred bytes were 63,124.

The Lighthouse CLI was not a project dependency, so version 13.4.1 was installed transiently for the measurement. The first installed run needed the preinstalled Playwright Chromium path and shared-memory flags; the completed measured run passed.

Evidence: `/work/.evidence/review-2-live/verify-url/verify.json`, `link-crawl.json`, `lighthouse-summary.json`, and `browser-summary.json`.

## Backend and deployment identity

- Live `/health` returned HTTP 200 with build `5e8b7a2ef516b553b00dfe97234d73827036c78f`.
- A fresh forwarded client received 300 allowed JSON API 404 responses followed by 5 HTTP 429 responses. A sampled 429 included `Retry-After: 50`, private no-store caching, and HSTS.
- A second forwarded client immediately received its independent 404 allowance.
- A separate local process test created two exams. Cross-exam and invalid tokens returned 403. Encrypted submission evidence remained readable after stopping and restarting the service with the same SQLite directory and generated key. Assessor deletion then returned 200 and later access returned 404.
- Rust tests also passed interrupted schema repair, safe empty-key recovery, durable SQLite reopening, expiration-before-read, forwarded-client limits, and security/cache middleware.
- Rebuilding the frontend with the deployed documentation SHA produced byte-identical live `index.html`, JavaScript, and CSS.
- `git diff 56a8ff0..5e8b7a2` changes only `.factory/handoff.md`. The later `f49023b` commit changes only verification reports. The live product therefore matches implementation candidate `56a8ff0`.

Evidence: `/work/.evidence/review-2-local/backend-persistence-isolation.json` and `/work/.evidence/review-2-live/health.json`, rate-response files, and `artifact-sha256.txt`.

## Earlier findings

| Finding | Current disposition | Fresh evidence |
|---|---|---|
| HPE-01 premature assessment | Fixed | Premature scoring returns 400; candidate evidence remains writable until submission. |
| HPE-02 provider checkout | Expected external 404, not a product finding | The page states purchases are unavailable, shows no checkout action, and the focused claim passes. |
| HPE-03 sensitive API caching | Fixed | Tokenized API responses use `private, no-store`; regression tests pass. |
| HPE-04 Docker build identity | Fixed | Dockerfile contract passes and `ARG BUILD_SHA=dev` is present. |
| HPE-05 mobile overflow | Fixed | Fresh 390 px landing and demo views both measured 390 px scroll width. |
| HPE-06 focus and targets | Fixed | Skip focus, error recovery, 44 px targets, Axe, and 200% text checks pass. |
| HPE-07 whitespace-only evidence | Fixed | Rust regression rejects submission without meaningful work or an artifact. |
| HPE-08 HSTS | Fixed | Live HTTPS sends one-year HSTS with subdomains. |
| HPE-09 expiry race | Fixed | Expired submissions are purged before reads; physical-deletion regression passes. |
| HPE-10 static headers and cache policy | Fixed | Live and local shell, asset, API, and 404 policies pass. |
| HPE-11 theme-transition contrast | Fixed | Light/dark Axe checks pass and primary colors do not transition through invalid pairs. |
| HPE-12 demo sandbox | Fixed | Fresh desktop and phone sample flows passed without API writes or marker changes. |
| HPE-13 claim registry | Fixed | 26 combined and 26 individual claim commands passed; 0 untested claims. |
| HPE-14 first-screen language | Fixed | Job, audience, first action, result, and three facts were visible before scrolling. |
| HPE-15 metadata, routes, and 404 | Fixed | Titles, canonicals, sitemap, legal routes, link crawl, HTML 404, and JSON API 404 pass. |
| HPE-16 forwarded rate limit | Fixed | Live 300/5 allowance, `Retry-After`, and separate-client check pass. |

## Scope

No product code was modified. This is a web service, not a CLI, library, desktop app, or PWA, so consumer-install and service-worker update checks do not apply. The narrower offline-draft claim passed in its own browser context.

The only future operational step is enabling the Sociobot catalog entry before offering new provider-tool purchases. Until then, the current unavailable state is accurate and tested.
