import {test} from '@playwright/test';
import {TestRecipe} from "./utils.js";

async function check(recipe, input, predicates, expected_output) {
	await recipe.input(input);
	await recipe.sort_models_canonically(...predicates);
	await recipe.output(expected_output);
}

test.describe("Sort Models Canonically", () => {
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
		`, [], `
a.
b.
§
b.
		`);
	});

	test("two models in wrong ordered", async () => {
		await check(recipe, `
b.
§
a.
b.
		`, [], `
a.
b.
§
b.
		`);
	});

	test("two models in correct order after projection", async () => {
		await check(recipe, `
b.
§
a.
b.
		`, ['b'], `
b.
§
a.
b.
		`);
	});
});