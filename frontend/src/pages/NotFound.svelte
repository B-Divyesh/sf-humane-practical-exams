<script lang="ts">import Header from '../components/Header.svelte'; import Footer from '../components/Footer.svelte'; import { navigate } from '../lib/navigation';</script>
<Header compact />
<main id="main" class="empty-page"><p class="eyebrow"><span></span> 404</p><h1>This evidence trail ends here.</h1><p>The page may have moved, or the capability link is incomplete.</p><a class="button primary" href="/" onclick={(event) => { event.preventDefault(); navigate('/'); }}>Return home</a></main>
<Footer />
