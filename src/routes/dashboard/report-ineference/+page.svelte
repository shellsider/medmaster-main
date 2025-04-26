<script>
	import axios from 'axios';
	import { marked } from 'marked';

	let file = null;
	let language = 'en'; // Default language is English ("hi" for Hindi)
	let generatedInference = '';
	let generatedInferenceHtml = '';
	let isLoading = false;
	let error = '';

	// Convert the generated inference to HTML
	$: {
		let text = generatedInference;
		if (language === 'hi') {
			text = text.replace(/[–—]/g, '-');
		}
		generatedInferenceHtml = marked(text, { breaks: true });
	}

	async function handleFileUpload() {
		if (!file) {
			error = 'Please upload a file (PNG, JPEG, or PDF).';
			return;
		}
		// Clear previous results and errors.
		generatedInference = '';
		error = '';
		isLoading = true;

		const formData = new FormData();
		formData.append('file', file);
		formData.append('language', language);

		try {
			const response = await axios.post('/api/report-inference', formData, {
				headers: { 'Content-Type': 'multipart/form-data' }
			});
			generatedInference = response.data.result;
		} catch (err) {
			console.error(err);
			error = 'An error occurred while generating the inference.';
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="container mx-auto px-4 py-8">
	<!-- Header -->
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-3xl font-bold text-gray-800">Report Inference Analyzer</h1>
		<div class="flex items-center space-x-4">
			<span class="font-medium text-gray-700">ENG</span>
			<label class="relative inline-flex cursor-pointer items-center">
				<input
					type="checkbox"
					checked={language === 'hi'}
					on:change={() => (language = language === 'en' ? 'hi' : 'en')}
					class="peer sr-only"
				/>
				<div
					class="peer h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-blue-600 peer-focus:ring-4 peer-focus:ring-blue-300"
				></div>
				<span
					class="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-all peer-checked:left-6"
				></span>
			</label>

			<span class="font-medium text-gray-700">हिंदी</span>
		</div>
	</div>

	<!-- File Upload Section -->
	<div class="mx-auto max-w-lg rounded-lg bg-white p-6 shadow-lg">
		<div class="mb-4">
			<label class="block text-lg font-medium text-gray-700" for="file">
				Upload an X-ray or PDF file (PNG, JPEG, PDF)
			</label>
			<input
				id="file"
				type="file"
				accept=".png,.jpeg,.jpg,.pdf"
				on:change={(e) => {
					file = e.target.files[0];
				}}
				class="mt-2 w-full rounded-lg border-gray-300 p-3 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-300"
			/>
		</div>

		{#if error}
			<p class="mb-4 text-sm text-red-500">{error}</p>
		{/if}

		<button
			on:click={handleFileUpload}
			class="w-full rounded-lg bg-blue-600 px-6 py-3 font-medium text-white shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
			disabled={isLoading}
		>
			{isLoading ? 'Generating Inference...' : 'Analyze'}
		</button>
	</div>

	<!-- Loading Spinner -->
	{#if isLoading}
		<div class="mt-6 flex justify-center">
			<svg
				class="h-8 w-8 animate-spin text-blue-500"
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
			>
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
				></circle>
				<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
				></path>
			</svg>
			<span class="ml-2">Analyzing...</span>
		</div>
	{/if}

	<!-- Inference Section -->
	{#if generatedInference && !isLoading}
		<div class="mt-8 rounded-lg bg-gray-100 p-6 shadow-lg">
			<h2 class="mb-4 text-xl font-bold text-gray-800">Generated Inference</h2>
			<div class="prose max-w-full text-gray-800">
				{@html generatedInferenceHtml}
			</div>
		</div>
	{/if}
</div>

<style>
	/* Styling for toggles and inference */
	.prose table {
		width: 100%;
		border-collapse: collapse;
		margin-top: 1rem;
	}
	.prose th,
	.prose td {
		border: 1px solid #ddd;
		padding: 0.5rem;
		text-align: left;
	}
	.prose th {
		background-color: #f2f2f2;
	}
	.prose pre {
		background-color: #f7f7f7;
		padding: 1rem;
		overflow-x: auto;
	}
</style>
