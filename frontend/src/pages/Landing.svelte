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
      <p class="eyebrow"><span></span> Open book. Clear evidence. No surveillance.</p>
      <h1>See the work.<br><i>Respect the person.</i></h1>
      <p class="lede">Run timed practical exams with artifacts, candidate-written logs, checkpoint hashes, and a transparent rubric—without webcams or locked browsers.</p>
      <div class="hero-actions">
        <a class="button primary" href="/create" onclick={(event) => { event.preventDefault(); navigate('/create'); }}>Create an exam <span aria-hidden="true">→</span></a>
        <a class="button quiet" href="#how">See the evidence trail</a>
      </div>
      <p class="trust-line"><span aria-hidden="true">✓</span> Self-hostable · encrypted submissions · scheduled deletion</p>
    </div>
    <figure class="hero-visual">
      <picture>
        <source srcset="/assets/evidence-landscape-768.webp 768w, /assets/evidence-landscape-1200.webp 1200w" sizes="(max-width: 780px) 100vw, 55vw" type="image/webp" />
        <img src="/assets/evidence-landscape-1200.webp" width="1200" height="800" alt="Three translucent platforms show a task flowing through checkpoint evidence into a completed assessment." decoding="async" fetchpriority="high" />
      </picture>
      <figcaption><span>01</span> Task <b></b><span>02</span> Evidence <b></b><span>03</span> Decision</figcaption>
    </figure>
  </section>

  <section class="principle-strip" aria-label="Product principles">
    <p><strong>Candidate controls the evidence</strong><span>Only chosen artifacts and written work logs are collected.</span></p>
    <p><strong>Assessor sees the same rubric</strong><span>Criteria are visible before the timer starts.</span></p>
    <p><strong>Records leave intact</strong><span>Export a durable, readable assessment record.</span></p>
  </section>

  <section id="how" class="how-section">
    <div class="section-heading">
      <p class="eyebrow"><span></span> A legible evidence trail</p>
      <h2>Competence leaves useful traces.</h2>
      <p>Collect the traces an assessor actually needs, while leaving ordinary human behavior alone.</p>
    </div>
    <ol class="steps">
      <li><span class="step-number">01</span><div><h3>Set the practical</h3><p>Write the brief, timebox, accommodations, deletion period, and scoring criteria. Candidate and assessor links stay separate.</p></div></li>
      <li><span class="step-number">02</span><div><h3>Build an evidence trail</h3><p>The candidate uploads one artifact, explains decisions, pastes only the commands they choose, and seals checkpoints with SHA-256 hashes.</p></div></li>
      <li><span class="step-number">03</span><div><h3>Make a transparent decision</h3><p>Score the visible rubric, write feedback, and export a portable JSON record with timestamps and evidence metadata.</p></div></li>
    </ol>
  </section>

  <section class="boundary-section">
    <div>
      <p class="eyebrow"><span></span> A deliberate boundary</p>
      <h2>What we refuse to collect is part of the product.</h2>
    </div>
    <ul>
      <li><span aria-hidden="true">×</span> No webcam or room recording</li>
      <li><span aria-hidden="true">×</span> No browser lockdown</li>
      <li><span aria-hidden="true">×</span> No identity biometrics</li>
      <li><span aria-hidden="true">×</span> No “AI cheating” score</li>
    </ul>
    <p class="honest-note">This tool is not “cheat-proof.” It helps assessors make a defensible judgement from visible work.</p>
  </section>

  <section class="pricing-section">
    <div>
      <p class="eyebrow"><span></span> Start useful, stay useful</p>
      <h2>Run a complete exam for free.</h2>
      <p>Creating, submitting, grading, exporting, accommodations, and deletion controls are always included.</p>
    </div>
    <article class="price-card">
      <p class="price-label">Provider unlock</p>
      <p class="price"><strong>$39</strong> once</p>
      <ul><li>Save reusable exam templates</li><li>Add provider branding to new exams</li><li>Keep rubric presets on this device</li></ul>
      {#if $license.unlocked}
        <p class="status-pill success">Provider features unlocked</p>
      {:else}
        <p class="purchase-unavailable" role="status">{purchase.notice} Existing license holders can restore access when creating an exam.</p>
      {/if}
      <small>Sociobot/Dodo is merchant of record. Refunds are handled there.</small>
    </article>
  </section>

  <section class="final-cta">
    <p class="eyebrow"><span></span> Ready when the task is</p>
    <h2>Assess the work.<br>Leave the room alone.</h2>
    <a class="button primary" href="/create" onclick={(event) => { event.preventDefault(); navigate('/create'); }}>Create your first exam <span aria-hidden="true">→</span></a>
  </section>
</main>
<Footer />
