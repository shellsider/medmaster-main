<!-- +page.svelte -->
<script>
	import { onMount } from 'svelte';
	import posePkg from '@mediapipe/pose';
	import drawingUtilsPkg from '@mediapipe/drawing_utils';
	import cameraUtilsPkg from '@mediapipe/camera_utils';
	const GIMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
	import TPose from '../../../lib/tpose.png';
	import WarriorPose from '../../../lib/warriorpose.png';
	import TreePose from '../../../lib/treepose.png';

	// Example: If you must import "google.generativeai" in the browser
	// (In practice, you'd often place this in a server route or use a different library)
	import { GoogleGenerativeAI } from '@google/generative-ai';
	let genAI;
	let responseText = '';

	// You will need to handle environment variables carefully in the client.
	const GEMINI_API_KEY = GIMINI_API_KEY; // <--- Replace with your real key or server-based approach

	// Configure Generative AI
	genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

	// Destructure MediaPipe Pose packages
	const { Pose, POSE_CONNECTIONS } = posePkg;
	const { drawConnectors, drawLandmarks } = drawingUtilsPkg;
	const { Camera } = cameraUtilsPkg;

	// -------------------------------------
	// Svelte State Variables
	// -------------------------------------
	let userProblem = '';
	let advice = '';
	let inputType = 'Live Feed'; // "Live Feed" or "Upload Image"
	let suggestedPose = ''; // e.g. "Warrior II Pose", "Tree Pose", or "T Pose"
	let referenceImage = null; // Points to matched image if found
	let images = {
		'Warrior II Pose': 'warriorpose.png',
		'Tree Pose': 'treepose.png',
		'T Pose': 'tpose.png'
	};

	// New state variable to hold the current detected pose (real-time)
	let currentDetectedPose = 'Unknown Pose';

	// Variables for the uploaded photo detection result
	let uploadedPhotoResult = '';
	let uploadedPhotoURL = '';

	let started = false;
	let stopped = false;

	// For MediaPipe & webcam usage
	let videoElement;
	let canvasElement;
	let canvasCtx;

	let camera = null;
	let pose = null;

	// For file upload
	let uploadedFile = null;
	// let videoFileUrl = null; // Not used in this example

	// -------------------------------------
	// Generate Pose Advice using Gemini API
	// -------------------------------------
	async function getPostureAdvice(issue) {
		try {
			// Example prompt
			const prompt = `Suggest a yoga pose from three yoga poses only: Warrior II Pose, Tree Pose, or T Pose 
                        based on this issue: ${issue}. 
                        Provide some info based on user_input not more than 2 lines 
                        also provide 4 step instruction to perform this.
                        without any astrix, and without any special characters 
                        `;

			// Using gemini-pro model (example)
			const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

			const response = await model.generateContent(prompt);
			console.log('response', response?.response?.candidates[0]?.content?.parts[0]?.text);

			if (response && response.response) {
				return response?.response?.candidates[0]?.content?.parts[0]?.text;
			} else {
				return 'Could not generate a response. Try again.';
			}
		} catch (error) {
			console.error('Gemini API Error:', error);
			return 'Error calling Gemini API.';
		}
	}

	// -------------------------------------
	// Button: "Get Yoga Pose Suggestion"
	// -------------------------------------
	async function handleGetSuggestion() {
		advice = await getPostureAdvice(userProblem);

		// Attempt to detect which pose was suggested
		for (const poseName of Object.keys(images)) {
			if (advice.includes(poseName)) {
				suggestedPose = poseName;
				console.log(suggestedPose);
				if (suggestedPose === 'Tree Pose') {
					referenceImage = TreePose;
				} else if (suggestedPose === 'Warrior II Pose') {
					referenceImage = WarriorPose;
				} else if (suggestedPose === 'T Pose' || suggestedPose === 'T pose') {
					referenceImage = TPose;
				}
				break;
			}
		}
	}

	// ---------------------
	// Pose Classification
	// ---------------------
	function calculateAngle(a, b, c) {
		const ba = [a.x - b.x, a.y - b.y];
		const bc = [c.x - b.x, c.y - b.y];
		const dotProduct = ba[0] * bc[0] + ba[1] * bc[1];
		const magBA = Math.sqrt(ba[0] * ba[0] + ba[1] * ba[1]);
		const magBC = Math.sqrt(bc[0] * bc[0] + bc[1] * bc[1]);
		const cosAngle = dotProduct / (magBA * magBC);
		const angle = Math.acos(Math.min(Math.max(cosAngle, -1.0), 1.0)) * (180 / Math.PI);
		return angle;
	}

	// Updated classification logic
	function classifyPose(landmarks) {
		let label = 'Unknown Pose';

		const leftElbowAngle = calculateAngle(landmarks[11], landmarks[13], landmarks[15]);
		const rightElbowAngle = calculateAngle(landmarks[12], landmarks[14], landmarks[16]);
		const leftShoulderAngle = calculateAngle(landmarks[13], landmarks[11], landmarks[23]);
		const rightShoulderAngle = calculateAngle(landmarks[24], landmarks[12], landmarks[14]);
		const leftKneeAngle = calculateAngle(landmarks[23], landmarks[25], landmarks[27]);
		const rightKneeAngle = calculateAngle(landmarks[24], landmarks[26], landmarks[28]);

		// If arms are straight:
		if (leftElbowAngle > 165 && rightElbowAngle > 165) {
			// T Pose: both knees nearly fully extended (≥165°)
			if (leftKneeAngle >= 165 && rightKneeAngle >= 165) {
				label = 'T Pose';
			}
			// Warrior II Pose: one knee clearly bent (between 60° and 120°)
			else if (
				(leftKneeAngle < 120 && leftKneeAngle > 60) ||
				(rightKneeAngle < 120 && rightKneeAngle > 60)
			) {
				label = 'Warrior II Pose';
			}
		}
		// Tree Pose: One leg is extended and the other is bent significantly
		if (
			(leftKneeAngle < 90 && rightKneeAngle >= 165) ||
			(rightKneeAngle < 90 && leftKneeAngle >= 165)
		) {
			label = 'Tree Pose';
		}

		return label;
	}

	// Helper to get the reference image for a given pose name
	function getImageForPose(poseName) {
		if (poseName === 'Tree Pose') return TreePose;
		if (poseName === 'Warrior II Pose') return WarriorPose;
		if (poseName === 'T Pose') return TPose;
		return null;
	}

	// --------------------------------
	// Process single image (Upload)
	// --------------------------------
	function handleFileSelect(event) {
		const files = event.target.files;
		if (!files || !files.length) return;
		uploadedFile = files[0];
		// Store a URL for display in the UI
		uploadedPhotoURL = URL.createObjectURL(uploadedFile);

		const reader = new FileReader();
		reader.onload = () => {
			const arrayBuffer = reader.result;
			processUploadedImage(arrayBuffer);
		};
		reader.readAsArrayBuffer(uploadedFile);
	}

	async function processUploadedImage(arrayBuffer) {
		// Convert array buffer to image data
		const bytes = new Uint8Array(arrayBuffer);
		let img = new Image();
		const blob = new Blob([bytes], { type: uploadedFile.type });
		// Use the same URL we set for display
		const url = uploadedPhotoURL;

		img.onload = async () => {
			// Draw to an offscreen canvas for Pose detection
			const offCanvas = document.createElement('canvas');
			offCanvas.width = img.width;
			offCanvas.height = img.height;
			const offCtx = offCanvas.getContext('2d');
			offCtx.drawImage(img, 0, 0);

			// Use Pose in static_image_mode
			if (!pose) {
				pose = new Pose({
					locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
				});
				pose.setOptions({
					staticImageMode: true,
					minDetectionConfidence: 0.5
				});
			}

			pose.onResults((results) => {
				if (results.poseLandmarks) {
					// Draw detected landmarks on the main canvas (for display)
					canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
					canvasCtx.drawImage(img, 0, 0, canvasElement.width, canvasElement.height);

					drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {
						color: '#00FF00',
						lineWidth: 4
					});
					drawLandmarks(canvasCtx, results.poseLandmarks, { color: '#FF0000', lineWidth: 2 });

					// Classify and update the real-time detected pose variable
					const detectedPose = classifyPose(results.poseLandmarks);
					console.log('Detected Pose:', detectedPose);
					// For live feed we update currentDetectedPose,
					// for uploaded photos we store the result separately:
					uploadedPhotoResult = detectedPose;
				}
			});

			await pose.send({ image: offCanvas });
			// We do not revoke the URL immediately so that the UI can display the uploaded image
		};
		img.src = url;
	}

	// -------------------------
	// Live Pose Detection
	// -------------------------
	function startLiveDetection() {
		started = true;
		stopped = false;
		if (!pose) {
			pose = new Pose({
				locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
			});
			pose.setOptions({
				modelComplexity: 1,
				smoothLandmarks: true,
				enableSegmentation: false,
				smoothSegmentation: true,
				minDetectionConfidence: 0.5,
				minTrackingConfidence: 0.5
			});
			pose.onResults(onResults);
		}

		if (!camera) {
			camera = new Camera(videoElement, {
				onFrame: async () => {
					await pose.send({ image: videoElement });
				},
				width: 640,
				height: 480
			});
		}
		camera.start();
	}

	function onResults(results) {
		if (!results.poseLandmarks) {
			return;
		}
		// Draw to canvas
		canvasCtx.save();
		canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
		canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

		drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {
			color: '#00FF00',
			lineWidth: 4
		});
		drawLandmarks(canvasCtx, results.poseLandmarks, { color: '#FF0000', lineWidth: 2 });
		canvasCtx.restore();

		// Classify and update the real-time detected pose variable
		const detectedPose = classifyPose(results.poseLandmarks);
		currentDetectedPose = detectedPose;
	}

	function stopLiveDetection() {
		started = false;
		stopped = true;
		if (camera) {
			camera.stop();
		}
	}

	// ---------------
	// onMount Setup
	// ---------------
	onMount(() => {
		// Prepare canvas context
		canvasCtx = canvasElement.getContext('2d');
	});
