# Humane Practical Exams — build handoff

Build date: 2026-08-28

Work order: `humane-practical-exams-build-1`

Artifact: single-container Rust/SQLite service with a Vite/Svelte frontend

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
SUBMISSION_ENCRYPTION_KEY='at-least-32-random-characters-here' APP_ENV=production cargo run --release
```

Container deployment:

```sh
docker build --build-arg BUILD_SHA="$(git rev-parse HEAD)" -t humane-practical-exams .
docker run --rm -p 8080:8080 \
  -e SUBMISSION_ENCRYPTION_KEY='at-least-32-random-characters-here' \
  -v humane-exam-data:/app/data \
  humane-practical-exams
```

Production startup fails closed if `SUBMISSION_ENCRYPTION_KEY` is absent or shorter than 32 characters. Persist `/app/data` and back up the encryption key separately. The service runs as an unprivileged `app` user on `PORT=8080`.

## Verification performed

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

- The worker image does not include Docker/Podman, so the Dockerfile could not be executed here. The exact two build stages (`npm run build` and `cargo build --release --locked`) were run successfully on the host; factory CI should still run `docker build` before deployment.
- The Sociobot product must be registered by the factory before a live checkout/verification can succeed. No product ID is hardcoded; the required slug URL is used. Live payment was not attempted.
- Capability URLs provide deliberate passwordless access. An assessor should distribute candidate links through an appropriate channel and store the assessor link like a password. For a future multi-tenant version, add organization accounts and per-candidate capability tokens.
- SQLite is appropriate for the intended single-tenant/self-hosted v1. A high-write shared deployment should move the same data model to PostgreSQL and a managed encrypted object store.
- Backups, key escrow/rotation, TLS termination, and deletion-policy governance are deployment-operator responsibilities. Key rotation currently requires a data migration.

## Product success check

The exported record includes task/rubric context, selected artifact metadata, written evidence, timestamps, checkpoint hashes, and the assessor decision. A pilot should measure what share of submissions can be graded from that record alone; the target remains 90%, with fewer than 10% needing an evidence-focused follow-up.
