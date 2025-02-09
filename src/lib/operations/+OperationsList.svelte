<script>
    import {Recipe} from "$lib/recipe";
    import {Input} from "@sveltestrap/sveltestrap";
    import {onDestroy, onMount, tick} from "svelte";
    import {keydown} from "dumbo-svelte";
    import Popover from "$lib/Popover.svelte";
    import {Utils} from "$lib/utils";
    import {consts} from "$lib/consts";
    import {v4 as uuidv4} from "uuid";
    import Javascript from "$lib/operations/Javascript.svelte";
    import RecipeOperation from "$lib/operations/Recipe.svelte";

    export let index;
    export let style = '';

    let filter = '';
    let filter_focused = false;
    let components = [];
    let component_to_add = null;

    async function load_components(filter) {
        components = Recipe.operation_components(filter);
    }

    async function add_operation(component_index) {
        if (component_index >= components.length) {
            Utils.snackbar("Invalid selection");
            return;
        }
        component_to_add = components[component_index];
        await tick();
        component_to_add = null;
    }

    async function onkeydown(event) {
        if (event.key === 'Enter') {
            await add_operation(0);
        } else if (event.key >= '1' && event.key <= '9') {
            await add_operation(parseInt(event.key));
        } else if (event.key === '0') {
            await add_operation(10);
        } else {
            return;
        }
        event.preventDefault();
    }

    function keybinding(number, filter_focused) {
        if (!filter_focused) {
            return undefined;
        } else if (number === 0) {
            return consts.SYMBOLS.NEW_LINE;
        } else if (number < 10) {
            return number;
        } else if (number === 10) {
            return 0;
        } else {
            return undefined;
        }
    }

    const keydown_uuid = uuidv4();

    onMount(() => {
        if (index === undefined) {
            $keydown.push([keydown_uuid, (event) => {
                if (event.uKey === 'F') {
                    document.getElementById("OperationsDetail-search").focus()
                    Utils.snackbar("Ready to filter operations!");
                    return true;
                }
            }]);
        }
    });

    onDestroy(() => {
        $keydown = $keydown.filter(key_value => key_value[0] !== keydown_uuid);
    });

    $: load_components(filter);
</script>

<Popover block placement="right" title="Filter operations">
    <div slot="value">
        <p>Use a regular expression to filter the list of operation.</p>
        {#if index === undefined}
            <p>Jump to this filter with the keybinding <code>F</code>.</p>
        {/if}
        <p>
            When filtering, the keybinding shown in the buttons below can be used to add ingredients to the recipe.
        </p>
    </div>
    <Input type="search"
           id="OperationsDetail-search"
           bind:value={filter}
           placeholder=">>> Filter operations..."
           autocomplete="off"
           on:keydown={onkeydown}
           on:focus={() => filter_focused = true}
           on:blur={() => filter_focused = false}
    />
</Popover>
<div {style}>
    {#each components as component, number}
        {#if Recipe.is_remote_javascript_operation(component)}
            <Javascript id="{undefined}" options="{undefined}" {index} add_to_recipe="{undefined}"
                    keybinding="{keybinding(number, filter_focused)}" remote_name="{component}" />
        {:else if Recipe.is_remote_recipe_operation(component)}
            <RecipeOperation id="{undefined}" options="{undefined}" {index} add_to_recipe="{undefined}"
                    keybinding="{keybinding(number, filter_focused)}" remote_name="{component}" />
        {:else}
            <svelte:component this={component} id="{undefined}" options="{undefined}" {index} add_to_recipe="{undefined}"
                          keybinding="{keybinding(number, filter_focused)}" />
        {/if}
    {/each}
</div>

{#if component_to_add}
    {#if Recipe.is_remote_javascript_operation(component_to_add)}
        <Javascript id="{undefined}" options="{undefined}" {index} add_to_recipe="{true}" keybinding="{undefined}" remote_name="{component_to_add}" />
    {:else if Recipe.is_remote_recipe_operation(component_to_add)}
        <RecipeOperation id="{undefined}" options="{undefined}" {index} add_to_recipe="{true}" keybinding="{undefined}" remote_name="{component_to_add}" />
    {:else}
        <svelte:component this={component_to_add} id="{undefined}" options="{undefined}" {index} add_to_recipe="{true}" keybinding="{undefined}" />
    {/if}
{/if}