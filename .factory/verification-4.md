# Verification 4 — Run practical exams without surveillance

Verified: 2026-09-05

Live URL: <https://humane-practical-exams.sociobot.in>

Implementation candidate: `56a8ff0a6d6b8d925e90eaab75d9e0a15f0a88fe`

Documentation candidate: `5e8b7a2ef516b553b00dfe97234d73827036c78f`

Live revision: `sf-humane-practical-exams--0000013`

## Verdict

**PASS — 0 findings. 0 untested public claims.**

The product performs the stated job: instructors and training providers can run timed, open-book practical exams using candidate-chosen evidence and a clear rubric, without surveillance tools. The live health response reports the documentation SHA. `git diff 56a8ff0..5e8b7a2` changes only `.factory/handoff.md`, so the deployed product tree is the implementation candidate.

The Sociobot checkout endpoint deliberately returns HTTP 404 because this product is not enabled in that catalog. This is expected external state for this verification, not a product defect: the page presents an honest unavailable notice, exposes no purchase action, and the `checkout-unavailable` claim proves no checkout request is made.

## First screen and sample

Fresh Chromium contexts at 1440×1000 and 390×844 opened the landing page before scrolling. Both showed:

- Job: **Run practical exams without surveillance**.
- Audience: instructors and training providers who need assessable technical work.
- First action: **Try it with sample data**; it opens a completed assessment and does not change real exam data.

The action opened `/demo` directly. The realistic **Repair a failing inventory API** assessment included Riley's work log, chosen commands, a named artifact, SHA-256 checkpoints, rubric scores, feedback, and a decision. The persistent label read **Demo — sample data, nothing is saved**. Changing feedback, selecting **Reset demo**, downloading `sample-assessment.json`, and choosing **Start for real** all worked. Browser traffic made no exam API writes, sent no request off the product origin, and a fresh sample context had no cookies. Desktop and phone had no console errors, page errors, failed requests, or horizontal overflow.

Evidence: `/work/.evidence/verify-4-live/browser-summary.json`, `desktop-landing.png`, `desktop-demo.png`, `phone-landing.png`, `phone-demo.png`, and `demo-privacy.json`.

## Clean checkout and claims

A fresh no-local clone at documentation candidate `5e8b7a2` was used. `npm ci` installed the documented dependencies (148 packages; 0 reported vulnerabilities). These commands passed:

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

Results were 0 Svelte diagnostics; 3 Vitest tests, 14 Rust tests, and the Dockerfile contract passing; a 104.76 KB raw / 37.61 KB gzip JavaScript bundle and 29.32 KB raw / 6.89 KB gzip CSS bundle; runtime startup with only `PORT`; 22/22 browser tests; and 26/26 combined claim tests.

Every command declared by the 26 entries in `.factory/claims.json` was also run individually from that clean clone. All 26 selected exactly one test and passed. The individual log is `/work/.evidence/verify-4-local/individual-claim-commands.txt`; combined and browser logs are `claims-combined.txt` and `e2e.txt` in the same directory. There are no missing registry entries, duplicate tags, false claims, or untested public claims found in the landing page, legal pages, README, or product UI.

The tests exercise normal, invalid, boundary, and recovery paths: invalid form/evidence recovery; capability separation; premature-scoring rejection; artifact replacement and the 15 MB limit; offline candidate drafts; scheduled and early deletion; encrypted storage and token hashes; runtime key persistence; interrupted schema/key recovery; and explicit candidate, assessor, export, deletion, and license states. This is a web service, not a CLI, library, desktop app, or PWA; consumer-install, service-worker update, and offline-reload checks do not apply.

## Live backend, routes, privacy, and accessibility

