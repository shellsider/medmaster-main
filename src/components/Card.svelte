<script>
	export let title;
	export let description;
	export let link;

	import { goto } from '$app/navigation';

	function handleClick() {
		goto(link);
	}
</script>

<div
	class="flex h-full min-h-[200px] flex-col justify-between
		   rounded-xl bg-white p-4 shadow-md transition-all duration-300
		   hover:scale-105 hover:shadow-xl"
>
	<h2 class="mb-2 text-xl font-bold text-gray-900">
		{title}
	</h2>
	<p class="flex-grow leading-relaxed text-gray-700">
		{description}
	</p>
	<button
		on:click={handleClick}
		class="mt-3 self-start rounded-lg bg-[#002057] px-4 py-2 text-white
			   transition-all duration-300 hover:bg-[#00a373] hover:shadow-md"
	>
		More Info
	</button>
</div>
