import {test} from '@playwright/test';
import {TestRecipe} from "./utils.js";

async function check(recipe, input, expected_output) {
	await recipe.input(input);
	await recipe.reverse_models();
	await recipe.output(expected_output);
}

test.describe("Reverse Models", () => {
	let recipe;

	test.beforeEach(async ({ page }) => {
		recipe = await TestRecipe.create(page);
	});

	test("two models", async () => {
		await check(recipe, `
a.
b.
§
b.
		`, `
b.
§
a.
b.
		`);
	});
});