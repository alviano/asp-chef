import {test} from '@playwright/test';
import {TestRecipe} from "./utils.js";

async function check(recipe, input, expected_output) {
	await recipe.input(input, false, true);
	await recipe.extract_facts({
		echo: false,
	});
	await recipe.output(expected_output);
}

test.describe("Extract Facts", () => {
	let recipe;

	test.beforeEach(async ({ page }) => {
		recipe = await TestRecipe.create(page);
	});

	test("only facts", async () => {
		await check(recipe, `
a(1).
b(2,c,"ddd").		
		`, `
a(1).
b(2,c,"ddd").
		`);
	});

	test("facts mixed to text", async () => {
		await check(recipe, `
somethign here
a(1).
and there b(2,c,"ddd").		
		`, `
a(1).
b(2,c,"ddd").
		`);
	});

});