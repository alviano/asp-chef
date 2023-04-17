import {test} from '@playwright/test';
import {TestRecipe} from "./utils.js";


test.describe("Recipe Panel", () => {
	let recipe;

	test.beforeEach(async ({ page }) => {
		recipe = await TestRecipe.create(page);
	});

	test("extract a graph from JSON", async () => {
		await recipe.input(``);
		await recipe.encode(`
{
    "nodes": [1, 2, 3],
    "links": [
        [1, 2],
        [2, 3],
        [3, 1]
    ]
}
		`);
		await recipe.json_path('$.nodes.*', 'node', true);
		await recipe.json_path('$.links.*', 'link', true);
		await recipe.select_predicates('node', 'link');
		await recipe.wrap('__graph__');
		await recipe.graph('__graph__', true);
		await recipe.unwrap('__graph__');
		await recipe.output(`
node(1).
node(2).
node(3).
link(1,2).
link(2,3).
link(3,1).
		`);
	});
});