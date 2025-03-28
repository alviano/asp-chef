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
		csp: {
            mode: "auto",
            directives: {
                "default-src": ["self"],
                "connect-src": [
                    "*",
                    "data:"
                ],
                "script-src": [
					"*",
                    "unsafe-eval",
                ],
                "script-src-attr": [
					"*",
                    "unsafe-inline",
                ],
                "worker-src": [
                    "self",
                    "blob:",
                ],
                "style-src": [
					"*",
                    "unsafe-inline",
                ],
                "style-src-elem": [
					"*",
                    "unsafe-inline",
                ],
                "img-src": [
					"*",
                    "data:",
                ],
                "font-src": [
					"*",
                ],
                "object-src": ["none"],
                "frame-src": ["none"],
                "frame-ancestors": ["none"],
                "base-uri": ["none"],
            },
        }
	},

    extensions: ['.svelte', '.md'],
};

export default config;
