<script lang="ts">
  import Header from '../components/Header.svelte';
  import Footer from '../components/Footer.svelte';
  import { navigate } from '../lib/navigation';

  const original = {
    outcome: 'Meets standard',
    feedback: 'The repair handles missing stock records and preserves the existing API response shape.',
    scores: [4, 3, 2]
  };
  let outcome = original.outcome;
  let feedback = original.feedback;
  let scores = [...original.scores];
  let message = '';

  const checkpoints = [
    { label: 'Failing test reproduced', hash: 'be5d7c716b43fdca3674d09a29f47f1a3c7fb2bdf5b3a52c9b8a34fa6b82d2b3', time: '09:24' },
    { label: 'Regression suite passed', hash: '527cba2c68f7db9cc11c022bdd92a69a10e3cbb63eed7810c82f6ffaf06bca9f', time: '10:07' }
  ];

  function resetDemo() {
    outcome = original.outcome;
    feedback = original.feedback;
    scores = [...original.scores];
    message = 'Demo reset to the original sample.';
  }

  function exportRecord() {
    const record = {
      format: 'humane-practical-exam/v1',
      sample: true,
      exam: { title: 'Repair a failing inventory API', duration_minutes: 90, deletion_days: 14 },
      submission: {
        alias: 'Riley',
        status: 'assessed',
        artifact_name: 'inventory-api.tar.gz',
        work_log: 'I reproduced the missing-stock failure, added a regression test, then changed the repository query to return an empty stock record.',
        command_history: 'cargo test inventory_missing_stock\ncurl -i localhost:8080/items/sku-104/stock',
        checkpoints,
        assessment: { scores, outcome, feedback }
      }
    };
    const href = URL.createObjectURL(new Blob([JSON.stringify(record, null, 2)], { type: 'application/json' }));
    const anchor = document.createElement('a');
    anchor.href = href;
    anchor.download = 'sample-assessment.json';
    anchor.click();
    URL.revokeObjectURL(href);
    message = 'Sample JSON downloaded.';
  }
</script>

<Header compact />
<aside class="demo-banner" aria-label="Demo status">
  <strong>Demo — sample data, nothing is saved</strong>
  <div><button type="button" onclick={resetDemo}>Reset demo</button><a href="/create" onclick={(event) => { event.preventDefault(); navigate('/create'); }}>Start for real</a></div>
</aside>
<main id="main" class="demo-page" tabindex="-1">
  <section class="demo-heading">
    <div><p class="eyebrow"><span></span> Sample assessor view</p><h1>Review a completed practical exam</h1></div>
    <p>This sample shows the evidence, rubric, feedback, and export an assessor receives.</p>
  </section>
  {#if message}<p class="notice success" role="status">{message}</p>{/if}

  <section class="demo-summary" aria-labelledby="sample-task">
    <div><span class="role-badge assessor">Assessor</span><h2 id="sample-task">Repair a failing inventory API</h2><p>Candidate Riley · submitted 5 September 2026 at 10:09</p></div>
    <dl><div><dt>Working time</dt><dd>90 minutes</dd></div><div><dt>Deletion date</dt><dd>19 September 2026</dd></div><div><dt>Status</dt><dd>Assessed</dd></div></dl>
  </section>

  <div class="demo-layout">
    <div>
      <section class="demo-panel"><p class="section-kicker">Task brief</p><h2>Required outcome</h2><p>Repair the missing-stock response without changing successful responses. Add a regression test and explain the verification steps.</p><p><strong>Accommodation:</strong> Screen readers, breaks, and local reference material are permitted.</p></section>
      <section class="demo-panel"><p class="section-kicker">Candidate work log</p><h2>Decisions and checks</h2><p>I reproduced the missing-stock failure, added a regression test, then changed the repository query to return an empty stock record.</p><p>I kept the handler response unchanged. This limited the repair to the data boundary and kept existing clients compatible.</p><h3>Chosen command history</h3><pre>cargo test inventory_missing_stock
curl -i localhost:8080/items/sku-104/stock</pre></section>
      <section class="demo-panel"><p class="section-kicker">Submitted artifact</p><h2>inventory-api.tar.gz</h2><p>842 KB · one uploaded artifact</p></section>
      <section class="demo-panel"><p class="section-kicker">Checkpoint fingerprints</p><h2>Recorded milestones</h2><ol class="demo-checkpoints">{#each checkpoints as checkpoint}<li><div><strong>{checkpoint.label}</strong><time>{checkpoint.time}</time></div><code>{checkpoint.hash}</code></li>{/each}</ol></section>
    </div>

    <aside class="demo-rubric" aria-labelledby="sample-rubric">
      <p class="section-kicker">Assessor decision</p><h2 id="sample-rubric">Score the rubric</h2>
      <label for="demo-score-1">Correct behavior <span>out of 4</span></label><input id="demo-score-1" type="number" min="0" max="4" bind:value={scores[0]} />
      <label for="demo-score-2">Technical reasoning <span>out of 4</span></label><input id="demo-score-2" type="number" min="0" max="4" bind:value={scores[1]} />
      <label for="demo-score-3">Verification <span>out of 2</span></label><input id="demo-score-3" type="number" min="0" max="2" bind:value={scores[2]} />
      <label for="demo-outcome">Overall decision</label><select id="demo-outcome" bind:value={outcome}><option>Meets standard</option><option>Partially meets</option><option>Needs evidence-focused follow-up</option></select>
      <label for="demo-feedback">Assessor feedback</label><textarea id="demo-feedback" rows="6" bind:value={feedback}></textarea>
      <button class="button primary full" type="button" onclick={exportRecord}>Download sample JSON</button>
      <small>Changes stay in this page until you reset or leave the demo.</small>
    </aside>
  </div>
</main>
<Footer />
