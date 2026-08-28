# Independent product verification 2 — FAIL

Verified: 2026-08-28 05:23 UTC

Work order: `humane-practical-exams-verify-2`

Candidate: `39b4af9a43ba6d62a5a6653d397f95b07f93f81e`

Live URL: <https://humane-practical-exams.sociobot.in>

Acceptance contract: `.factory/brief.json`, `AGENTS.md`, and the supplied backend, accessibility, performance, design, and paid-unlock requirements

## Verdict

**FAIL. Do not promote this candidate.**

The candidate is deployed exactly and the free create-to-assess workflow works on desktop and 390 px mobile. Three major defects nevertheless violate the deletion-date privacy promise, browser response-policy contract, and advertised paid flow. One minor transient contrast defect also remains.

## Defects

### Major — HPE-09: expired evidence remains visible in the assessor list until the hourly sweep

`GET /api/exams/<exam>/submissions?token=<assessor>` selects every submission for the exam and calls `load_submission` without checking `delete_at`. Individual submission routes call `authorize_submission`, which enforces expiry, but the list route does not. The background deletion task runs only once per hour.

Fresh reproduction against the exact local release build:

1. Create an exam and start a submission with alias `EXPIRED-LIST-SENTINEL`.
2. Advance that row past its deletion boundary by setting `delete_at` to `2000-01-01T00:00:00Z` in the isolated QA database while the process remains running.
3. Request the assessor submissions list.
4. The server returns HTTP 200 and decrypts the expired record:

```json
{"submissions":[{"alias":"EXPIRED-LIST-SENTINEL","delete_at":"2000-01-01T00:00:00Z","status":"in_progress",...}]}
```

5. Requesting the individual submission then returns 404 and deletes it; the next list is empty.

An assessor can therefore view expired aliases, work logs, command histories, checkpoint metadata, artifact metadata, and assessments for up to about one hour after the promised deletion time. Every route that reads submissions must enforce the deletion boundary, or expired rows must be filtered and purged transactionally before list output.

### Major — HPE-10: static pages and assets bypass all security and cache policies

The live HTML response contains none of `Content-Security-Policy`, `Strict-Transport-Security`, `Referrer-Policy`, `Permissions-Policy`, `X-Content-Type-Options`, or `Cache-Control`. Hashed JS, CSS, and WebP responses also lack `Cache-Control`, so the promised one-year immutable policy is not applied.

Fresh live evidence for `/`:

```text
HTTP/2 200
content-type: text/html
accept-ranges: bytes
last-modified: Fri, 28 Aug 2026 04:41:42 GMT
content-length: 696
vary: accept-encoding
```

Fresh live evidence for `/assets/index-BuHf9JV9.js` likewise contains no security or cache headers. In contrast, an `/api/` 404 correctly returns CSP, HSTS, no-referrer, permissions denial, nosniff, and `Cache-Control: private, no-store`.

The router applies `security_headers` to `protected_app(state)` before adding the static fallback, so fallback responses never traverse that middleware. This removes clickjacking/CSP protection from the actual UI, omits HSTS and referrer policy on a user's first page response, and defeats immutable caching for hashed assets.

### Major — HPE-02 remains: the advertised provider unlock cannot be purchased

The live product prominently advertises a `$39 once` provider unlock, but the required checkout endpoint remains unavailable:

```text
GET https://api.sociobot.in/api/v1/products/humane-practical-exams/checkout
HTTP/2 404
{"error":"enabled factory product","status":404}
```

Invalid-license verification itself works: it returns HTTP 200 with `{"valid":false,"reason":"invalid","expires_at":null}`, `Cache-Control: no-store`, and the correct CORS origin. Browser testing confirmed that an incoming license is stored, stripped from the URL, verified only with `api.sociobot.in`, and produces the inactive-license notice on `/create`. A new customer still cannot complete the advertised purchase.

### Minor — HPE-11: primary buttons temporarily fail contrast during the light-theme transition

