<script lang="ts">
  import Header from '../components/Header.svelte';
  import Footer from '../components/Footer.svelte';
  import { navigate } from '../lib/navigation';
  import { license, purchase } from '../lib/license';
</script>

<Header />
<main id="main" tabindex="-1">
  <section class="hero">
    <div class="hero-copy">
      <p class="eyebrow"><span></span> Timed, open-book assessment</p>
      <h1>Run practical exams without surveillance</h1>
      <p class="lede">For instructors and training providers who need assessable technical work without watching candidates through a camera.</p>
      <div class="hero-actions">
        <a class="button primary" href="/demo" onclick={(event) => { event.preventDefault(); navigate('/demo'); }}>Try it with sample data <span aria-hidden="true">→</span></a>
        <a class="button quiet" href="/create" onclick={(event) => { event.preventDefault(); navigate('/create'); }}>Create a real exam</a>
      </div>
      <p class="action-note">The sample opens a completed assessment. It does not change real exam data.</p>
      <ul class="hero-facts" aria-label="Product facts">
        <li>No webcam or browser lock.</li>
        <li>Candidate drafts stay available while offline.</li>
        <li>$39 provider tools: new purchases unavailable.</li>
      </ul>
    </div>
    <figure class="hero-visual">
      <picture>
        <source srcset="/assets/evidence-landscape-768.webp 768w, /assets/evidence-landscape-1200.webp 1200w" sizes="(max-width: 780px) 100vw, 55vw" type="image/webp" />
        <img src="/assets/evidence-landscape-1200.webp" width="1200" height="800" alt="A task, checkpoint evidence, and a completed rubric sit on three connected glass platforms." decoding="async" fetchpriority="high" />
      </picture>
      <figcaption><span>01</span> Task <b></b><span>02</span> Evidence <b></b><span>03</span> Decision</figcaption>
    </figure>
  </section>

  <section class="principle-strip" aria-label="Sample assessment summary">
    <p><strong>Task is defined first</strong><span>The brief, time, accommodations, deletion date, and rubric are visible.</span></p>
    <p><strong>Candidate chooses evidence</strong><span>The candidate adds a work log, command excerpts, checkpoints, and one artifact.</span></p>
    <p><strong>Assessor exports the result</strong><span>The rubric decision and submitted evidence form one JSON record.</span></p>
  </section>

  <section id="how" class="how-section">
    <div class="section-heading">
      <p class="eyebrow"><span></span> How it works</p>
      <h2>Create, complete, and assess one task</h2>
      <p>Each role sees only the controls needed for its part of the exam.</p>
    </div>
    <ol class="steps">
      <li><span class="step-number">01</span><div><h3>Create the task</h3><p>Set the brief, time, accommodations, deletion period, and scored rubric. The app creates separate role links.</p></div></li>
      <li><span class="step-number">02</span><div><h3>Candidate records the work</h3><p>The candidate explains decisions, adds chosen commands, seals checkpoints, and uploads one artifact.</p></div></li>
      <li><span class="step-number">03</span><div><h3>Assessor scores and exports</h3><p>The assessor reviews submitted evidence, scores the visible rubric, writes feedback, and downloads a JSON record.</p></div></li>
    </ol>
  </section>

  <section class="boundary-section">
    <div>
      <p class="eyebrow"><span></span> Privacy boundary</p>
      <h2>What the app does not collect</h2>
    </div>
    <ul>
      <li><span aria-hidden="true">×</span> Webcam or room recordings</li>
      <li><span aria-hidden="true">×</span> Browser or screen monitoring</li>
      <li><span aria-hidden="true">×</span> Identity biometrics</li>
      <li><span aria-hidden="true">×</span> Automated cheating scores</li>
    </ul>
    <p class="honest-note">This app does not prove who completed the work. The assessor decides whether the submitted evidence is enough.</p>
  </section>

  <section class="pricing-section">
    <div>
      <p class="eyebrow"><span></span> Provider tools</p>
      <h2>$39 one-time provider tools</h2>
      <p>Templates and provider names are optional. Exam creation, evidence, assessment, export, and deletion remain available without them.</p>
    </div>
    <article class="price-card">
      <p class="price-label">Provider tools</p>
      <p class="price"><strong>$39</strong> one time</p>
      <ul><li>Save the last exam as a local template</li><li>Add a provider name to new exams</li><li>Restore an existing license on another device</li></ul>
      {#if $license.unlocked}
        <p class="status-pill success">Provider tools active</p>
      {:else}
        <p class="purchase-unavailable" role="status">{purchase.notice} Existing license holders can restore access on the create page.</p>
      {/if}
      <small>The external Sociobot checkout is not enabled for this product.</small>
    </article>
  </section>

  <section class="final-cta">
    <p class="eyebrow"><span></span> Start an assessment</p>
    <h2>Create your practical exam</h2>
    <a class="button primary" href="/create" onclick={(event) => { event.preventDefault(); navigate('/create'); }}>Create an exam <span aria-hidden="true">→</span></a>
  </section>
</main>
<Footer />
