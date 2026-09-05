# Demo sandbox

## Entry point

Open <https://humane-practical-exams.sociobot.in/demo> or select **Try it with sample data** on the landing page.

## Sample data

The demo opens a completed assessment named **Repair a failing inventory API**. It includes:

- candidate alias Riley;
- a 90-minute task and accommodation note;
- a written work log and two chosen commands;
- one 842 KB sample artifact record;
- two full SHA-256 checkpoint fingerprints;
- three rubric scores, an assessor decision, and feedback.

The JSON download is generated from the current sample state and marks the file as sample data.

## Isolation and reset

The sample is held only in Svelte component memory. It uses no localStorage, IndexedDB, cookie, SQLite row, exam token, or API write. The global theme preference may still be read by the shared header.

**Reset demo** restores the original scores, decision, and feedback. Leaving or reloading the route also discards changes. **Start for real** leaves the sample and opens <code>/create</code>; it does not copy sample data.

The persistent banner reads **Demo — sample data, nothing is saved** while the sample is active.
