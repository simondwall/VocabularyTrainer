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

<div class="flex gap-2">
	<Button variant="outline" size="sm" onclick={onNew}>
		<Plus class="size-4" />
		Neu
	</Button>
	<Button variant="outline" size="sm" onclick={onOpen}>
		<FolderOpen class="size-4" />
		Öffnen
	</Button>
	<Button variant="outline" size="sm" onclick={onSaveAs}>
		<Save class="size-4" />
		Speichern unter...
	</Button>
	<Button variant="outline" size="sm" onclick={onClose}>
		<LogOut class="size-4" />
		Schließen
	</Button>
</div>
