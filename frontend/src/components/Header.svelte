<script lang="ts">
  import { navigate } from '../lib/navigation';
  export let compact = false;
  let light = false;
  function toggleTheme() {
    light = !light;
    document.documentElement.dataset.theme = light ? 'light' : 'dark';
    localStorage.setItem('hpe-theme', light ? 'light' : 'dark');
  }
  if (typeof document !== 'undefined') {
    light = (localStorage.getItem('hpe-theme') || '') === 'light';
    if (light) document.documentElement.dataset.theme = 'light';
  }
</script>

<a class="skip-link" href="#main">Skip to main content</a>
<header class:compact>
  <a class="brand" href="/" onclick={(event) => { event.preventDefault(); navigate('/'); }} aria-label="Humane Practical Exams home">
    <svg viewBox="0 0 36 36" aria-hidden="true"><path d="M5 10 18 3l13 7v16l-13 7-13-7Z"/><path d="m9 20 5 5L27 11"/></svg>
    <span>Humane <em>Practical Exams</em></span>
  </a>
  <nav aria-label="Primary navigation">
    {#if !compact}<a href="#how">How it works</a>{/if}
    <a href="/create" class="nav-action" onclick={(event) => { event.preventDefault(); navigate('/create'); }}>Create an exam</a>
    <button class="theme-button" type="button" onclick={toggleTheme} aria-label={light ? 'Use dark theme' : 'Use light theme'} title={light ? 'Use dark theme' : 'Use light theme'}>
      {light ? '◐' : '◑'}
    </button>
  </nav>
</header>
