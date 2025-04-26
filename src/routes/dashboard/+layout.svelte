<!-- src/routes/dashboard/+layout.svelte -->
<script>
	import { goto } from '$app/navigation';
	import { writable } from 'svelte/store';
	import MedMasterLogo from '$lib/medmaster_logo.png';
	// Receive minimal session data from the server load function (only used for auth/Logout)
	export let data;

	// Store the current utility title (default: "Dashboard")
	export let currentUtility = writable('Dashboard');

	// Menu items for the sidebar
	const menuItems = [
		{ title: 'Dashboard', icon: 'M3 12h18M3 6h18M3 18h18', path: '/dashboard' },
		{
			title: 'General Health Support',
			icon: 'M5 13l4 4L19 7',
			path: '/dashboard/general-health-support'
		},
		{
			title: 'Report Inference Generator',
			icon: 'M15 10l4.5 4.5M9 10l-4.5 4.5',
			path: '/dashboard/report-ineference'
		},
		{
			title: 'MBTI Mental Health Chatbot',
			icon: 'M12 4v16M4 12h16',
			path: '/dashboard/mbti-chatbot'
		},
		{ title: 'Exercise', icon: 'M9 12h6', path: '/dashboard/exercise' },
		{ title: 'Yoga', icon: 'M15 10l4.5 4.5M9 10l-4.5 4.5', path: '/dashboard/yoga' },
		{ title: 'Classifier', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16', path: '/dashboard/classifier' },
		{ title: 'Chat', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16', path: '/dashboard/chat' }
		// {
		// 	title: 'Radiology Inference',
		// 	path: '/dashboard/radiology',
		// 	icon: 'M15 10l4.5 4.5M9 10l-4.5 4.5'
		// }
	];

	const otherItems = [];
	let sidebarOpen = false;

	function toggleSidebar() {
		sidebarOpen = !sidebarOpen;
	}

	function handleNavClick(item) {
		currentUtility.set(item.title);
		goto(item.path);
		sidebarOpen = false;
	}

	async function handleLogout() {
		try {
			// Call the sign-out endpoint to clear the session cookie
			await fetch('/api/auth/signout', { method: 'POST' });
			// Redirect to the home page after logout
			goto('/');
		} catch (error) {
			console.error('Logout failed', error);
		}
	}
</script>

<div class="relative flex h-screen w-full bg-gray-100">
	<!-- SIDEBAR (collapsible on mobile) -->
	<aside
		class="fixed inset-y-0 left-0 z-50 flex w-2/3 transform flex-col border-r border-gray-200 bg-[#1E40AF] text-gray-800 shadow-md transition-transform duration-300 sm:relative sm:w-1/4 sm:translate-x-0 {sidebarOpen
			? 'translate-x-0'
			: '-translate-x-full'} overflow-y-auto"
	>
		<!-- Logo Row -->
		<!-- svelte-ignore a11y_consider_explicit_label -->
		<div class="flex items-center justify-between bg-[#1E40AF] px-4 py-4 sm:justify-start">
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<img
				on:click={() => {
					goto('/');
				}}
				src={MedMasterLogo}
				alt=""
				class="h-26"
			/>
			<!-- <button on:click={() => goto('/')} class="text-2xl font-bold text-[#FFFFFF]">
				{MedMasterLogo}
			</button> -->
			<!-- Mobile Close Button -->
			<!-- svelte-ignore a11y_consider_explicit_label -->
			<button
				on:click={toggleSidebar}
				class="inline-flex items-center justify-center p-2 text-gray-600 hover:text-gray-800 focus:outline-none sm:hidden"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-6 w-6"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="2"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>

		<!-- Navigation Links -->
		<nav class="flex flex-1 flex-col px-4 py-6">
			<div class="flex flex-col space-y-2">
				{#each menuItems as item}
					<button
						on:click={() => handleNavClick(item)}
						class="flex items-center space-x-3 rounded-md px-4 py-3 text-left text-lg font-medium transition-colors hover:bg-[#008D6E] hover:text-[#00C383]"
					>
						{#if item.icon}
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								class="h-5 w-5 text-gray-500"
							>
								<path d={item.icon} />
							</svg>
						{/if}
						<span class="text-[#FFFFFF]">{item.title}</span>
					</button>
				{/each}

				<!-- Others Heading -->
				<h3 class="mb-2 mt-4 text-sm font-semibold uppercase text-gray-400">Others</h3>

				{#each otherItems as other}
					<button
						on:click={() => handleNavClick(other)}
						class="block w-full rounded-md px-4 py-3 text-left text-lg font-medium transition-colors hover:bg-[#008D6E] hover:text-[#00C383]"
					>
						{other.title}
					</button>
				{/each}
			</div>
		</nav>
	</aside>

	<!-- MAIN CONTENT AREA -->
	<div class="flex flex-1 flex-col">
		<!-- MOBILE TOP BAR (visible on small screens) -->
		<header class="flex items-center bg-white p-4 shadow sm:hidden">
			<button
				on:click={toggleSidebar}
				class="p-2 text-gray-600 hover:text-gray-800 focus:outline-none"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-6 w-6"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="2"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
				</svg>
			</button>
			<h2 class="ml-4 text-lg font-bold">Dashboard</h2>
			{#if data && data.session}
				<button
					on:click={handleLogout}
					class="ml-auto rounded bg-red-600 px-3 py-1 text-white hover:bg-red-700"
				>
					Logout
				</button>
			{/if}
		</header>

		<!-- DESKTOP TOP BAR -->
		<nav class="hidden items-center justify-between bg-white px-6 py-3 shadow sm:flex">
			<div>
				<span class="font-semibold text-gray-700">Current Utility:</span>
				<span class="ml-2 font-bold text-[#002057]">{$currentUtility}</span>
			</div>
			{#if data && data.session}
				<button
					on:click={handleLogout}
					class="rounded bg-red-600 px-3 py-1 text-white hover:bg-red-700"
				>
					Logout
				</button>
			{/if}
		</nav>

		<!-- Protected Sub-route Content -->
		<main class="flex-1 overflow-y-auto p-4 sm:p-6">
			<slot />
		</main>
	</div>
</div>
