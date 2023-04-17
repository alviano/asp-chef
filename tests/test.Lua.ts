import {test} from '@playwright/test';
import {TestRecipe} from "./utils.js";

async function check(recipe, input, lua, search_models, expected_output) {
	await recipe.input(input);
	await recipe.lua(lua);
	await recipe.search_models(search_models);
	await recipe.output(expected_output);
}

test.describe("Lua", () => {
	let recipe;

	test.beforeEach(async ({ page }) => {
		recipe = await TestRecipe.create(page);
	});

	test("successor", async () => {
		await check(recipe, `
first_even_number(0).
		`, `
function successor(x)
  	return x.number + 1
end
		`, `
first_odd_number(@successor(Number)) :- first_even_number(Number).
		`, `
first_even_number(0).
first_odd_number(1).
		`);
	});

	test("middle point over reals", async () => {
		await check(recipe, `
pair("0.1", "0.2").
		`, `
function middle(x, y)
  	return string.format("%.2f", (tonumber(x.string) + tonumber(y.string)) / 2.0) 
end
		`, `
middle(@middle(X,Y)) :- pair(X,Y).
		`, `
pair("0.1","0.2").
middle("0.15").
		`);
	});

});