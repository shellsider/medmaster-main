<script>
	import { onMount } from 'svelte';
	import axios from 'axios';
	import { writable } from 'svelte/store';
	import Highcharts from 'highcharts';

	const userData = writable({
		mbti: '',
		ei: { I: 0, E: 0 },
		sn: { N: 0, S: 0 },
		tf: { F: 0, T: 0 },
		jp: { P: 0, J: 0 }
	});

	async function fetchUserData() {
		try {
			const res = await axios.get('/api/user');
			if (res.data?.user) {
				userData.set(res.data.user);
				renderCharts(res.data.user);
			}
		} catch (error) {
			console.error('Error fetching user data:', error);
		}
	}

	function renderCharts(data) {
		const chartConfigs = [
			{
				id: 'ei-chart',
				title: 'Introvert (I) vs Extrovert (E)',
				data: [
					{ name: 'Introvert (I)', y: data.ei_I, color: '#3498db' },
					{ name: 'Extrovert (E)', y: data.ei_E, color: '#e74c3c' }
				]
			},
			{
				id: 'sn-chart',
				title: 'Intuitive (N) vs Sensing (S)',
				data: [
					{ name: 'Intuitive (N)', y: data.sn_N, color: '#9b59b6' },
					{ name: 'Sensing (S)', y: data.sn_S, color: '#1abc9c' }
				]
			},
			{
				id: 'tf-chart',
				title: 'Thinking (T) vs Feeling (F)',
				data: [
					{ name: 'Thinking (T)', y: data.tf_T, color: '#f1c40f' },
					{ name: 'Feeling (F)', y: data.tf_F, color: '#e67e22' }
				]
			},
			{
				id: 'jp-chart',
				title: 'Judging (J) vs Perceiving (P)',
				data: [
					{ name: 'Judging (J)', y: data.jp_J, color: '#2ecc71' },
					{ name: 'Perceiving (P)', y: data.jp_P, color: '#e74c3c' }
				]
			}
		];

		chartConfigs.forEach((config) => {
			Highcharts.chart(config.id, {
				chart: {
					type: 'pie',
					backgroundColor: 'transparent',
					spacing: [20, 20, 20, 20]
				},
				title: {
					text: config.title,
					style: { color: '#333', fontSize: '18px', fontWeight: 'bold' }
				},
				series: [
					{
						name: config.title,
						data: config.data,
						innerSize: '50%',
						size: '80%'
					}
				],
				plotOptions: {
					pie: {
						dataLabels: {
							enabled: true,
							format: '{point.name}: {point.percentage:.1f} %',
							style: { fontSize: '14px' }
						},
						showInLegend: true
					}
				},
				legend: {
					align: 'center',
					verticalAlign: 'bottom',
					layout: 'horizontal',
					itemStyle: { fontSize: '14px', fontWeight: 'normal' },
					itemMarginTop: 8,
					itemMarginBottom: 8
				}
			});
		});
	}

	onMount(() => {
		fetchUserData();
	});
</script>

<div class="container mx-auto px-4 py-8">
	<!-- MBTI Type Display -->
	<div class="mb-6 flex flex-col items-center rounded-lg bg-white p-6 shadow-lg">
		<h2 class="text-2xl font-bold text-gray-800">Your MBTI Type</h2>
		<p class="mt-2 text-xl font-semibold text-blue-600">
			{$userData.mbti || 'Take the Test!'}
		</p>
	</div>

	<!-- Charts Grid -->
	<div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
		<div id="ei-chart" class="rounded-lg bg-white p-6 shadow"></div>
		<div id="sn-chart" class="rounded-lg bg-white p-6 shadow"></div>
		<div id="tf-chart" class="rounded-lg bg-white p-6 shadow"></div>
		<div id="jp-chart" class="rounded-lg bg-white p-6 shadow"></div>
	</div>
</div>
