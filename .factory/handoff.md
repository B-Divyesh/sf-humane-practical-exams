# Humane Practical Exams — build handoff

## Repair 3 — verifier blockers resolved in product code

Repair date: 2026-08-28

Work order: `humane-practical-exams-repair-3`

Source report: `.factory/verification-2.md` at `4b82d8a7785fe90bf4a7579572578b5e87d57e90`

Candidate repaired: `39b4af9a43ba6d62a5a6653d397f95b07f93f81e`

### Repairs

- **HPE-09:** the assessor list now deletes records at or past `delete_at`, selects only unexpired IDs, and rechecks expiry inside `load_submission` before checkpoint, assessment, alias, work-log, command-history, or artifact-name decryption. A record that crosses the boundary between the list query and load is purged and omitted. The regression advances a live-process row to `2000-01-01`, requests the queue, asserts an empty response, and verifies physical deletion.
- **HPE-10:** security middleware now wraps the router only after the static directory and SPA fallback are attached. Exact integration coverage requests `/` and a hashed-style asset, checking CSP, HSTS, referrer policy, permissions policy, nosniff, five-minute HTML caching, and one-year immutable asset caching. Local release responses include every expected header.
- **HPE-02:** the external Sociobot catalog still returns 404 for this slug and repository policy forbids changing billing infrastructure. The product no longer exposes a checkout link that cannot complete; it clearly says new purchases are temporarily unavailable. Incoming-license capture, URL cleanup, daily verification, paste-to-restore, and already-unlocked provider features remain intact. Restore and legal copy now state the same availability. Re-enable the buy action only after the factory registers the product and a hosted checkout redirect is observed.
- **HPE-11:** primary-button backgrounds no longer transition between theme token pairs. Transform and border feedback remain. Browser regression runs Axe immediately after dark-to-light and light-to-dark switches and confirms the background is not a transitioned property.

### Fresh local evidence

- `npm ci` — pass; 148 packages installed, 0 vulnerabilities.
- `npm run check` — pass; 0 Svelte errors and 0 warnings.
- `npm test` — pass; 3 Vitest tests, 8 Rust tests, and Dockerfile contract.
- `cargo fmt --check` — pass.
- `cargo clippy --all-targets --locked -- -D warnings` — pass.
- `npm run build` — pass; `dist/index.html` plus 96,897-byte JS (35,295-byte gzip) and 25,955-byte CSS (6,355-byte gzip).
- `BUILD_SHA=repair-qa cargo build --release --locked` — pass.
- `npm run test:runtime` — pass with only `PORT` supplied; the generated key remains mode `0600`.
- `npm run test:e2e` — 14/14 pass across desktop Chromium and 390×844 mobile. Coverage includes full create-to-assess, active-submission protection, keyboard focus recovery, no 390 px overflow, offline drafts, console smoke, no broken checkout action, and transition-time Axe scans in both theme directions.
- `/opt/fleet/lib/verify-url.sh http://127.0.0.1:18082` — pass in 588 ms: title, `lang=en`, one h1, main landmark, alt text, labeled buttons, and zero console errors. Desktop and mobile screenshots were visually reviewed.
- Local Lighthouse mobile — Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 1.1 s, LCP 1.4 s, TBT 60 ms, CLS 0, total 62 KiB.
- Local release response policy — `/` returned CSP, HSTS, no-referrer, permissions denial, nosniff, and `Cache-Control: public, max-age=300`; the built JS returned the same security policy plus `Cache-Control: public, max-age=31536000, immutable`.

### Deployment and live evidence

- Repair commit `2d8b16f0ad229c3ffec1d994c344eb49de791ae7` was pushed to `origin/main` and built by Azure Container Registry run `chdq` in 4m58s as `sociobotregistry.azurecr.io/sf-humane-practical-exams:2d8b16f0ad22`.
- Container Apps revision `sf-humane-practical-exams--0000005` reports `Healthy`/`Running`; app provisioning is `Succeeded`.
- `https://humane-practical-exams.sociobot.in/health` returned HTTP 200 with `{"build":"2d8b16f0ad229c3ffec1d994c344eb49de791ae7","status":"ok"}`.
- Live `/` and hashed JS returned the exact security/cache policies listed above. A routed tokenized API 404 returned `Cache-Control: private, no-store`, `Pragma: no-cache`, `Expires: 0`, and the same security headers.
- Live `index.html`, JS, and CSS SHA-256 hashes exactly matched local `dist/`: `120fa4d…`, `0f6ba8a…`, and `fa266a00…` respectively.
- Live desktop 1440×1000 and mobile 390×844 checks found zero console/page errors, one h1/main/title/lang/alt baseline intact, first Tab on the skip link with Enter focus transfer to `main`, viewport widths 1440/1440 and 390/390, no checkout link, and zero serious/critical Axe findings immediately after both theme directions. Normal browsing requested only the product origin.
- Live Lighthouse mobile — Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 1.1 s, LCP 1.1 s, TBT 0 ms, CLS 0, total 59 KiB. All 100 concurrent live `/health` requests returned 200.
- The external Sociobot checkout still returns `404 {"error":"enabled factory product","status":404}`. This is no longer a broken user action: the live product shows the truthful unavailable state and retains license restoration. Factory billing registration remains the sole operator step before re-enabling purchase.

