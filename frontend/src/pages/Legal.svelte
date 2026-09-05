<script lang="ts">
  import Header from '../components/Header.svelte';
  import Footer from '../components/Footer.svelte';
  export let page: 'privacy' | 'terms';
</script>

<Header compact />
<main id="main" class="legal-page" tabindex="-1">
  {#if page === 'privacy'}
    <p class="eyebrow"><span></span> Privacy policy</p><h1>Privacy</h1><p class="updated">Effective 5 September 2026</p>
    <p>This app collects submitted work evidence. It does not collect video, audio, biometrics, screen activity, or browsing activity.</p>
    <p>The app has no analytics or advertising trackers.</p>
    <h2>Data the service stores</h2>
    <p>An exam stores its task, rubric, accommodations, deletion setting, and role-link hashes.</p>
    <p>A submission can store an alias, work log, chosen commands, checkpoint hashes, one artifact, timestamps, scores, and feedback.</p>
    <p>Do not enter personal information that the assessment does not need.</p>
    <h2>How the service protects submissions</h2>
    <p>The service encrypts submission text and artifact bytes with AES-256-GCM before writing them to SQLite.</p>
    <p>Candidate and assessor links use access tokens. The database stores one-way SHA-256 hashes of those tokens.</p>
    <p>Anyone with a complete role link can use that role. Treat the assessor link like a password.</p>
    <h2>Deletion</h2>
    <p>Every submission gets the deletion period chosen for its exam. The server removes expired submissions and rejects later access.</p>
    <p>An assessor can delete a submission sooner. This deletion cannot be undone.</p>
    <p>Candidate drafts remain in that browser until submission or browser-data removal.</p>
    <h2>Provider licenses</h2>
    <p>This app can store a provider license token and its recent verification result in the browser.</p>
    <p>License checks go only to the Sociobot API. The checkout for new purchases is not currently enabled.</p>
    <h2>Your choices</h2>
    <p>Use an alias. Share only relevant commands. Download the assessment record or ask the assessor to delete it.</p>
  {:else}
    <p class="eyebrow"><span></span> Terms of use</p><h1>Terms</h1><p class="updated">Effective 5 September 2026</p>
    <p>Use this app only for lawful practical assessments. Explain the task, evidence request, rubric, and deletion period before work starts.</p>
    <h2>The app does not prove identity</h2>
    <p>The service does not verify identity or prove that a candidate worked without help.</p>
    <p>Checkpoint hashes identify candidate-chosen content at a recorded time. They do not prove authorship.</p>
    <p>The assessor remains responsible for the final decision.</p>
    <h2>Acceptable use</h2>
    <p>Do not upload malware, unlawful material, secrets, or data you lack permission to process.</p>
    <p>Do not use a role link to access another person’s assessment. The service may rate-limit abusive requests.</p>
    <h2>Data and availability</h2>
    <p>Keep exported copies of records you must retain. Scheduled or early deletion is permanent.</p>
    <p>The service may be unavailable during maintenance. The software has no warranties beyond those required by law.</p>
    <h2>Provider tools</h2>
    <p>The optional provider tools cost $39 once when checkout is available. New purchases are not currently available.</p>
    <p>Existing licenses can be restored. Sociobot is the merchant of record and handles refunds when checkout is available.</p>
    <p>A revoked license disables provider tools after the next check. Accessibility, safety, assessment, export, and deletion remain free.</p>
    <h2>Self-hosting</h2>
    <p>The source uses the MIT license. A self-hosting organization controls its notices, retention, backups, and encryption key.</p>
  {/if}
</main>
<Footer />
