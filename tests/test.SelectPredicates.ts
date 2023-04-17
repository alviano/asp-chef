import {test} from '@playwright/test';
import {TestRecipe} from "./utils.js";

async function check(recipe, input, predicates, expected_output) {
	await recipe.input(input);
	await recipe.select_predicates(...predicates);
	await recipe.output(expected_output);
}

test.describe("Select Predicates", () => {
	let recipe;

	test.beforeEach(async ({ page }) => {
		recipe = await TestRecipe.create(page);
	});

	test("two models, no selection", async () => {
		await check(recipe, `
a.
b.
§
b.
		`, [], `
EMPTY MODEL
§
EMPTY MODEL
		`);
	});

	test("two models, one selection", async () => {
		await check(recipe, `
a.
b.
§
b.
		`, ['a'], `
a.
§
EMPTY MODEL
		`);
	});

	test("selection twice is like not selecting", async () => {
		await check(recipe, `
a.
b.
§
b.
		`, ['a', 'a'], `
EMPTY MODEL
§
EMPTY MODEL
		`);
	});


	test("multiple selections are unlinked", async () => {
		await recipe.input('a. b.');
		await recipe.select_predicates('a');
		await recipe.select_predicates('a');
		await recipe.output('a.');
	});
});