Package/consumer testing is not applicable to this web service. It is not a PWA, so service-worker update/offline-reload testing is not applicable; the intentional local-draft offline/reconnect flow is covered. The artifact and deployment class remain a single Rust/SQLite container serving the Svelte build on `PORT` 8080.

## Independent verification 2 result — FAIL

Verification date: 2026-08-28

Candidate: `39b4af9a43ba6d62a5a6653d397f95b07f93f81e`

Live URL: <https://humane-practical-exams.sociobot.in>

Report: `.factory/verification-2.md`

**FAIL — do not promote.** Fresh verification confirms that `/health` reports the exact candidate and all local quality gates plus the live create-to-assess workflow pass. Release remains blocked by three major defects: the assessor submissions list decrypts expired records until the hourly cleanup runs (HPE-09); static HTML/assets bypass CSP, HSTS, referrer, permissions, nosniff, and cache headers (HPE-10); and the advertised Sociobot checkout still returns 404 (HPE-02). A minor light-theme transition contrast failure also remains (HPE-11). See `.factory/verification-2.md` for exact reproduction evidence, passing checks, hashes, Lighthouse results, and required fixes.

## Repair 2 verification result

Verification date: 2026-08-28

Candidate: `e8127cc6ea7813b549fea40149f2e062d1f463ce`

Live URL: <https://humane-practical-exams.sociobot.in>

Report: `.factory/verification.md`

The source repairs HPE-01, HPE-03, and HPE-04, plus HPE-05 through HPE-08. The free create-to-assess workflow remains intact and now keeps assessment candidate-controlled. HPE-02 is an external Sociobot billing-catalog dependency: on 2026-08-28, `GET https://api.sociobot.in/api/v1/products/humane-practical-exams/checkout` still returned `404 {"error":"enabled factory product"}` and the public catalog did not list the slug. This repository has the required Sociobot checkout/verification integration, but it cannot register a merchant product or touch billing. Do not promote the paid unlock until the factory enables that product and a hosted-checkout redirect is observed.

1. **HPE-01 fixed:** assessment writes now require `submitted` (or `assessed` for intentional edits). The assessor UI explains that scoring is locked for active work. Rust and Playwright coverage prove a direct premature assessment returns 400, the candidate can still save and submit, and scoring then unlocks.
2. **HPE-03 fixed:** every `/api/` response, including decrypted details, artifact/export downloads, and errors, now carries `Cache-Control: private, no-store`, `Pragma: no-cache`, and `Expires: 0`.
3. **HPE-04 fixed:** Docker declares `ARG BUILD_SHA=dev` and no longer validates/rejects omitted build identity. `tests/dockerfile-contract.sh` is included in `npm test`.
4. **HPE-05–08 fixed:** the hero glow is clipped to its visual region at 390 px; skip navigation moves focus to `main`; Svelte waits for the error alert before focusing it; home and footer controls are at least 44 px; whitespace-only work logs are rejected server-side; and the app emits one-year HSTS with subdomains.

Fresh repair evidence: `npm ci` (148 packages, 0 vulnerabilities), `npm run check` (0 Svelte diagnostics), `npm test` (2 Vitest + 6 Rust tests plus Docker contract), `cargo fmt --check`, `cargo clippy --all-targets --locked -- -D warnings`, `npm run build`, `BUILD_SHA=dev cargo build --release --locked`, `npm run test:runtime`, and `npm run test:e2e` (12/12 Playwright checks across desktop Chromium and 390×844 mobile) all pass. Browser regressions include Axe serious/critical checks, offline draft recovery, console smoke, candidate-controlled assessment, private response headers, keyboard focus recovery, and 390 px no-overflow verification.

Deployment verification, 2026-08-28:

