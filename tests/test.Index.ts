import {test} from '@playwright/test';
import {TestRecipe} from "./utils.js";

async function check(recipe, input, predicate, expected_output) {
	await recipe.input(input);
	await recipe.index(predicate);
	await recipe.output(expected_output);
}

test.describe("Index", () => {
	let recipe;

	test.beforeEach(async ({ page }) => {
		recipe = await TestRecipe.create(page);
	});

	test("one model, three elements", async () => {
		await check(recipe, `
a.
b.
c.
		`, '__index__', `
__index__(1,a).
__index__(2,b).
__index__(3,c).
		`);
	});

	test("two models, five elements", async () => {
		await check(recipe, `
foo(1,2).
bar(2,3).
buzz(4).
§
a.
b.
		`, 'i', `
i(1,foo(1,2)).
i(2,bar(2,3)).
i(3,buzz(4)).
§
i(1,a).
i(2,b).
		`);
	});

});