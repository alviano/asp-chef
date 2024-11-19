import {test} from '@playwright/test';
import {TestRecipe} from "./utils.js";

async function check(recipe, input, content, predicate, expected_output) {
	await recipe.click_pause_baking();
	await recipe.input(input);
	await recipe.extensional_relation(content.trim(), predicate);
	await recipe.click_pause_baking();
	await recipe.output(expected_output);
}

test.describe("Extensional Relation", () => {
	let recipe;

	test.beforeEach(async ({ page }) => {
		recipe = await TestRecipe.create(page);
	});

	test("three unary facts", async () => {
		await check(recipe, '', `
1
2
3
		`, 'foo', `
foo(1).
foo(2).
foo(3).
		`);
	});

	test("three binary facts", async () => {
		await check(recipe, '', `
a,1
b,2
c,3
		`, 'foo', `
foo(a,1).
foo(b,2).
foo(c,3).
		`);
	});

	test("three facts of different arities", async () => {
		await check(recipe, '', `
1

1,2,3
		`, 'foo', `
foo(1).
foo.
foo(1,2,3).
		`);
	});

});