Switching from dark to light changes button text to white immediately while `.button` continues animating its background. Fresh computed samples for the “Buy provider unlock” button were:

| Time after switch | Foreground | Background | Contrast |
|---:|---|---|---:|
| 0 ms | `#fff` | `rgb(109,231,197)` | 1.51:1 |
| 20 ms | `#fff` | `rgb(82,203,173)` | 2.00:1 |
| 40 ms | `#fff` | `rgb(23,140,119)` | 4.16:1 |
| settled | `#fff` | `#087c69` | 5.13:1 |

An Axe run during the transition reported serious `color-contrast` findings on the provider-buy and final create buttons (one captured intermediate ratio was 3.12:1). All 13 settled-state Axe scans had zero serious/critical findings. Reduced-motion mode reduces the transition to `0.01ms`.

## Passing evidence

### Clean checkout, install, checks, and exact build

The worktree began clean at the exact candidate; `HEAD` and `origin/main` both resolved to `39b4af9a43ba6d62a5a6653d397f95b07f93f81e`.

- `npm ci` — pass; 148 packages installed and npm reported 0 vulnerabilities.
- `npm test` — pass; 2/2 Vitest tests, 6/6 Rust tests, and the Dockerfile contract.
- `npm run check` — pass; 0 Svelte errors and 0 warnings.
- `cargo fmt --check` — pass.
- `cargo clippy --all-targets --locked -- -D warnings` — pass.
- `npm run build` — pass; production output created in `dist/`.
- `BUILD_SHA=39b4af9a43ba6d62a5a6653d397f95b07f93f81e cargo build --release --locked` — pass.
- `npm run test:runtime` — pass; service launched with only `PORT` and created a mode-`0600` key.
- A separate `env -i` launch with no variables listened on default port 8080, served the shell, and reported the candidate SHA.
- `npm run test:e2e` — pass; 12/12 Playwright tests across desktop Chromium and 390×844 mobile.

Docker, Podman, and Buildah are unavailable in this verifier image, so a local container build could not be repeated. The multi-stage source builds, static Dockerfile contract, no-environment executable startup, and live candidate-identity check passed.

### Independent backend and persistence exercise

Against the exact release executable and a fresh temporary SQLite database:

- `/health` returned the candidate SHA.
- Exact limits of 10/1,440 minutes, 1/365 deletion days, 1/20 criteria, and score 1/20 were accepted as applicable.
- Blank title, 39-character brief, duration 9/1,441, deletion 0/366, zero criteria, score 0/21, 81-character alias, 30,001-character evidence, blank checkpoint label, 4,001-character checkpoint content, empty evidence submission, whitespace-only work log submission, invalid role token, premature assessment, and out-of-range rubric score were rejected.
- A 15 MiB artifact uploaded and downloaded byte-for-byte; 15 MiB + 1 byte was rejected.
- Evidence remained editable after a blocked premature assessment, then became immutable only after candidate submission.
- Scoring, JSON export, candidate-denied deletion, assessor deletion, and post-delete 404 passed.
- The generated key was mode `0600`; startup after restart logged `key_source=persisted`; encrypted evidence remained readable. The plaintext persistence sentinel was absent from the SQLite file.
- A record already expired at startup was purged immediately and returned 404.
- 100 concurrent health reads returned 200; 50 concurrent exam writes returned 200. A fresh local rate window returned 299 successes and six 429 responses for 305 concurrent requests, and the 429 responses retained security headers.

HPE-09 above is the exception: a record that expires between hourly sweeps remains exposed through the assessor list.

### Live identity and artifact match

- `/health` returned HTTP 200 and `{"build":"39b4af9a43ba6d62a5a6653d397f95b07f93f81e","status":"ok"}`.
- Live `index.html`, JS, CSS, and both WebP files matched local `dist/` byte-for-byte by SHA-256.
- Key hashes included `bfcd912c...` for `index.html`, `9aff4adc...` for JS, and `668e41a7...` for CSS.
- 100 concurrent live health requests all returned 200 in 0.471 seconds.
- Plain HTTP redirects to HTTPS with 301. The certificate is valid from 2026-08-28 through 2027-02-28.

