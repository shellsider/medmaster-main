<script>
	// Expect session data (e.g., { userId, role, ... }) via the "data" prop.
	export let data;
	import medMasterLogo from '$lib/medmaster_logo.png';
	let mobileNavOpen = false;

	function toggleMobileNav() {
		mobileNavOpen = !mobileNavOpen;
	}

	async function handleLogout() {
		try {
			// Call your signout endpoint
			await fetch('/api/auth/signout', { method: 'POST' });
			// Redirect to the home page after logout
			window.location.href = '/';
		} catch (err) {
			console.error('Logout failed', err);
		}
	}
</script>

<!-- Navbar container -->
<nav class="fixed left-0 top-0 z-50 w-full bg-white shadow-md">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="flex h-16 items-center justify-between">
			<!-- Logo / Brand -->
			<div class="flex items-center justify-start">
				<a href="/" class="flex-shrink-0">
					<img src={medMasterLogo} alt="MedMaster Logo" class="h-20 object-contain" />
				</a>
			</div>

			<!-- Desktop Nav Links -->
			<div class="hidden space-x-8 md:flex">
				<a href="/" class="text-base font-medium text-gray-700 hover:text-blue-600">Home</a>
				<a href="/dashboard" class="text-base font-medium text-gray-700 hover:text-blue-600">
					Dashboard
				</a>
				<a href="/user/auth" class="text-base font-medium text-gray-700 hover:text-blue-600">
					Signup
				</a>
			</div>

			<!-- Mobile Menu Button -->
			<div class="flex items-center md:hidden">
				<button
					type="button"
					class="inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:text-blue-600 focus:outline-none"
					on:click={toggleMobileNav}
					aria-controls="mobile-menu"
					aria-expanded={mobileNavOpen}
				>
					<svg
						class="h-6 w-6"
						stroke="currentColor"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="2"
					>
						<path
							class={mobileNavOpen ? 'hidden' : 'block'}
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M4 6h16M4 12h16M4 18h16"
						/>
						<path
							class={mobileNavOpen ? 'block' : 'hidden'}
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			<!-- If session data is present, show Logout button -->
			{#if data && data.session}
				<div>
					<button
						on:click={handleLogout}
						class="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
					>
						Logout
					</button>
				</div>
			{/if}
		</div>
	</div>

	<!-- Mobile Nav Links -->
	<div class={`md:hidden ${mobileNavOpen ? 'block' : 'hidden'}`} id="mobile-menu">
		<div class="space-y-1 bg-gray-100 px-2 pb-3 pt-2 shadow-lg">
			<a
				href="/"
				class="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-blue-100 hover:text-blue-600"
			>
				Home
			</a>
			<a
				href="/dashboard"
				class="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-blue-100 hover:text-blue-600"
			>
				Dashboard
			</a>
			<a
				href="/user/auth"
				class="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-blue-100 hover:text-blue-600"
			>
				Signup
			</a>
		</div>
	</div>
</nav>
