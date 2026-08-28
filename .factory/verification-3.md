# Independent product verification 3 — FAIL

Verified: 2026-08-28 06:21–06:44 UTC

Work order: `humane-practical-exams-verify-3`

Candidate: `6505282a0a339c52cf5b13d3ac754ac81d056dd7`

Live URL: <https://humane-practical-exams.sociobot.in>

Acceptance contract: `.factory/brief.json`, `AGENTS.md`, and the supplied backend, accessibility, performance, design, and paid-unlock requirements

## Verdict

**FAIL — do not promote.**

The previous deployment failure is not present: the live service is healthy, reports the exact candidate SHA, and serves assets that match the clean local production build byte-for-byte. The free practical-exam workflow passes end to end. Release remains blocked because the specified one-time provider purchase cannot be completed.

## Defect

### Major — HPE-02 persists: the required one-time provider unlock is not purchasable

The acceptance contract specifies one-time monetization and explicitly requires a buy link to the Sociobot checkout. The product advertises “Provider unlock — $39 once” and its benefits, but renders no checkout link or button. It instead says “New provider unlock purchases are temporarily unavailable.” Existing-license restoration remains available.

Fresh direct evidence:

```text
GET https://api.sociobot.in/api/v1/products/humane-practical-exams/checkout
HTTP/2 404
{"error":"enabled factory product","status":404}
```

This is an honest and non-breaking fallback, and the complete free assessment workflow remains useful. It does not satisfy the paid-unlock acceptance contract. The factory must register/enable this product, confirm the endpoint redirects to hosted checkout, and restore the buy action before promotion.

## Clean checkout, install, checks, and production build

The worktree began clean. `HEAD` and `origin/main` both resolved to the requested candidate.

- `npm ci` — pass; 148 packages installed, 0 vulnerabilities.
- `npm run check` — pass; 0 Svelte errors and 0 warnings.
- `npm test` — pass; 3/3 Vitest tests, 8/8 Rust tests, and the Dockerfile contract.
- `cargo fmt --check` — pass.
- `cargo clippy --all-targets --locked -- -D warnings` — pass.
- `npm run build` — pass; production output generated in `dist/`.
- `BUILD_SHA=6505282a0a339c52cf5b13d3ac754ac81d056dd7 cargo build --release --locked` — pass.
- `npm run test:runtime` — pass; production frontend rebuilt, backend built locked, and the service started with only `PORT`.
- `npm run test:e2e` — pass; 14/14 Playwright tests across desktop Chromium and a 390×844 mobile profile.

Docker, Podman, and Buildah are not installed in the verifier image, so a local container build was not available. The exact frontend and release backend builds passed, the Dockerfile source contract passed, an `env -i` release launch passed, and the deployed candidate identity/artifact comparison passed.

Production output:

| Asset | Raw | Gzip | Budget |
|---|---:|---:|---:|
| JavaScript | 96,897 B | 35,295 B | ≤ 200 KB |
| CSS | 25,955 B | 6,355 B | ≤ 50 KB |
| Mobile hero WebP | 15,940 B | — | ≤ 300 KB |
| Large hero WebP | 38,292 B | — | — |
| Fonts | 0 B | — | ≤ 120 KB |

## Independent backend and persistence exercise

A separate harness exercised the release executable against a fresh SQLite database and passed 91 assertions:

- Accepted the 10/1,440-minute duration boundaries, 1/365-day deletion boundaries, 1/20 criterion-count boundaries, and 1/20 maximum-score boundaries.
- Rejected a blank title, 39-character brief, durations 9 and 1,441, deletion periods 0 and 366, zero and 21 criteria, maximum scores 0 and 21, an 81-character alias, 30,001-character evidence, blank checkpoint labels, and 4,001-character checkpoint content.
- Rejected invalid capabilities, candidate use of assessor actions, assessor use of candidate actions, premature assessment, whitespace-only evidence submission, post-submit mutation, and an out-of-range rubric score.
- Accepted a 30,000-character work log and 4,000-character checkpoint. A 15 MiB artifact uploaded and downloaded byte-for-byte; 15 MiB + 1 byte was rejected.
- Completed create → start → save evidence → checkpoint → artifact → submit → assess → list/detail → JSON export → download → assessor deletion. Export status, checkpoint count, and sanitized artifact name were correct; deleted records returned 404.
- Fifty concurrent exam writes succeeded. A fresh 305-request rate-window test returned exactly 300 HTTP 200 responses and five HTTP 429 responses; the 429 retained the security policy headers.
- The plaintext persistence sentinel was absent from the SQLite file, while the same encrypted record was readable after process restart with the same key.
- A separate `env -i` launch with no variables used port 8080, generated a 65-byte mode-`0600` key, returned the exact candidate SHA, shut down gracefully, and reported `key_source=persisted` after restart.
- Repository tests independently cover deletion of a record that expires while the process is running and the static/security-header regression.

## Live deployment and build identity

