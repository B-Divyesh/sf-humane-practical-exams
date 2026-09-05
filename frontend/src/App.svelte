<script lang="ts">
  import { onMount, tick } from 'svelte';
  import Landing from './pages/Landing.svelte';
  import Demo from './pages/Demo.svelte';
  import CreateExam from './pages/CreateExam.svelte';
  import ExamWorkspace from './pages/ExamWorkspace.svelte';
  import Legal from './pages/Legal.svelte';
  import NotFound from './pages/NotFound.svelte';
  import { captureLicense } from './lib/license';
  import { applyMetadata } from './lib/metadata';

  let path = window.location.pathname;
  let routeAnnouncement = '';
  async function updateRoute(focusHeading = true) {
    path = window.location.pathname;
    const metadata = applyMetadata(path);
    routeAnnouncement = metadata.title;
    if (focusHeading) {
      await tick();
      const heading = document.querySelector<HTMLElement>('main h1');
      if (heading) {
        heading.tabIndex = -1;
        heading.focus({ preventScroll: true });
      }
    }
  }
  onMount(() => {
    captureLicense();
    applyMetadata(path);
    const update = () => { void updateRoute(); };
    window.addEventListener('popstate', update);
    return () => window.removeEventListener('popstate', update);
  });
  $: examMatch = path.match(/^\/exam\/([^/]+)$/);
</script>

{#if path === '/'}
  <Landing />
{:else if path === '/demo'}
  <Demo />
{:else if path === '/create'}
  <CreateExam />
{:else if examMatch}
  <ExamWorkspace examId={examMatch[1]} />
{:else if path === '/privacy' || path === '/terms'}
  <Legal page={path.slice(1) as 'privacy' | 'terms'} />
{:else}
  <NotFound />
{/if}

<div class="visually-hidden" aria-live="polite" aria-atomic="true">{routeAnnouncement}</div>
