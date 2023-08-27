import type { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
	webServer: {
		// command: 'npm run build && npm run preview',
		command: 'npm run dev',
		port: 5188,
		reuseExistingServer: true,
	},
	testDir: 'tests',
	testMatch: /test\..*.ts/,
	retries: 3,
};

export default config;
