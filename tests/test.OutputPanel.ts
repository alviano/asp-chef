import {test} from '@playwright/test';
import {TestRecipe} from "./utils.js";

async function check(recipe, input, trim, encode, decode, expected_output) {
	await recipe.input(input, trim, encode);
	await recipe.output(expected_output, false, decode);
}

test.describe("Output Panel", () => {
	let recipe;

	test.beforeEach(async ({ page }) => {
		recipe = await TestRecipe.create(page);
	});

	test("echo", async () => {
		await check(recipe, ' input.', true, false, false, 'input.');
	});

	test("encode", async () => {
		await check(recipe, 'input', false, true, false, '__base64__("aW5wdXQ=").');
	});

	test("decode", async () => {
		await check(recipe, ' input ', false, true, true, ' input ');
	});

});