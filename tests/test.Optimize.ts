import {test} from '@playwright/test';
import {TestRecipe} from "./utils.js";

async function check(recipe, input, rules, predicates, expected_output) {
	await recipe.input(input);
	await recipe.optimize(rules);
	await recipe.select_predicates(...predicates);
	await recipe.output(expected_output);
}

test.describe("Optimize operation", () => {
	let recipe;

	test.beforeEach(async ({ page }) => {
		recipe = await TestRecipe.create(page);
	});

	test("minimum sum above a threshold", async () => {
		await check(recipe, `
a(5).
a(10).
a(12).
a(18).
		`, `
{b(X)} :- a(X).
:- #sum{X : b(X)} < 13.
:~ b(X). [X@1, X]
		`, ['b'], `
b(5).
b(10).
		`)
	});
});