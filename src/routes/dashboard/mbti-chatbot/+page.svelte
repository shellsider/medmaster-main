<!-- src/routes/dashboard/mbti-chatbot/+page.svelte -->
<script>
	import { onMount } from 'svelte';

	let showQuestions = false;
	let loading = false;
	let showChatbot = false;
	let summaryPrompt = '';
	let computedMbti = '';

	// Your Botpress/chatbot iframe URL remains the same.
	let chatbotUrl =
		'https://cdn.botpress.cloud/webchat/v2.2/shareable.html?configUrl=https://files.bpcontent.cloud/2025/01/21/08/20250121085924-R8Q809X4.json';

	// 12 MBTI questions
	const questions = [
		// EI dimension questions
		{
			key: 'q1',
			dimension: 'EI',
			label: 'I gain energy from being around people and often seek out social gatherings.'
		},
		{
			key: 'q2',
			dimension: 'EI',
			label:
				'I prefer talking through ideas with others rather than thinking them through quietly on my own.'
		},
		{
			key: 'q3',
			dimension: 'EI',
			label:
				'I frequently initiate conversations and feel comfortable being the center of attention.'
		},
		// SN dimension questions
		{
			key: 'q4',
			dimension: 'SN',
			label: 'I focus on concrete details and trust what can be directly observed.'
		},
		{
			key: 'q5',
			dimension: 'SN',
			label:
				'When solving problems, I’m more interested in realistic applications than in hypothetical possibilities.'
		},
		{
			key: 'q6',
			dimension: 'SN',
			label:
				'I pay close attention to specifics (details, facts, data) rather than overarching patterns.'
		},
		// TF dimension questions
		{
			key: 'q7',
			dimension: 'TF',
			label:
				'When making decisions, I rely more on objective criteria than on personal values or others’ feelings.'
		},
		{
			key: 'q8',
			dimension: 'TF',
			label:
				'I find it relatively easy to give impartial feedback, even if it might hurt someone’s feelings.'
		},
		{
			key: 'q9',
			dimension: 'TF',
			label:
				'In conflicts, I prefer to resolve matters by calmly applying reason rather than focusing on emotions.'
		},
		// JP dimension questions
		{
			key: 'q10',
			dimension: 'JP',
			label: 'I like having a detailed plan or schedule and feel uneasy without one.'
		},
		{
			key: 'q11',
			dimension: 'JP',
			label:
				'I often complete tasks well before their deadlines rather than waiting until the last moment.'
		},
		{
			key: 'q12',
			dimension: 'JP',
			label: 'I prefer clear guidelines and defined roles over flexible or changing circumstances.'
		}
	];

	// Initialize answers (default slider value = 5 for each)
	let answers = {};
	for (let q of questions) {
		answers[q.key] = 5;
	}

	// Show questions section
	function startQuestions() {
		showQuestions = true;
	}

	// Returns a gradient background style for a slider
	function getSliderBackground(value) {
		const min = 1,
			max = 10;
		const percent = ((value - min) / (max - min)) * 100;
		return `background: linear-gradient(to right, #00C383 0%, #00C383 ${percent}%, #f0f0f0 ${percent}%, #f0f0f0 100%)`;
	}

	// Compute MBTI and percentages for each dimension.
	function computeMbtiAndPercentages() {
		let sumEI = 0,
			sumSN = 0,
			sumTF = 0,
			sumJP = 0;
		for (let q of questions) {
			const val = answers[q.key];
			switch (q.dimension) {
				case 'EI':
					sumEI += val;
					break;
				case 'SN':
					sumSN += val;
					break;
				case 'TF':
					sumTF += val;
					break;
				case 'JP':
					sumJP += val;
					break;
			}
		}

		// Each dimension has 3 questions, so the possible sum is 3 to 30.
		// Normalize each sum to a value in [0, 1]
		const normEI = (sumEI - 3) / 27;
		const normSN = (sumSN - 3) / 27;
		const normTF = (sumTF - 3) / 27;
		const normJP = (sumJP - 3) / 27;

		let letterEI, ei_I, ei_E;
		if (normEI >= 0.5) {
			letterEI = 'E';
			ei_E = Math.round(normEI * 100);
			ei_I = 100 - ei_E;
		} else {
			letterEI = 'I';
			ei_I = Math.round((1 - normEI) * 100);
			ei_E = 100 - ei_I;
		}

		let letterSN, sn_S, sn_N;
		if (normSN >= 0.5) {
			letterSN = 'S';
			sn_S = Math.round(normSN * 100);
			sn_N = 100 - sn_S;
		} else {
			letterSN = 'N';
			sn_N = Math.round((1 - normSN) * 100);
			sn_S = 100 - sn_N;
		}

		let letterTF, tf_T, tf_F;
		if (normTF >= 0.5) {
			letterTF = 'T';
			tf_T = Math.round(normTF * 100);
			tf_F = 100 - tf_T;
		} else {
			letterTF = 'F';
			tf_F = Math.round((1 - normTF) * 100);
			tf_T = 100 - tf_F;
		}

		let letterJP, jp_J, jp_P;
		if (normJP >= 0.5) {
			letterJP = 'J';
			jp_J = Math.round(normJP * 100);
			jp_P = 100 - jp_J;
		} else {
			letterJP = 'P';
			jp_P = Math.round((1 - normJP) * 100);
			jp_J = 100 - jp_P;
		}

		computedMbti = letterEI + letterSN + letterTF + letterJP;

		return {
			mbti: computedMbti,
			ei: { I: ei_I, E: ei_E },
			sn: { N: sn_N, S: sn_S },
			tf: { F: tf_F, T: tf_T },
			jp: { P: jp_P, J: jp_J }
		};
	}

	// Submit handler: compute MBTI, update database, then show chatbot.
	async function handleSubmit() {
		loading = true;

		// Compute MBTI and percentages
		const result = computeMbtiAndPercentages();

		// Build a summary prompt for copying, if needed
		let lines = [];
		lines.push(`Computed MBTI: ${result.mbti}`);
		questions.forEach((q) => {
			lines.push(`${q.label} => ${answers[q.key]}`);
		});
		summaryPrompt = `User's MBTI: ${result.mbti}. Adjust chatbot experience accordingly.`;

		// Update the user's MBTI data in the database.
		try {
			await fetch('/api/mbti/update', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(result)
			});
		} catch (err) {
			console.error('Failed to update MBTI in database', err);
		}

		// Simulate a brief loading time, then show the chatbot
		setTimeout(() => {
			loading = false;
			showChatbot = true;
		}, 1500);
	}

	// Copy prompt to clipboard
	async function copyPrompt() {
		try {
			await navigator.clipboard.writeText(summaryPrompt);
			alert('Prompt copied to clipboard!');
		} catch (error) {
			alert('Failed to copy prompt.');
			console.error(error);
		}
	}
