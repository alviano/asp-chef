import {test} from '@playwright/test';
import {TestRecipe} from "./utils.js";

test.describe("Encode Input", () => {
	let recipe;

	test.beforeEach(async ({ page }) => {
		recipe = await TestRecipe.create(page);
	});

	test("restore some previous input", async () => {
		await recipe.input('a.\n§\nb.');
		await recipe.encode_input({ predicate: 'store' });
		await recipe.search_models('an_extra_atom.')
		await recipe.select_predicates('store')
		await recipe.output(`store("YS4KwqcKYi4=").`);
	});

	test("echo input", async () => {
		await recipe.input('a.\n§\nb.');
		await recipe.encode_input({ predicate: 'store', echo: true });
		await recipe.output(`
a.
store("YS4KwqcKYi4=").
§
b.
store("YS4KwqcKYi4=").
`);
	});

});