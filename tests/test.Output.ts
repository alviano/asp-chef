import {test} from '@playwright/test';
import {TestRecipe} from "./utils.js";

async function check(recipe, input, expected_output) {
	await recipe.input(input);
	await recipe.output_ingredient(expected_output);
	await recipe.output(expected_output);
}

test.describe("Output", () => {
	let recipe;

	test.beforeEach(async ({ page }) => {
		recipe = await TestRecipe.create(page);
	});

	test("simple input", async () => {
		await check(recipe, `
hello.
world.
		`, `
hello.
world.
		`);
	});

});