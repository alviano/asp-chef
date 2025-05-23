<script>
    import {Button, Card, CardBody, Icon} from "@sveltestrap/sveltestrap";
    import IngredientHeader from "$lib/IngredientHeader.svelte";
    import {Recipe} from "$lib/recipe";
    import Popover from "$lib/Popover.svelte";
    import {
        errors_at_index,
        readonly_ingredients,
        show_ingredient_details,
        show_ingredient_headers
    } from "$lib/stores";

    function default_options() {
        return {
            ...Recipe.common_default_options(),
            ...default_extra_options,
        };
    }

    export let default_extra_options;

    export let id;
    export let operation;
    export let options = default_options();
    export let index;
    export let add_to_recipe;
    export let keybinding;

    if (add_to_recipe) {
        Recipe.add_operation(operation, options, index);
    }
</script>

{#if id !== undefined}
    <Card style="{$show_ingredient_headers && !options.hide_header ? 'border-top: 3px solid black;' : 'border: 0px;'} {options.stop ? 'border-bottom: 3px solid red;' : ''} {options.apply ? '' : 'border-left: 3px dashed #f47c3c; border-right: 3px dashed #f47c3c;'}"
          data-testid="Operation">
        {#if $show_ingredient_headers && !options.hide_header}
            <IngredientHeader {id} {operation} {index} {options} />
        {/if}
        {#if $show_ingredient_details && options.show}
            <CardBody class="p-0" style="cursor: auto;">
                {#if !$readonly_ingredients && !options.readonly}
                    <slot />
                {/if}
                <slot name="output" />
                {#if $errors_at_index[index]}
                    <div class="alert-danger p-3" style="color: white">
                        <h5 class="alert-heading">Errors</h5>
                        <div class="font-monospace" style="white-space: pre; overflow: auto;">{$errors_at_index[index]}</div>
                    </div>
                {/if}
            </CardBody>
        {/if}
    </Card>
{:else}
    <Popover block placement="right" title="Add {operation} Operation" class="mw-70">
        <div slot="value">
            {#await Recipe.operation_doc(operation, true)}
                <em>Loading documentation...</em>
            {:then doc}
                {@html doc}
            {/await}
            <slot name="description" />
            {#if keybinding !== undefined}
                <p>Keybinding: <code>{keybinding}</code></p>
            {/if}
        </div>
        <Button block outline style="border-radius: 0; text-align: left; text-transform: revert;"
                on:click={() => Recipe.add_operation(operation, {...options}, index)}>
            {operation}
            {#if keybinding !== undefined}
                <code class="float-end">[{keybinding}]</code>
            {/if}
        </Button>
    </Popover>
{/if}

<style>
    :global(.mw-70) {
        max-width: 70%!important;
    }
</style>