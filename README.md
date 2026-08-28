# Humane Practical Exams

Humane Practical Exams is a self-hostable assessment workspace for instructors and training providers who need credible evidence of practical technical work without webcam monitoring, browser lockdown, biometrics, or automated “cheating” scores.

An instructor creates a timed open-book task and transparent rubric, then receives separate candidate and assessor capability links. The candidate submits a written work log, selected command excerpts, SHA-256 checkpoints, and one artifact. The assessor reviews those materials, scores the rubric, and exports a portable JSON assessment record.

Live product: <https://humane-practical-exams.sociobot.in>

## Product boundaries

- It is evidence tooling, not identity verification and not “cheat-proof.”
- Submission content and artifacts are AES-256-GCM encrypted at rest.
- Candidate and assessor tokens are stored only as one-way SHA-256 hashes.
- Every submission has an automatic deletion date; assessors can delete sooner.
- Accessibility accommodations, grading, deletion, and record export are always free.
- The optional $39 one-time provider unlock adds local templates and provider branding through the Sociobot billing API. No payment provider is embedded.

## Stack

- Svelte 5 + TypeScript + Vite frontend
- Rust 2021, axum, sqlx, and SQLite backend
- One multi-stage container serving the built frontend and API on `PORT`

The researched scope is in [`.factory/brief.json`](.factory/brief.json), visual system and generated asset provenance are in [`.factory/design.md`](.factory/design.md), and operational notes are in [`.factory/handoff.md`](.factory/handoff.md).

## Run locally

Prerequisites: Node 22+, npm, and current stable Rust.

```sh
npm install
npm run build
cargo run
```

Open <http://localhost:8080>. SQLite data is written to `data/humane-exams.db` by default.

For separate hot-reload processes:

```sh
npm run dev       # frontend on :5173, proxies /api to :8080
npm run dev:api   # backend on :8080
```

## Test and verify

```sh
npm run check
npm test          # frontend unit tests, Rust unit/integration tests
npm run build     # reproducible frontend output in dist/
npm run test:e2e  # Playwright end-to-end, desktop and 390px mobile
```

The first Playwright run uses the preinstalled Chromium expected by the factory worker. The documented load smoke is:

```sh
seq 1 100 | xargs -P20 -I{} curl -fsS http://127.0.0.1:8080/health >/dev/null
```

## Configuration

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `8080` | HTTP listen port |
| `DATABASE_URL` | `sqlite://data/humane-exams.db?mode=rwc` | SQLite connection URL |
| `STATIC_DIR` | `dist` | Built frontend directory |
| `SUBMISSION_ENCRYPTION_KEY` | generated and persisted in `data/submission-encryption-key` | Optional master-secret override used to derive the at-rest encryption key |
| `BUILD_SHA` | `development` | Value returned by `/health` |

Back up the encryption key separately from the database. Losing it makes encrypted submissions unrecoverable. Rotating it requires an explicit data migration.

## Container

```sh
docker build --build-arg BUILD_SHA="$(git rev-parse HEAD)" -t humane-practical-exams .
docker run --rm -e PORT=8080 -p 8080:8080 -v humane-exam-data:/app/data humane-practical-exams
```

The runtime container runs as a non-root user and needs only `PORT`; it listens on `0.0.0.0:$PORT`. On its first boot it generates a CSPRNG encryption key and saves it as mode `0600` in the mounted data directory. Persist and back up `/app/data` together: losing that file makes encrypted submissions unreadable. `SUBMISSION_ENCRYPTION_KEY` remains an optional override for an operator-managed key.

## License

MIT. See [LICENSE](LICENSE).