- `/health` returned HTTP 200 with `{"build":"6505282a0a339c52cf5b13d3ac754ac81d056dd7","status":"ok"}`.
- Live `index.html`, hashed JS, hashed CSS, and both responsive WebP files matched local `dist/` byte-for-byte. Key SHA-256 values were `120fa4d…` (HTML), `0f6ba8a…` (JS), and `fa266a00…` (CSS).
- Plain HTTP redirected to HTTPS with HTTP 301. The certificate covers the product hostname and is valid 2026-08-28 through 2027-02-28.
- 100 concurrent live `/health` requests all returned HTTP 200 in 5.474 seconds.

## Live end-to-end product exercise

Chromium exercised the live service at 1440×1000 desktop and 390×844 mobile:

1. A too-short brief produced an announced error and moved focus to it; corrected input then created a 10-minute exam with a one-day deletion period and explicit accessibility accommodations.
2. The assessor link initially showed the designed empty state.
3. The candidate entered a chosen alias, recovered from an invalid empty checkpoint, saved a work log and selected command history, sealed a SHA-256 checkpoint, and uploaded an artifact.
4. Both cancel and confirm paths of the submission confirmation worked.
5. The assessor read the selected evidence, recovered from an invalid score, saved a rubric decision and feedback, exported valid JSON, and downloaded an artifact byte-for-byte identical to the upload.
6. Both cancel and confirm paths of permanent deletion worked; the successful run left no submission behind.

The automated run had zero console errors, uncaught page errors, or unexpected failed requests. Several earlier harness-development attempts created three synthetic `QA River` records before terminating; they contain only synthetic QA content and are configured for automatic deletion on 2026-08-29. Their one-time assessor capabilities were not retained.

## Accessibility, responsive behavior, and visual review

- Live Axe scans found zero serious or critical issues on dark and light landing states, exam-created state, assessor empty state, mobile candidate workbench, mobile receipt, assessed submission, privacy, terms, and not-found pages.
- Semantic checks found `lang="en"`, a nonempty title, exactly one `h1`, one `main`, and no images missing `alt` text.
- Keyboard-only smoke: first Tab exposed and focused “Skip to main content”; Enter transferred focus to `main`; the validation alert received focus; no trap was observed. The focused skip link had a visible outline.
- At 390 px, tested pages had `clientWidth=390` and `scrollWidth=390`; all sampled visible links, buttons, inputs, textareas, selects, and the file-drop target were at least 44×44 CSS px.
- Reduced-motion emulation changed the hero animation duration to `0.00001s`; no looping motion remained.
- Desktop assessor-empty and mobile candidate-receipt screenshots were visually reviewed. Hierarchy, contrast, responsive stacking, and content legibility were intact.
- `/privacy`, `/terms`, and the not-found view each rendered one h1/main with no serious/critical Axe findings, console errors, page errors, or mobile overflow.

## Privacy, outbound requests, response policy, and caching

- Ordinary live browsing contacted only `humane-practical-exams.sociobot.in`. Invalid-license testing contacted only the product origin and `api.sociobot.in`; the query token was removed from the page URL, persisted under `sb_license:humane-practical-exams`, and reconciled to the “license no longer active” state.
- No analytics, advertising, remote fonts, third-party scripts, webcam, microphone, geolocation, or monitoring request was observed. Static source inspection found only the documented Sociobot verifier and repository source link as external production URLs.
- `/` and hashed assets returned CSP, one-year HSTS with subdomains, `no-referrer`, camera/microphone/geolocation/browsing-topics denial, and `nosniff`.
- HTML returned `Cache-Control: public, max-age=300`; hashed JS/CSS returned `public, max-age=31536000, immutable`. `If-Modified-Since` on JS returned 304 with those policies. Brotli negotiation returned `Content-Encoding: br`.
- A tokenized `/api/` 404 returned `Cache-Control: private, no-store`, `Pragma: no-cache`, `Expires: 0`, and the same security headers.
- Invalid license verification returned HTTP 200, `Cache-Control: no-store`, the exact product-origin CORS allowance, and `{ "valid": false, "reason": "invalid" }`.

## Performance

Fresh Lighthouse 13 mobile results against the live candidate:

- Performance 100, Accessibility 100, Best Practices 100, SEO 100.
- FCP 1.2 s, LCP 1.2 s, TBT 90 ms, CLS 0, Speed Index 1.2 s, interactive 1.4 s.
- Total transferred bytes: 60,177.
- Lighthouse did not produce a lab INP value for the navigation-only trace. TBT and observed browser interaction remained within the supplied responsiveness budget.

`verify-url.sh` also passed in 691 ms with the expected title, `lang=en`, one h1/main, no missing image alt text, no unlabeled buttons, and zero console errors.

## Scope notes

- This web service is not a library or CLI, so pack/install consumer testing is not applicable.
- It is not a PWA and ships no manifest or service worker, so service-worker update and offline-reload testing are not applicable. The intended local-draft offline/reconnect behavior passed in the repository Playwright suite.
- No product source was modified during verification.

## Required release action

Register and enable `humane-practical-exams` in the Sociobot billing catalog, verify that the required checkout URL redirects to hosted checkout, and expose the buy action. Re-run this verification after that external dependency is live.
