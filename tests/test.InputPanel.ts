import {test} from '@playwright/test';
import {TestRecipe} from "./utils.js";

async function check(recipe, input, trim, encode, expected_output) {
	await recipe.input(input, trim, encode);
	await recipe.output(expected_output);
}

test.describe("Input Panel", () => {
	let recipe;

	test.beforeEach(async ({ page }) => {
		recipe = await TestRecipe.create(page);
	});

	test("trim left", async () => {
		await check(recipe, ' input.', true, false, 'input.');
	});

	test("trim right", async () => {
		await check(recipe, 'input. ', true, false, 'input.');
	});

	test("encode", async () => {
		await check(recipe, 'input', false, true, '__base64__("aW5wdXQ=").');
	});

	test("encode also preserves spaces", async () => {
		await check(recipe, ' input ', false, true, '__base64__("IGlucHV0IA==").');
	});

});