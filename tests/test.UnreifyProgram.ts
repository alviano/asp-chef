import {test} from '@playwright/test';
import {TestRecipe} from "./utils.js";

async function check(recipe, input, expected_output) {
	await recipe.input(input);
	await recipe.unreify_program();
	await recipe.output(expected_output, true, true);
}

test.describe("Unreify Program", () => {
	let recipe;

	test.beforeEach(async ({ page }) => {
		recipe = await TestRecipe.create(page);
	});

	test("fact", async () => {
		await check(recipe, `
atom_tuple(0).
atom_tuple(0,1).
literal_tuple(0).
rule(disjunction(0),normal(0)).
output(foo,0).
		`, `
__atom__(1).
#show foo.
		`);
	});

	test("choice rule", async () => {
		await check(recipe, `
atom_tuple(0).
atom_tuple(0,1).
literal_tuple(0).
rule(choice(0),normal(0)).
literal_tuple(1).
literal_tuple(1,1).
output(a,1).
		`, `
{a}.
#show a : a.
		`);
	});

	test("disjunctive rule", async () => {
		await check(recipe, `
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
		`, `
a | b.
#show a : a.
#show b : b.
		`);
	});

	test("extending input models", async () => {
		await check(recipe, `
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
		`, `
__atom__(1).
{b}.
#show a.
#show b : b.
		`);
	});

});