<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { initDatabase, getAllCards, deleteCard, getHandle } from '$lib/db/database';
	import { base } from '$app/paths';
	import { goto } from '$app/navigation';
	import type { Card } from '$lib/types';
	import { Plus, Edit, Trash2 } from '@lucide/svelte';

	let cards = $state<Card[]>([]);
	let ready = $state(false);
	let error = $state<string | null>(null);

	onMount(async () => {
		try {
			await initDatabase(base);
			if (!getHandle()) {
				goto(base);
				return;
			}
			cards = getAllCards();
			ready = true;
		} catch (e) {
			error = String(e);
		}
	});

	function handleDelete(id: number) {
		if (!confirm('Karte wirklich löschen?')) return;
		deleteCard(id);
		cards = getAllCards();
	}

	function dueLabel(card: Card): string {
		const today = new Date().toISOString().split('T')[0];
		if (card.repetitions === 0) return 'Neu';
		if (card.due_date <= today) return 'Fällig';
		return `Wiederholung am ${card.due_date}`;
	}

	function dueVariant(card: Card): 'default' | 'secondary' | 'outline' | 'destructive' {
		const today = new Date().toISOString().split('T')[0];
		if (card.repetitions === 0) return 'outline';
		if (card.due_date <= today) return 'destructive';
		return 'secondary';
	}

	function tagList(card: Card): string[] {
		return card.tags ? card.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];
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
{:else}
	<div class="mb-6 flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold">Karten</h1>
			<p class="text-muted-foreground mt-1">Alle Vokabelkarten verwalten</p>
		</div>
		<Button href="{base}/cards/new">
			<Plus class="size-4" />
			Neue Karte
		</Button>
	</div>

	{#if cards.length === 0}
		<div class="py-16 text-center">
			<p class="text-muted-foreground mb-4">Noch keine Karten vorhanden</p>
			<Button href="{base}/cards/new">Erste Karte anlegen</Button>
		</div>
	{:else}
		<div class="space-y-2">
			{#each cards as card (card.id)}
				<div class="bg-card text-card-foreground border-border flex items-start justify-between rounded-xl border p-4">
					<div class="min-w-0 flex-1">
						<div class="flex items-start gap-4">
							<div class="min-w-0 flex-1">
								<p class="font-medium">{card.front}</p>
								<p class="text-muted-foreground truncate text-sm">{card.back}</p>
								{#if tagList(card).length > 0}
									<div class="mt-1.5 flex flex-wrap gap-1">
										{#each tagList(card) as tag}
											<Badge variant="outline" class="text-[10px]">{tag}</Badge>
										{/each}
									</div>
								{/if}
							</div>
							<Badge variant={dueVariant(card)} class="shrink-0">
								{dueLabel(card)}
							</Badge>
						</div>
					</div>
					<div class="ml-4 flex shrink-0 gap-1">
						<Button variant="ghost" size="icon-sm" aria-label="Bearbeiten" href="{base}/cards/{card.id}/edit">
							<Edit class="size-4" />
						</Button>
						<Button variant="ghost" size="icon-sm" aria-label="Löschen" onclick={() => handleDelete(card.id)}>
							<Trash2 class="size-4 text-destructive" />
						</Button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
{/if}
