import {test} from '@playwright/test';
import {TestRecipe} from "./utils.js";

async function check(recipe, input, predicate, echo, expected_output) {
	await recipe.input(input);
	await recipe.output_encoded_content(expected_output, true,{ predicate, echo });
	if (echo) {
		await recipe.output(input);
	}
}

test.describe("Output Encoded Content", () => {
	let recipe;

	test.beforeEach(async ({ page }) => {
		recipe = await TestRecipe.create(page);
	});

	test("hello world!", async () => {
		await check(recipe, `
__base64__("aGVsbG8gd29ybGQh").
		`, '__base64__', false,`
hello world!
		`);
	});

	test("hello echo", async () => {
		await check(recipe, `
base64("aGVsbG8gd29ybGQh").
		`, 'base64', true,`
hello world!
		`);
	});

});