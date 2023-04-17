import {test} from '@playwright/test';
import {TestRecipe} from "./utils.js";

test.describe("Decode Input", () => {
	let recipe;

	test.beforeEach(async ({ page }) => {
		recipe = await TestRecipe.create(page);
	});

	test("restore some previous input", async () => {
		await recipe.input('store("YS4KwqcKYi4=").\nfoo.');
		await recipe.decode_input({ predicate: 'store' });
		await recipe.output(`
a.
§
b.
		`);
	});

	test("echo encoded content", async () => {
		await recipe.input('store("YS4KwqcKYi4=").\nfoo.');
		await recipe.decode_input({ predicate: 'store', echo: true });
		await recipe.output(`
a.
§
b.
store("YS4KwqcKYi4=").
		`);
	});

	test("include other content", async () => {
		await recipe.input('store("YS4KwqcKYi4=").\nfoo.');
		await recipe.decode_input({ predicate: 'store', include_others: true });
		await recipe.output(`
a.
§
b.
foo.
		`);
	});


});