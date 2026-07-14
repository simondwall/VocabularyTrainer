<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Plus, FolderOpen, Save, LogOut } from '@lucide/svelte';

	let {
		onNew,
		onOpen,
		onSaveAs,
		onClose,
	}: {
		onNew: () => void;
		onOpen: () => void;
		onSaveAs: () => void;
		onClose: () => void;
	} = $props();
</script>

<div class="flex flex-wrap gap-2">
	<Button variant="outline" size="sm" onclick={onNew}>
		<Plus class="size-4" />
		<span class="hidden sm:inline">Neu</span>
	</Button>
	<Button variant="outline" size="sm" onclick={onOpen}>
		<FolderOpen class="size-4" />
		<span class="hidden sm:inline">Öffnen</span>
	</Button>
	<Button variant="outline" size="sm" onclick={onSaveAs}>
		<Save class="size-4" />
		<span class="hidden sm:inline">Speichern unter...</span>
	</Button>
	<Button variant="outline" size="sm" onclick={onClose}>
		<LogOut class="size-4" />
		<span class="hidden sm:inline">Schließen</span>
	</Button>
</div>
