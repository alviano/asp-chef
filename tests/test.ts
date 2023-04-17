import {expect, test} from '@playwright/test';

test('the name of the app is shown in the logo', async ({ page }) => {
	await page.goto('/');
	expect(await page.textContent('span.logo')).toBe('ASP Chef');
});
