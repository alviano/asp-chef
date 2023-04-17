import {test} from '@playwright/test';
import {TestRecipe} from "./utils.js";

async function check(recipe, input, rules, expected_output) {
	await recipe.input(input);
	await recipe.reify_program(rules);
	await recipe.output(expected_output);
}

test.describe("Reify Program", () => {
	let recipe;

	test.beforeEach(async ({ page }) => {
		recipe = await TestRecipe.create(page);
	});

	test("fact", async () => {
		await check(recipe, `
foo.
		`, `
		`, `
atom_tuple(0).
atom_tuple(0,1).
literal_tuple(0).
rule(disjunction(0),normal(0)).
output(foo,0).
		`);
	});

	test("choice rule", async () => {
		await check(recipe, `
		`, `
{a}.
		`, `
atom_tuple(0).
atom_tuple(0,1).
literal_tuple(0).
rule(choice(0),normal(0)).
literal_tuple(1).
literal_tuple(1,1).
output(a,1).
		`);
	});

	test("disjunctive rule", async () => {
		await check(recipe, `
		`, `
a | b.
		`, `
atom_tuple(0).
atom_tuple(0,1).
atom_tuple(0,2).
literal_tuple(0).
rule(disjunction(0),normal(0)).
literal_tuple(1).
literal_tuple(1,1).
output(a,1).
literal_tuple(2).
literal_tuple(2,2).
output(b,2).
		`);
	});

	test("extending input models", async () => {
		await check(recipe, `
a.
		`, `
{b} :- a.
		`, `
atom_tuple(0).
atom_tuple(0,1).
literal_tuple(0).
rule(disjunction(0),normal(0)).
atom_tuple(1).
atom_tuple(1,2).
rule(choice(1),normal(0)).
output(a,0).
literal_tuple(1).
literal_tuple(1,2).
output(b,1).
		`);
	});

});