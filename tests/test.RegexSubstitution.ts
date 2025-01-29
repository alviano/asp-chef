import {test} from '@playwright/test';
import {TestRecipe} from "./utils.js";

async function check(recipe, input, pattern, pattern_flags, replacement, expected_output) {
	await recipe.input(input, false, true);
	await recipe.regex_substitution( { pattern, pattern_flags, replacement });
	await recipe.output(expected_output, false, true);
}

test.describe("Regex Substition", () => {
	let recipe;

	test.beforeEach(async ({ page }) => {
		recipe = await TestRecipe.create(page);
	});

	test("single substitution", async () => {
		await check(recipe, `
Person: Mario Alviano.
Person: Foo BAR.
		`, "Person: (\\w+)\\s(\\w+)\\.\\n", "", "Person: $2, $1.\\n", `
Person: Alviano, Mario.
Person: Foo BAR.
		`);
	});

	test("global substitution", async () => {
		await check(recipe, `
Person: Mario Alviano.
Person: Foo BAR.
		`, "Person: (\\w+)\\s(\\w+)\\.\\n", "g", "Person: $2, $1.\\n", `
Person: Alviano, Mario.
Person: BAR, Foo.
		`);
	});


});