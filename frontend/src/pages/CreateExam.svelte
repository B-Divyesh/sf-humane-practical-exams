<script lang="ts">
  import { tick } from 'svelte';
  import Header from '../components/Header.svelte';
  import Footer from '../components/Footer.svelte';
  import { api, absoluteLink } from '../lib/api';
  import { checkoutUrl, license, restoreLicense } from '../lib/license';

  type CriterionDraft = { label: string; description: string; max_score: number };
  let title = '';
  let brief = '';
  let duration = 90;
  let deletionDays = 30;
  let accommodations = 'The timer may be extended by the assessor before sharing this link. Breaks and assistive technology are permitted.';
  let providerName = '';
  let criteria: CriterionDraft[] = [
    { label: 'Outcome works', description: 'The submitted artifact meets the practical requirements.', max_score: 4 },
    { label: 'Technical reasoning', description: 'The work log explains consequential choices and tradeoffs.', max_score: 4 },
    { label: 'Verification', description: 'The candidate provides useful checks and reproducible evidence.', max_score: 2 }
  ];
  let busy = false;
  let error = '';
  let result: { candidate: string; assessor: string } | null = null;
  let restoreToken = '';
  let copied = '';

  function addCriterion() {
    criteria = [...criteria, { label: '', description: '', max_score: 4 }];
  }
  function removeCriterion(index: number) {
    if (criteria.length > 1) criteria = criteria.filter((_, current) => current !== index);
  }
  function updateCriterion(index: number, key: keyof CriterionDraft, value: string | number) {
    criteria = criteria.map((criterion, current) => current === index ? { ...criterion, [key]: value } : criterion);
  }
  async function submit() {
    error = '';
    if (!title.trim() || brief.trim().length < 40 || criteria.some((item) => !item.label.trim())) {
      error = 'Add a title, a task brief of at least 40 characters, and a name for every rubric criterion.';
      await tick();
      document.getElementById('form-error')?.focus();
      return;
    }
    busy = true;
    try {
      const created = await api.createExam({
        title, brief, duration_minutes: duration, deletion_days: deletionDays,
        accommodations, provider_name: $license.unlocked ? providerName : '', criteria
      });
      result = {
        candidate: absoluteLink(`/exam/${created.exam_id}`, { token: created.candidate_token }),
        assessor: absoluteLink(`/exam/${created.exam_id}`, { token: created.assessor_token })
      };
      if ($license.unlocked) localStorage.setItem('hpe:last-template', JSON.stringify({ title, brief, duration, deletionDays, accommodations, criteria }));
    } catch (caught) { error = (caught as Error).message; }
    finally { busy = false; }
  }
  async function copy(value: string, which: string) {
    await navigator.clipboard.writeText(value);
    copied = which;
    setTimeout(() => copied = '', 1800);
  }
  function loadTemplate() {
    const saved = JSON.parse(localStorage.getItem('hpe:last-template') || 'null');
    if (!saved) return;
    ({ title, brief, duration, deletionDays, accommodations, criteria } = saved);
  }
</script>

