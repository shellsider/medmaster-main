<script>
	import { goto } from '$app/navigation';
	import axios from 'axios';
	import MedMasterLogo from '$lib/medmaster_logo.png';
	import HeartBeat from '$lib/heartbeat.png'; // Updated with the transparent PNG

	let mode = 'signin';
	let email = '';
	let password = '';
	let errorMessage = '';

	async function handleSubmit() {
		errorMessage = '';
		try {
			if (mode === 'signup') {
				await axios.post('/api/auth/signup', { email, password, role: 'user' });
				mode = 'signin';
			} else {
				const res = await axios.post('/api/auth/signin', { email, password });
				if (res.data.user.role !== 'user') {
					errorMessage = 'This is not a user account';
					return;
				}
				goto('/dashboard');
			}
		} catch (err) {
			errorMessage = err.response?.data?.error || err.message;
		}
	}

	function toggleMode() {
		mode = mode === 'signin' ? 'signup' : 'signin';
	}

	function goBack() {
		goto('/');
	}
</script>

<div class="flex h-screen flex-col md:flex-row">
	<!-- BACK BUTTON -->
	<button
		on:click={goBack}
		class="absolute left-4 top-4 flex items-center space-x-2 text-sm font-semibold text-white md:left-6 md:top-6"
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="h-5 w-5"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path d="M19 12H5M12 19l-7-7 7-7" />
		</svg>
		<span>Back</span>
	</button>

	<!-- LEFT (Blue) PANEL -->
	<div
		class="flex w-full flex-col items-center justify-center bg-blue-500 p-6 md:w-1/2 md:p-8 lg:p-10"
	>
		<h1 class="mb-6 text-4xl font-bold text-black md:text-5xl">
			{mode === 'signup' ? 'Sign Up' : 'Login'}
		</h1>

		<!-- White card container -->
		<div class="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
			<form on:submit|preventDefault={handleSubmit} class="flex flex-col space-y-6">
				<!-- Email Field -->
				<div>
					<label for="email" class="mb-1 block text-lg font-semibold text-gray-700">Email</label>
					<input
						id="email"
						type="email"
						bind:value={email}
						required
						class="w-full rounded-md border border-gray-300 p-3 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
					/>
				</div>

				<!-- Password Field -->
				<div>
					<label for="password" class="mb-1 block text-lg font-semibold text-gray-700"
						>Password</label
					>
					<input
						id="password"
						type="password"
						bind:value={password}
						required
						class="w-full rounded-md border border-gray-300 p-3 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
					/>
				</div>

				<!-- Error Message -->
				{#if errorMessage}
					<p class="text-sm font-medium text-red-600">{errorMessage}</p>
				{/if}

				<!-- Submit Button -->
				<button
					type="submit"
					class="w-full rounded-md bg-black py-3 text-lg font-semibold text-white hover:bg-gray-800"
				>
					{mode === 'signup' ? 'Sign Up' : 'Log In'}
				</button>

				<!-- Toggle Mode Button -->
				<button
					type="button"
					on:click={toggleMode}
					class="w-full rounded-md bg-gray-200 py-3 text-lg font-semibold text-black hover:bg-gray-300"
				>
					{mode === 'signup' ? 'Switch to Log In' : 'Switch to Sign Up'}
				</button>
			</form>
		</div>
	</div>

	<!-- RIGHT (White) PANEL -->
	<div class="hidden flex-col items-center bg-white p-6 md:flex md:w-1/2 md:p-8 lg:p-10">
		<!-- MedMasters Logo (Centered) -->
		<div class="mb-6 flex justify-center">
			<img src={MedMasterLogo} alt="MedMasters" class="h-28 object-contain md:h-32" />
		</div>

		<!-- Secure Medical Access heading -->
		<div class="mb-2 text-center text-xl font-semibold text-blue-500 md:text-2xl">
			Secure Medical Access
		</div>

		<!-- Welcome text -->
		<div class="text-center text-2xl font-bold text-blue-500 md:text-3xl">
			Welcome To Health Professional!
		</div>

		<!-- Subtext -->
		<p class="mt-4 max-w-md text-center text-gray-600">
			Access your comprehensive medical dashboard with advanced health insights.
		</p>

		<!-- Heartbeat Icon -->
		<div class="mt-8 flex justify-center">
			<img src={HeartBeat} alt="Heartbeat" class="h-36 w-36 md:h-40 md:w-40" />
		</div>
	</div>
</div>
