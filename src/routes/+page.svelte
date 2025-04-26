<script>
	import { goto } from '$app/navigation';
	import Navbar from '../components/Navbar.svelte';
	import MedMasterLogo from '$lib/medmaster_logo.png';
	import RadiologyIcon from '$lib/Radiology.png';
	import ReportIcon from '$lib/report_3.png';
	import YogaIcon from '$lib/yoga.png';
	import ExerciseIcon from '$lib/gym.png';
	import TelemedicenIcon from '$lib/teli.png';
	import MBTIIcon from '$lib/mbti_2.png';
	import ChatRoomIcon from '$lib/chat_room.png';
	import BrainTumorIcon from '$lib/brain_3.png';

	// Feature data array with icons
	const features = [
		{
			title: 'MBTI Chatbot',
			description: 'MBTI-enabled personalized chatbot for mental health support',
			link: '/dashboard/mbti-chatbot',
			icon: `${MBTIIcon}`
		},
		{
			title: 'Report Inference',
			description: 'Drafts a first inference based on the report',
			link: '/dashboard/report-ineference',
			icon: `${ReportIcon}`
		},
		{
			title: 'Telemedicine',
			description: 'Remote consultations with advanced AI support',
			link: '/dashboard/general-health-support',
			icon: `${TelemedicenIcon}`
		},
		{
			title: 'Yoga',
			description: 'Yoga guide for beginners to attain good posture',
			link: '/dashboard/yoga',
			icon: `${YogaIcon}`
		},
		{
			title: 'Exercise',
			description: 'Helps rectify the form of the person during workouts',
			link: '/dashboard/exercise',
			icon: `${ExerciseIcon}`
		},
		{
			title: 'Brain Tumor Classification',
			description: 'Detects and classifies brain tumors',
			link: '/dashboard/classifier',
			icon: `${BrainTumorIcon}`
		},
		{
			title: 'Chat Room',
			description: 'Collaborate with professionals in a secure chat room',
			link: '/dashboard/chat',
			icon: `${ChatRoomIcon}`
		}
	];

	function handleDashboardClick() {
		goto('/dashboard');
	}
</script>

<main class="min-h-screen w-full bg-gradient-to-r from-blue-100 via-blue-50 to-blue-100">
	<!-- Navbar -->
	<section id="navbar" class="bg-blue-600 text-white shadow-lg">
		<Navbar />
	</section>

	<!-- Hero Section -->
	<section class="relative mx-auto max-w-7xl px-6 pt-20 text-center md:pt-28">
		<h1 class="mb-4 text-4xl font-extrabold text-blue-800 md:text-5xl">
			Transforming Healthcare with AI
		</h1>
		<p class="mb-6 text-lg text-gray-700">
			Advanced AI-powered health solutions that provide personalized insights, remote consultations,
			and proactive health management.
		</p>
		<button
			on:click={handleDashboardClick}
			class="rounded-full bg-blue-700 px-6 py-3 text-lg font-semibold text-white shadow-md transition-all hover:bg-blue-800 active:scale-95"
		>
			Go To Dashboard →
		</button>
	</section>

	<!-- Features Section -->
	<section class="mx-auto mt-16 grid max-w-7xl gap-8 px-6">
		<div class="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
			{#each features.slice(0, 4) as feature}
				<div
					on:click={() => goto(feature.link)}
					class="cursor-pointer rounded-lg bg-gray-100 p-6 shadow transition hover:shadow-md"
				>
					<img src={feature.icon} alt={feature.title} class="mx-auto mb-4 h-16 w-16" />
					<h3 class="text-center text-lg font-bold text-gray-800">{feature.title}</h3>
					<p class="mt-2 text-center text-sm text-gray-600">{feature.description}</p>
				</div>
			{/each}
		</div>
		<div class="mt-8 grid grid-cols-1 justify-center gap-8 sm:grid-cols-2 lg:grid-cols-3">
			{#each features.slice(4) as feature}
				<div
					on:click={() => goto(feature.link)}
					class="cursor-pointer rounded-lg bg-gray-100 p-6 shadow transition hover:shadow-md"
				>
					<img src={feature.icon} alt={feature.title} class="mx-auto mb-4 h-16 w-16" />
					<h3 class="text-center text-lg font-bold text-gray-800">{feature.title}</h3>
					<p class="mt-2 text-center text-sm text-gray-600">{feature.description}</p>
				</div>
			{/each}
		</div>
	</section>

	<!-- Footer Section -->
	<footer class="mt-16 bg-blue-700 text-white">
		<div class="grid max-w-7xl grid-cols-1 gap-8 px-6 py-8 md:grid-cols-4">
			<!-- Brand -->
			<div>
				<h2 class="text-2xl font-bold">MedMaster</h2>
				<p class="mt-2 text-sm">Transforming healthcare through innovative AI solutions.</p>
			</div>

			<!-- Quick Links -->
			<div>
				<h3 class="text-lg font-semibold">Quick Links</h3>
				<ul class="mt-2 space-y-1 text-sm">
					<li><a href="#" class="hover:underline">About</a></li>
					<li><a href="#" class="hover:underline">Services</a></li>
					<li><a href="#" class="hover:underline">Blog</a></li>
					<li><a href="#" class="hover:underline">Careers</a></li>
				</ul>
			</div>

			<!-- Legal -->
			<div>
				<h3 class="text-lg font-semibold">Legal</h3>
				<ul class="mt-2 space-y-1 text-sm">
					<li><a href="#" class="hover:underline">Privacy Policy</a></li>
					<li><a href="#" class="hover:underline">Terms of Service</a></li>
					<li><a href="#" class="hover:underline">Cookie Settings</a></li>
				</ul>
			</div>

			<!-- Stay Updated -->
			<div>
				<h3 class="text-lg font-semibold">Stay Updated</h3>
				<p class="mt-2 text-sm">Get weekly insights and healthcare tips.</p>
			</div>
		</div>

		<!-- Footer Bottom -->
		<div class="border-t border-blue-500 py-4 text-center text-sm text-blue-200">
			© 2025 MedMaster. All Rights Reserved.
		</div>
	</footer>
</main>
