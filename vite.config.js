import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
	plugins: [sveltekit()],
	define: {
		'process.env.PUBLIC_API_URL': JSON.stringify(process.env.PUBLIC_API_URL),
		'process.env.PRIVATE_SECRET_KEY': JSON.stringify(process.env.PRIVATE_SECRET_KEY)
	}
});
