<script context="module">
    import {Recipe} from "$lib/recipe";

    const operation = "Table";
    const default_extra_options = {
        search: '',
        hide_search: false,
        hide_model_index: false,
        hide_sort_buttons: false,
    };

    const listeners = new Map();

    Recipe.register_operation_type(operation, async (input, options, index, id) => {
        try {
            listeners.get(id)(input);
        } catch (error) { /* component not mounted, possibly because of headless mode */ }
        return input;
    });
</script>

<script>
    import {Button, ButtonGroup, Icon, Input, InputGroup, InputGroupText, Table} from "@sveltestrap/sveltestrap";
    import Operation from "$lib/Operation.svelte";
    import {onDestroy, onMount} from "svelte";
    import Popover from "$lib/Popover.svelte";

    export let id;
    export let options;
    export let index;
    export let add_to_recipe;
    export let keybinding;

    let models = [];

    function edit() {
        Recipe.edit_operation(id, index, options);
    }

    function argument_indices(model) {
        const max = model.reduce((max, atom) => Math.max(max, atom.terms ? atom.terms.length : 0), 0);
        return [...Array(max).keys()];
    }

    function add_sort(sort_index = 0, descending = false) {
        Recipe.add_operation(
            'Sort by Predicate or Argument',
            { ...Recipe.common_default_options(), sort_index: sort_index, descending: descending },
            index
        );
    }

    function match(atom) {
        try {
            return atom.str.match(new RegExp(options.search, 'i'));
        } catch (error) {
            return true;
        }
    }

    onMount(() => {
        listeners.set(id, (input) => {
            models = input;
        });
    });

    onDestroy(() => {
        listeners.delete(id);
    });
</script>

<Operation {id} {operation} {options} {index} {default_extra_options} {add_to_recipe} {keybinding}>
    <InputGroup>
        <InputGroupText>UI Elements</InputGroupText>
        <Button outline="{options.hide_search}" on:click={() => { options.hide_search = !options.hide_search; edit(); }}>Search</Button>
        <Button outline="{options.hide_model_index}" on:click={() => { options.hide_model_index = !options.hide_model_index; edit(); }}>Model Index</Button>
        <Button outline="{options.hide_sort_buttons}" on:click={() => { options.hide_sort_buttons = !options.hide_sort_buttons; edit(); }}>Sort Buttons</Button>
    </InputGroup>
    <div slot="output">
        {#if !options.hide_search}
            <InputGroup>
                <InputGroupText>Search</InputGroupText>
                <Input type="search" placeholder="Search..." bind:value={options.search} on:input={edit} data-testid="Table-search" />
            </InputGroup>
        {/if}
        <div class="m-1" style="overflow-y: auto;">
            {#each models as model, model_index}
                {#if !options.hide_model_index}
                    <h6 class="text-center">Model #{model_index + 1}</h6>
                {/if}
                <Table bordered data-testid="Table">
                    {#if !options.hide_sort_buttons}
                        <thead>
                            <tr>
                                <th>
                                    <Popover block title="Sort by predicate" value="Add a Sort operation before this ingredient.">
                                        <ButtonGroup class="align-content-center">
                                        <InputGroupText>Predicate</InputGroupText>
                                                <Button size="sm" on:click={() => add_sort(0, true)} data-testid="Table-sort-desc-0">
                                                    <Icon name="arrow-up" />
                                                </Button>
                                            <Button size="sm" on:click={() => add_sort(0, false)} data-testid="Table-sort-asc-0">
                                                <Icon name="arrow-down" />
                                            </Button>
                                        </ButtonGroup>
                                    </Popover>
                                </th>
                                {#each argument_indices(model) as arg_index}
                                    <th>
                                        <Popover block title="Sort by argument #{arg_index + 1}" value="Add a Sort operation before this ingredient.">
                                            <ButtonGroup class="align-content-center">
                                                <InputGroupText>Arg#{arg_index + 1}</InputGroupText>
                                                <Button size="sm" on:click={() => add_sort(arg_index + 1, true)} data-testid="Table-sort-desc-{arg_index + 1}">
                                                    <Icon name="arrow-up" />
                                                </Button>
                                                <Button size="sm" on:click={() => add_sort(arg_index + 1, false)} data-testid="Table-sort-asc-{arg_index + 1}">
                                                    <Icon name="arrow-down" />
                                                </Button>
                                            </ButtonGroup>
                                        </Popover>
                                    </th>
                                {/each}
                            </tr>
                        </thead>
                    {/if}
                    <tbody>
                        {#if model.length === 0}
                            <tr>
                                <td>EMPTY</td>
                            </tr>
                        {:else}
                            {#each model as atom}
                                {#if match(atom)}
                                    <tr>
                                        <td><code>{atom.predicate || 'CONSTANT'}</code></td>
                                        {#if atom.terms}
                                            {#each atom.terms as term}
                                                <td><code>{term.str}</code></td>
                                            {/each}
                                        {:else if atom.string !== undefined || atom.number !== undefined}
                                            <td><code>{atom.str}</code></td>
                                        {/if}
                                    </tr>
                                {/if}
                            {/each}
                        {/if}
                    </tbody>
                </Table>
            {/each}
        </div>
    </div>
</Operation>
