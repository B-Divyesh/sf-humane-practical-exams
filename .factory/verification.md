# Independent product verification — FAIL

Verified: 2026-08-28 04:03 UTC

Work order: `humane-practical-exams-verify-1`

Candidate: `e8127cc6ea7813b549fea40149f2e062d1f463ce`

Live URL: <https://humane-practical-exams.sociobot.in>

Acceptance contract: `.factory/brief.json`, `AGENTS.md`, and the injected backend, accessibility, performance, design, and paid-unlock requirements

## Verdict

**FAIL. Do not promote this candidate.**

The free create-to-assess workflow is functional and the live deployment is byte-for-byte consistent with the candidate frontend, but four major defects violate workflow integrity, paid-feature availability, privacy-by-default response policy, and the mandatory container build contract.

## Defects

### Major — HPE-01: an assessor can finalize an in-progress submission and lock out its candidate

The assessor queue exposes `in_progress` submissions and enables the assessment form. The backend does not require `submitted` status in `save_assessment`.

Fresh reproduction against the live deployment:

1. Create an exam and start a candidate submission without submitting it.
2. POST a valid score to `/api/submissions/<id>/assessment` using the assessor capability.
3. The server returns `200` with `assessed_at`.
4. The candidate then receives `400 {"error":"Submitted evidence can no longer be changed."}` from both `/evidence` and `/submit`.

This lets an assessor accidentally or deliberately terminate a candidate's active exam before the candidate chooses to submit. It breaks the brief's candidate-controlled evidence flow and the normal job-to-be-done. The same behavior was reproduced locally and live; the live QA submission was deleted afterward.

### Major — HPE-02: the advertised $39 provider unlock cannot be purchased

The live "Buy provider unlock" link targets the required Sociobot route, but the product is not enabled there:

```text
GET https://api.sociobot.in/api/v1/products/humane-practical-exams/checkout
HTTP/2 404
{"error":"enabled factory product","status":404}
```

Invalid-license verification itself works and returns `{"valid":false,"reason":"invalid"}` with `Cache-Control: no-store`. The app also stores an incoming license token, strips it from the URL, calls the verifier, and shows "License no longer active." However, a new customer cannot buy the marketed one-time unlock.

### Major — HPE-03: decrypted candidate evidence responses lack a private/no-store cache policy

A fresh live submission containing `SENSITIVE-CACHE-SENTINEL` was fetched through the assessor capability. The GET returned the decrypted sentinel with none of `Cache-Control`, `Pragma`, or `Expires` present:

```text
GET /api/submissions/<id>?token=<assessor capability>
HTTP 200
content-type: application/json
cache-control: <absent>
pragma: <absent>
expires: <absent>
```

Submission detail, artifact, and export routes carry sensitive decrypted assessment data in tokenized GET responses. They need an explicit `Cache-Control: no-store` policy (and should be reviewed for `private`) so browser and intermediary caches do not retain evidence by default. The QA submission was deleted after this check.

### Major — HPE-04: Dockerfile violates the mandatory build-identity default contract

The required contract says `ARG BUILD_SHA=dev` must have a default and local Docker builds must not fail when it is empty. The candidate instead declares `ARG BUILD_SHA` and immediately requires a 40-character lowercase SHA:

```dockerfile
ARG BUILD_SHA
RUN test "${#BUILD_SHA}" -eq 40 && ...
```

Therefore `docker build .` without the factory build argument deterministically fails. Docker was unavailable in this verifier image, but the failure follows directly from the shell predicate. The exact web and locked Rust release stages did pass when `BUILD_SHA=e8127cc6...` was supplied.

### Minor — HPE-05: the 390 px landing page has horizontal overflow

At the required 390 px viewport, `documentElement.clientWidth` was `390` while `scrollWidth` was `469`. The 460 px decorative `.hero::before` glow extends beyond the viewport. Core content remains visible, but the page can pan sideways and does not meet the responsive-layout requirement. `/create` measured 390/390 without overflow.

### Minor — HPE-06: keyboard focus and touch-target gaps

- The visible skip link is first in the Tab order and Enter changes the URL to `#main`, but focus falls back to `BODY`; `<main>` is not focused.
- Invalid create-form input renders a `role="alert"`, but the attempted focus call happens before the conditional error exists. Focus remains on the submit button instead of `#form-error`.
- At 390 px, the icon-only home link measured 34×44 px and the Terms footer link 41×44 px, below the 44×44 target baseline.

Focus rings are otherwise visible (`3px` accent outline), keyboard navigation has no trap, and the error is announced through its live alert role.

### Minor — HPE-07: direct API clients can submit whitespace-only evidence

The UI blocks this, but the backend accepts a one-character whitespace work log. Because submission validation tests encrypted byte length rather than trimmed plaintext, `/submit` then returns `200` with no artifact or meaningful work log. Server-side validation should enforce the same meaningful-evidence rule as the UI.

### Minor — HPE-08: HSTS is absent

Plain HTTP correctly redirects to HTTPS with `301`, TLS is valid through 2027-02-28, and CSP/referrer/permissions/nosniff policies are present. The HTTPS responses do not include `Strict-Transport-Security`.

## Fresh verification evidence

### Clean checkout, install, checks, and production build

The worktree started clean at the exact candidate and `origin/main` resolved to the same SHA.

