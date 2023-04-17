import {test} from '@playwright/test';
import {TestRecipe} from "./utils.js";

test.describe("Encode", () => {
	let recipe;

	test.beforeEach(async ({ page }) => {
		recipe = await TestRecipe.create(page);
	});

	test("encode a choice rule", async () => {
		await recipe.encode('{a}.');
		await recipe.search_models('', { number: 2 });
		await recipe.output(`
EMPTY MODEL
§
a.
		`);
	});

	test("encode a choice rule using a different predicate", async () => {
		await recipe.encode('{a}.', true, 'my_rule');
		await recipe.search_models('', { number: 2, decode_predicate: 'my_rule' });
		await recipe.output(`
EMPTY MODEL
§
a.
		`);
	});
});