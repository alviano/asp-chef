import {test} from '@playwright/test';
import {TestRecipe} from "./utils.js";

test.describe("Store and Restore", () => {
	let recipe;

	test.beforeEach(async ({ page }) => {
		recipe = await TestRecipe.create(page);
	});

	test("restore input", async () => {
		await recipe.input('a.');
		const store = await recipe.store();
		await recipe.search_models('{b}.', { number: 2 });
		await recipe.select_predicates('b');
		await recipe.restore({ store: await store.getByTestId('Store-id').inputValue() });
		await recipe.output('a.');
	});


	test("restore input with echo", async () => {
		await recipe.input('a.');
		const store = await recipe.store();
		await recipe.search_models('{b}.', { number: 2 });
		await recipe.select_predicates('b');
		await recipe.restore({ store: await store.getByTestId('Store-id').inputValue(), echo: true });
		await recipe.output(`
a.
§
b.
a.
		`);
	});
});