- Factory container deployment built and deployed `sociobotregistry.azurecr.io/sf-humane-practical-exams:40c2e2b23059` from repair commit `40c2e2b230592365aa320c2ad9c0a5487e950793`.
- Live `https://humane-practical-exams.sociobot.in/health` returned HTTP 200 with `{"build":"40c2e2b230592365aa320c2ad9c0a5487e950793","status":"ok"}`.
- A live tokenized API error returned HTTP 404 with `Cache-Control: private, no-store`, `Pragma: no-cache`, `Expires: 0`, and `Strict-Transport-Security: max-age=31536000; includeSubDomains`, confirming the response-policy repair at the deployed edge.
- Live checkout remains the documented external blocker: HTTP 404 with `{"error":"enabled factory product","status":404}`.

Build date: 2026-08-28

Work order: `humane-practical-exams-build-1`, repaired by `humane-practical-exams-repair-1`

Artifact: single-container Rust/SQLite service with a Vite/Svelte frontend

## Repair: container startup and ingress

- Root cause reproduced from deployed revision `sf-humane-practical-exams--x8611dp`: the image set `APP_ENV=production`, while `src/main.rs` deliberately panicked when `SUBMISSION_ENCRYPTION_KEY` was missing. Azure supplied only `PORT=8080`, so the process exited before binding; Container Apps marked the revision `ActivationFailed`/`Unhealthy`, yielding the custom-domain `000`.
- The runtime now needs only `PORT` (default `8080`) and binds `0.0.0.0:$PORT`. `DATABASE_URL` and `STATIC_DIR` remain optional overrides with safe in-image working-directory defaults.
- Missing `SUBMISSION_ENCRYPTION_KEY` now causes a 32-byte CSPRNG secret to be created once in `data/submission-encryption-key`, mode `0600`, and reused on restart. A supplied value still overrides it. Startup logs only `key_source=generated|persisted|supplied`, never the secret.
- The runtime image no longer injects `APP_ENV`, `DATABASE_URL`, `STATIC_DIR`, or `PORT`. The Docker build requires a 40-character lowercase commit SHA and compiles it into `/health`.
- Focused coverage: Rust verifies generated-key persistence and permissions; `npm run test:runtime` launches the executable with `env -i PORT=18081` (no other app environment), verifies `/health`, `/`, the generated key, permissions, and startup log. Browser coverage now includes offline candidate-draft persistence.

Repair commit deployed: `f343e99779713cc264025782777cf0918ed6aa29` (`fix: start container with only port`).

## What was built

- A product landing page that clearly positions evidence-based practical assessment without claiming to be cheat-proof.
- An exam builder for task briefs, 10–1,440 minute timeboxes, 1–365 day deletion policies, accommodation/tool notes, and transparent scored rubric criteria.
- One-time candidate and assessor capability links. Only SHA-256 hashes of the link tokens are persisted, so lost assessor links cannot be recovered from the database.
- Candidate workspace with a non-blocking visible timer, local draft recovery, encrypted work logs and selected command excerpts, server-timestamped SHA-256 checkpoints, one replaceable artifact up to 15 MB, and a submission receipt.
- Assessor queue with empty state, evidence/artifact review, checkpoint fingerprints, criterion scoring, written feedback, explicit outcome, portable JSON export, artifact download, and confirmed early deletion.
- AES-256-GCM at-rest encryption with a fresh nonce for candidate aliases, logs, command excerpts, checkpoint source content, filenames, uploaded bytes, and assessor notes.
- Hourly expiry deletion, per-request expired-record checks, a 300 requests/minute/IP ceiling, 16 MB request ceiling, CSP/referrer/permissions/nosniff headers, Brotli/Gzip compression, and immutable asset caching.
- Optional $39 one-time provider unlock through the Sociobot billing contract: hosted buy link, query-token capture and URL cleanup, local license storage, daily verification cache, optimistic offline behavior, inactive-license handling, and paste-to-restore. Paid features are local templates and provider branding only; grading, export, deletion, and accommodations remain free.
- Privacy and terms routes, responsive light/dark treatments, keyboard focus states, reduced-motion behavior, and offline/error/loading/empty states.
- Original generated evidence-landscape hero in responsive 768/1200 WebP variants (16 KB / 38 KB). Prompt, review, model, date, and source are recorded in `.factory/design.md` and `assets/src/`.

## Run and deploy

Local production-style run:

```sh
npm ci
npm run build
cargo run --release
```

Container deployment:

```sh
docker build --build-arg BUILD_SHA="$(git rev-parse HEAD)" -t humane-practical-exams .
docker run --rm -e PORT=8080 -p 8080:8080 -v humane-exam-data:/app/data humane-practical-exams
```

The service runs as an unprivileged `app` user on `0.0.0.0:$PORT`. Persist `/app/data` and back it up with the SQLite database; the generated encryption-key file is needed to decrypt existing submissions.

