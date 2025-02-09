<script>
    import {Badge, Button, ButtonGroup, CardHeader, CardTitle, Icon} from "@sveltestrap/sveltestrap";
    import {recipe, errors_at_index, processing_index, drag_disabled} from "$lib/stores";
    import Popover from "$lib/Popover.svelte";
    import {Recipe} from "$lib/recipe";

    export let id;
    export let operation;
    export let index;
    export let options;

    function mouse_in_draggable_area() {
        drag_disabled.set(false);
    }

    function mouse_out_of_draggable_area() {
        drag_disabled.set(true);
    }
</script>

<CardHeader>
    <CardTitle class="h6">
        <Popover title="Ingredient #{index + 1}">
            <div slot="value">
                <p><em>Drag&amp;drop</em> the ingredient index  to move the ingredient in the recipe.</p>
                <p>UUID: {id}</p>
            </div>
            <span aria-hidden="true" on:mouseenter={mouse_in_draggable_area} on:mouseleave={mouse_out_of_draggable_area} class="drag">
                #{index + 1}.
            </span>
            {operation}{options.name ? ": " + options.name : ""}
        </Popover>
        <span class="float-end">
            {#if $processing_index === index}
                <Badge color="warning me-2">Processing</Badge>
            {:else if $processing_index < index}
                <Badge color="info me-2">Waiting</Badge>
            {/if}
            {#if $errors_at_index[index]}
                <Badge color="danger me-2">Errors!</Badge>
            {/if}
            <Popover title="Remove operation" value="Remove ingredient #{index + 1} from the recipe.">
                <Button size="sm" color="danger" on:click={() => Recipe.remove_operation(index)} data-testid="IngredientHeader-remove"><Icon name="trash" /></Button>
            </Popover>
            <ButtonGroup>
                <Popover title="Operations" value="Add Operations ingredient above ingredient #{index + 1}.">
                    <Button size="sm" on:click={() => Recipe.add_operation('Operations', Recipe.common_default_options(), index)}>
                        <Icon name="box-arrow-up" />
                    </Button>
                </Popover>
                <Popover title="Duplicate operation" value="Add a copy of ingredient #{index + 1} below it.">
                    <Button size="sm" on:click={() => Recipe.duplicate_operation(index)}><Icon name="box-arrow-down" /></Button>
                </Popover>
            </ButtonGroup>
            <ButtonGroup>
                <Popover title="Interceptor above" value="Add Interceptor ingredient above ingredient #{index + 1}.">
                    <Button size="sm" on:click={() => Recipe.add_operation('Interceptor', Recipe.common_default_options(), index)}>
                        <Icon name="box-arrow-in-up" />
                    </Button>
                </Popover>
                <Popover title="Interceptor below" value="Add Interceptor ingredient below ingredient #{index + 1}.">
                    <Button size="sm" on:click={() => Recipe.add_operation('Interceptor', Recipe.common_default_options(), index + 1)}>
                        <Icon name="box-arrow-in-down" />
                    </Button>
                </Popover>
            </ButtonGroup>
            <ButtonGroup>
                <Popover title="Show ingredient details">
                    <div slot="value">
                        <p>Activate <Badge color="secondary"><Icon name="binoculars" /></Badge> to show the ingredient details.</p>
                        <p><em>It also invalidates the cache and runs the ingredient.</em></p>
                    </div>
                    <Button size="sm" color="secondary" outline={!options.show} on:click={() => Recipe.toggle_show_operation(index)}>
                        <Icon name="binoculars" />
                    </Button>
                </Popover>
                <Popover title="Show edit controls">
                    <div slot="value">
                        <p>Activate <Badge color="secondary"><Icon name="pencil" /></Badge> to modify the ingredient.</p>
                        <p><em>It also invalidates the cache and runs the ingredient.</em></p>
                    </div>
                    <Button size="sm" color="secondary" outline={options.readonly} on:click={() => Recipe.toggle_readonly_operation(index)}>
                        <Icon name="pencil" />
                    </Button>
                </Popover>
                <Popover title="Show ingredient header bar">
                    <div slot="value">
                        <p>Click on <Badge color="secondary"><Icon name="arrow-down-up" /></Badge> to hide the header bar.</p>
                        <p>Header bars can be shown back by clicking on the number of hidden headers in the button <Badge color="secondary"><Icon name="arrow-down-up" /></Badge>.</p>
                    </div>
                    <Button size="sm"
                            color="secondary"
                            on:click={() => Recipe.toggle_hide_header_operation(index)}>
                        <Icon name="arrow-down-up" />
                    </Button>
                </Popover>
                <Popover title="Skip ingredient">
                    <div slot="value">
                        <p>Activate <Badge color="warning"><Icon name="skip-forward" /></Badge> to skip the ingredient.</p>
                    </div>
                    <Button size="sm" color={options.apply ? "secondary" : "warning"} outline={options.apply} on:click={() => Recipe.toggle_apply_operation(index)}>
                        <Icon name="skip-forward" />
                    </Button>
                </Popover>
                <Popover title="Terminate recipe here">
                    <div slot="value">
                        <p>The recipe is terminated after applying an ingredient with the <strong>pause button</strong> <Badge color="danger"><Icon name="pause-fill" /></Badge> active.</p>
                    </div>
                    <Button size="sm" color={options.stop ? "danger" : "secondary"} outline={!options.stop} on:click={() => Recipe.toggle_stop_at_operation(index)}><Icon name="pause-fill" /></Button>
                </Popover>
            </ButtonGroup>
            <ButtonGroup>
                <Popover title="Move operation up" value="Move ingredient #{index + 1} up in the recipe.">
                    <Button size="sm" disabled="{index <= 0}" on:click={() => Recipe.swap_operations(index - 1, index)}><Icon name="arrow-up" /></Button>
                </Popover>
                <Popover title="Move operation down" value="Move ingredient #{index + 1} down in the recipe.">
                    <Button size="sm" disabled="{index + 1 >= $recipe.length}" on:click={() => Recipe.swap_operations(index, index + 1)}><Icon name="arrow-down" /></Button>
                </Popover>
            </ButtonGroup>
        </span>
    </CardTitle>
</CardHeader>

<style>
    span.drag {
        cursor: move;
    }
</style>