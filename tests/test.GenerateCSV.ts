import {test} from '@playwright/test';
import {TestRecipe} from "./utils.js";

async function check(recipe, input, separator, input_predicate, expected_output) {
	await recipe.input(input);
	await recipe.generate_csv({ separator, input_predicate });
	await recipe.output(expected_output, true, true);
}

test.describe("Generate CSV", () => {
	let recipe;

	test.beforeEach(async ({ page }) => {
		recipe = await TestRecipe.create(page);
	});

	test("SPACE separated", async () => {
		await check(recipe, `
cell(1,1,"foo").
cell(1,2,"bar").
cell(2,1,1).
cell(2,2,2).
		`, 'SPACE', 'cell',`
foo bar
1 2
		`);
	});

	test("TAB separated", async () => {
		await check(recipe, `
c(1,1,"foo").
c(1,2,"bar").
c(2,1,1).
c(2,2,2).
		`, 'TAB', 'c',`
foo\tbar
1\t2
		`);
	});

	test("strings with spaces", async () => {
		await check(recipe, `
cell(1,1,"foo").
cell(1,2,"bar buzz").
cell(2,1,1).
cell(2,2,2).
		`, 'SPACE', 'cell',`
foo "bar buzz"
1 2
		`);
	});

	test("empty separator", async () => {
		await check(recipe, `
cell(1,1,"a").
cell(1,2,"b").
cell(1,3,"c").
cell(2,1,1).
cell(2,2,2).
cell(2,3,3).
cell(2,4,4).
		`, '', 'cell',`
abc
1234
		`);
	});
});