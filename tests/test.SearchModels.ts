import {test} from '@playwright/test';
import {TestRecipe} from "./utils.js";

test.describe("Search Model operation", () => {
	let recipe;

	test.beforeEach(async ({ page }) => {
		recipe = await TestRecipe.create(page);
	});

	test("search for a single model", async () => {
		await recipe.input("hello.");
		await recipe.search_models('world.');
		await recipe.output("hello.\nworld.");
	});

	test("search for a single model but unsat raises error", async () => {
		await recipe.input("hello.");
		await recipe.search_models('-hello.');
		await recipe.output("Error: Expecting 1 models, found 0.");
	});

	test("unsat without raise error produces no models", async () => {
		await recipe.input("-a.");
		await recipe.search_models('a.', { click_raise_error: true });
		await recipe.output("");
	});

	test("all models are computed if number of required models is 0", async () => {
		await recipe.input("");
		await recipe.search_models('{a}.', {number: 0, click_raise_error: true});
		await recipe.output("EMPTY MODEL\n§\na.");
	});

	test("requiring 0 models with raise error active produces an error on sat programs", async () => {
		await recipe.input("");
		await recipe.search_models('{a}.', { number: 0 });
		await recipe.output("Error: Expecting 0 models, found 2.");
	});

	test("use constraints can be used to reconstruct a projected model", async () => {
		await recipe.input("b(1).");
		await recipe.search_models(`
{a(1,2); a(1,3); a(4,5); a(4,6)} = 1.
b(X) :- a(X,Y).
		`, { number: 0, click_raise_error: true, click_use_constraints: true });
		await recipe.output(`
b(1).
a(1,3).
§
b(1).
a(1,2).
		`);
	});

	test("base64 input is decoded", async () => {
		await recipe.input(`__base64__("aGVsbG8u").`)
		await recipe.search_models(`world.`);
		await recipe.output(`hello.\nworld.`)
	});

	test("each model in input is processed individually", async () => {
		await recipe.input("hello.§world.");
		await recipe.search_models('hello :- world. world :- hello.');
		await recipe.output("world.\nhello.\n§\nworld.\nhello.");
	});

	test("search models after search models", async () => {
		await recipe.input("");
		await recipe.search_models('a(1..4).');
		await recipe.search_models('#show.\n#show SUM : SUM = #sum{X : a(X)}.');
		await recipe.output("10.");
	});
});