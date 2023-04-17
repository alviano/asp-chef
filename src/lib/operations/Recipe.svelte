<script context="module">
    import {Recipe} from "$lib/recipe";
    import {consts} from "$lib/consts";

    const operation = "Recipe";
    const default_extra_options = {
        url: '',
    };

    const listeners = new Map();

    Recipe.register_operation_type(operation, async (input, options, index, id) => {
        if (options.url === '') {
            return input;
        } else  if (options.url.indexOf('#') === -1) {
            Recipe.set_errors_at_index(index, 'Error: invalid URL, must contain #. Forward input.');
            return input;
        }

        let res = input;
        try {
            const url = options.url.split('#')[1];
            const recipe_ingredients = Recipe.extract_recipe_from_serialization(url);
            try {
                listeners.get(id)(recipe_ingredients);
            } catch (error) { /* component not mounted, possibly because of headless mode */ }
            for (const ingredient of recipe_ingredients) {
                if (ingredient.options.apply) {
                    res = await Recipe.apply_operation_type(index, ingredient, res);
                }
                if (ingredient.options.stop) {
                    break;
                }
            }
        } catch (error) {
            Recipe.set_errors_at_index(index, error, res);
        }
        return res;
    });
</script>

<script>
    import {Button, Icon, Input, InputGroup, InputGroupText} from "sveltestrap";
    import Operation from "$lib/operations/Operation.svelte";
    import {onDestroy, onMount} from "svelte";
    import {Popover} from "dumbo-svelte";
    import {Utils} from "$lib/utils";

    export let id;
    export let options;
    export let index;
    export let add_to_recipe;
    export let keybinding;

    let ingredients = [];
    let ingredients_length = 0;
    let number_of_ingredients_to_implode = 0;

    function edit() {
        Recipe.edit_operation(index, options);
    }

    async function explode() {
        const stores = new Map();
        for (const [ingredient_index, ingredient] of ingredients.entries()) {
            await Recipe.add_operation(ingredient.operation, ingredient.options, index + ingredient_index + 1);
            if (ingredient.operation === 'Store') {
                stores.set(ingredient.id, Recipe.id_of_ingredient(index + ingredient_index + 1));
            } else if (ingredient.operation === 'Restore') {
                const the_options = JSON.parse(JSON.stringify(ingredient.options));
                the_options.store = stores.get(ingredient.options.store);
                Recipe.edit_operation(index + ingredient_index + 1, the_options);
            }
        }
    }

    function implode(number) {
        options.url = `${consts.DOMAIN}/#${Recipe.serialize_ingredients(index + 1, number)}`;
        edit();
        Recipe.remove_operations(index + 1, number);
    }

    async function copy_to_clipboard(url) {
        await navigator.clipboard.writeText(url);
        Utils.snackbar("URL ready to be pasted!");
    }

    onMount(() => {
        listeners.set(id, (the_ingredients) => {
            ingredients = the_ingredients;
            ingredients_length = the_ingredients.length;
        });
    });

    onDestroy(() => {
        listeners.delete(id);
    });
</script>

<Operation {id} {operation} {options} {index} {default_extra_options} {add_to_recipe} {keybinding}>
    <div slot="description">
        <p>The <strong>{operation}</strong> operation takes a URL representing another recipe and adds that recipe as an ingredient.</p>
        <p>
            This operation is practically equivalent to copy all ingredients of a recipe into another recipe.
        </p>
        <p>
            Note that ASP Chef URLs also contains input, as well as flags to encode input and decode output.
            Such content is ignored, as well as anything preceding <code>#</code>.
        </p>
        <p>
            The ingredients of the recipe ingredient can be added to the main recipe (explode button).
            Similarly, some ingredients can be imploded into the recipe ingredient (implode button), actually replacing it.
        </p>
    </div>
    <Input type="text"
           bind:value="{options.url}"
           placeholder="{consts.DOMAIN + '#/...%21'}"
           on:input={edit}
           data-testid="Recipe-url"
    />
    <InputGroup>
        <Button on:click={() => implode(number_of_ingredients_to_implode)}>
            Implode
        </Button>
        <Input type="number"
               bind:value={number_of_ingredients_to_implode}
               min="0"
               title="Number of ingredients below to implode (0 for all)"
               data-testid="Recipe-number-of-ingredients-to-implode"
        />
        <InputGroupText class="me-3">
            from #{index + 2} to #{number_of_ingredients_to_implode ? index + 1 + number_of_ingredients_to_implode : 'end'}
        </InputGroupText>
        <Button on:click={explode}>Explode</Button>
        <InputGroupText class="me-3">
            <Popover title="Ingredients in the Recipe">
                <div slot="value">
                    {#each ingredients as ingredient, index}
                        <span>
                            #{index + 1}. {ingredient.operation}
                            {#if !ingredient.options.apply}
                                [not applied]
                            {/if}
                            {#if ingredient.options.stop}
                                [STOP!]
                            {/if}
                        </span><br />
                    {/each}
                </div>
                <code>{ingredients.length} ingredients</code>
            </Popover>
        </InputGroupText>
        <Button href="{consts.DOMAIN + '#' + options.url.split('#')[1]}" target="_blank">
            Open in new tab
        </Button>
        <Button size="sm" title="Copy to clipboard" on:click={() => copy_to_clipboard(consts.DOMAIN + '#' + options.url.split('#')[1])}>
            <Icon name="clipboard-plus" />
        </Button>
    </InputGroup>
</Operation>
