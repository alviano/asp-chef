import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

/** @type {import('vite').UserConfig} */
const config = defineConfig(({ command, mode }) => {
    const isProduction = command === 'build';

    return {
        plugins: [sveltekit()],
        optimizeDeps: {
            exclude: isProduction ? ['swipl-wasm'] : [],
        },
        test: {
            include: ['src/**/*.{test,spec}.{js,ts}'],
            environment: 'jsdom',
            globals: true,
            setupFiles: ['@testing-library/jest-dom/extend-expect']
        }
    };
});


export default config;
