import {test} from '@playwright/test';
import {TestRecipe} from "./utils.js";

async function check(recipe, input, content, expected_output) {
	await recipe.input(input);
	await recipe.encode(content);
	await recipe.expand_mustache_queries();
	await recipe.select_predicates("__base64__");
	await recipe.output(expected_output, true, true);
}

test.describe("Expand Mustache Queries", () => {
	let recipe;

	test.beforeEach(async ({ page }) => {
		recipe = await TestRecipe.create(page);
	});

	test("inline", async () => {
		await check(recipe, `
foo(bar).
		`, `
what the {{= (X,) : foo(X) }}!		
		`, `
what the bar!
		`);
	});

	test("standard", async () => {
		await check(recipe, `
foo(bar).
		`, `
what the {{
  #show (X,) : foo(X).
}}!		
		`, `
what the bar!
		`);
	});

	test("sort", async () => {
		await check(recipe, `
foo(2).
foo(1).
		`, `
what the {{
  #show (X,) : foo(X).
  #show sort(1). 
  #show separator(", ").
}}!		
		`, `
what the 1, 2!
		`);
	});

  test("fstring_interpolation", async () => {
    await check(recipe, `
person("Mario", 30).
    `, `
{{= {{f"Name: \${N}, Age: \${A}"}} : person(N, A) }}
    `, `
Name: Mario, Age: 30
    `);
  });

  test("fstring_formatting", async () => {
    await check(
			recipe,
			`
data(1, "Oli Bob", 12, "red", "").
data(2, "Mary May", 1, "blue", "14/05/1982").
data(3, "Christine Lobowski", 42, "green", "22/05/1982").
data(4, "Brendon Philips", 125, "orange", "01/08/1980").
data(5, "Margret Marmajuke", 16, "yellow", "31/01/1999").
    `,
			`
{{= {{f"{
	id: \${Id:%5d}, 
	name: '\${Name}', 
	age: \${Age}, 
	col: '\${Color}', 
	dob: '\${DoB}'
}"}} : data(Id, Name, Age, Color, DoB) }}
    `,
			`
{
  id:     1, 
  name: 'Oli Bob', 
  age: 12, 
  col: 'red', 
  dob: ''
}
{
  id:     2, 
  name: 'Mary May', 
  age: 1, 
  col: 'blue', 
  dob: '14/05/1982'
}
{
  id:     3, 
  name: 'Christine Lobowski', 
  age: 42, 
  col: 'green', 
  dob: '22/05/1982'
}
{
  id:     4, 
  name: 'Brendon Philips', 
  age: 125, 
  col: 'orange', 
  dob: '01/08/1980'
}
{
  id:     5, 
  name: 'Margret Marmajuke', 
  age: 16, 
  col: 'yellow', 
  dob: '31/01/1999'
}
    `
		);
  });

  test("nested_fstring", async () => {
    await check(recipe, `
n("level1").
    `, `
{{= {{f"L1: \${X} -> {{f"L2"}}"}} : n(X) }}
    `, `
L1: level1 -> {{f"L2"}}
    `);
  });

  test("multiple_nesting", async () => {
    await check(recipe, `
val(1).
    `, `
{{= {{f"A: {{f"B: {{f"C"}}"}}"}} }}
    `, `
A: {{f"B: {{f"C"}}"}}
    `);
  });

  test("persistent_state_add", async () => {
    await check(
			recipe,
			`
data(1, "Oli Bob", 12, "red", "").
data(2, "Mary May", 1, "blue", "14/05/1982").
data(3, "Christine Lobowski", 42, "green", "22/05/1982").
data(4, "Brendon Philips", 125, "orange", "01/08/1980").
data(5, "Margret Marmajuke", 16, "yellow", "31/01/1999").`,
			`
{{+ separator(",")}}
{{= @string_format("{id: %d, name: '%s', age: %d, col: '%s', dob: '%s'}", Id, Name, Age, Color, DoB) : data(Id, Name, Age, Color, DoB) }}
    `,
			`

{id: 1, name: 'Oli Bob', age: 12, col: 'red', dob: ''},{id: 2, name: 'Mary May', age: 1, col: 'blue', dob: '14/05/1982'},{id: 3, name: 'Christine Lobowski', age: 42, col: 'green', dob: '22/05/1982'},{id: 4, name: 'Brendon Philips', age: 125, col: 'orange', dob: '01/08/1980'},{id: 5, name: 'Margret Marmajuke', age: 16, col: 'yellow', dob: '31/01/1999'}
    `
		);
  });

  test("persistent_state_reset", async () => {
    await check(
			recipe,
			`
data(1, "Oli Bob", 12, "red", "").
data(2, "Mary May", 1, "blue", "14/05/1982").
data(3, "Christine Lobowski", 42, "green", "22/05/1982").
data(4, "Brendon Philips", 125, "orange", "01/08/1980").
data(5, "Margret Marmajuke", 16, "yellow", "31/01/1999").`,
			`
{{+ separator(",")}}
{{-}}
{{= @string_format("{id: %d, name: '%s', age: %d, col: '%s', dob: '%s'}", Id, Name, Age, Color, DoB) : data(Id, Name, Age, Color, DoB) }}`,
			`

{id: 1, name: 'Oli Bob', age: 12, col: 'red', dob: ''}
{id: 2, name: 'Mary May', age: 1, col: 'blue', dob: '14/05/1982'}
{id: 3, name: 'Christine Lobowski', age: 42, col: 'green', dob: '22/05/1982'}
{id: 4, name: 'Brendon Philips', age: 125, col: 'orange', dob: '01/08/1980'}
{id: 5, name: 'Margret Marmajuke', age: 16, col: 'yellow', dob: '31/01/1999'}    `
		);
  });

});