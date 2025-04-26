<script>
	import { onMount } from 'svelte';
	import posePkg from '@mediapipe/pose';
	import drawingUtilsPkg from '@mediapipe/drawing_utils';
	import cameraUtilsPkg from '@mediapipe/camera_utils';

	const { Pose, POSE_CONNECTIONS } = posePkg;
	const { drawConnectors, drawLandmarks } = drawingUtilsPkg;
	const { Camera } = cameraUtilsPkg;

	let exerciseType = 'Bench Press';
	let inputSource = 'Webcam';
	let uploadedFile = null;
	let videoFileUrl = null;

	let started = false;
	let stopped = false;
	let count = 0;
	let calories = 0;
	let isActive = false;
	let lastRepTime = 0;

	const caloriesPerRep = {
		'Bench Press': 0.08,
		'Bicep Curls': 0.04,
		'Lateral Raises': 0.04,
		Squats: 0.08,
		'Push-ups': 0.4,
		'Shoulder Presses': 0.05
	};

	let pose = null;
	let camera = null;

	let videoElement;
	let canvasElement;
	let canvasCtx;

	function calculateAngle(a, b, c) {
		const ba = [a.x - b.x, a.y - b.y];
		const bc = [c.x - b.x, c.y - b.y];
		const dotProduct = ba[0] * bc[0] + ba[1] * bc[1];
		const magBA = Math.sqrt(ba[0] ** 2 + ba[1] ** 2);
		const magBC = Math.sqrt(bc[0] ** 2 + bc[1] ** 2);
		const cosAngle = dotProduct / (magBA * magBC);
		return Math.acos(Math.min(Math.max(cosAngle, -1.0), 1.0)) * (180 / Math.PI);
	}

	function onResults(results) {
		if (!results.poseLandmarks) return;

		canvasCtx.save();
		canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
		canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

		drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {
			color: '#00FF00',
			lineWidth: 4
		});
		drawLandmarks(canvasCtx, results.poseLandmarks, {
			color: '#FF0000',
			lineWidth: 2
		});

		canvasCtx.fillStyle = '#00FF00';
		canvasCtx.font = '20px Arial';
		canvasCtx.fillText(`Reps: ${count}`, 50, 50);
		canvasCtx.fillText(`Calories: ${calories.toFixed(2)} kcal`, 50, 80);
		canvasCtx.restore();

		const ls = results.poseLandmarks;
		const L_SHOULDER = ls[11];
		const L_ELBOW = ls[13];
		const L_WRIST = ls[15];
		const L_HIP = ls[23];
		const L_KNEE = ls[25];
		const L_ANKLE = ls[27];

		if (!L_SHOULDER || !L_ELBOW || !L_WRIST || !L_HIP || !L_KNEE || !L_ANKLE) {
			return;
		}

		const now = Date.now();
		const timeDiff = now - lastRepTime;

		if (exerciseType === 'Bench Press') {
			const angle = calculateAngle(L_SHOULDER, L_ELBOW, L_WRIST);
			if (angle < 90 && !isActive) {
				isActive = true;
			} else if (angle > 160 && isActive && timeDiff > 500) {
				count++;
				calories += caloriesPerRep[exerciseType] || 0;
				isActive = false;
				lastRepTime = now;
			}
		} else if (exerciseType === 'Bicep Curls') {
			const angle = calculateAngle(L_SHOULDER, L_ELBOW, L_WRIST);
			if (angle < 45 && !isActive) {
				isActive = true;
			} else if (angle > 160 && isActive && timeDiff > 500) {
				count++;
				calories += caloriesPerRep[exerciseType] || 0;
				isActive = false;
				lastRepTime = now;
			}
		} else if (exerciseType === 'Lateral Raises') {
			const angle = calculateAngle(L_SHOULDER, L_ELBOW, L_WRIST);
			if (angle > 90 && !isActive) {
				isActive = true;
			} else if (angle < 40 && isActive && timeDiff > 500) {
				count++;
				calories += caloriesPerRep[exerciseType] || 0;
				isActive = false;
				lastRepTime = now;
			}
		} else if (exerciseType === 'Squats') {
			const kneeAngle = calculateAngle(L_HIP, L_KNEE, L_ANKLE);
			console.log('Knee angle', kneeAngle);
			if (kneeAngle < 140 && !isActive) {
				isActive = true;
			} else if (kneeAngle > 170 && isActive && timeDiff > 500) {
				count++;
				calories += caloriesPerRep[exerciseType] || 0;
				isActive = false;
				lastRepTime = now;
			}
		} else if (exerciseType === 'Push-ups') {
			if (L_SHOULDER.y > L_ELBOW.y) {
				isActive = true;
			} else if (L_SHOULDER.y < L_ELBOW.y && isActive && timeDiff > 500) {
				count++;
				calories += caloriesPerRep[exerciseType] || 0;
				isActive = false;
				lastRepTime = now;
			}
		} else if (exerciseType === 'Shoulder Presses') {
			if (L_ELBOW.y > L_SHOULDER.y) {
				isActive = true;
			} else if (L_ELBOW.y < L_SHOULDER.y && isActive && timeDiff > 500) {
				count++;
				calories += caloriesPerRep[exerciseType] || 0;
				isActive = false;
				lastRepTime = now;
			}
		}
	}

	function startCounting() {
		count = 0;
		calories = 0;
		isActive = false;
		stopped = false;
		started = true;

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

		if (inputSource === 'Webcam') {
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
		} else {
			videoElement.play();
			requestAnimationFrame(analyzeVideoFrame);
		}
	}

	function stopCounting() {
		stopped = true;
		started = false;
		if (camera) {
			camera.stop();
		}
		videoElement.pause();
	}

	async function analyzeVideoFrame() {
		if (stopped || inputSource === 'Webcam') {
			return;
		}
		await pose.send({ image: videoElement });
		if (!videoElement.paused && !videoElement.ended) {
			requestAnimationFrame(analyzeVideoFrame);
		}
	}

	function handleFileSelect(event) {
		const input = event.target;
		if (!input.files || input.files.length === 0) return;
		uploadedFile = input.files[0];
		videoFileUrl = URL.createObjectURL(uploadedFile);
	}

	onMount(() => {
		canvasCtx = canvasElement.getContext('2d');
	});