### Live end-to-end workflow

Chromium 145 was exercised at 1440×1000 desktop and 390×844 mobile. A fresh live run passed:

1. invalid 39-character brief, announced error, focus recovery, then valid exam creation at the 10-minute/1-day lower boundaries with explicit accommodations;
2. separate one-time candidate and assessor links and assessor empty state;
3. mobile candidate start, invalid-checkpoint recovery, offline local-draft recovery, reconnect, work log, selected command history, SHA-256 checkpoint, and artifact upload;
4. assessor view of an active submission with scoring locked and a direct premature-assessment request rejected;
5. submit-confirmation cancel and confirm paths;
6. invalid-score recovery, rubric assessment and feedback;
7. valid portable JSON export and byte-identical artifact download;
8. delete-confirmation cancel and confirmed permanent deletion.

Successful runs deleted their submissions. One synthetic `Mobile River` submission from an earlier interrupted harness lost its one-time assessor capability before cleanup; it contains no real personal data and is configured for automatic deletion within one day (by approximately 2026-08-29 05:17 UTC).

### Accessibility, responsive behavior, privacy, and browser health

- Thirteen settled-state Axe scans across dark/light landing, create, privacy, terms, candidate workbench/receipt, and assessor empty/in-progress/submitted/assessed states had 0 serious or critical findings.
- The theme-transition exception is HPE-11 above.
- Keyboard first focus is the visible skip link; Enter transfers focus to `main`. Invalid create input moves focus to the alert. Focus uses a visible 3 px outline.
- Required mobile states measured `clientWidth=390` and `scrollWidth=390`; sampled visible interactive controls met the 44×44 px target.
- Reduced-motion emulation changed the hero animation duration to `0.00001s`.
- Explicit static-route smoke recorded 0 console errors, 0 uncaught page errors, and 0 failed requests.
- Normal product browsing requested only `https://humane-practical-exams.sociobot.in`; license handling additionally contacted only `https://api.sociobot.in`. No analytics, trackers, third-party scripts, or remote fonts were observed.
- `/privacy` and `/terms` render with one h1 each. Semantic checks found `lang=en`, a title, one main landmark, one h1, and alt text on the sole image.

### Performance and budgets

Fresh Lighthouse mobile against the live candidate:

- Performance 100, Accessibility 100, Best Practices 100, SEO 100.
- FCP 1.1 s, LCP 1.1 s, TBT 70 ms, CLS 0, Speed Index 1.1 s, interactive 1.3 s.
- Total transferred size: 58 KiB. Lighthouse did not produce a field/lab INP value for the non-interactive navigation trace.

Production assets:

- JavaScript: 96,736 bytes raw / 35.37 KiB gzip (budget 200 KB).
- CSS: 25,809 bytes raw / 6.32 KiB gzip (budget 50 KB).
- Hero WebP: 15,940-byte mobile and 38,292-byte large variants (budget 300 KB).
- No webfont payload.

Payload budgets pass. The required immutable caching behavior does not; see HPE-10.

## Scope notes

- This is not a library or CLI, so consumer pack/install testing is not applicable.
- This is not a PWA and ships no manifest or service worker, so service-worker update and offline-reload testing are not applicable. The explicit local-draft offline/reconnect path was tested.
- No product source was modified during verification.

## Required next steps

1. Filter/purge expired submissions in `list_submissions` before any decryption or response, and add a regression that advances a record past `delete_at` while the service remains running.
2. Apply security and caching middleware outside the static fallback so HTML and assets receive the intended CSP, HSTS, referrer, permissions, nosniff, and cache policies; verify live headers for `/` and a hashed asset.
3. Enable/register the live Sociobot checkout product and verify a hosted-checkout redirect before advertising the buy action.
4. Avoid transitioning a primary button between incompatible foreground/background token pairs, then run Axe during and after both theme directions.
