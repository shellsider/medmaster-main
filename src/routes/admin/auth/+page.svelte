<!-- src/routes/admin/auth/+page.svelte -->
<script>
	import { goto } from '$app/navigation';
	import axios from 'axios';

	let mode = 'signin'; // toggles between signin and signup
	let email = '';
	let password = '';
	let errorMessage = '';

	async function handleSubmit() {
		errorMessage = '';
		try {
			if (mode === 'signup') {
				// For admin sign up, include role: 'admin'
				await axios.post('/api/auth/signup', { email, password, role: 'admin' });
				mode = 'signin';
			} else {
				const res = await axios.post('/api/auth/signin', { email, password });
				// Ensure the returned user is admin
				if (res.data.user.role !== 'admin') {
					errorMessage = 'This is not an admin account';
					return;
				}
				goto('/admin/dashboard');
			}
		} catch (err) {
			errorMessage = err.response?.data?.error || err.message;
		}
	}
</script>

<div class="mx-auto max-w-md p-4">
	<h1 class="text-center text-2xl font-bold">
		Admin {mode === 'signup' ? 'Sign Up' : 'Sign In'}
	</h1>
	<form on:submit|preventDefault={handleSubmit} class="flex flex-col space-y-4">
		<input
			type="email"
			placeholder="Email"
			bind:value={email}
			required
			class="rounded border p-2"
		/>
		<input
			type="password"
			placeholder="Password"
			bind:value={password}
			required
			class="rounded border p-2"
		/>
		<button type="submit" class="rounded bg-blue-600 p-2 text-white">
			{mode === 'signup' ? 'Sign Up' : 'Sign In'}
		</button>
	</form>
	{#if errorMessage}
		<p class="mt-2 text-red-600">{errorMessage}</p>
	{/if}
	<button
		on:click={() => (mode = mode === 'signup' ? 'signin' : 'signup')}
		class="mt-4 text-sm text-blue-600"
	>
		{mode === 'signup' ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
	</button>
</div>
