import {test} from '@playwright/test';
import {TestRecipe} from "./utils.js";

async function check(recipe, input, input_predicate, closure_predicate, expected_output) {
	await recipe.input(input);
	await recipe.transitive_closure(input_predicate, closure_predicate, '__base64__');
	await recipe.search_models('');
	await recipe.select_predicates(closure_predicate);
	await recipe.sort_by_predicate_or_argument(2);
	await recipe.sort_by_predicate_or_argument(1);
	await recipe.output(expected_output);
}

test.describe("Transitive Closure", () => {
	let recipe;

	test.beforeEach(async ({ page }) => {
		recipe = await TestRecipe.create(page);
	});

	test("closing edge on edge", async () => {
		await check(recipe, 'edge(a,b). edge(b,c).', 'edge', 'edge', `
edge(a,b).
edge(a,c).
edge(b,c).
		`);
	});

	test("closing edge on reach", async () => {
		await check(recipe, 'edge(a,b). edge(b,c).', 'edge', 'reach', `
reach(a,b).
reach(a,c).
reach(b,c).
		`);
	});

});