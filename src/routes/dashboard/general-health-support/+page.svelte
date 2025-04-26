<script>
	import axios from 'axios';
	import { marked } from 'marked';

	let symptoms = '';
	let language = 'en'; // Default is English, "hi" for Hindi
	let recommendation = '';
	let recommendationHtml = '';
	let audioSrc = '';
	let isLoading = false;
	let error = '';
	let isPlaying = false; // Tracks if the audio is playing
	let audioElement = null; // Reference to the audio element

	// Convert the recommendation text (Markdown) to HTML.
	$: {
		let cleanText = recommendation.replace(/^'+|'+$/g, '');
		if (language === 'hi') {
			cleanText = cleanText.replace(/[–—]/g, '-');
		}
		recommendationHtml = marked(cleanText, { breaks: true });
	}

	async function getRecommendation() {
		if (!symptoms) {
			error = 'Please enter your symptoms.';
			return;
		}
		error = '';
		recommendation = '';
		audioSrc = '';
		isLoading = true;

		const formData = new FormData();
		formData.append('symptoms', symptoms);
		formData.append('language', language);

		try {
			const response = await axios.post('/api/genral-health-support', formData, {
				headers: { 'Content-Type': 'multipart/form-data' }
			});
			recommendation = response.data.recommendation;
			audioSrc = 'data:audio/mp3;base64,' + response.data.audio;
		} catch (err) {
			console.error(err);
			error = 'An error occurred while getting the recommendation.';
		} finally {
			isLoading = false;
		}
	}

	function toggleAudio() {
		if (!audioElement) {
			audioElement = new Audio(audioSrc);
			audioElement.addEventListener('ended', () => {
				isPlaying = false; // Reset state when the audio ends
			});
		}

		if (isPlaying) {
			audioElement.pause();
		} else {
			audioElement.play();
		}
		isPlaying = !isPlaying;
	}
</script>

<div class="container mx-auto px-4 py-8">
	<!-- Header with Language Toggle -->
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-3xl font-bold text-gray-800">Telemedicine Recommender</h1>
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

	<!-- Input Section -->
	<div class="mx-auto max-w-lg rounded-lg bg-white p-6 shadow-lg">
		<div class="mb-4">
			<label for="symptoms" class="block text-lg font-medium text-gray-700">
				Enter your chief complaints
			</label>
			<input
				id="symptoms"
				type="text"
				bind:value={symptoms}
				placeholder="e.g., fever, cough, headache"
				class="mt-2 w-full rounded-lg border-gray-300 p-3 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-300"
			/>
		</div>

		{#if error}
			<p class="mb-4 text-sm text-red-500">{error}</p>
		{/if}

		<button
			on:click={getRecommendation}
			class="w-full rounded-lg bg-blue-600 px-6 py-3 font-medium text-white shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
			disabled={isLoading}
		>
			{isLoading ? 'Fetching Recommendations...' : 'Get Recommendation'}
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
			<span class="ml-2">Fetching Recommendations...</span>
		</div>
	{/if}

	<!-- Recommendation Section -->
	{#if recommendation && !isLoading}
		<div class="mt-8 rounded-lg bg-gray-100 p-6 shadow-lg">
			<h2 class="mb-4 text-xl font-bold text-gray-800">Recommended Medicines and Remedies:</h2>
			<div class="prose max-w-full text-gray-800">
				{@html recommendationHtml}
			</div>
			{#if audioSrc}
				<div class="mt-8 flex flex-col items-center rounded-lg bg-gray-200 p-4">
					<span class="mb-2 font-medium text-gray-700">For Audio:</span>
					<button
						on:click={toggleAudio}
						class="flex h-16 w-16 items-center justify-center rounded-full bg-blue-500 shadow-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							class="h-8 w-8 text-white"
						>
							<path d="M11 5L6 9H2v6h4l5 4V5zm10 4v6m-4-6v6" />
						</svg>
					</button>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
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
