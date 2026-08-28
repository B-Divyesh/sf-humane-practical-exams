<script lang="ts">
  import Header from '../components/Header.svelte';
  import Footer from '../components/Footer.svelte';
  export let page: 'privacy' | 'terms';
</script>

<Header compact />
<main id="main" class="legal-page">
  {#if page === 'privacy'}
    <p class="eyebrow"><span></span> Plain-language policy</p><h1>Privacy</h1><p class="updated">Effective 28 August 2026</p>
    <p>Humane Practical Exams is designed to collect work evidence, not behavior. It does not use analytics, advertising trackers, webcams, browser monitoring, biometrics, or AI cheating detection.</p>
    <h2>What is stored</h2><p>An exam stores its task brief, rubric, accommodations, and deletion setting. A submission may store a candidate-chosen alias, written work log, command excerpts, checkpoint hashes, one uploaded artifact, timestamps, and assessor feedback. Do not enter unnecessary personal information.</p>
    <h2>How it is protected</h2><p>Submission text and artifact bytes are encrypted at rest. Access is controlled by unguessable candidate and assessor capability links. Treat an assessor link like a password. The service stores only one-way hashes of those tokens.</p>
    <h2>Deletion</h2><p>Each exam has a deletion period of 1–365 days. Submission records are automatically purged after that date and an assessor can delete them earlier. Deletion is permanent. Locally saved candidate drafts remain in that browser until the candidate clears them.</p>
    <h2>Payments</h2><p>The optional provider unlock is processed by Sociobot/Dodo, the merchant of record. This app receives a license token and verification result, not card details. The token and a daily verification cache are stored in your browser.</p>
    <h2>Your choices</h2><p>Use an alias, share only relevant command history, export your record, or ask the assessor to delete a submission. A self-hosted operator is responsible for their deployment and encryption key.</p>
  {:else}
    <p class="eyebrow"><span></span> Plain-language agreement</p><h1>Terms</h1><p class="updated">Effective 28 August 2026</p>
    <p>Humane Practical Exams helps people conduct transparent, artifact-based practical assessments. By using it, you agree to use it lawfully and to explain the assessment conditions to candidates.</p>
    <h2>Not cheat-proof</h2><p>The service does not verify identity or guarantee that work was completed without outside help. Checkpoint hashes show that chosen content existed at a recorded time; they do not prove authorship. Assessment decisions remain the assessor’s responsibility.</p>
    <h2>Acceptable use</h2><p>Do not upload malware, unlawful material, secrets, or data you do not have permission to process. Do not use capability links to access someone else’s assessment. Operators may remove harmful content or rate-limit abusive traffic.</p>
    <h2>Data and availability</h2><p>Keep exported copies of records you must retain. Content is deleted according to the exam’s schedule and may be unavailable during maintenance. The software is provided without warranties to the extent permitted by law.</p>
    <h2>Provider unlock</h2><p>The $39 provider unlock is a one-time purchase for the current listed features. Sociobot/Dodo is the merchant of record and handles payment and refunds. A refunded purchase revokes its license automatically. Accessibility, safety, grading, and core export are not paid features.</p>
    <h2>Self-hosting</h2><p>The source is MIT licensed. A self-hosting organization is the service operator and is responsible for notices, retention choices, backups, and safeguarding its encryption key.</p>
  {/if}
</main>
<Footer />
