# Review 1 — Run humane practical exams without surveillance

Reviewed: 2026-09-05

Live URL: <https://humane-practical-exams.sociobot.in>

Implementation candidate: `2d8b16f0ad229c3ffec1d994c344eb49de791ae7` (`fix: close second verification blockers`)

Documentation HEAD: `e976e4c2d1e3644e535d33cc2a2ac044f366b634` (`docs: record third independent verification`)

The documentation commits after `2d8b16f` do not change product code. Live `/health` reports `6505282a0a339c52cf5b13d3ac754ac81d056dd7`, a documentation-only commit whose product tree is the same candidate.

## Verdict

**FAIL — 6 findings, including 22 untested public claim groups. Do not promote.**

The core free workflow and earlier implementation repairs remain healthy, but the mandatory sample sandbox, claims evidence, plain-language first screen, route structure, and two backend-rate-limit requirements are still absent. The provider purchase also remains unavailable.

## Findings

### Major — HPE-02: required one-time provider unlock is still not purchasable

The brief specifies one-time monetization and the paid-unlock contract requires a visible link to the Sociobot checkout. The live price card says `$39 once` but gives no purchase action; it says new purchases are temporarily unavailable. Direct verification of the required endpoint returned:

```text
GET https://api.sociobot.in/api/v1/products/humane-practical-exams/checkout
HTTP 404
{"error":"enabled factory product","status":404}
```

The fallback is honest and does not break the free product, but it does not meet the required paid-unlock contract. Enable the catalog product, verify a hosted checkout redirect, then restore the buy link.

### Major — HPE-12: no one-click demo or isolated sample exists

The landing page has no “Try it with sample data” action. Its only first action is `Create an exam`, which creates real server state. A fresh phone browser opening `/demo` rendered the not-found page (`This evidence trail ends here.`), with no sample output, persistent `Demo — sample data, nothing is saved` label, reset control, or start-for-real control. The repository also has neither `.factory/demo.md` nor sample/demo storage code.

This makes the requested no-real-data sample check impossible and fails the demo-sandbox contract.

### Major — HPE-13: claims registry and claim tests are absent

`.factory/claims.json` does not exist, so there are no declared claim commands to run. There are no `@claim:` test tags. At least these 22 visitor-reliant claim groups appear on the landing page, legal pages, or README without the required tested registry entry: self-hosting; encryption at rest; scheduled deletion; candidate-selected evidence; rubric visibility; portable export; separate role links; one artifact; selected command excerpts; SHA-256 checkpoints; no webcam; no browser lockdown; no biometrics; no AI-cheating score; not cheat-proof; free core workflow; provider templates; provider branding; rubric presets; purchase availability; refund handling; and no analytics/tracking.

The clean suite passing does not prove these public claims. Add one sandboxed observable test per claim and registry entry, or remove claims that cannot be tested.

### Major — HPE-14: first screen does not state the job, audience, and sample action in plain words

Fresh desktop and 390 px phone browsers both start with `See the work. Respect the person.` and the eyebrow `Open book. Clear evidence. No surveillance.` These are slogans, not a plain job headline. The screen never names instructors or training providers, and offers `Create an exam` rather than the required sample action. Other landing headings such as `Competence leaves useful traces.`, `A deliberate boundary`, and `Ready when the task is` are mood/metaphor headings prohibited by the plain-words contract.

`.factory/copy-audit.md` is also missing. Rewrite the first screen around the job, audience, and sample action; remove the slogan/mood copy; then add the required sentence audit and terminology table.

### Major — HPE-15: required route titles, metadata, sitemap, and HTTP 404 behavior are missing

The browser title remains `Humane Practical Exams — evidence, not surveillance` on `/`, `/create`, `/privacy`, `/terms`, `/demo`, and an unknown route. The HTML contains no canonical link, Open Graph metadata, Twitter card, favicon, or route-specific title. `dist/` contains only `index.html` and `robots.txt` at its top level; there is no sitemap. `GET /sitemap.xml`, `/staticwebapp.config.json`, `/not-a-real-page`, and an unknown `/api/...` path all return HTTP 200 with the landing SPA shell. The client-rendered not-found view is visually usable, but it is not a real HTTP 404.

Provide the required metadata and per-route title updates, a sitemap, and a designed page returned with HTTP 404. API misses must return an API 404 rather than the HTML shell.

### Major — HPE-16: backend rate limiting lacks `Retry-After` and ignores forwarded client IP

The mandatory rate-limit contract requires the first `X-Forwarded-For` hop as the client key and `429` with `Retry-After`. `src/main.rs` keys the window solely from `ConnectInfo<SocketAddr>` and has no forwarded-header parsing. It has no `Retry-After` header anywhere. A live sequential probe received 72 HTTP 429 responses; a sampled response had the expected error body and security/cache headers, but no `Retry-After` header.

