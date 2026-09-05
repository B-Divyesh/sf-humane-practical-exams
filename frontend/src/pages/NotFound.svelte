<script lang="ts">import Header from '../components/Header.svelte'; import Footer from '../components/Footer.svelte'; import { navigate } from '../lib/navigation';</script>
<Header compact />
<main id="main" class="empty-page" tabindex="-1"><p class="eyebrow"><span></span> Error 404</p><h1>We could not find this page</h1><p>Check the address. A candidate or assessor link must include its complete access token.</p><a class="button primary" href="/" onclick={(event) => { event.preventDefault(); navigate('/'); }}>Return home</a></main>
<Footer />
