<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Download, Upload } from '@lucide/svelte';

	let {
		onImport,
		onExport,
	}: {
		onImport: (data: Uint8Array) => void;
		onExport: () => Uint8Array | null;
	} = $props();

	let fileInput: HTMLInputElement;

	function handleFileSelect() {
		const file = fileInput.files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = () => {
			const data = new Uint8Array(reader.result as ArrayBuffer);
			onImport(data);
			fileInput.value = '';
		};
		reader.readAsArrayBuffer(file);
	}

	function handleExport() {
		const data = onExport();
		if (!data) return;
		const blob = new Blob([data as BlobPart], { type: 'application/x-sqlite3' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'vokabel_trainer.sqlite';
		a.click();
		URL.revokeObjectURL(url);
	}
</script>

<div class="flex gap-2">
	<Button variant="outline" size="sm" onclick={() => fileInput.click()}>
		<Upload class="size-4" />
		Importieren
	</Button>
	<Button variant="outline" size="sm" onclick={handleExport}>
		<Download class="size-4" />
		Exportieren
	</Button>
	<input
		type="file"
		accept=".sqlite,.db,.sqlite3"
		bind:this={fileInput}
		onchange={handleFileSelect}
		class="hidden"
	/>
</div>