Key the limit from the first trusted `X-Forwarded-For` address (with a safe fallback), emit a valid `Retry-After`, and add an integration regression covering both.

## Live browser and accessibility evidence

- Opened the live landing page in separate fresh Chromium desktop (1440×1000) and phone (390×844) contexts before scrolling. Both had no console errors, page errors, or failed requests; ordinary browsing contacted only the product origin. Both had no horizontal overflow.
- The live landing, `/demo`, `/privacy`, `/terms`, and not-found views each had one `main`; all had zero serious or critical Axe violations through the Playwright Axe integration. Keyboard Tab reached the skip link and Enter moved focus to `main`. Reduced-motion emulation produced a `0.00001s` hero animation duration.
- `/opt/fleet/lib/verify-url.sh` passed after the rate-test window reset: title/lang, one h1, main, alt text, button labels, screenshots, and zero console errors. The standalone `npx @axe-core/cli` could not run in this worker because its bundled ChromeDriver supports Chrome 152 while the preinstalled Playwright Chromium is Chrome 145; the Playwright Axe result above is the executed equivalent.
- Privacy and terms pages render and describe deletion, local drafts, and license tokens. No PWA/service worker is shipped, so service-worker update/offline-reload is not a promised feature. The candidate’s explicit local offline-draft behavior is covered by the passing Playwright suite.

## Earlier findings and current disposition

| Finding | Current disposition | Evidence |
|---|---|---|
| HPE-01 active work could be assessed | Fixed | Candidate test `candidate_must_submit_before_assessment...` and the passing E2E role-flow test cover rejection before submission. |
| HPE-02 provider purchase | Still open | Finding above; checkout remains HTTP 404. |
| HPE-03 sensitive API caching | Fixed | Candidate applies `private, no-store`; live 429 and API response headers include it. |
| HPE-04 Docker build SHA default | Fixed | `npm test` includes the Dockerfile contract and passed. |
| HPE-05 390 px overflow | Fixed | Fresh live phone viewport measured 390/390. |
| HPE-06 focus and target gaps | Fixed | Fresh skip-link keyboard check passed; live Axe has no serious/critical issue. |
| HPE-07 whitespace-only evidence | Fixed | Candidate regression remains in the Rust suite. |
| HPE-08 HSTS | Fixed | Live response includes `Strict-Transport-Security: max-age=31536000; includeSubDomains`. |
| HPE-09 expiry race | Fixed | Candidate regression `assessor_list_purges_records_that_expire_while_service_is_running` remains in the Rust suite. |
| HPE-10 static security/cache headers | Fixed | Live HTML and static responses include CSP, HSTS, referrer, permissions, nosniff, and cache policy headers. |
| HPE-11 theme-transition contrast | Fixed | Candidate E2E checks theme transitions and live Playwright Axe scan found no serious/critical issue. |

## Clean checkout and runtime evidence

The review began with a clean worktree at documentation HEAD. Documented Node and Rust prerequisites were installed with `npm ci` (148 packages, 0 vulnerabilities). The following declared quality commands passed from that checkout:

- `npm run check` — 0 Svelte errors/warnings.
- `npm test` — 3 Vitest tests, 8 Rust tests, and Dockerfile contract passed.
- `npm run build` — produced `dist/`; 96,897-byte JS (35,295 bytes gzip) and 25,955-byte CSS (6,355 bytes gzip).
- `npm run test:runtime` — passed with the service launched under the runtime contract.
- `npm run test:e2e` — 14/14 desktop and mobile Playwright tests passed.
- `cargo fmt --check` and `cargo clippy --all-targets --locked -- -D warnings` — passed.

There were no declared claim commands because the required registry is missing; this is HPE-13, not a passing claim result. Local test coverage exercises normal, invalid, recovery, offline-draft, boundary, persistence, encryption, and deletion paths against isolated local SQLite state. No live assessment data was created during this review because the mandatory isolated demo is absent.

## Required next steps

1. Add `/demo` with realistic isolated sample data, a persistent sample label, reset/start-for-real controls, documentation, and tests proving it never reads or writes real data.
2. Add `.factory/claims.json` and one tagged demo test for every public claim; remove untestable copy.
3. Rewrite the landing page and add `.factory/copy-audit.md` to meet the plain-words first-screen contract.
4. Complete site metadata/routing/404/sitemap requirements.
5. Repair rate-limit identity and `Retry-After` behavior.
6. Enable the Sociobot billing product, prove checkout, and restore the required purchase action.