## Verification performed

Repair verification, 2026-08-28:

- Exact clean builder command: `npm ci && npm run build && cargo build --release --locked` — pass. The same Vite/Rust stages also passed in Azure Container Registry build run `ch9w`, image digest `sha256:1bc260d65ab348e62d820a797a42b02f94f9ae0ed910b97dfbb77c280874058b`.
- `npm run check` — pass (0 Svelte errors/warnings); `npm test` — pass (2 frontend + 4 Rust tests); `cargo fmt --check` — pass; `npm run test:runtime` — pass.
- `npm run test:e2e` — pass: 8 Playwright tests across desktop Chromium and 390×844 mobile, including the full create/candidate/assessor/export flow, serious/critical Axe checks, console smoke, and offline local-draft recovery.
- Live deployment: `az containerapp update` deployed `sociobotregistry.azurecr.io/sf-humane-practical-exams:f343e9977971`; revision `sf-humane-practical-exams--0000001` is `Healthy`, externally exposed on ingress target port `8080`, with only `PORT` configured.
- Live identity and ingress: both `https://humane-practical-exams.sociobot.in/health` and the Azure FQDN returned HTTP 200 and `{"build":"f343e99779713cc264025782777cf0918ed6aa29","status":"ok"}`. Application logs recorded `key_source=generated` and `service listening` on port 8080.
- Live `verify-url.sh` pass: 631 ms load, no browser console errors, title present, `lang=en`, exactly one h1, main landmark, and no images missing alt. A live mobile keyboard check reached the visible “Skip to main content” link first; `/privacy` and `/terms` each rendered their matching h1 with no console errors.
- Privacy review: no analytics/tracking scripts or third-party fonts are loaded; the only external runtime endpoint is the documented Sociobot license verifier. Privacy and terms routes are live.
- Live Lighthouse mobile report: Performance 99, Accessibility 100, Best Practices 100, SEO 100; LCP 1.21 s, CLS 0, TBT 99 ms. A 100-request live `/health` smoke completed in 2.547 s with no failures.

### Original builder verification

- `npm run check`: pass; Svelte reports 0 errors and 0 warnings.
- `npm test`: pass; 2 frontend tests and 3 Rust tests, including encrypted-data round-trip, token authorization, and create/open API integration.
- `npm run build`: pass; output at `dist/index.html`.
- `cargo fmt --check`: pass.
- `cargo build --release --locked`: pass with Rust 1.98.0. The container pins Rust 1.88, compatible with the lockfile dependency MSRVs.
- `npm run test:e2e`: pass; 6 Playwright checks across Chromium desktop and a 390×844 Chromium mobile profile. The full create → candidate checkpoint/artifact → submit → assessor grade → JSON export flow passes in both.
- Axe via `@axe-core/playwright`: no serious or critical issues on the landing and exam-builder screens in desktop or mobile projects.
- Console smoke: no console errors on initial load and exam creation.
- Load smoke: 100 parallel `/health` requests completed in 0.456 seconds (~219 requests/second) on the local debug server.
- Bundle: 96.06 KB initial JS (35.14 KB gzip), 25.73 KB CSS (6.31 KB gzip), no webfonts, 38 KB largest hero image.
- Lighthouse mobile, headless Chromium against the production build: **Performance 100, Accessibility 100, Best Practices 100, SEO 100**; LCP 1.3 s, CLS 0, total blocking time 0 ms, max potential input delay 60 ms.
- Visual inspection completed for 1440 px desktop and 390 px mobile full-page renders.

## Known gaps and operator next steps

- Docker is not installed in the worker image, but Azure Container Registry build run `ch9w` successfully built and pushed the production Docker image used by the live revision.
- The Sociobot product must be registered by the factory before a live checkout/verification can succeed. No product ID is hardcoded; the required slug URL is used. Live payment was not attempted.
- Capability URLs provide deliberate passwordless access. An assessor should distribute candidate links through an appropriate channel and store the assessor link like a password. For a future multi-tenant version, add organization accounts and per-candidate capability tokens.
- SQLite is appropriate for the intended single-tenant/self-hosted v1. A high-write shared deployment should move the same data model to PostgreSQL and a managed encrypted object store.
- Backups, key escrow/rotation, TLS termination, and deletion-policy governance are deployment-operator responsibilities. Key rotation currently requires a data migration.

## Product success check

The exported record includes task/rubric context, selected artifact metadata, written evidence, timestamps, checkpoint hashes, and the assessor decision. A pilot should measure what share of submissions can be graded from that record alone; the target remains 90%, with fewer than 10% needing an evidence-focused follow-up.
