import { test } from '@playwright/test';
import { TestRecipe } from './utils.js';

async function check(recipe, input, search, order, expected_output) {
	await recipe.input(input);
    await recipe.table({
        input_one_atom_per_line: input,
        search,
        order,
    });
	await recipe.output(expected_output);
}

test.describe("Table", () => {
    let recipe;

    test.beforeEach(async ({page}) => {
        recipe = await TestRecipe.create(page);
    });

    test("Display Table", async () => {
        await check(recipe, `
uno(b,c).
dos(c,d).
                `, [], [], `
uno(b,c).
dos(c,d).
            `);
    });

    test("Display Sorted Table by Predicate", async () => {
        await check(recipe, `
uno(b,c).
dos(c,d).
                `, [], [{ index: 0 }], `
dos(c,d).
uno(b,c).
            `);
    });

    test("Display Sorted Table by Predicate descending", async () => {
        await check(recipe, `
dos(c,d).
uno(b,c).
                `, [], [{ index: 0, desc: true }], `
uno(b,c).
dos(c,d).
            `);
    });

    test("Display Sorted Table by Arg#1", async () => {
        await check(recipe, `
foo(c,d).
foo(b,c).
                `, [], [{ index: 1 }], `
foo(b,c).
foo(c,d).
            `);
    });

    test("Display Sorted Table by Arg#1 descending", async () => {
        await check(recipe, `
foo(b,c).
foo(c,d).
                `, [], [{ index: 1, desc: true }], `
foo(c,d).
foo(b,c).
            `);
    });

    test("Search atoms", async () => {
        await check(recipe, `
foo(123).
bar(345).
                `, [{ string: '1', expected: 1 }], [], `
foo(123).
bar(345).
            `);
    });
});