- `npm ci` — pass; 148 packages installed, npm audit reported 0 vulnerabilities.
- `npm run check` — pass; 0 Svelte errors and 0 warnings.
- `cargo fmt --check` — pass.
- `cargo clippy --all-targets --locked -- -D warnings` — pass.
- `npm test` — pass; 2/2 Vitest tests and 4/4 Rust tests.
- `npm run build` — pass; `dist/index.html` produced.
- `BUILD_SHA=e8127cc6ea7813b549fea40149f2e062d1f463ce cargo build --release --locked` — pass.
- `npm run test:runtime` — pass with a process launched using only `PORT`.
- A separate `env -i` launch with no variables bound the documented default port 8080 and served `/` and `/health`.
- `npm run test:e2e` — pass; 8/8 repository Playwright checks across desktop Chromium and 390×844 mobile.

No product code was changed.

### Independent local backend exercise

Using the release executable and a fresh temporary data directory:

- `/health` returned the candidate SHA.
- Create validation accepted exact minimums (10 minutes, 1 day, score 1) and maximums (1,440 minutes, 365 days, score 20).
- Blank title, 39-character brief, out-of-range duration/deletion/score, zero criteria, 81-character alias, oversized evidence/checkpoint, empty artifact, invalid role token, and incomplete assessment were rejected.
- A 15 MiB artifact uploaded, decrypted, and downloaded byte-for-byte; 15 MiB + 1 byte was rejected.
- Submitted evidence became immutable; rubric scoring, JSON export, role-limited deletion, and post-delete 404 worked.
- The generated encryption key was mode `0600`, restarted as `key_source=persisted`, and encrypted evidence remained readable after restart. Plaintext sentinel strings were absent from the SQLite file.
- A forced-expired temporary submission was purged immediately at startup and then returned 404.
- 100 concurrent local health requests all returned 200; 50 concurrent exam writes all returned 200. Rate limiting returned 429 after the remaining allowance in the 300-request window was consumed.

### Live identity and deployment match

- `/health` returned HTTP 200 and `{"build":"e8127cc6ea7813b549fea40149f2e062d1f463ce","status":"ok"}`.
- Live `index.html` SHA-256 matched local `dist/index.html`: `58b109fe114ab4d4eaf9982ad20e9727655b0b61a32fde66662f2be902b01a54`.
- Live JS, CSS, and both hero WebP assets matched local production files byte-for-byte by SHA-256.
- 100 concurrent live `/health` requests all returned 200 in 5.361 seconds.

### Live end-to-end product exercise

A fresh live exam used the lower time/deletion boundaries and explicit accessibility accommodations. The following path passed:

1. invalid 39-character brief and recovery;
2. exam creation and separate one-time candidate/assessor capability links;
3. assessor empty state;
4. candidate start, visible timebox, invalid-checkpoint recovery, local offline draft, reconnect, work log, chosen command history, checkpoint, and artifact upload;
5. submit confirmation cancel and confirm paths;
6. assessor evidence review, invalid-score recovery, rubric decision and feedback;
7. JSON export validation and artifact byte-for-byte download;
8. delete confirmation cancel and confirmed permanent deletion.

The live QA submission was deleted. Test exam configuration remains subject to its one-day retention policy because no exam-deletion endpoint exists.

### Accessibility, mobile, browser, privacy, and response policies

- Chromium 145 desktop (1440×1000) and mobile (390×844) were exercised.
- Axe serious/critical: 0 on 12 states — dark landing, settled light landing, create, privacy, terms, assessor empty/detail, candidate pre-start/workbench/receipt, and 390 px landing/create.
- Console errors: 0. Uncaught page errors: 0.
- Reduced-motion emulation reduced the hero animation duration to `0.01ms`.
- Normal free workflow requested only `https://humane-practical-exams.sociobot.in`; there were no analytics, third-party fonts, or tracking requests. License restoration made only the documented request to `https://api.sociobot.in`.
- `Referrer-Policy: no-referrer`, restrictive CSP, camera/microphone/geolocation/browsing-topics denial, `X-Content-Type-Options: nosniff`, and year-long immutable cache policy on hashed assets were present.
- `/privacy` and `/terms` rendered correctly with one h1 each.

### Performance and budgets

Fresh Lighthouse mobile against the live candidate:

- Performance 99, Accessibility 100, Best Practices 100, SEO 100.
- FCP 1.3 s, LCP 1.3 s, TBT 120 ms, CLS 0; lab INP was not available because no interaction trace was collected.
- Total transferred size reported by Lighthouse: 58 KiB.

Production assets:

- JS: 96,060 bytes raw / 35,928 bytes compressed (budget 200 KB).
- CSS: 25,726 bytes raw / 6,517 bytes compressed (budget 50 KB).
- Hero WebP: 15,940-byte mobile and 38,292-byte large variants (budget 300 KB).
- No webfont payload.

Hashed assets return `Cache-Control: public, max-age=31536000, immutable`; HTML returns `public, max-age=300`.

## Scope notes

- This is not a library or CLI, so consumer pack/install testing is not applicable.
- This is not a PWA and ships no manifest or service worker, so service-worker update/offline-reload testing is not applicable. Its explicit local-draft offline state was tested.
- Docker/container execution was not available in this verifier container. Both production build stages and the no-environment runtime contract were exercised directly, and the live image reports the candidate identity.

## Required next steps

1. Reject assessment writes unless the submission status is `submitted` (or already `assessed` for an intentional edit), and hide/disable grading controls for active submissions. Add an end-to-end regression proving the candidate can keep working until submission.
2. Register/enable the live Sociobot product and verify a hosted checkout redirect before presenting the buy action.
3. Add explicit no-store/private response policy to every capability-bearing dynamic response, especially decrypted submission detail, artifacts, and exports.
4. Restore the mandatory Docker build default (`ARG BUILD_SHA=dev`) without rejecting an omitted/default identity.
5. Fix 390 px overflow, skip-link focus transfer, async error focus, small touch targets, and trimmed server-side evidence validation.
6. Add HSTS at the application or ingress layer, then rerun this verification suite.