</script>

<div class="container mx-auto rounded-lg bg-white p-6 shadow-lg">
	<h1 class="mb-6 text-center text-2xl font-bold">AI-Fitness Tracking</h1>
	<div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
		<div>
			<h2 class="mb-2 text-lg font-semibold">Settings</h2>
			<div class="mb-4">
				<label class="block font-semibold">Select Exercise</label>
				<select class="mt-1 w-full rounded border p-2" bind:value={exerciseType}>
					<option>Bench Press</option>
					<option>Bicep Curls</option>
					<option>Lateral Raises</option>
					<option>Squats</option>
					<option>Push-ups</option>
					<option>Shoulder Presses</option>
				</select>
			</div>
			<div class="mb-4">
				<label class="block font-semibold">Input Source</label>
				<div class="mt-2 flex items-center space-x-4">
					<label class="flex items-center">
						<input type="radio" class="mr-2" bind:group={inputSource} value="Webcam" />
						Webcam
					</label>
					<label class="flex items-center">
						<input type="radio" class="mr-2" bind:group={inputSource} value="Upload Video" />
						Upload Video
					</label>
				</div>
			</div>
			{#if inputSource === 'Upload Video'}
				<div class="mb-4">
					<label class="block font-semibold">Upload your workout video</label>
					<input
						type="file"
						accept="video/*"
						class="mt-2 w-full rounded border p-2"
						on:change={handleFileSelect}
					/>
				</div>
			{/if}
			<button
				class="mb-4 w-full rounded bg-blue-600 py-2 text-white hover:bg-blue-700"
				on:click={startCounting}
			>
				Start
			</button>
			<button
				class="w-full rounded bg-red-600 py-2 text-white hover:bg-red-700"
				on:click={stopCounting}
			>
				Stop
			</button>
		</div>
		<div class="flex flex-col items-center">
			<video
				bind:this={videoElement}
				class="mb-4 w-full rounded bg-black"
				src={videoFileUrl}
				muted
				playsinline
			></video>
			<canvas bind:this={canvasElement} class="h-auto w-full" width="640" height="480"></canvas>
			<div class="mt-4 text-lg font-semibold">
				<p>Total Reps: {count}</p>
				<p>Calories Burned: {calories.toFixed(2)} kcal</p>
			</div>
		</div>
	</div>
</div>
