<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { X } from '@lucide/svelte';

	let {
		tags = $bindable([] as string[]),
		allTags = [] as string[],
		placeholder = 'Tag hinzufügen...',
	}: {
		tags?: string[];
		allTags?: string[];
		placeholder?: string;
	} = $props();

	let input = $state('');
	let showDropdown = $state(false);
	let inputEl: HTMLInputElement;

	let filtered = $derived(
		input.trim()
			? allTags.filter(
					(t) => t.toLowerCase().includes(input.toLowerCase()) && !tags.includes(t)
				)
			: []
	);

	function addTag(tag: string) {
		const t = tag.trim().toLowerCase();
		if (!t || tags.includes(t)) return;
		tags = [...tags, t];
		input = '';
		showDropdown = false;
		inputEl.focus();
	}

	function removeTag(tag: string) {
		tags = tags.filter((t) => t !== tag);
	}

	function onKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ',') {
			e.preventDefault();
			if (filtered.length > 0) {
				addTag(filtered[0]);
			} else if (input.trim()) {
				addTag(input.trim());
			}
		} else if (e.key === 'Backspace' && !input && tags.length > 0) {
			tags = tags.slice(0, -1);
		} else if (e.key === 'Escape') {
			showDropdown = false;
		}
	}

	function onBlur() {
		setTimeout(() => (showDropdown = false), 200);
	}
</script>

<div class="border-border bg-background ring-offset-background focus-within:ring-ring flex flex-wrap items-center gap-1.5 rounded-lg border px-2 py-1.5 text-sm focus-within:ring-2 focus-within:ring-offset-1">
	{#each tags as tag}
		<Badge variant="secondary" class="flex items-center gap-1 py-0.5 pl-2 pr-1 text-xs">
			{tag}
			<button
				class="hover:text-foreground ml-0.5 inline-flex cursor-pointer text-muted-foreground"
				onclick={() => removeTag(tag)}
				aria-label={`${tag} entfernen`}
			>
				<X class="size-3" />
			</button>
		</Badge>
	{/each}
	<div class="relative min-w-[120px] grow">
		<input
			bind:this={inputEl}
			type="text"
			bind:value={input}
			oninput={() => (showDropdown = true)}
			onkeydown={onKeyDown}
			onfocus={() => (showDropdown = true)}
			onblur={onBlur}
			placeholder={tags.length === 0 ? placeholder : ''}
			class="w-full bg-transparent py-0.5 text-sm outline-none placeholder:text-muted-foreground"
		/>
		{#if showDropdown && filtered.length > 0}
			<div class="bg-popover text-popover-foreground border-border absolute left-0 top-full z-50 mt-1 max-h-40 w-full overflow-y-auto rounded-lg border shadow-sm">
				{#each filtered as tag}
					<button
						class="hover:bg-muted w-full cursor-pointer px-3 py-1.5 text-left text-sm"
						onmousedown={() => addTag(tag)}
					>
						{tag}
					</button>
				{/each}
			</div>
		{/if}
	</div>
</div>
