<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import CardView from '$lib/components/CardView.svelte';
	import RatingButtons from '$lib/components/RatingButtons.svelte';
	import { initDatabase, getDueCards, reviewCard, getHandle } from '$lib/db/database';
	import { base } from '$app/paths';
	import { goto } from '$app/navigation';
	import type { Card, Rating } from '$lib/types';
	import { ChevronLeft } from '@lucide/svelte';

	let cards = $state<Card[]>([]);
	let currentIndex = $state(0);
	let ready = $state(false);
	let error = $state<string | null>(null);
	let flipped = $state(false);
	let finished = $state(false);

	onMount(async () => {
		try {
			await initDatabase(base);
			if (!getHandle()) {
				goto(base);
				return;
			}
			cards = getDueCards();
			if (cards.length === 0) {
				finished = true;
			}
			ready = true;
		} catch (e) {
			error = String(e);
		}
	});

	function handleRate(rating: Rating) {
		const card = cards[currentIndex];
		if (!card) return;
		reviewCard(card.id, rating);
		flipped = false;

		if (currentIndex < cards.length - 1) {
			currentIndex++;
		} else {
			const remaining = getDueCards();
			if (remaining.length > 0 && currentIndex < cards.length - 1) {
				currentIndex++;
			} else {
				finished = true;
			}
		}
	}

	function restart() {
		cards = getDueCards();
		currentIndex = 0;
		flipped = false;
		finished = false;
		if (cards.length === 0) {
			finished = true;
		}
	}
</script>

{#if error}
	<div class="flex flex-col items-center gap-4 py-16">
		<p class="text-destructive text-lg font-medium">Fehler beim Initialisieren</p>
		<p class="text-muted-foreground text-sm">{error}</p>
		<Button href={base} variant="outline">Zum Dashboard</Button>
	</div>
{:else if !ready}
	<p class="text-muted-foreground py-16 text-center">Datenbank wird initialisiert...</p>
{:else if finished}
	<div class="flex flex-col items-center gap-4 py-16">
		<h2 class="text-2xl font-bold">Lerneinheit abgeschlossen!</h2>
		<p class="text-muted-foreground">Alle fälligen Karten wurden wiederholt</p>
		<div class="flex gap-2">
			<Button onclick={restart}>Nochmal lernen</Button>
			<Button href={base} variant="outline">Zum Dashboard</Button>
		</div>
	</div>
{:else}
	<div class="mx-auto max-w-lg">
		<div class="mb-4 flex items-center justify-between">
			<Button href={base} variant="ghost" size="sm">
				<ChevronLeft class="size-4" />
				Zurück
			</Button>
			<span class="text-muted-foreground text-sm">
				{currentIndex + 1} / {cards.length}
			</span>
		</div>

		<div class="mb-6">
			<CardView card={cards[currentIndex]} bind:flipped />
		</div>

		{#if flipped}
			<RatingButtons onRate={handleRate} />
		{/if}
	</div>
{/if}
