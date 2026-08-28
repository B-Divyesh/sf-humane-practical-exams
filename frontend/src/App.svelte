<script lang="ts">
  import { onMount } from 'svelte';
  import Landing from './pages/Landing.svelte';
  import CreateExam from './pages/CreateExam.svelte';
  import ExamWorkspace from './pages/ExamWorkspace.svelte';
  import Legal from './pages/Legal.svelte';
  import NotFound from './pages/NotFound.svelte';
  import { captureLicense } from './lib/license';

  let path = window.location.pathname;
  onMount(() => {
    captureLicense();
    const update = () => path = window.location.pathname;
    window.addEventListener('popstate', update);
    return () => window.removeEventListener('popstate', update);
  });
  $: examMatch = path.match(/^\/exam\/([^/]+)$/);
</script>

{#if path === '/'}
  <Landing />
{:else if path === '/create'}
  <CreateExam />
{:else if examMatch}
  <ExamWorkspace examId={examMatch[1]} />
{:else if path === '/privacy' || path === '/terms'}
  <Legal page={path.slice(1) as 'privacy' | 'terms'} />
{:else}
  <NotFound />
{/if}
