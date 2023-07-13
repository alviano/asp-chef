<script>
    import {Alert, Button, Card, CardBody} from "sveltestrap";
    import IngredientHeader from "$lib/operations/IngredientHeader.svelte";
    import {Recipe} from "$lib/recipe";
    import {Popover} from "dumbo-svelte";
    import {drag_disabled, errors_at_index, show_ingredient_details} from "$lib/stores";

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

    function mouse_in_draggable_area() {
        drag_disabled.set(false);
    }

    function mouse_out_of_draggable_area() {
        drag_disabled.set(true);
    }
</script>

{#if id !== undefined}
    <Card style="border-top: 3px solid black; {options.stop ? 'border-bottom: 3px solid red;' : ''} {options.apply ? '' : 'border-left: 3px dashed red; border-right: 3px dashed red;'}"
          data-testid="Operation">
        <div on:mouseenter={mouse_in_draggable_area} on:mouseleave={mouse_out_of_draggable_area}>
            <IngredientHeader {id} {operation} {index} {options} />
        </div>
        {#if $show_ingredient_details && options.show}
        <CardBody class="p-0" style="cursor: auto;">
            <slot />
            {#if $errors_at_index[index]}
                <div class="alert-danger p-3" style="color: white">
                    <h5 class="alert-heading">Errors</h5>
                    <div class="font-monospace">{$errors_at_index[index]}</div>
                </div>
            {/if}
        </CardBody>
        {/if}
    </Card>
{:else}
    <Popover block placement="right" title="Add {operation} Operation" class="mw-70">
        <div slot="value">
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