- `/health` returned HTTP 200 and build `5e8b7a2ef516b553b00dfe97234d73827036c78f`.
- A controlled live allowance probe using one forwarded client address returned 300 HTTP 404 API misses followed by 5 HTTP 429 responses. Every 429 sent `Retry-After: 42`. A second forwarded client address immediately received its own HTTP 404 allowance.
- The local Rust regression also covers forwarded-client separation, `Retry-After`, `/data`-safe SQLite startup, schema repair, generated-key persistence, and expiration-before-read behavior. `npm run test:runtime` passed the zero-environment restart/key-reuse contract.
- `/`, `/demo`, `/create`, `/privacy`, `/terms`, `/sitemap.xml`, and `/robots.txt` returned 200. The designed unknown-page view returned an HTML 404; the unknown API route returned JSON 404. Each tested route had its own expected title, one h1, and one main landmark.
- The live product sends CSP, HSTS, permissions policy, referrer policy, nosniff, and appropriate cache headers. Sample use used no cookies, analytics, remote fonts, scripts, webcam, microphone, screen capture, browser lock, biometrics, or model request.
- Playwright Axe checks on the landing, demo, create, privacy, terms, and designed 404 route found zero serious or critical violations. `verify-url.sh` passed with title, `lang=en`, one h1, main landmark, image alt text, labeled buttons, and zero console errors. The standalone Axe CLI could not create a session with this worker's ChromeDriver/Playwright Chromium combination; the working Playwright Axe integration is the explicitly allowed equivalent.
- Keyboard checks passed: Skip to main content was first, Enter moved focus to `main`, and the visible focus treatment remained present. Reduced-motion mode produced the reduced animation value. The mobile layout measured 390 CSS pixels wide with 390 pixels of scroll width.
- The public-link scan found no broken user path. Its only HTTP 404 entry was the `#main` skip anchor on the already designed 404 page itself; it remains an in-page keyboard link, not a dead destination.
- Live Lighthouse scored Performance 100, Accessibility 100, Best Practices 100, and SEO 100; LCP was 1.1 s, TBT 0 ms, CLS 0, and transfer size 61 KiB.

Evidence: `/work/.evidence/verify-4-live/verify-url/verify.json`, `axe-routes.json`, `link-crawl.json`, `lighthouse-summary.json`, and the captured rate-response summary in this verification run.

## Earlier findings

| Finding | Current disposition | Verification evidence |
|---|---|---|
| HPE-01 premature assessment | Fixed | Candidate submission is required before scoring; Rust and browser tests pass. |
| HPE-02 provider checkout | Expected external 404, not a product finding | No broken checkout action is shown; checkout-unavailable claim passes. |
| HPE-03 sensitive API caching | Fixed | Tokenized API responses use private no-store headers; regression passes. |
| HPE-04 Docker build identity | Fixed | Dockerfile contract passes in `npm test`. |
| HPE-05 mobile overflow | Fixed | Live phone width and scroll width are both 390. |
| HPE-06 focus and targets | Fixed | Skip focus and error recovery pass; live Axe has no serious or critical issue. |
| HPE-07 whitespace-only evidence | Fixed | Rust regression rejects it. |
| HPE-08 HSTS | Fixed | Live HTTPS sends one-year HSTS including subdomains. |
| HPE-09 expiry race | Fixed | Expired records purge before a read; regression passes. |
| HPE-10 static headers/cache | Fixed | Live shell, assets, and API misses carry the expected policies. |
| HPE-11 theme contrast | Fixed | Browser regression and live Axe pass. |
| HPE-12 demo sandbox | Fixed | Fresh desktop and phone sample verification passed with no API writes. |
| HPE-13 claim registry | Fixed | 26/26 combined and 26/26 individual commands passed. |
| HPE-14 first-screen language | Fixed | Job, audience, result, first action, and three facts appear before scrolling. |
| HPE-15 metadata/routes/404 | Fixed | Route titles, sitemap, HTML 404, and JSON API 404 pass. |
| HPE-16 forwarded rate limit | Fixed | Live 300/5 allowance and `Retry-After`; separate forwarded client allowed. |

## Scope

No product code was modified during this verification. There are no product findings or untested claims. The only future operational action is enabling the Sociobot catalog product before offering new provider-tool purchases; that change is outside this repository and is intentionally not represented as a working purchase flow.
