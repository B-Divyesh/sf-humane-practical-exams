# Humane Practical Exams — review 2 handoff

Updated: 2026-09-05

Live URL: <https://humane-practical-exams.sociobot.in>

Implementation SHA: `56a8ff0a6d6b8d925e90eaab75d9e0a15f0a88fe`

Deployed documentation SHA: `5e8b7a2ef516b553b00dfe97234d73827036c78f`

Review baseline SHA: `f49023b34716326143bbb239a7dc161b1a88acd0`

Review report: `.factory/review-2.md`

## Outcome

**PASS — 0 findings and 0 untested public claims.**

The live product, clean checkout, all 26 claims, desktop and phone sample flows, routes, accessibility, privacy behavior, backend isolation, restart persistence, rate limits, and all earlier fixes passed a fresh strict review. No product code was changed.

The external Sociobot checkout still returns HTTP 404 because this product is not enabled in that catalog. The product accurately states that new purchases are unavailable and presents no broken checkout action. This expected external state is not a product finding.

## Verification summary

From a fresh remote clone at `f49023b`:

```sh
npm ci
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

- 148 packages installed with 0 reported vulnerabilities.
- Svelte reported 0 errors and 0 warnings.
- 3 Vitest and 14 Rust tests passed; Dockerfile contract passed.
- 22/22 Playwright browser tests passed.
- 26/26 combined claim tests passed.
- Every one of the 26 declared focused claim commands passed separately.
- Production assets measured 104.76 KB JS raw / 37.61 KB gzip and 29.32 KB CSS raw / 6.89 KB gzip.
- Zero-config startup, generated-key reuse, SQLite restart persistence, and cross-exam token isolation passed.

Fresh live Chromium contexts at 1440×1000 and 390×844 verified the first screen and one-click sample. The sample remained labeled after scrolling, reset correctly, exported realistic JSON, preserved planted real-data markers, made no API writes or off-origin requests, and set no cookies. Keyboard, focus, reduced motion, 200% text, legal routes, metadata, links, and the designed 404 passed. Playwright Axe found no serious or critical issues.

Live `/health` returned the deployed documentation SHA. A rate probe returned 300 allowed API misses and then five 429 responses with `Retry-After`; another forwarded client retained a separate allowance. Rebuilt frontend shell, JavaScript, and CSS matched live assets byte for byte.

Lighthouse mobile: Performance 100, Accessibility 100, Best Practices 100, SEO 100; LCP 1.08 s, TBT 4 ms, CLS 0, 63,124 transferred bytes.

## Earlier finding disposition

All findings HPE-01 through HPE-16 are fixed or, for HPE-02, accurately handled as expected external catalog state. Fresh evidence for each disposition is in `.factory/review-2.md`.

## Evidence

- Repository report: `.factory/review-2.md`
- Local checks and individual claim logs: `/work/.evidence/review-2-local/`
- Live screenshots, browser results, route/link checks, rate responses, asset hashes, and Lighthouse: `/work/.evidence/review-2-live/`
- Copied report: `/work/.evidence/qa-report.md`
- Machine verdict: `/work/.evidence/qa-result.json`

## Remaining operational step

Enable `humane-practical-exams` in the Sociobot billing catalog before adding a purchase action. Then verify the hosted checkout and update the `checkout-unavailable` claim. This is outside the repository and is not required for the current honest free product.
