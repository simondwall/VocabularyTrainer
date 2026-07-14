<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card as CardUI, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import FileActions from '$lib/components/FileActions.svelte';
	import {
		initDatabase, reloadDatabase, setHandle, getHandle, exportDatabase,
		getStats, closeAndReset, writeFile,
		loadHandle, readFile, loadLegacyData, removeLegacyData
	} from '$lib/db/database';
	import { base } from '$app/paths';
	import type { AppState } from '$lib/types';
	import { BookOpen, Brain, TrendingUp, Database, FileUp, FolderOpen } from '@lucide/svelte';

	let appState: AppState = $state('loading');
	let stats = $state({ total: 0, due: 0, learned: 0, newCards: 0 });
	let error: string | null = $state(null);
	let fsaSupported = $state(false);
	let pendingHandle: FileSystemFileHandle | null = $state(null);

	onMount(async () => {
		fsaSupported = 'showDirectoryPicker' in window || 'showOpenFilePicker' in window;
		try {
			await initDatabase(base);
			const handle = await loadHandle();
			if (handle && typeof handle.queryPermission !== 'function') {
				await setHandle(null);
				appState = await checkLegacy();
				return;
			}
			if (handle) {
				const permission = await handle.queryPermission({ mode: 'readwrite' });
				if (permission === 'granted') {
					await loadFromHandle(handle);
				} else if (permission === 'prompt') {
					pendingHandle = handle;
					appState = 'permission-needed';
				} else {
					await setHandle(null);
					appState = await checkLegacy();
				}
			} else {
				appState = await checkLegacy();
			}
		} catch (e) {
			error = String(e);
			appState = 'error';
		}
	});

	async function loadFromHandle(handle: FileSystemFileHandle) {
		const data = await readFile(handle);
		await reloadDatabase(data);
		await setHandle(handle);
		stats = getStats();
		appState = 'ready';
		pendingHandle = null;
	}

	async function handleGrantPermission() {
		if (!pendingHandle) return;
		try {
			const permission = await pendingHandle.requestPermission({ mode: 'readwrite' });
			if (permission === 'granted') {
				await loadFromHandle(pendingHandle);
			} else {
				await setHandle(null);
				pendingHandle = null;
				appState = await checkLegacy();
			}
		} catch (e) {
			error = String(e);
			appState = 'error';
		}
	}

	async function checkLegacy(): Promise<AppState> {
		const legacy = await loadLegacyData();
		return legacy ? 'migration' : 'file-picker';
	}

	async function handleNew() {
		try {
			const handle = await window.showSaveFilePicker({
				suggestedName: 'vokabel_trainer.sqlite',
				types: [{ description: 'SQLite Database', accept: { 'application/vnd.sqlite3': ['.sqlite'] } }]
			});
			await reloadDatabase(new Uint8Array(0));
			await setHandle(handle);
			stats = getStats();
			appState = 'ready';
		} catch (e) {
			if ((e as DOMException).name === 'AbortError') return;
			error = String(e);
			appState = 'error';
		}
	}

	async function handleOpen() {
		try {
			const [handle] = await window.showOpenFilePicker({
				types: [{ description: 'SQLite Database', accept: { 'application/vnd.sqlite3': ['.sqlite'] } }]
			});
			const data = await readFile(handle);
			await reloadDatabase(data);
			await setHandle(handle);
			stats = getStats();
			appState = 'ready';
		} catch (e) {
			if ((e as DOMException).name === 'AbortError') return;
			error = String(e);
			appState = 'error';
		}
	}

	async function handleSaveAs() {
		try {
			const data = exportDatabase();
			if (!data) return;
			const handle = await window.showSaveFilePicker({
				suggestedName: 'vokabel_trainer.sqlite',
				types: [{ description: 'SQLite Database', accept: { 'application/vnd.sqlite3': ['.sqlite'] } }]
			});
			await writeFile(handle, data);
		} catch (e) {
			if ((e as DOMException).name === 'AbortError') return;
			error = String(e);
			appState = 'error';
		}
	}

	async function handleClose() {
		closeAndReset();
		await initDatabase(base);
		appState = 'file-picker';
	}

	async function handleMigrate() {
		const legacy = await loadLegacyData();
		if (!legacy) return;
		try {
			const handle = await window.showSaveFilePicker({
				suggestedName: 'vokabel_trainer.sqlite',
				types: [{ description: 'SQLite Database', accept: { 'application/vnd.sqlite3': ['.sqlite'] } }]
			});
			await writeFile(handle, legacy);
			await reloadDatabase(legacy);
			await setHandle(handle);
			await removeLegacyData();
			stats = getStats();
			appState = 'ready';
		} catch (e) {
			if ((e as DOMException).name === 'AbortError') return;
			error = String(e);
			appState = 'error';
		}
	}

	async function handleDiscardLegacy() {
		await removeLegacyData();
		appState = 'file-picker';
	}

	function refreshStats() {
		stats = getStats();
	}
