<script lang="ts">
  import { navigate } from '../lib/navigation';
  const build = import.meta.env.VITE_BUILD_SHA || 'dev';
</script>

<footer>
  <p><span class="signal" aria-hidden="true"></span> Run practical exams using chosen work evidence.</p>
  <nav aria-label="Footer navigation">
    <a href="/demo" onclick={(event) => { event.preventDefault(); navigate('/demo'); }}>Demo</a>
    <a href="/privacy" onclick={(event) => { event.preventDefault(); navigate('/privacy'); }}>Privacy</a>
    <a href="/terms" onclick={(event) => { event.preventDefault(); navigate('/terms'); }}>Terms</a>
  </nav>
  <small>Built by Param Factory · Version 1.1 · Build {build.slice(0, 12)} · Original generated illustration</small>
</footer>
