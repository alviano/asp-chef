import {test} from '@playwright/test';
import {TestRecipe} from "./utils.js";

async function check(recipe, input, content, expected_output) {
	await recipe.input(input);
	await recipe.encode(content);
	await recipe.expand_mustache_queries();
	await recipe.select_predicates("__base64__");
	await recipe.output(expected_output, true, true);
}

test.describe("Expand Mustache Queries", () => {
	let recipe;

	test.beforeEach(async ({ page }) => {
		recipe = await TestRecipe.create(page);
	});

	test("inline", async () => {
		await check(recipe, `
foo(bar).
		`, `
what the {{= (X,) : foo(X) }}!		
		`, `
what the bar!
		`);
	});

	test("standard", async () => {
		await check(recipe, `
foo(bar).
		`, `
what the {{
  #show (X,) : foo(X).
}}!		
		`, `
what the bar!
		`);
	});

	test("sort", async () => {
		await check(recipe, `
foo(2).
foo(1).
		`, `
what the {{
  #show (X,) : foo(X).
  #show sort(1). 
  #show separator(", ").
}}!		
		`, `
what the 1, 2!
		`);
	});

});