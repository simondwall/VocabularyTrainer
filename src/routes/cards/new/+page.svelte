<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import TagInput from '$lib/components/TagInput.svelte';
	import { initDatabase, addCard, getAllTags } from '$lib/db/database';
	import { base } from '$app/paths';
	import { goto } from '$app/navigation';
	import { ChevronLeft, Save } from '@lucide/svelte';

	let front = $state('');
	let back = $state('');
	let tags = $state<string[]>([]);
	let allTags = $state<string[]>([]);
	let saving = $state(false);
	let ready = $state(false);
	let error = $state<string | null>(null);

	onMount(async () => {
		try {
			await initDatabase(base);
			allTags = getAllTags();
			ready = true;
		} catch (e) {
			error = String(e);
		}
	});

	async function save() {
		if (!front.trim() || !back.trim()) return;
		saving = true;
		addCard(front.trim(), back.trim(), tags);
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
{:else}
	<div class="mx-auto max-w-lg">
		<Button href="{base}/cards" variant="ghost" size="sm" class="mb-4">
			<ChevronLeft class="size-4" />
			Zurück
		</Button>

		<Card>
			<CardHeader>
				<CardTitle>Neue Karte</CardTitle>
				<CardDescription>Lege eine neue Vokabelkarte an</CardDescription>
			</CardHeader>
			<CardContent class="space-y-4">
				<div class="space-y-2">
					<label for="front" class="text-sm font-medium">Vorderseite</label>
					<Input id="front" placeholder="z.B. hello" bind:value={front} />
				</div>
				<div class="space-y-2">
					<label for="back" class="text-sm font-medium">Rückseite</label>
					<Textarea id="back" placeholder="z.B. hallo" bind:value={back} rows={4} />
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
