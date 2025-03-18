import {test} from '@playwright/test';
import {TestRecipe} from "./utils.js";

async function implode(recipe, ingredient, number) {
	await recipe.delay(2000);
	await ingredient.getByTestId('Recipe-number-of-ingredients-to-implode').fill(`${number}`);
	await ingredient.getByRole('button', {name: 'Implode'}).click();
}

async function explode(recipe, ingredient) {
	await recipe.delay(2000);
	await ingredient.getByRole('button', {name: 'Explode'}).click();
}

test.describe("Recipe", () => {
	let recipe;

	test.beforeEach(async ({ page }) => {
		recipe = await TestRecipe.create(page);
		await recipe.click_pause_baking();
	});

	test("no url, no action, just forward input", async () => {
		await recipe.recipe();
		await recipe.search_models('{a}.', {
			number: 2,
		});
		await recipe.sort_by_increasing_size();
		await recipe.click_pause_baking();
		await recipe.output(`
EMPTY MODEL
§
a.
		`);
	});

	test("implode one ingredient", async () => {
		const recipe_ingredient = await recipe.recipe();
		await recipe.search_models('{a}.', {
			number: 2,
		});
		await recipe.sort_by_increasing_size();
		await implode(recipe, recipe_ingredient, 1);
		await recipe.click_pause_baking();
		await recipe.output(`
EMPTY MODEL
§
a.
		`);
	});

	test("implode two ingredients", async () => {
		const recipe_ingredient = await recipe.recipe();
		await recipe.search_models('{a}.', {
			number: 2,
		});
		await recipe.sort_by_increasing_size();
		await implode(recipe, recipe_ingredient, 2);
		await recipe.click_pause_baking();
		await recipe.output(`
EMPTY MODEL
§
a.
		`);
	});

	test("implode all ingredients", async () => {
		const recipe_ingredient = await recipe.recipe();
		await recipe.search_models('{a}.', {
			number: 2,
		});
		await recipe.sort_by_increasing_size();
		await implode(recipe, recipe_ingredient, 0);
		await recipe.click_pause_baking();
		await recipe.output(`
EMPTY MODEL
§
a.
		`);
	});

	test("explode ingredients", async () => {
		const recipe_ingredient = await recipe.recipe();
		await recipe.search_models('{a}.', {
			number: 2,
		});
		await recipe.sort_by_increasing_size();
		await recipe.click_pause_baking();
		await implode(recipe, recipe_ingredient, 0);
		await explode(recipe, recipe_ingredient);
		await recipe.delay(1000);
		await recipe_ingredient.getByTestId('IngredientHeader-remove').click();
		await recipe.delay(1000);
		await recipe.output(`
EMPTY MODEL
§
a.
		`);
	});

});