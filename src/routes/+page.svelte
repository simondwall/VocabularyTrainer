<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card as CardUI, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import FileActions from '$lib/components/FileActions.svelte';
	import { getStats } from '$lib/db/database';
	import { initDatabase, exportDatabase, importDatabase } from '$lib/db/database';
	import { base } from '$app/paths';
	import type { Stats } from '$lib/types';
	import { BookOpen, Brain, TrendingUp } from '@lucide/svelte';

	let stats = $state<Stats>({ total: 0, due: 0, learned: 0, newCards: 0 });
	let ready = $state(false);
	let error = $state<string | null>(null);

	onMount(async () => {
		try {
			await initDatabase(base);
			stats = getStats();
			ready = true;
		} catch (e) {
			error = String(e);
		}
	});

	function refreshStats() {
		stats = getStats();
	}

	async function handleImport(data: Uint8Array) {
		await importDatabase(data);
		refreshStats();
	}

	function handleExport() {
		return exportDatabase();
	}
</script>

{#if error}
	<div class="flex flex-col items-center gap-4 py-16">
		<p class="text-destructive text-lg font-medium">Fehler beim Initialisieren</p>
		<p class="text-muted-foreground text-sm">{error}</p>
	</div>
{:else if !ready}
	<p class="text-muted-foreground py-16 text-center">Datenbank wird initialisiert...</p>
{:else}
	<div class="mb-6 flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold">Dashboard</h1>
			<p class="text-muted-foreground mt-1">Willkommen beim Vokabeltrainer</p>
		</div>
		<FileActions onImport={handleImport} onExport={handleExport} />
	</div>

	<div class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
		<div class="bg-card text-card-foreground border-border rounded-xl border p-4">
			<div class="flex items-center gap-2">
				<BookOpen class="size-5 text-blue-500" />
				<span class="text-muted-foreground text-sm">Total</span>
			</div>
			<p class="mt-1 text-2xl font-bold">{stats.total}</p>
		</div>
		<div class="bg-card text-card-foreground border-border rounded-xl border p-4">
			<div class="flex items-center gap-2">
				<Brain class="size-5 text-orange-500" />
				<span class="text-muted-foreground text-sm">Fällig</span>
			</div>
			<p class="mt-1 text-2xl font-bold">{stats.due}</p>
		</div>
		<div class="bg-card text-card-foreground border-border rounded-xl border p-4">
			<div class="flex items-center gap-2">
				<TrendingUp class="size-5 text-green-500" />
				<span class="text-muted-foreground text-sm">Gelernt</span>
			</div>
			<p class="mt-1 text-2xl font-bold">{stats.learned}</p>
		</div>
		<div class="bg-card text-card-foreground border-border rounded-xl border p-4">
			<div class="flex items-center gap-2">
				<BookOpen class="size-5 text-purple-500" />
				<span class="text-muted-foreground text-sm">Neu</span>
			</div>
			<p class="mt-1 text-2xl font-bold">{stats.newCards}</p>
		</div>
	</div>

	<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
		<CardUI>
			<CardHeader>
				<CardTitle>Weiterlernen</CardTitle>
				<CardDescription>
					{stats.due > 0 ? `${stats.due} Karte${stats.due === 1 ? '' : 'n'} fällig` : 'Alle Karten sind auf dem neuesten Stand'}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Button class="w-full" href={stats.due > 0 ? `${base}/study` : undefined} disabled={stats.due === 0}>
					Jetzt lernen ({stats.due})
				</Button>
			</CardContent>
		</CardUI>

		<CardUI>
			<CardHeader>
				<CardTitle>Karten verwalten</CardTitle>
				<CardDescription>Neue Karten anlegen oder bestehende bearbeiten</CardDescription>
			</CardHeader>
			<CardContent class="flex gap-2">
				<Button variant="default" href="{base}/cards/new">Neue Karte</Button>
				<Button variant="outline" href="{base}/cards">Alle Karten</Button>
			</CardContent>
		</CardUI>
	</div>
{/if}
