# Humane Practical Exams — repair 4 handoff

Updated: 2026-09-05

Live URL: <https://humane-practical-exams.sociobot.in>

Implementation SHA: `56a8ff0a6d6b8d925e90eaab75d9e0a15f0a88fe`

Documentation SHA: the report-only commit containing this handoff. The final evidence report records its resolved SHA separately from the implementation.

## Outcome

The product-code findings in review 1 are repaired and deployed. The live free workflow, isolated sample, claim tests, route structure, request limits, durable SQLite startup, and earlier fixes pass.

One external dependency remains: the required Sociobot checkout endpoint still returns HTTP 404 because this product is not enabled in the billing catalog. Repository policy does not authorize billing-catalog changes. The product does not show a broken purchase link or imitate a paid flow. It names the unavailable state and keeps existing-license restore and revocation handling working. Do not call the paid purchase complete until the factory enables the product and the hosted checkout redirects successfully.

## Repairs completed

- Added `/demo` and the first-screen **Try it with sample data** action. The populated assessor sample stays in page memory, makes no exam API writes, leaves real-data markers unchanged, exports sample JSON, resets, and provides **Start for real**.
- Added `.factory/claims.json` with 26 unique public claims. Each claim has exactly one `@claim:<id>` browser test. All combined and individual claim commands pass.
- Rewrote the first screen around the job and audience: **Run practical exams without surveillance**, for instructors and training providers. Mood headings were replaced with task names. `.factory/copy-audit.md` records word counts and terminology.
- Added route-specific titles, descriptions, canonical URLs, Open Graph and Twitter metadata, product icons, a 1200×630 preview, `robots.txt`, `sitemap.xml`, and designed 404 responses. Unknown pages return HTML 404; unknown API routes return JSON 404.
- Rate limits now use the first valid `X-Forwarded-For` hop, fall back to the socket address, separate client allowances, and return 429 with `Retry-After`. Health remains exempt.
- Made SQLite startup safe on the fleet Azure Files mount by using the `unix-dotfile` VFS, a single connection, delete journaling, lock retries, and idempotent schema repair. Key creation is exclusive and empty-file recovery is allowed only before submissions exist.
- Strengthened outcome checks for display capture, identity/authorship disclaimers, revoked licenses, demo export parity, and encryption-key reuse after a zero-environment restart.

## Earlier finding disposition

| Finding | Disposition |
|---|---|
| HPE-01 premature assessment | Fixed; backend and browser tests reject scoring before candidate submission. |
| HPE-02 provider checkout | External dependency remains; endpoint is 404 and no broken buy action is shown. |
| HPE-03 sensitive API caching | Fixed; API responses use `private, no-store`, `Pragma: no-cache`, and `Expires: 0`. |
| HPE-04 Docker build identity | Fixed; `ARG BUILD_SHA=dev` works without Git metadata. |
| HPE-05 mobile overflow | Fixed; 390 px live pages have no horizontal overflow. |
| HPE-06 focus and targets | Fixed; skip focus, error focus, visible rings, and 44 px targets pass. |
| HPE-07 whitespace evidence | Fixed; the backend rejects whitespace-only submission without an artifact. |
| HPE-08 HSTS | Fixed; live HTTPS sends one-year HSTS with subdomains. |
| HPE-09 expiry race | Fixed; expired records are purged before assessor-list decryption. |
| HPE-10 static headers/cache | Fixed; middleware wraps routes and static fallback. |
| HPE-11 theme contrast | Fixed; primary backgrounds do not transition through low-contrast colors. |
| HPE-12 demo sandbox | Fixed and live-tested from fresh desktop and phone contexts. |
| HPE-13 claim registry | Fixed; 26/26 combined tests and every declared focused command pass. |
| HPE-14 first-screen language | Fixed; job, audience, first action, result, and three facts appear before scrolling. |
| HPE-15 metadata/routes/404 | Fixed; route titles, sitemap, metadata, HTML 404, and API 404 pass. |
| HPE-16 forwarded rate limit | Fixed; live probe returned 300×404 then 5×429 with `Retry-After`; another client received 404. |

## Clean verification

From the documented Node 22/current Rust setup:

```sh
npm ci
npm run check
npm test
npm run build
npm run test:runtime
npm run test:e2e
npm run test:claims
cargo fmt --check
cargo clippy --all-targets --locked -- -D warnings
```

Results:

- `npm ci`: 148 packages, 0 vulnerabilities.
- Svelte: 0 errors and 0 warnings.
- Unit/integration: 3 Vitest and 14 Rust tests passed; Dockerfile contract passed.
- Runtime: started with only `PORT`, generated a mode-0600 key, restarted, reused the same key, and reported `key_source=persisted`.
- Browser: 22/22 desktop and 390×844 Chromium tests passed.
- Claims: 26/26 combined tests passed. Every command in `.factory/claims.json` also passed separately.
- Production bundle: 104.76 KB JS raw / 37.61 KB gzip; 29.32 KB CSS raw / 6.89 KB gzip; no webfonts; hero variants remain below 39 KB.
- Local Lighthouse: Performance 100, Accessibility 100, Best Practices 100, SEO 100; LCP 1.2 s, TBT 0 ms, CLS 0, 64 KiB transferred.

## Deployment and live verification

- ACR run `ch23c` built `sociobotregistry.azurecr.io/sf-humane-practical-exams:56a8ff0a6d6b` successfully.
- Container Apps revision `sf-humane-practical-exams--0000013` is provisioned successfully.
- The existing `sf-humane-practical-exams-data` Azure Files share remains mounted at `/data`; min and max replicas are both 1.
- Startup logs report `database_vfs=unix-dotfile`, `schema_source=existing`, `key_source=persisted`, and port 8080. No secret value is logged.
- `/health` returns the exact implementation SHA.
- Fresh 1440×1000 and 390×844 browser contexts both passed the landing, demo, reset, JSON download, start-for-real, keyboard, reduced-motion, legal-route, and designed-404 checks.
- Live demo traffic stayed on the product origin, made zero exam API writes, and preserved the planted real-data marker.
- Live Axe checks found zero serious or critical issues. The expected console line for the deliberate HTTP 404 was classified as expected; there were no other console, page, or request failures.
- `verify-url.sh` passed: title, `lang=en`, one h1, main landmark, alt text, labeled buttons, and zero landing-page console errors.
- Live Lighthouse: Performance 100, Accessibility 100, Best Practices 100, SEO 100; LCP 1.1 s, TBT 0 ms, CLS 0, 62 KiB transferred.
- Every discovered internal public link returned HTTP 200. Unknown pages return HTTP 404 with the designed page; unknown API routes return JSON 404.

Evidence screenshots, Lighthouse JSON, and URL verification output are under `/work/.evidence/repair-4-live/`. The catalog description is copied to `/work/.evidence/catalog-description.txt`.

## Scope and next step

- This is a web service, so CLI/library consumer-install checks do not apply.
- It is not a PWA. Offline reload and service-worker update behavior are not claimed. The narrower browser-local draft behavior is tested offline.
- The sample uses recorded license-verification fixtures and never spends or invents provider credentials.
- Factory operator action: enable `humane-practical-exams` in the Sociobot billing catalog, verify the hosted checkout redirect and $39 one-time product, then restore the buy link and rerun the checkout claim.
