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
__base64__("IyBGaXJzdCBsZXZlbCB0aXRsZQoKe3s9IChZLFgpIDogZm9vKFksWCkgfX0gCgp8IEZvbyB8IEJhciB8CnwgLS0tIHwgLS0tIHwKe3sKICAjc2hvdyB0cigiRm9vIiwgIkJhciIpLgogICNzaG93IHRyKFgsWSkgOiBmb28oWCxZKS4KfX0KCk15IGxpc3Q6Cnt7IAogICNzaG93IHVsKFgsWSkgOiBmb28oWCxZKS4KICAjc2hvdyB0ZXJtX3NlcGFyYXRvcigiIHRvICIpLgp9fQoKCk15IGxpc3Q6Cnt7IAogICNzaG93IChYLFkpIDogZm9vKFgsWSkuCiAgI3Nob3cgdGVybV9zZXBhcmF0b3IoIiB0byAiKS4KICAjc2hvdyBwcmVmaXgoIi0gIikuCn19Cg==").
		`.trim());
		await recipe.markdown(async output => {
			await expect(output.getByRole("heading", { name: "First level title" })).toBeVisible();
		});
	});

	test("query", async () => {
		await recipe.input(`
foo(a,b).
foo(c,d).
__base64__("IyBGaXJzdCBsZXZlbCB0aXRsZQoKe3s9IChZLFgpIDogZm9vKFksWCkgfX0gCgp8IEZvbyB8IEJhciB8CnwgLS0tIHwgLS0tIHwKe3sKICAjc2hvdyB0cigiRm9vIiwgIkJhciIpLgogICNzaG93IHRyKFgsWSkgOiBmb28oWCxZKS4KfX0KCk15IGxpc3Q6Cnt7IAogICNzaG93IHVsKFgsWSkgOiBmb28oWCxZKS4KICAjc2hvdyB0ZXJtX3NlcGFyYXRvcigiIHRvICIpLgp9fQoKCk15IGxpc3Q6Cnt7IAogICNzaG93IChYLFkpIDogZm9vKFgsWSkuCiAgI3Nob3cgdGVybV9zZXBhcmF0b3IoIiB0byAiKS4KICAjc2hvdyBwcmVmaXgoIi0gIikuCn19Cg==").
		`.trim());
		await recipe.markdown(async output => {
			await expect(output.getByText('a, b c, d')).toBeVisible();
		});
	});

});