<script>
    import {Badge, Button, ButtonGroup, CardHeader, CardTitle, Icon} from "sveltestrap";
    import {recipe, errors_at_index, processing_index} from "$lib/stores";
    import {Popover} from "dumbo-svelte";
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
                <Popover title="Duplicate operation" value="Add a copy of ingredient #{index + 1} below it.">
                    <Button size="sm" on:click={() => Recipe.duplicate_operation(index)}><Icon name="box-arrow-down" /></Button>
                </Popover>
                <Popover title="Operations" value="Add Operations ingredient above ingredient #{index + 1}.">
                    <Button size="sm" on:click={() => Recipe.add_operation('Operations', Recipe.common_default_options(), index)}>
                        <Icon name="box-arrow-up" />
                    </Button>
                </Popover>
            </ButtonGroup>
            <Popover title="Control execution of the recipe">
                <div slot="value">
                    <p>Enabled ingredients <Badge color="success"><Icon name="eye" /></Badge> are applied.</p>
                    <p>Disabled ingredients <Badge><Icon name="eye-slash" /></Badge> are skipped.</p>
                    <p>The recipe is terminated after applying an ingredient with the <strong>pause button</strong> <Badge><Icon name="pause-fill" /></Badge> active.</p>
                    <p>Ingredient details can be shown <Badge color="success"><Icon name="binoculars" /></Badge> or hidden <Badge><Icon name="binoculars" /></Badge> </p>
                </div>
                <ButtonGroup>
                    <Button size="sm" color={options.show ? "success" : "secondary"} outline={!options.show} on:click={() => Recipe.toggle_show_operation(index)}>
                        <Icon name="binoculars" />
                    </Button>
                    <Button size="sm" color={options.apply ? "success" : "secondary"} outline={!options.apply} on:click={() => Recipe.toggle_apply_operation(index)}>
                        <Icon name={options.apply ? "eye" : "eye-slash"} />
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