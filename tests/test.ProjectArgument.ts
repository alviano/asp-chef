import {test} from '@playwright/test';
import {TestRecipe} from "./utils.js";

async function check(recipe, input, project_indices, expected_output) {
	await recipe.input(input);
	for (const index of project_indices) {
		await recipe.project_argument({ index: index });
	}
	await recipe.output(expected_output);
}

test.describe("Project Argument", () => {
	let recipe;

	test.beforeEach(async ({ page }) => {
		recipe = await TestRecipe.create(page);
	});

	test("argument 1", async () => {
		await check(recipe, `
foo(1,2,3).
bar(1,2).
buzz.
		`, [1], `
foo(2,3).
bar(2).
buzz.
		`);
	});

	test("argument 2", async () => {
		await check(recipe, `
foo(1,2,3).
bar(1,2).
buzz.
		`, [2], `
foo(1,3).
bar(1).
buzz.
		`);
	});

	test("argument 3", async () => {
		await check(recipe, `
foo(1,2,3).
bar(1,2).
buzz.
		`, [3], `
foo(1,2).
bar(1,2).
buzz.
		`);
	});

	test("arguments 1 and 2", async () => {
		await check(recipe, `
foo(1,2,3).
bar(1,2).
buzz.
		`, [1, 1], `
foo(3).
bar.
buzz.
		`);
	});

});