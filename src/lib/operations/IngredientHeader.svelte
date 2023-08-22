<script>
    import {Badge, Button, ButtonGroup, CardHeader, CardTitle, Icon} from "sveltestrap";
    import {recipe, errors_at_index, processing_index} from "$lib/stores";
    import Popover from "$lib/Popover.svelte";
    import {Recipe} from "$lib/recipe";

    export let id;
    export let operation;
    export let index;
    export let options;
</script>

<CardHeader>
    <CardTitle class="h6">
        <Popover title="Ingredient #{index + 1}">
            <div slot="value">
                <p>Drag and drop to move the ingredient in the recipe.</p>
                <p>UUID: {id}</p>
            </div>
            #{index + 1}.
            {operation}
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
                <Popover title="Duplicate operation" value="Add a copy of ingredient #{index + 1} below it.">
                    <Button size="sm" on:click={() => Recipe.duplicate_operation(index)}><Icon name="box-arrow-down" /></Button>
                </Popover>
            </ButtonGroup>
            <Popover title="Control execution of the recipe">
                <div slot="value">
                    <p>Activate <Badge color="success"><Icon name="binoculars" /></Badge> to show the ingredient.</p>
                    <p>Activate <Badge color="secondary"><Icon name="pencil" /></Badge> to modify the ingredient.</p>
                    <p>Activate <Badge color="warning"><Icon name="skip-forward" /></Badge> to skip the ingredient.</p>
                    <p>The recipe is terminated after applying an ingredient with the <strong>pause button</strong> <Badge color="danger"><Icon name="pause-fill" /></Badge> active.</p>
                </div>
                <ButtonGroup>
                    <Button size="sm" color={options.show ? "success" : "secondary"} outline={!options.show} on:click={() => Recipe.toggle_show_operation(index)}>
                        <Icon name="binoculars" />
                    </Button>
                    <Button size="sm" color="secondary" outline={options.readonly} on:click={() => Recipe.toggle_readonly_operation(index)}>
                        <Icon name="pencil" />
                    </Button>
                    <Button size="sm" color={options.apply ? "secondary" : "warning"} outline={options.apply} on:click={() => Recipe.toggle_apply_operation(index)}>
                        <Icon name="skip-forward" />
                    </Button>
                    <Button size="sm" color={options.stop ? "danger" : "secondary"} outline={!options.stop} on:click={() => Recipe.toggle_stop_at_operation(index)}><Icon name="pause-fill" /></Button>
                </ButtonGroup>
            </Popover>
            <Popover title="Move operation" value="Move ingredient #{index + 1} up or down in the recipe.">
                <ButtonGroup>
                    <Button size="sm" disabled="{index <= 0}" on:click={() => Recipe.swap_operations(index - 1, index)}><Icon name="arrow-up" /></Button>
                    <Button size="sm" disabled="{index + 1 >= $recipe.length}" on:click={() => Recipe.swap_operations(index, index + 1)}><Icon name="arrow-down" /></Button>
                </ButtonGroup>
            </Popover>
        </span>
    </CardTitle>
</CardHeader>