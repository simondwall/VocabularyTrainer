<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import type { Rating } from '$lib/types';

	let { onRate }: { onRate: (rating: Rating) => void } = $props();

	const ratings: { value: Rating; label: string; color: string }[] = [
		{ value: 'again', label: 'Again', color: 'destructive' },
		{ value: 'hard', label: 'Hard', color: 'secondary' },
		{ value: 'good', label: 'Good', color: 'default' },
		{ value: 'easy', label: 'Easy', color: 'default' },
	];
</script>

<div class="flex justify-center gap-2">
	{#each ratings as { value, label, color }}
		<Button
			variant={color === 'destructive' ? 'destructive' : color === 'secondary' ? 'secondary' : color === 'default' ? 'default' : 'default'}
			onclick={() => onRate(value)}
		>
			{label}
		</Button>
	{/each}
</div>
