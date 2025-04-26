<script>
	import axios from 'axios';
	let file = null;
	let language = 'en'; // default to English
	let inference = '';
	let audioSrc = '';
	let isLoading = false;
	let error = '';

	async function handleUpload() {
		if (!file) {
			error = 'Please upload an image or PDF file.';
			return;
		}
		error = '';
		inference = '';
		audioSrc = '';
		isLoading = true;

		const formData = new FormData();
		formData.append('file', file);
		formData.append('language', language);

		try {
			const response = await axios.post('/api/ai-doctor', formData, {
				headers: { 'Content-Type': 'multipart/form-data' }
			});
			// Response contains { inference: "...", audio: "BASE64_STRING" }
			inference = response.data.inference;
			audioSrc = 'data:audio/mp3;base64,' + response.data.audio;
		} catch (err) {
			console.error(err);
			error = 'An error occurred while generating the inference.';
		} finally {
			isLoading = false;
		}
	}

	function handleFileChange(e) {
		file = e.target.files[0];
	}
</script>

<div class="mx-auto flex max-w-2xl flex-col items-center p-4 sm:p-6">
	<h1 class="mb-6 text-center text-2xl font-bold">AI Doctor</h1>

	<!-- File input -->
	<input
		type="file"
		accept=".png,.jpg,.jpeg,.pdf"
		on:change={handleFileChange}
		class="mb-4 w-full rounded border p-2"
	/>

	<!-- Language selection -->
	<div class="mb-4">
		<label class="mr-2 font-semibold">Select Language:</label>
		<select bind:value={language} class="rounded border p-1">
			<option value="en">English</option>
			<option value="hi">Hindi</option>
		</select>
	</div>

	{#if error}
		<p class="mb-4 text-red-500">{error}</p>
	{/if}

	<button
		on:click={handleUpload}
		class="w-full rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50 sm:w-auto"
		disabled={isLoading}
	>
		{isLoading ? 'Analysing' : 'Analyze'}
	</button>

	{#if isLoading}
		<div class="mt-4 flex items-center">
			<svg
				class="mr-2 h-6 w-6 animate-spin text-blue-500"
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
			>
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
				></circle>
				<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
				></path>
			</svg>
			<span>Analysing</span>
		</div>
	{/if}

	{#if inference && !isLoading}
		<div class="mt-6 w-full rounded bg-gray-100 p-6 shadow">
			<h2 class="mb-4 text-xl font-bold">AI Doctor Inference</h2>
			<p class="whitespace-pre-wrap">{inference}</p>
			{#if audioSrc}
				<audio controls class="mt-4" src={audioSrc}></audio>
			{/if}
		</div>
	{/if}
</div>

<style>
	/* Additional styling if needed */
</style>
