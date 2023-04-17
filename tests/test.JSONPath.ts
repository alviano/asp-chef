import {test} from '@playwright/test';
import {TestRecipe} from "./utils.js";

async function check_queries(recipe, json, queries, predicates, expected_output) {
	await recipe.input(``);
	await recipe.encode(json);
	for (let index = 0; index < queries.length; index++) {
		await recipe.json_path(queries[index], predicates[index]);
	}
	await recipe.select_predicates(...predicates);
	await recipe.output(expected_output);
}

test.describe("JSON Path", () => {
	let recipe;

	test.beforeEach(async ({ page }) => {
		recipe = await TestRecipe.create(page);
	});

	test("extract numbers", async () => {
		await check_queries(recipe, `
{
    "numbers": [1, 2, 3]
}
		`, ['$.numbers.*'], ['number'], `
number(1).
number(2).
number(3).
		`);
	});

	test("extract strings", async () => {
		await check_queries(recipe, `
{
    "strings": ["foo", "bar"]
}
		`, ['$.strings.*'], ['string'], `
string("foo").
string("bar").
		`);
	});

	test("extract arguments", async () => {
		await check_queries(recipe, `
{
    "binary": [[1, 2], [3, 4], ["a", "b"]]
}
		`, ['$.binary.*'], ['binary'], `
binary(1,2).
binary(3,4).
binary("a","b").
		`);
	});

	test("extract objects", async () => {
		await check_queries(recipe, `
{
    "objects": [
    	{
    		"foo": 1,
    		"bar": "buzz"
    	}
    ]
}
		`, ['$.objects.*'], ['object'], `
object(foo(1),bar("buzz")).
		`);
	});

	test("extract object values (ignoring keys)", async () => {
		await check_queries(recipe, `
{
    "objects": {
		"foo": 1,
		"bar": "buzz"
	}
}
		`, ['$.objects.*'], ['object'], `
object(1).
object("buzz").
		`);
	});

});