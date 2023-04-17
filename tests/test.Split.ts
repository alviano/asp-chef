import {test} from '@playwright/test';
import {TestRecipe} from "./utils.js";

async function check(recipe, input, split_predicate, expected_output) {
	await recipe.input(input);
	await recipe.split(split_predicate);
	await recipe.sort_by_increasing_size();
	await recipe.output(expected_output);
}

test.describe("Split", () => {
	let recipe;

	test.beforeEach(async ({ page }) => {
		recipe = await TestRecipe.create(page);
	});

	test("simple input", async () => {
		await check(recipe, `
model(1).
model(2).
model(2,a).
		`, `model`, `
EMPTY MODEL
§
a.
		`);
	});

});