import adapter from '@sveltejs/adapter-auto';
import { mdsvex } from "mdsvex";
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: [
		vitePreprocess(),
		mdsvex({
      		extensions: ['.md']
		})
	],

	kit: {
		adapter: adapter({
		  	fallback: '/',
		}),
		alias: {
		    "$lib": "./src/lib",
		    "$lib/*": "./src/lib/*",
		},
	},

    extensions: ['.svelte', '.md'],
};

export default config;
