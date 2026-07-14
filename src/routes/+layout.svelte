<script lang="ts">
	import './layout.css';
	import NavBar from '$lib/components/NavBar.svelte';

	let { children } = $props();
</script>

<NavBar />
<main class="mx-auto max-w-4xl px-4 py-6">
	{@render children()}
</main>
