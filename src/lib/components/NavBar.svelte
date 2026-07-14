<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { base } from '$app/paths';
	import { page } from '$app/stores';
	import { Book, Home, GraduationCap } from '@lucide/svelte';

	const links = [
		{ href: `${base}/`, label: 'Dashboard', icon: Home },
		{ href: `${base}/study`, label: 'Lernen', icon: GraduationCap },
		{ href: `${base}/cards`, label: 'Karten', icon: Book },
	];
</script>

<nav class="border-b border-border bg-background px-4 py-3">
	<div class="mx-auto flex max-w-4xl items-center gap-2">
		<span class="mr-4 text-lg font-bold">VokabelTrainer</span>
		<div class="flex gap-1">
			{#each links as { href, label, icon: Icon }}
				<Button
					{href}
					variant={$page.url.pathname === href ? 'default' : 'ghost'}
					size="sm"
				>
					<Icon class="size-4" />
					{label}
				</Button>
			{/each}
		</div>
	</div>
</nav>