</script>

<!-- Tailwind container for styling -->
<div class="container mx-auto p-4">
	<h1 class="mb-4 text-2xl font-bold">AI-Powered Yoga Suggestion</h1>

	<!-- Sidebar-like controls -->
	<div class="mb-4 rounded bg-gray-100 p-4">
		<label class="mb-2 block font-semibold">Describe your pain or posture issue:</label>
		<textarea
			bind:value={userProblem}
			placeholder="Describe your issue..."
			class="mb-4 w-full rounded border border-gray-300 p-2"
		></textarea>

		<button
			on:click={handleGetSuggestion}
			class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
		>
			Get Yoga Pose Suggestion
		</button>

		{#if advice}
			<div class="mt-4 rounded border border-gray-200 bg-white p-2">
				<h2 class="text-lg font-semibold">Suggested Pose / Info</h2>
				<p class="whitespace-pre-line text-sm">{advice}</p>
			</div>
		{/if}
	</div>

	<div class="mb-4 rounded bg-gray-100 p-4">
		<!-- Show reference image if we found a matched pose -->
		{#if referenceImage}
			<h2 class="mb-2 font-semibold">Reference Pose</h2>
			<img
				src={referenceImage}
				alt="Reference Pose"
				class="mb-4 w-1/2 rounded border border-gray-300"
			/>
		{/if}

		<label class="mb-2 block font-semibold">Choose Input Type</label>
		<div class="mb-4 flex items-center space-x-4">
			<label class="inline-flex items-center">
				<input type="radio" class="mr-2" bind:group={inputType} value="Live Feed" />
				Live Feed
			</label>
			<!-- <label class="inline-flex items-center">
				<input type="radio" class="mr-2" bind:group={inputType} value="Upload Image" />
				Upload Image
			</label> -->
		</div>

		{#if inputType === 'Live Feed'}
			<!-- Live feed controls -->
			<button
				on:click={startLiveDetection}
				class="mr-2 rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600"
			>
				Start Live Feed
			</button>
			<button
				on:click={stopLiveDetection}
				class="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
			>
				Stop Live Feed
			</button>
		{:else if inputType === 'Upload Image'}
			<!-- File uploader -->
			<div class="mb-2">
				<label class="mb-2 block font-semibold">Upload an image (jpg, png, jpeg)</label>
				<input
					type="file"
					accept="image/*"
					on:change={handleFileSelect}
					class="rounded border border-gray-300 p-2"
				/>
			</div>
		{/if}
	</div>

	<!-- Flex container for the webcam feed and real-time pose scanner -->
	<div class="flex flex-wrap gap-4">
		<!-- Video & Canvas Container -->
		<div class="relative mb-4 w-full max-w-xl rounded border border-gray-200">
			<video
				bind:this={videoElement}
				autoplay
				muted
				playsinline
				class="w-full bg-black"
				width="640"
				height="480"
			></video>
			<canvas
				bind:this={canvasElement}
				class="pointer-events-none absolute left-0 top-0 h-full w-full"
				width="640"
				height="480"
			></canvas>
		</div>

		<!-- Real-Time Pose Scanner Panel -->
		<div class="h-60 w-80 rounded border border-gray-200 p-4">
			<h2 class="mb-2 text-lg font-semibold">Real-Time Pose Scanner</h2>
			<p class="mb-2">
				Detected Pose: <span class="font-bold">{currentDetectedPose}</span>
			</p>
			{#if getImageForPose(currentDetectedPose)}
				<img
					src={getImageForPose(currentDetectedPose)}
					alt="Detected Pose Reference"
					class="h-auto w-full"
				/>
			{/if}
		</div>
	</div>

	<!-- Uploaded Photo Detection Results -->
	{#if inputType === 'Upload Image' && uploadedPhotoURL}
		<div class="mt-4 rounded bg-gray-100 p-4">
			<h2 class="mb-2 text-lg font-semibold">Uploaded Photo Detection</h2>
			<div class="flex flex-col items-center">
				<img
					src={uploadedPhotoURL}
					alt="Uploaded Photo"
					class="mb-2 max-w-md rounded border border-gray-300"
				/>
				<p class="text-lg">Detected Pose: <span class="font-bold">{uploadedPhotoResult}</span></p>
			</div>
		</div>
	{/if}
</div>

<style>
	/* Tailwind classes are used; add any additional custom CSS here if you like */
</style>
