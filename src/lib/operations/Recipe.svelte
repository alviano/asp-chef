<script context="module">
    import {Recipe} from "$lib/recipe";
    import {consts} from "$lib/consts";
    import {Utils} from "$lib/utils";

    const operation = "Recipe";
    const default_extra_options = {
        name: '',
        url: '',
        show_side_output: false,
    };

    const listeners = new Map();

    Recipe.register_operation_type(operation, async (input, options, index, id) => {
        let recipe_url = options.url;
        if (recipe_url !== options.url) {
            Utils.snackbar(`Fetched recipe ${recipe_url.substring(0, 25)}...`)
        }
        if (recipe_url === '') {
            return input;
        }
        recipe_url = await Recipe.expand_if_short_link(recipe_url);
        if (recipe_url.indexOf('#') === -1) {
            Recipe.set_errors_at_index(index, 'Error: invalid URL, must contain #. Forward input.');
            return input;
        }

        let res = input;
        try {
            const url = recipe_url.split('#')[1];
            const recipe_ingredients = Recipe.extract_recipe_from_serialization(url);
            try {
                listeners.get(id)(recipe_url, recipe_ingredients);
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
    import {Badge, Button, Icon, Input, InputGroup, InputGroupText} from "sveltestrap";
    import Operation from "$lib/Operation.svelte";
    import {onDestroy, onMount} from "svelte";
    import Popover from "$lib/Popover.svelte";
    import Javascript from "$lib/operations/Javascript.svelte";
    import Nop from "$lib/operations/Nop.svelte";

    export let id;
    export let options;
    export let index;
    export let add_to_recipe;
    export let keybinding;
    export let remote_name = undefined;

    let recipe_url = '';
    let ingredients = [];
    let ingredients_length = 0;
    let number_of_ingredients_to_implode = 0;

    function normalized_recipe_url(recipe_url) {
        try {
            return consts.DOMAIN + '#' + new URL(recipe_url).hash.slice(1);
        } catch (error) {
            return '';
        }
    }

    function edit() {
        Recipe.edit_operation(id, index, options);
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

    async function resolve_url() {
        options.url = await Recipe.expand_if_short_link(recipe_url);
        edit();
    }

    async function shorten_url() {
        Utils.confirm({
            message: "The recipe contains no sensitive information and I want to create a short URL for it?",
            onconfirm: async () => {
                options.url = await Recipe.shorten_link(options.url);
                edit();
            },
        });
    }

    function leave_only_side_output(options) {
        return {
            ...options,
            hide_header: true,
            readonly: true
        };
    }

    async function register(options) {
        console.log(options)
        await Recipe.new_remote_recipe_operation(options.name, options.url, options.show_side_output);
        await Utils.snackbar("Registered! Search in the Operations panel to find the new operation");
    }

    onMount(() => {
        if (remote_name) {
            const recipe = Recipe.get_remote_recipe_operation(remote_name);
            if (options) {
                options = {
                    ...options,
                    ...recipe,
                };
                edit();
            }
        }
        listeners.set(id, (the_recipe_url, the_ingredients) => {
            recipe_url = the_recipe_url;
            ingredients = the_ingredients;
            ingredients_length = the_ingredients.length;
        });
    });

    onDestroy(() => {
        listeners.delete(id);
    });
</script>

<Operation {id} operation={remote_name || operation} {options} {index} {default_extra_options} {add_to_recipe} {keybinding}>
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
        <p>
            The side output of ingredients inside the <strong>{operation}</strong> ingredient can be shown by activating <Badge>SHOW SIDE OUTPUT</Badge>.
        </p>
    </div>
    <InputGroup>
        <InputGroupText>Name</InputGroupText>
        <Input type="text"
               bind:value={options.name}
               placeholder="Recipe name (possibly to register it as an operation)"
               on:input={edit}
               data-testid="Recipe-name"
        />
        <Button size="sm" disabled="{!options.name || !options.url}" on:click={() => register(options)}>Register</Button>
    </InputGroup>
    <InputGroup>
        <Input type="text"
               bind:value="{options.url}"
               placeholder="{consts.DOMAIN + '#/...%21'}"
               on:input={edit}
               data-testid="Recipe-url"
        />
        {#if recipe_url === options.url}
            <Button size="sm" title="Shorten recipe URL (not suggested in case of sensitive information in the URL)" on:click={shorten_url}>
                <Icon name="arrows-angle-contract" />
            </Button>
        {:else}
            <Button size="sm" title="Replace shorten recipe URL with its long version" on:click={resolve_url}>
                <Icon name="arrows-angle-expand" />
            </Button>
        {/if}
        <Button size="sm" title="Copy to clipboard" on:click={() => copy_to_clipboard(normalized_recipe_url(recipe_url))}>
            <Icon name="clipboard-plus" />
        </Button>
        <Button href="{normalized_recipe_url(recipe_url)}" target="_blank">
            Open in new tab
        </Button>
    </InputGroup>
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
        <InputGroupText>
            ingredients, from #{index + 2} to #{number_of_ingredients_to_implode ? index + 1 + number_of_ingredients_to_implode : 'end'}
        </InputGroupText>
    </InputGroup>
    <InputGroup>
        <Button on:click={explode}>Explode</Button>
        <InputGroupText>
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
        <Input disabled={true} />
        <Button outline="{!options.show_side_output}" on:click={() => { options.show_side_output = !options.show_side_output; edit(); }}>Show side output</Button>
    </InputGroup>
    <div slot="output">
        {#if options.show_side_output}
            {#each ingredients as item}
                {#if Recipe.is_remote_javascript_operation(item.operation)}
                    <Javascript remote_name={item.operation} id="{item.id}" options="{leave_only_side_output(item.options)}" {index} add_to_recipe="{undefined}" keybinding={undefined} />
                {:else if Recipe.is_remote_recipe_operation(item.operation)}
                    <svelte:self remote_name={item.operation} id="{item.id}" options="{leave_only_side_output(item.options)}" {index} add_to_recipe="{undefined}" keybinding={undefined} />
                {:else if Recipe.has_operation_type(item.operation)}
                    <svelte:component this={Recipe.operation_component(item.operation)} id="{item.id}" options="{leave_only_side_output(item.options)}" {index} add_to_recipe="{undefined}" keybinding={undefined} />
                {:else}
                    <Nop id={item.id} options={item.options} index={index} add_to_recipe={undefined} keybinding={undefined} />
                    <div class="alert-warning" style="color: white" data-fix-ingredient-index="{index}">
                        <h5 class="alert-heading">Oops!</h5>
                        Unknown operation replaced by Nop: {item.operation}.
                        Explode the recipe, fix it, and implode it back.
                    </div>
                {/if}
            {/each}
        {/if}
    </div>
</Operation>
