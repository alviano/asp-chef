import {test} from '@playwright/test';
import {TestRecipe} from "./utils.js";

async function check(recipe, input, input_predicate, closure_predicate, expected_output) {
	await recipe.input(input);
	await recipe.symmetric_closure(input_predicate, closure_predicate, '__base64__');
	await recipe.search_models('');
	await recipe.select_predicates(closure_predicate);
	await recipe.sort_by_predicate_or_argument(2);
	await recipe.sort_by_predicate_or_argument(1);
	await recipe.output(expected_output);
}

test.describe("Symmetric Closure", () => {
	let recipe;

	test.beforeEach(async ({ page }) => {
		recipe = await TestRecipe.create(page);
	});

	test("closing edge on edge", async () => {
		await check(recipe, 'edge(a,b). edge(b,c).', 'edge', 'edge', `
edge(a,b).
edge(b,a).
edge(b,c).
edge(c,b).
		`);
	});

	test("closing edge on link", async () => {
		await check(recipe, 'edge(a,b). edge(b,c).', 'edge', 'link', `
link(a,b).
link(b,a).
link(b,c).
link(c,b).
		`);
	});

});