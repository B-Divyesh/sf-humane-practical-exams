# Humane Practical Exams

Humane Practical Exams runs timed technical assessments for instructors and training providers. Candidates submit chosen work evidence instead of camera or browser monitoring.

An instructor defines the task, accommodations, deletion period, and rubric. The app creates separate candidate and assessor capability links. Candidates submit a work log, chosen commands, SHA-256 checkpoints, and one artifact. Assessors score the rubric and export the complete record as JSON.

Live product: <https://humane-practical-exams.sociobot.in>

Sample workspace: <https://humane-practical-exams.sociobot.in/demo>

## Try the sample

Open <code>/demo</code> or select **Try it with sample data** on the first screen. The sample contains a completed API-repair task, written evidence, command excerpts, two checkpoints, an artifact, scores, and feedback.

The demo runs in page memory. It makes no exam API writes and never reads real exam keys. **Reset demo** restores the original sample. **Start for real** opens the exam builder.

## Product boundaries

- The candidate controls when evidence is submitted. An assessor cannot score active work.
- The visible timebox does not lock candidate writing when time ends.
- The candidate enters the work log and chosen command excerpts.
- A candidate can upload one replaceable artifact up to 15 MB.
- Submission text and artifact bytes use AES-256-GCM encryption before SQLite storage.
- The database stores SHA-256 hashes of role tokens instead of raw tokens.
- Every submission has a deletion date. Expired records are removed before a read.
- Typed candidate drafts remain available in that browser while offline.
- The app does not request camera, microphone, fullscreen, pointer lock, biometrics, or AI-generated cheating scores.
- Exam creation, assessment, export, accommodations, and deletion controls require no account or provider tools.

The optional provider tools cost $39 once. They add a local last-exam template and a provider name. Existing licenses can be restored. New purchases remain unavailable because the external Sociobot checkout is not enabled for this product.

## Stack

- Svelte 5, TypeScript, and Vite frontend
- Rust 2021, axum, sqlx, and SQLite backend
- One non-root container serving the frontend and API on <code>PORT</code>

The researched scope is in [the brief](.factory/brief.json). The visual system and asset provenance are in [the design record](.factory/design.md).

## Clean setup

Prerequisites are Node 22+, npm, current stable Rust, and Chromium for Playwright 1.58.2.

~~~sh
npm ci
npm run build
cargo run
~~~

Open <http://localhost:8080>. The service starts with no required environment variables.

For separate development processes:

~~~sh
npm run dev
npm run dev:api
~~~

## Test and verify

~~~sh
npm run check
npm test
npm run build
npm run test:runtime
npm run test:e2e
npm run test:claims
cargo fmt --check
cargo clippy --all-targets --locked -- -D warnings
~~~

Every public claim and its focused command is listed in [the claims registry](.factory/claims.json). Claim tests use an isolated local SQLite database and the <code>/demo</code> entry point.

The load smoke is:

~~~sh
seq 1 100 | xargs -P20 -I{} curl -fsS http://127.0.0.1:8080/health >/dev/null
~~~

## Configuration

| Variable | Default | Purpose |
|---|---|---|
| <code>PORT</code> | <code>8080</code> | HTTP listen port |
| <code>DATABASE_URL</code> | <code>/data/humane-exams.db</code> when <code>/data</code> exists; otherwise <code>data/humane-exams.db</code> | SQLite connection URL |
| <code>STATIC_DIR</code> | <code>dist</code> | Built frontend directory |
| <code>SUBMISSION_ENCRYPTION_KEY</code> | Generated beside the SQLite database | Optional encryption-key override |
| <code>BUILD_SHA</code> | <code>development</code> | Value returned by <code>/health</code> |

The generated key uses mode <code>0600</code>. Back up the key with the database. Losing it makes encrypted submissions unreadable.

## Container and deployment

~~~sh
docker build --build-arg BUILD_SHA="$(git rev-parse HEAD)" -t humane-practical-exams .
docker run --rm -e PORT=8080 -p 8080:8080 -v humane-exam-data:/data humane-practical-exams
~~~

The runtime image runs as a non-root user. Persist <code>/data</code> with one replica because SQLite and the generated encryption key live there. The factory owns deployment, DNS, and billing configuration.

## License

MIT. See [LICENSE](LICENSE).
