import {test} from '@playwright/test';
import {TestRecipe} from "./utils.js";

async function check(recipe, input, search_models, merge_predicate, expected_output) {
	await recipe.input(input);
	await recipe.search_models(search_models, {
		number: 0,
		click_raise_error: true,
	});
	await recipe.merge(merge_predicate);
	await recipe.output(expected_output);
}

test.describe("Merge", () => {
	let recipe;

	test.beforeEach(async ({ page }) => {
		recipe = await TestRecipe.create(page);
	});

	test("simple choice", async () => {
		await check(recipe, ``, `{a}.`, `model`, `
model(1).
model(2).
model(2,a).
		`);
	});

});