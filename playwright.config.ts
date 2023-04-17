import type { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
	webServer: {
		// command: 'npm run build && npm run preview',
		command: 'npm run dev',
		port: 5188,
		reuseExistingServer: true,
	},
	testDir: 'tests'
};

export default config;
