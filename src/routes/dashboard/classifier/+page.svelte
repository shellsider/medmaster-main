<script>
	import axios from 'axios';

	let file = null;
	let selectedModel = 'brain'; // Default model type
	let inference = '';
	let summary = ''; // For detailed tumor information
	let isLoading = false;
	let error = '';
	let imageUrl = null; // For image preview

	// Tumor summaries
	const tumorSummaries = {
		meningioma: `Meningioma is a type of tumor that arises from the meninges, the membranous layers surrounding the brain and spinal cord. While most meningiomas are benign, some can be malignant or atypical. Common symptoms include headaches, seizures, and neurological deficits depending on the tumor's location. Treatment often involves surgery, radiation, or a combination of both.`,
		glioma: `Glioma is a broad category of tumors that originate in the glial cells of the brain or spinal cord. It includes astrocytomas, oligodendrogliomas, and glioblastomas. Symptoms may include headaches, nausea, cognitive difficulties, and seizures. Gliomas are typically treated with surgery, chemotherapy, and radiation therapy.`,
		pituitary: `Pituitary tumors develop in the pituitary gland, a small organ at the base of the brain responsible for regulating hormones. While most pituitary tumors are benign, they can cause hormonal imbalances, vision problems, and headaches. Treatments may include medication, surgery, or radiation therapy, depending on the tumor's size and activity.`,
		notumor: `Congratulations! Based on the model's analysis, there are no indications of a brain tumor in the provided scan. However, if you are experiencing any concerning symptoms, it is always advisable to consult a medical professional for further evaluation and reassurance.`
	};

	async function handleUpload() {
		if (!file) {
			error = 'Please upload an image file.';
			return;
		}
		error = '';
		inference = '';
		summary = '';
		isLoading = true;

		const formData = new FormData();
		formData.append('file', file);
		formData.append('modelType', selectedModel);

		try {
			const response = await axios.post('/api/classify', formData, {
				headers: { 'Content-Type': 'multipart/form-data' }
			});
			const prediction = response.data.prediction;
			inference = `The Model deems this image as: ${prediction}`;
			summary =
				tumorSummaries[prediction] || 'No detailed information available for this prediction.';
		} catch (err) {
			console.error(err);
			error = 'An error occurred while generating the inference.';
		} finally {
			isLoading = false;
		}
	}

	function handleFileChange(e) {
		file = e.target.files[0];
		imageUrl = file ? URL.createObjectURL(file) : null;
	}
</script>

<div class="container mx-auto px-4 py-8">
	<!-- Header -->
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-3xl font-bold text-gray-800">Brain Tumor Diagnostic Tool</h1>
		<div class="flex items-center space-x-4">
			<label class="mr-2 font-semibold text-gray-700">Select Model:</label>
			<select
				bind:value={selectedModel}
				class="rounded border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-300"
			>
				<option value="brain">Brain Tumor</option>
			</select>
		</div>
	</div>

	<!-- File Upload Section -->
	<div class="mx-auto max-w-lg rounded-lg bg-white p-6 shadow-lg">
		<div class="mb-4">
			<label class="block text-lg font-medium text-gray-700" for="file">
				Upload an Image File (PNG, JPEG, JPG)
			</label>
			<input
				id="file"
				type="file"
				accept=".png,.jpeg,.jpg"
				on:change={handleFileChange}
				class="mt-2 w-full rounded-lg border-gray-300 p-3 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-300"
			/>
		</div>

		<!-- Image Preview -->
		{#if imageUrl}
			<div class="mb-4 flex justify-center">
				<img src={imageUrl} alt="Preview" class="max-w-full rounded-lg shadow-md" />
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
			<h2 class="mb-4 text-xl font-bold text-gray-800">AI Inference</h2>
			<p class="whitespace-pre-wrap text-gray-700">{inference}</p>
			<p class="mt-4 text-gray-700">{summary}</p>
		</div>
	{/if}
</div>

<style>
	/* Additional custom styling for image preview */
	img {
		max-height: 300px;
		object-fit: contain;
	}
</style>
