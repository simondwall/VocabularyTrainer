<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import TagInput from '$lib/components/TagInput.svelte';
	import { initDatabase, getCard, updateCard, getAllTags, getHandle } from '$lib/db/database';
	import { base } from '$app/paths';
	import { goto } from '$app/navigation';
	import { ChevronLeft, Save } from '@lucide/svelte';

	let { params } = $props();
	let cardId = $derived(Number(params.id));

	let front = $state('');
	let back = $state('');
	let tags = $state<string[]>([]);
	let allTags = $state<string[]>([]);
	let saving = $state(false);
	let ready = $state(false);
	let error = $state<string | null>(null);
	let notFound = $state(false);

	onMount(async () => {
		try {
			await initDatabase(base);
			if (!getHandle()) {
				goto(base);
				return;
			}
			const card = getCard(cardId);
			if (card) {
				front = card.front;
				back = card.back;
				tags = card.tags ? card.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];
			} else {
				notFound = true;
			}
			allTags = getAllTags();
			ready = true;
		} catch (e) {
			error = String(e);
		}
	});

	async function save() {
		if (!front.trim() || !back.trim()) return;
		saving = true;
		updateCard(cardId, front.trim(), back.trim(), tags);
		await goto(`${base}/cards`);
	}
</script>

{#if error}
	<div class="flex flex-col items-center gap-4 py-16">
		<p class="text-destructive text-lg font-medium">Fehler beim Initialisieren</p>
		<p class="text-muted-foreground text-sm">{error}</p>
		<Button href={base} variant="outline">Zurück</Button>
	</div>
{:else if !ready}
	<p class="text-muted-foreground py-16 text-center">Datenbank wird initialisiert...</p>
{:else if notFound}
	<div class="py-16 text-center">
		<p class="text-muted-foreground mb-4">Karte nicht gefunden</p>
		<Button href="{base}/cards" variant="outline">Zurück zur Übersicht</Button>
	</div>
{:else}
	<div class="mx-auto max-w-lg">
		<Button href="{base}/cards" variant="ghost" size="sm" class="mb-4">
			<ChevronLeft class="size-4" />
			Zurück
		</Button>

		<Card>
			<CardHeader>
				<CardTitle>Karte bearbeiten</CardTitle>
				<CardDescription>Ändere die Vorder- und Rückseite der Karte</CardDescription>
			</CardHeader>
			<CardContent class="space-y-4">
				<div class="space-y-2">
					<label for="front" class="text-sm font-medium">Vorderseite</label>
					<Input id="front" bind:value={front} />
				</div>
				<div class="space-y-2">
					<label for="back" class="text-sm font-medium">Rückseite</label>
					<Textarea id="back" bind:value={back} rows={4} />
				</div>
				<div class="space-y-2">
					<p class="text-sm font-medium">Tags</p>
					<TagInput bind:tags {allTags} />
				</div>
			</CardContent>
			<CardFooter>
				<Button onclick={save} disabled={!front.trim() || !back.trim() || saving}>
					<Save class="size-4" />
					Speichern
				</Button>
			</CardFooter>
		</Card>
	</div>
{/if}
