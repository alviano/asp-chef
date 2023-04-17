import {test} from '@playwright/test';
import {TestRecipe} from "./utils.js";

async function check(recipe, input, separator, output_predicate, expected_output) {
	await recipe.input('');
	await recipe.encode(input);
	await recipe.parse_csv({ separator, output_predicate });
	await recipe.output(expected_output);
}

test.describe("Parse CSV", () => {
	let recipe;

	test.beforeEach(async ({ page }) => {
		recipe = await TestRecipe.create(page);
	});

	test("SPACE separated", async () => {
		await check(recipe, `
foo bar
1 2
		`, 'SPACE', 'cell',`
cell(1,1,"foo").
cell(1,2,"bar").
cell(2,1,1).
cell(2,2,2).
		`);
	});

	test("TAB separated", async () => {
		await check(recipe, `
foo\tbar
1\t2
		`, 'TAB', 'c',`
c(1,1,"foo").
c(1,2,"bar").
c(2,1,1).
c(2,2,2).
		`);
	});

	test("strings with spaces", async () => {
		await check(recipe, `
foo "bar buzz"
1 2
		`, 'SPACE', 'cell',`
cell(1,1,"foo").
cell(1,2,"bar buzz").
cell(2,1,1).
cell(2,2,2).
		`);
	});

	test("non-integer numbers are mapped to functions", async () => {
		await check(recipe, `
1.2
		`, 'SPACE', 'cell',`
cell(1,1,real("1.2")).
		`);
	});

	test("empty separator", async () => {
		await check(recipe, `
abc
1234
		`, '', 'cell',`
cell(1,1,"a").
cell(1,2,"b").
cell(1,3,"c").
cell(2,1,1).
cell(2,2,2).
cell(2,3,3).
cell(2,4,4).
		`);
	});

});