import {test} from '@playwright/test';
import {TestRecipe} from "./utils.js";

async function check(recipe, input, predicates, expected_output) {
	await recipe.input(input);
	await recipe.unique(...predicates);
	await recipe.output(expected_output);
}

test.describe("Unique", () => {
	let recipe;

	test.beforeEach(async ({ page }) => {
		recipe = await TestRecipe.create(page);
	});

	test("two unique models", async () => {
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

	test("two copies of the same model", async () => {
		await check(recipe, `
a.
b.
§
a.
b.
		`, [], `
a.
b.
		`);
	});

	test("two copies of the same model when projected", async () => {
		await check(recipe, `
a.
b.
c.
§
a.
b.
		`, ['c'], `
a.
b.
c.
		`);
	});
});