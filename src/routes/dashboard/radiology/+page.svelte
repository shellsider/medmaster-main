<script>
	import axios from 'axios';

	let file = null;
	let language = 'en'; // Default to English; user can toggle to "hi" for Hindi
	let inference = '';
	let audioSrc = '';
	let isLoading = false;
	let error = '';
	let imageUrl = null; // For image preview

	async function handleUpload() {
		if (!file) {
			error = 'Please upload an image or PDF file.';
			return;
		}
		// Clear previous results and errors
		inference = '';
		audioSrc = '';
		error = '';
		isLoading = true;

		const formData = new FormData();
		formData.append('file', file);
		formData.append('language', language);

		try {
			const response = await axios.post('/api/radiology', formData, {
				headers: { 'Content-Type': 'multipart/form-data' }
			});
			// Response includes { inference: "...", audio: "BASE64_STRING" }
			inference = response.data.inference;
			audioSrc = 'data:audio/mp3;base64,' + response.data.audio;
		} catch (err) {
			console.error(err);
			error = 'An error occurred while analyzing the image.';
		} finally {
			isLoading = false;
		}
	}

	function handleFileChange(e) {
		file = e.target.files[0];
		imageUrl = file ? URL.createObjectURL(file) : null; // Generate preview URL
	}
</script>

<div class="container mx-auto px-4 py-8">
	<!-- Header -->
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-3xl font-bold text-gray-800">Radiology Inference Analyzer</h1>
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
				Upload an Image or PDF File (PNG, JPEG, JPG, PDF)
			</label>
			<input
				id="file"
				type="file"
				accept=".png,.jpeg,.jpg,.pdf"
				on:change={handleFileChange}
				class="mt-2 w-full rounded-lg border-gray-300 p-3 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-300"
			/>
		</div>

		<!-- Image Preview -->
		{#if imageUrl}
			<div class="mb-4 flex justify-center">
				<img src={imageUrl} alt="Uploaded Preview" class="max-w-full rounded-lg shadow-md" />
			</div>
		{/if}

		{#if error}
			<p class="mb-4 text-sm text-red-500">{error}</p>
		{/if}

		<button
			on:click={handleUpload}
			class="w-full rounded-lg bg-blue-600 px-6 py-3 font-medium text-white shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
			disabled={isLoading}
		>
			{isLoading ? 'Analyzing...' : 'Analyze'}
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
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
				<path
					class="opacity-75"
					fill="currentColor"
					d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
				/>
			</svg>
			<span class="ml-2">Analyzing...</span>
		</div>
	{/if}

	<!-- Inference Section -->
	{#if inference && !isLoading}
		<div class="mt-8 rounded-lg bg-gray-100 p-6 shadow-lg">
			<h2 class="mb-4 text-xl font-bold text-gray-800">Radiology Inference</h2>
			<p class="whitespace-pre-wrap text-gray-700">{inference}</p>
			{#if audioSrc}
				<div class="mt-4 flex items-center space-x-2">
					<span class="font-medium text-gray-700">For Audio:</span>
					<audio controls class="w-full max-w-sm">
						<source src={audioSrc} type="audio/mp3" />
						Your browser does not support the audio element.
					</audio>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	/* Additional custom styles */
	img {
		max-height: 300px;
		object-fit: contain;
		border: 1px solid #e5e7eb; /* Light gray border */
	}
	audio {
		max-width: 100%;
		outline: none;
	}
</style>
