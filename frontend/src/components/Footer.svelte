<script lang="ts">
  import { navigate } from '../lib/navigation';
</script>

<footer>
  <p><span class="signal" aria-hidden="true"></span> Evidence, not surveillance.</p>
  <nav aria-label="Footer navigation">
    <a href="/privacy" onclick={(event) => { event.preventDefault(); navigate('/privacy'); }}>Privacy</a>
    <a href="/terms" onclick={(event) => { event.preventDefault(); navigate('/terms'); }}>Terms</a>
    <a href="https://github.com/B-Divyesh/sf-humane-practical-exams">Source</a>
  </nav>
  <small>Original generated illustration · No analytics, cameras, or tracking scripts</small>
</footer>
