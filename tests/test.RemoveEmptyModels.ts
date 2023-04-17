import {test} from '@playwright/test';
import {TestRecipe} from "./utils.js";

async function check(recipe, input, predicates, expected_output) {
	await recipe.input(input);
	await recipe.remove_empty_models(...predicates);
	await recipe.output(expected_output);
}

test.describe("Remove Emtpy Models", () => {
	let recipe;

	test.beforeEach(async ({ page }) => {
		recipe = await TestRecipe.create(page);
	});

	test("two nonempty models", async () => {
		await check(recipe, `
a.
§
a.
b.
		`, [], `
a.
§
a.
b.
		`);
	});

	test("one empty model", async () => {
		await check(recipe, `

§
a.
b.
		`, [], `
a.
b.
		`);
	});

	test("one empty model after projecting one predicate", async () => {
		await check(recipe, `
a.
§
a.
b.
		`, ['a'], `
a.
b.
		`);
	});

	test("two empty models after projecting two predicates", async () => {
		await check(recipe, `
a.
§
a.
b.
		`, ['a', 'b'], ``);
	});

});