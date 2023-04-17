<script context="module">
    import {Recipe} from "$lib/recipe";

    const operation = "Table";
    const default_extra_options = {
        search: '',
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
    import {Button, ButtonGroup, Icon, Input, InputGroup, InputGroupText, Table} from "sveltestrap";
    import Operation from "$lib/operations/Operation.svelte";
    import {onDestroy, onMount} from "svelte";
    import {Popover} from "dumbo-svelte";

    export let id;
    export let options;
    export let index;
    export let add_to_recipe;
    export let keybinding;

    let models = [];

    function edit() {
        Recipe.edit_operation(index, options);
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
    <div slot="description">
        <p>
            The <strong>{operation}</strong> operation shows input models in tables.
        </p>
        <p>
            Each table comprises one row for each atom in the associated model.
        </p>
        <p>
            The input is echoed in output.
        </p>
    </div>
    <InputGroup>
        <InputGroupText>Search</InputGroupText>
        <Input type="search" placeholder="Search..." bind:value={options.search} on:input={edit} data-testid="Table-search" />
    </InputGroup>
    <div class="m-1" style="overflow-y: auto;">
        {#each models as model, model_index}
            <h6 class="text-center">Model #{model_index + 1}</h6>
            <Table bordered data-testid="Table">
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
                                        <td><code>{atom.str}</code>
                                    {/if}
                                </tr>
                            {/if}
                        {/each}
                    {/if}
                </tbody>
            </Table>
        {/each}
    </div>
</Operation>
