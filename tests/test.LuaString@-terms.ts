import {test} from '@playwright/test';
import {TestRecipe} from "./utils.js";

async function check(recipe, search_models, expected_output) {
	await recipe.search_models(search_models, { decode_predicate: 'string_terms' });
	await recipe.output(expected_output);
}

test.describe("Lua String @-terms", () => {
	let recipe;

	test.beforeEach(async ({ page }) => {
		recipe = await TestRecipe.create(page);
		await recipe.lua_string_at_terms( { predicate: 'string_terms' });
	});

	test("join", async () => {
		await check(recipe, `
predicate(@string_join(" | ", a, "b", 1, f(c, "d"))).
		`, `
predicate("a | b | 1 | f(c,\\"d\\")").
		`);
	});

	test("len", async () => {
		await check(recipe, `
foo(@string_len("123")).
		`, `
foo(3).
		`);
	});

	test("lower", async () => {
		await check(recipe, `
bar(@string_lower("HELLO!")).
		`, `
bar("hello!").
		`);
	});

});