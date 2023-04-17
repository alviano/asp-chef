import {test} from '@playwright/test';
import {TestRecipe} from "./utils.js";

async function check(recipe, search_models, expected_output) {
	await recipe.search_models(search_models, { decode_predicate: 'introspection_terms' });
	await recipe.output(expected_output);
}

test.describe("Introspection Terms", () => {
	let recipe;

	test.beforeEach(async ({ page }) => {
		recipe = await TestRecipe.create(page);
		await recipe.introspection_terms( { predicate: 'introspection_terms' });
	});

	test("functor", async () => {
		await check(recipe, `
predicate(@functor(Atom), @arity(Atom)) :- Atom = foo(1,2,3).
		`, `
predicate("foo",3).
		`);
	});

	test("valid argument", async () => {
		await check(recipe, `
argument(@argument(Atom, 1)) :- Atom = foo(1,2,3).
		`, `
argument(1).
		`);
	});

	test("invalid argument", async () => {
		await check(recipe, `
argument(@argument(Atom, 4)) :- Atom = foo(1,2,3).
		`, `
argument(error("%s has no argument at index %d","foo(1,2,3)",4)).
		`);
	});

});