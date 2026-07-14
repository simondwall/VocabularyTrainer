<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import type { Card } from '$lib/types';

	let {
		card,
		flipped = $bindable(false),
	}: { card: Card; flipped?: boolean } = $props();

	function toggle() {
		flipped = !flipped;
	}

	let tags = $derived(
		card.tags ? card.tags.split(',').map((t) => t.trim()).filter(Boolean) : []
	);
</script>

<div
	class="cursor-pointer select-none"
	style="perspective: 1000px; height: 250px;"
	onclick={toggle}
	onkeydown={(e) => e.key === 'Enter' && toggle()}
	role="button"
	tabindex="0"
	aria-label={flipped ? 'Vorderseite anzeigen' : 'Rückseite anzeigen'}
>
	<div
		class="relative size-full"
		style="transition: transform 0.4s ease; transform-style: preserve-3d; {flipped ? 'transform: rotateY(180deg);' : ''}"
	>
		<div
			class="bg-card text-card-foreground border-border flex w-full flex-col items-center justify-center rounded-xl border p-6"
			style="position: absolute; inset: 0; backface-visibility: hidden;"
		>
			<span class="text-muted-foreground text-xs font-medium">Vorderseite</span>
			<p class="mt-2 text-lg">{card.front}</p>
		</div>
		<div
			class="bg-card text-card-foreground border-border flex w-full flex-col items-center justify-center rounded-xl border p-6"
			style="position: absolute; inset: 0; backface-visibility: hidden; transform: rotateY(180deg);"
		>
			<span class="text-muted-foreground text-xs font-medium">Rückseite</span>
			<p class="mt-2 text-lg">{card.back}</p>
			{#if tags.length > 0}
				<div class="mt-3 flex flex-wrap justify-center gap-1">
					{#each tags as tag}
						<Badge variant="outline" class="text-[10px]">{tag}</Badge>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>