</script>

{#if appState === 'error'}
	<div class="flex flex-col items-center gap-4 py-16">
		<p class="text-destructive text-lg font-medium">Fehler</p>
		<p class="text-muted-foreground text-sm">{error}</p>
		<Button variant="outline" onclick={() => appState = 'file-picker'}>Zurück</Button>
	</div>
{:else if appState === 'loading'}
	<p class="text-muted-foreground py-16 text-center">Datenbank wird initialisiert...</p>
{:else if appState === 'migration'}
	<div class="mx-auto flex max-w-md flex-col items-center gap-6 py-16 text-center">
		<Database class="size-12 text-blue-500" />
		<h2 class="text-xl font-bold">Vorhandene Daten gefunden</h2>
		<p class="text-muted-foreground">
			Es wurden Daten aus einer früheren Version gefunden.
			Speichere sie in einer Datei, um sie weiterzunutzen.
		</p>
		<div class="flex gap-3">
			<Button onclick={handleMigrate}>
				<FileUp class="size-4" />
				In Datei speichern
			</Button>
			<Button variant="outline" onclick={handleDiscardLegacy}>
				Verwerfen
			</Button>
		</div>
	</div>
{:else if appState === 'permission-needed'}
	<div class="mx-auto flex max-w-md flex-col items-center gap-6 py-16 text-center">
		<Database class="size-16 text-blue-500" />
		<h2 class="text-xl font-bold">Berechtigung erforderlich</h2>
		<p class="text-muted-foreground">
			Der Vokabeltrainer benötigt Zugriff auf die zuletzt geöffnete Datei.
			Klicke auf den Button, um die Berechtigung zu erteilen.
		</p>
		<Button onclick={handleGrantPermission}>
			<FolderOpen class="size-4" />
			Zugriff erlauben
		</Button>
	</div>
{:else if appState === 'file-picker'}
	<div class="mx-auto flex max-w-md flex-col items-center gap-6 py-16 text-center">
		<Database class="size-16 text-blue-500" />
		<h1 class="text-2xl font-bold">Vokabeltrainer</h1>
		{#if !fsaSupported}
			<div class="bg-destructive/10 text-destructive border-destructive/20 rounded-xl border p-4 text-sm">
				Dein Browser unterstützt die File System Access API nicht.
				Bitte verwende Chrome, Edge oder einen anderen Chromium-basierten Browser.
			</div>
		{/if}
		<p class="text-muted-foreground">
			Wähle eine vorhandene Vokabeldatenbank oder erstelle eine neue.
		</p>
		<div class="flex gap-3">
			<Button onclick={handleNew} disabled={!fsaSupported}>
				<Database class="size-4" />
				Neue Datenbank
			</Button>
			<Button variant="outline" onclick={handleOpen} disabled={!fsaSupported}>
				<FolderOpen class="size-4" />
				Vorhandene öffnen
			</Button>
		</div>
	</div>
{:else if appState === 'ready'}
	<div class="mb-6 sm:flex sm:items-center sm:justify-between">
		<div>
			<h1 class="text-2xl font-bold">Dashboard</h1>
			<p class="text-muted-foreground mt-1">Willkommen beim Vokabeltrainer</p>
		</div>
		<div class="mt-3 sm:mt-0">
			<FileActions onNew={handleNew} onOpen={handleOpen} onSaveAs={handleSaveAs} onClose={handleClose} />
		</div>
		{#if !fsaSupported}
			<div class="bg-destructive/10 text-destructive border-destructive/20 mt-3 rounded-xl border p-3 text-xs">
				Datei-Funktionen nicht verfügbar – bitte Chrome/Edge verwenden.
			</div>
		{/if}
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
