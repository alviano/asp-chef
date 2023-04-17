import {test} from '@playwright/test';
import {TestRecipe} from "./utils.js";

async function check(recipe, input, expected_output) {
	await recipe.input(input);
	await recipe.sort_canonical();
	await recipe.output(expected_output);
}

test.describe("Sort Canonical", () => {
	let recipe;

	test.beforeEach(async ({ page }) => {
		recipe = await TestRecipe.create(page);
	});

	test("two models already ordered", async () => {
		await check(recipe, `
a.
b.
§
b.
c.
		`, `
a.
b.
§
b.
c.
		`);
	});

	test("two models in wrong ordered", async () => {
		await check(recipe, `
b.
a.
§
c.
b.
		`, `
a.
b.
§
b.
c.
		`);
	});

});