<Header compact />
<main id="main" class="workspace-shell" tabindex="-1">
  {#if result}
    <section class="share-complete" aria-labelledby="created-title">
      <p class="eyebrow"><span></span> Exam ready</p>
      <h1 id="created-title">Two links. Two clear roles.</h1>
      <p class="lede">These capability links are shown once. Store the assessor link safely; anyone with it can grade and delete submissions.</p>
      <div class="link-panes">
        <article>
          <span class="role-badge candidate">Candidate</span>
          <h2>Share this link to begin</h2>
          <p>Candidates can read the brief, start a submission, and submit only their chosen evidence.</p>
          <label for="candidate-link">Candidate capability link</label>
          <div class="copy-field"><input id="candidate-link" readonly value={result.candidate} /><button type="button" onclick={() => copy(result!.candidate, 'candidate')}>{copied === 'candidate' ? 'Copied' : 'Copy'}</button></div>
        </article>
        <article>
          <span class="role-badge assessor">Assessor</span>
          <h2>Keep this link private</h2>
          <p>Assessors can see all submissions, download artifacts, score rubrics, export records, and delete data.</p>
          <label for="assessor-link">Assessor capability link</label>
          <div class="copy-field"><input id="assessor-link" readonly value={result.assessor} /><button type="button" onclick={() => copy(result!.assessor, 'assessor')}>{copied === 'assessor' ? 'Copied' : 'Copy'}</button></div>
        </article>
      </div>
      <div class="callout warning"><strong>Save the assessor link now.</strong> Tokens are stored only as one-way hashes and cannot be recovered from the server.</div>
      <button class="button quiet" type="button" onclick={() => result = null}>Create another exam</button>
    </section>
  {:else}
    <section class="create-heading">
      <div><p class="eyebrow"><span></span> Exam builder</p><h1>Make the evidence<br><i>clear before the clock starts.</i></h1></div>
      <p>Everything the candidate will be asked to share is visible here. No hidden collection, no monitoring in the background.</p>
    </section>

    {#if $license.notice}<div class="notice" role="status">{$license.notice} <a href={checkoutUrl}>View unlock</a></div>{/if}
    {#if $license.unlocked && localStorage.getItem('hpe:last-template')}<button type="button" class="template-button" onclick={loadTemplate}>Load your last exam template</button>{/if}

    <form class="exam-form" onsubmit={(event) => { event.preventDefault(); submit(); }}>
      {#if error}<div id="form-error" class="form-error" role="alert" tabindex="-1">{error}</div>{/if}
      <section aria-labelledby="task-section">
        <div class="form-section-number">01</div>
        <div class="form-fields"><h2 id="task-section">The practical task</h2><p>Use a concrete outcome and say what “done” means.</p>
          <label for="title">Exam title <span>required</span></label>
          <input id="title" bind:value={title} maxlength="120" autocomplete="off" required />
          <label for="brief">Task brief <span>required · at least 40 characters</span></label>
          <textarea id="brief" bind:value={brief} rows="10" maxlength="12000" required></textarea>
        </div>
      </section>
      <section aria-labelledby="conditions-section">
        <div class="form-section-number">02</div>
        <div class="form-fields"><h2 id="conditions-section">Conditions and care</h2><p>Set expectations without constraining ordinary behavior.</p>
          <div class="field-row">
            <div><label for="duration">Working time <span>minutes</span></label><input id="duration" type="number" bind:value={duration} min="10" max="1440" required /></div>
            <div><label for="deletion">Delete after <span>days from start</span></label><input id="deletion" type="number" bind:value={deletionDays} min="1" max="365" required /></div>
          </div>
          <label for="accommodations">Accommodations and permitted tools</label>
          <textarea id="accommodations" bind:value={accommodations} rows="4" maxlength="2000"></textarea>
          {#if $license.unlocked}<label for="provider">Provider name <span>provider unlock</span></label><input id="provider" bind:value={providerName} maxlength="100" />{/if}
        </div>
      </section>
      <section aria-labelledby="rubric-section">
        <div class="form-section-number">03</div>
        <div class="form-fields"><h2 id="rubric-section">Transparent rubric</h2><p>Candidates see these criteria before starting. Use observable language.</p>
          <div class="criterion-list">
            {#each criteria as criterion, index}
              <fieldset class="criterion">
                <legend>Criterion {index + 1}</legend>
                <label for="criterion-{index}">Criterion name</label><input id="criterion-{index}" value={criterion.label} oninput={(e) => updateCriterion(index, 'label', e.currentTarget.value)} maxlength="100" required />
                <label for="description-{index}">What good evidence shows</label><textarea id="description-{index}" value={criterion.description} oninput={(e) => updateCriterion(index, 'description', e.currentTarget.value)} rows="2" maxlength="500"></textarea>
                <label for="score-{index}">Maximum score</label><input class="score-input" id="score-{index}" type="number" value={criterion.max_score} oninput={(e) => updateCriterion(index, 'max_score', Number(e.currentTarget.value))} min="1" max="20" required />
                {#if criteria.length > 1}<button type="button" class="text-button danger" onclick={() => removeCriterion(index)}>Remove criterion {index + 1}</button>{/if}
              </fieldset>
            {/each}
          </div>
          <button type="button" class="button quiet" onclick={addCriterion}>+ Add criterion</button>
        </div>
      </section>
      <div class="submit-bar"><p><strong>No account needed.</strong><span>You’ll receive separate candidate and assessor capability links.</span></p><button class="button primary" type="submit" disabled={busy}>{busy ? 'Creating exam…' : 'Create exam →'}</button></div>
    </form>

    {#if !$license.unlocked}
      <details class="restore-panel"><summary>Have a provider license?</summary><div><label for="restore">Paste license token</label><input id="restore" bind:value={restoreToken} autocomplete="off" /><button type="button" class="button quiet" onclick={() => restoreLicense(restoreToken)}>Verify and restore</button><p>Provider unlock is a $39 one-time purchase for templates and branding. Core exam and export features remain free.</p></div></details>
    {/if}
  {/if}
</main>
<Footer />
