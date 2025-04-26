<script>
	import { onMount, onDestroy, afterUpdate } from 'svelte';
	import { writable } from 'svelte/store';
	import axios from 'axios';

	let currentUser = '';
	let chatWith = '';
	const chatHistory = writable([]);
	let newMessage = '';
	let fileToUpload = null;
	let fileUploading = false;
	let error = '';

	let chatHistoryContainer;
	let isUserScrolling = false;
	let isAtBottom = true;

	let pollingInterval;

	async function getSession() {
		try {
			const res = await axios.get('/api/session');
			if (res.data && res.data.currentUser) {
				currentUser = res.data.currentUser;
			} else {
				window.location.href = '/user/auth';
			}
		} catch (error) {
			console.error('Error retrieving session:', error);
			window.location.href = '/user/auth';
		}
	}

	async function fetchChatHistory() {
		if (!chatWith) return;
		try {
			const response = await axios.get('/api/chat', {
				params: { user: currentUser, with: chatWith }
			});
			if (response.data) {
				chatHistory.set(response.data.messages);
				if (isAtBottom) {
					scrollToBottom();
				}
			}
		} catch (error) {
			console.error('Error fetching chat history:', error);
		}
	}

	function handleFileChange(event) {
		fileToUpload = event.target.files ? event.target.files[0] : null;
	}

	async function sendMessage() {
		if (!chatWith) {
			alert('Please enter a username to chat with.');
			return;
		}
		if (!newMessage && !fileToUpload) {
			alert('Please enter a message or select a file to send.');
			return;
		}

		let filePath = null;

		if (fileToUpload) {
			fileUploading = true;
			const formData = new FormData();
			formData.append('file', fileToUpload);
			try {
				const uploadRes = await axios.post('/api/upload', formData, {
					headers: { 'Content-Type': 'multipart/form-data' }
				});
				filePath = uploadRes.data.filePath;
			} catch (error) {
				console.error('Error uploading file:', error);
				alert('Error uploading file.');
				fileUploading = false;
				return;
			}
			fileUploading = false;
		}

		const payload = {
			sender: currentUser,
			receiver: chatWith,
			message: newMessage,
			filePath: filePath
		};

		try {
			const res = await axios.post('/api/chat', payload, {
				headers: { 'Content-Type': 'application/json' }
			});
			if (res.data.success) {
				newMessage = '';
				fileToUpload = null;
				fetchChatHistory();
				scrollToBottom();
			} else {
				alert('Failed to send message.');
			}
		} catch (error) {
			console.error('Error sending message:', error);
			alert('Failed to send message.');
		}
	}

	function handleScroll() {
		if (chatHistoryContainer) {
			const { scrollTop, scrollHeight, clientHeight } = chatHistoryContainer;
			isAtBottom = scrollHeight - scrollTop <= clientHeight + 10;
			isUserScrolling = !isAtBottom;
		}
	}

	function scrollToBottom() {
		if (chatHistoryContainer) {
			chatHistoryContainer.scrollTop = chatHistoryContainer.scrollHeight;
		}
	}

	function handleKeypress(event) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			sendMessage();
		}
	}

	onMount(async () => {
		await getSession();
		pollingInterval = setInterval(fetchChatHistory, 2000);
	});

	onDestroy(() => {
		clearInterval(pollingInterval);
	});

	afterUpdate(() => {
		if (isAtBottom) {
			scrollToBottom();
		}
	});
</script>

<div class="chat-container">
	<h1 class="text-3xl font-bold text-gray-800">Chat</h1>
	<div class="chat-header mb-6 mt-4 flex items-center justify-between">
		<div class="w-3/4">
			<label for="chatWith" class="block text-sm font-medium text-gray-700">
				Chat with (enter email):
			</label>
			<input
				id="chatWith"
				type="text"
				bind:value={chatWith}
				placeholder="Enter user's email"
				class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-300"
			/>
		</div>
		<button
			on:click={fetchChatHistory}
			class="rounded-lg bg-blue-600 px-4 py-2 text-white shadow-lg hover:bg-blue-700"
		>
			Load Chat
		</button>
	</div>

	<div
		class="chat-history flex flex-col space-y-4 overflow-y-auto rounded-lg bg-gray-100 p-4 shadow-lg"
		style="max-height: 400px;"
		bind:this={chatHistoryContainer}
		on:scroll={handleScroll}
	>
		{#if $chatHistory.length > 0}
			{#each $chatHistory as msg (msg.id)}
				<div
					class="message word-wrap max-w-[75%] rounded-lg p-4 text-white shadow-md
						{msg.sender === currentUser
						? 'self-end bg-green-500 text-right'
						: 'self-start bg-gray-700 text-left'}"
				>
					<p>
						<strong>{msg.sender}</strong>
						<br />
						{msg.message}
					</p>
					{#if msg.file_path}
						<a
							href="{msg.file_path}?fl_attachment=true"
							download
							target="_blank"
							rel="noopener noreferrer"
							class="mt-2 block text-sm text-blue-300 underline hover:text-blue-400"
						>
							Download File
						</a>
					{/if}
					<span class="mt-2 block text-xs text-gray-300"
						>{new Date(msg.timestamp).toLocaleString()}</span
					>
				</div>
			{/each}
		{:else}
			<p class="text-gray-600">No messages yet.</p>
		{/if}
	</div>

	<div class="mt-6">
		<textarea
			bind:value={newMessage}
			placeholder="Type your message..."
			class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-300"
			on:keypress={handleKeypress}
			rows="3"
		></textarea>
		<div class="mt-4 flex items-center space-x-4">
			<input type="file" on:change={handleFileChange} />
			{#if fileUploading}
				<div class="spinner"></div>
			{/if}
		</div>
		<button
			on:click={sendMessage}
			class="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2 text-white shadow-lg hover:bg-blue-700"
		>
			Send
		</button>
	</div>
</div>

<style>
	.chat-container {
		max-width: 900px;
		margin: 0 auto;
		padding: 1rem;
	}
	.chat-header {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}
	.chat-history {
		max-height: 400px;
		overflow-y: auto;
	}
	.message {
		word-wrap: break-word;
		padding: 1rem;
		border-radius: 1rem;
	}
	.spinner {
		width: 20px;
		height: 20px;
		border: 3px solid transparent;
		border-top: 3px solid #00c383;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