</script>

<div class="h-full w-full">
	<!-- STEP 0: Intro Section -->
	{#if !showQuestions}
		<section class="flex h-full w-full flex-col items-center justify-center p-4">
			<div class="mx-auto max-w-2xl text-center">
				<h1 class="mb-4 text-2xl font-bold text-gray-700">
					MBTI Questionnaire – Personalized Chatbot
				</h1>
				<p class="mb-6 text-gray-600">
					Please answer these 12 questions on a scale from 1 (strongly disagree) to 10 (strongly
					agree) to help us determine your MBTI personality type.
				</p>
				<button
					on:click={startQuestions}
					class="rounded bg-[#00C383] px-6 py-3 text-white transition-colors hover:bg-green-600"
				>
					Start
				</button>
			</div>
		</section>
	{/if}

	<!-- STEP 1: MBTI Questions Form -->
	{#if showQuestions && !loading && !showChatbot}
		<section class="mx-auto max-w-2xl px-4 py-6">
			<h2 class="mb-4 text-xl font-semibold text-gray-700">
				Please rate each statement from 1 (strongly disagree) to 10 (strongly agree):
			</h2>
			{#each questions as q}
				<div class="mb-6">
					<label class="mb-2 block font-medium text-gray-700">{q.label}</label>
					<div class="relative w-full">
						<input
							type="range"
							min="1"
							max="10"
							bind:value={answers[q.key]}
							class="slider w-full"
							style={getSliderBackground(answers[q.key])}
						/>
					</div>
					<span class="mt-1 block text-sm text-gray-500">
						Current rating: {answers[q.key]}
					</span>
				</div>
			{/each}
			<button
				on:click={handleSubmit}
				class="rounded bg-[#00C383] px-6 py-3 text-white transition-colors hover:bg-green-600"
			>
				Submit
			</button>
		</section>
	{/if}

	<!-- STEP 2: Loading Spinner -->
	{#if loading}
		<div class="flex h-full w-full flex-col items-center justify-center">
			<div
				class="loader mb-4 h-16 w-16 rounded-full border-8 border-t-8 border-gray-200 ease-linear"
			></div>
			<h2 class="text-xl font-semibold text-gray-700">Calculating Your MBTI...</h2>
		</div>
	{/if}

	<!-- STEP 3: Chatbot + MBTI Display -->
	{#if showChatbot}
		<div class="mx-auto max-w-3xl p-4">
			<div class="mb-2 flex items-center gap-4">
				<h2 class="text-xl font-semibold text-gray-700">MBTI Chatbot</h2>
				<span class="inline-block rounded bg-green-100 px-3 py-1 text-green-700">
					Your MBTI is {computedMbti}
				</span>
			</div>
			<p class="mb-4 text-sm text-gray-500">
				We’ve summarized your responses. You can copy &amp; paste them into the chatbot if you like:
			</p>
			<button
				on:click={copyPrompt}
				class="mb-4 inline-block rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
			>
				Copy Prompt
			</button>
			<iframe title="MBTI Chatbot" src={chatbotUrl} class="h-[600px] w-full border border-gray-300"
			></iframe>
		</div>
	{/if}
</div>

<style>
	/* Slider styling */
	input[type='range'] {
		-webkit-appearance: none;
		-moz-appearance: none;
		appearance: none;
		width: 100%;
		height: 6px;
		border-radius: 3px;
		outline: none;
		cursor: pointer;
	}
	input[type='range']::-webkit-slider-runnable-track {
		height: 6px;
		border-radius: 3px;
	}
	input[type='range']::-webkit-slider-thumb {
		-webkit-appearance: none;
		height: 16px;
		width: 16px;
		border-radius: 9999px;
		background: #00c383;
		border: 2px solid #fff;
		box-shadow: 0 0 2px rgba(0, 0, 0, 0.2);
		margin-top: -5px;
		cursor: pointer;
	}
	input[type='range']:hover::-webkit-slider-thumb,
	input[type='range']:focus::-webkit-slider-thumb {
		background: #00a373;
	}
	input[type='range']::-moz-range-track {
		height: 6px;
		border-radius: 3px;
		background: transparent;
	}
	input[type='range']::-moz-range-thumb {
		height: 16px;
		width: 16px;
		border-radius: 9999px;
		background: #00c383;
		border: 2px solid #fff;
		box-shadow: 0 0 2px rgba(0, 0, 0, 0.2);
		cursor: pointer;
	}
	input[type='range']:hover::-moz-range-thumb,
	input[type='range']:focus::-moz-range-thumb {
		background: #00a373;
	}
	input[type='range']::-moz-range-progress {
		background-color: transparent;
	}
	.loader {
		border-top-color: #00c383;
		animation: spinner 1s linear infinite;
	}
	@keyframes spinner {
		to {
			transform: rotate(360deg);
		}
	}
</style>
