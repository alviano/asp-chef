import {test} from '@playwright/test';
import {TestRecipe} from "./utils.js";
import {expect} from '@playwright/test';

test.describe("Markdown", () => {
	let recipe;

	test.beforeEach(async ({ page }) => {
		recipe = await TestRecipe.create(page);
	});

	test("heading", async () => {
		await recipe.input(`
foo(a,b).
foo(c,d).
__base64__("IyBGaXJzdCBsZXZlbCB0aXRsZQoKe3sgKFksWCkgOiBmb28oWSxYKSB9fSAKCnwgRm9vIHwgQmFyIHwKfCAtLS0gfCAtLS0gfAp7eyB0YWJsZSB9fSB7eyAoWCxZKSA6IGZvbyhYLFkpIH19CgpNeSBsaXN0Ogp7eyBsaXN0IH19IHt7IHRlcm1fc2VwYXJhdG9yKCIgdG8gIikgfX0ge3sgKFgsWSkgOiBmb28oWCxZKSB9fQoKe3sgcHJlZml4KCItICIpIH19Cnt7IChYLFkpIDogZm9vKFgsWSkgfX0=").
		`.trim());
		await recipe.markdown(async output => {
			await expect(output.getByRole("heading", { name: "First level title" })).toBeVisible();
		});
	});

	test("query", async () => {
		await recipe.input(`
foo(a,b).
foo(c,d).
__base64__("IyBGaXJzdCBsZXZlbCB0aXRsZQoKe3sgKFksWCkgOiBmb28oWSxYKSB9fSAKCnwgRm9vIHwgQmFyIHwKfCAtLS0gfCAtLS0gfAp7eyB0YWJsZSB9fSB7eyAoWCxZKSA6IGZvbyhYLFkpIH19CgpNeSBsaXN0Ogp7eyBsaXN0IH19IHt7IHRlcm1fc2VwYXJhdG9yKCIgdG8gIikgfX0ge3sgKFgsWSkgOiBmb28oWCxZKSB9fQoKe3sgcHJlZml4KCItICIpIH19Cnt7IChYLFkpIDogZm9vKFgsWSkgfX0=").
		`.trim());
		await recipe.markdown(async output => {
			await expect(output.getByText('a, b c, d')).toBeVisible();
		});
	});

});