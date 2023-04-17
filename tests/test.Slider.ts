import {test} from '@playwright/test';
import {TestRecipe} from "./utils.js";

async function check(recipe, input, slider_predicate, min, max, value, expected_output) {
	await recipe.input(input);
	await recipe.slider({
		output_predicate: slider_predicate,
		minimum_value: min,
		maximum_value: max,
		value: value,
	});
	await recipe.output(expected_output);
}

test.describe("Slider", () => {
	let recipe;

	test.beforeEach(async ({ page }) => {
		recipe = await TestRecipe.create(page);
	});

	test("fixed range, value 1", async () => {
		await check(recipe, `
foo.
		`, 'slider', '1', '10', '1', `
foo.
slider(1).
		`);
	});

	test("fixed range, value 5", async () => {
		await check(recipe, `
foo.
		`, 'slider', '1', '10', '5', `
foo.
slider(5).
		`);
	});

	test("range from input", async () => {
		await check(recipe, `
values(5..8).
		`, 'slider', 'values', 'values', '6', `
values(5).
values(6).
values(7).
values(8).
slider(6).
		`);
	});

});