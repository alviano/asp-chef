<script context="module">
    import {Recipe} from "$lib/recipe";
    import {Utils} from "$lib/utils";

    const operation = "Select Predicates";
    const default_extra_options = {
        predicates: [],
        other_predicates: [],
    };

    const listeners = new Map();

    Recipe.register_operation_type(operation, async (input, options, index, id) => {
        try {
            listeners.get(id)(input);
        } catch (error) { /* component not mounted, possibly because of headless mode */ }
        const included_predicates = new Set(options.predicates);
        return input.map(model => model.filter(atom => included_predicates.has(atom.predicate || 'CONSTANTS')));
    });
</script>

<script>
    import {Button, Icon, Input, InputGroup} from "sveltestrap";
    import Operation from "$lib/Operation.svelte";
    import {onDestroy, onMount} from "svelte";

    export let id;
    export let options;
    export let index;
    export let add_to_recipe;
    export let keybinding;

    let input_predicates = [];
    let program_predicates = new Set();

    let new_predicate = '';

    function edit() {
        Recipe.edit_operation(id, index, options);
    }

    function toggle_predicate(predicate) {
        const index_of_predicate = options.predicates.indexOf(predicate);
        if (index_of_predicate !== -1) {
            options.predicates.splice(index_of_predicate, 1);
            options.other_predicates.push(predicate);
        } else {
            const other_index_of_predicate = options.other_predicates.indexOf(predicate);
            if (other_index_of_predicate) {
                options.other_predicates.splice(other_index_of_predicate, 1);
            }
            options.predicates.push(predicate);
        }
        edit();
    }

    function remove_predicate(predicate) {
        const index_of_predicate = options.predicates.indexOf(predicate);
        if (index_of_predicate !== -1) {
            options.predicates.splice(index_of_predicate, 1);
        }
        const other_index_of_predicate = options.other_predicates.indexOf(predicate);
        if (other_index_of_predicate !== -1) {
            options.other_predicates.splice(other_index_of_predicate, 1);
        }
        edit();
    }

    function add_predicate(predicate) {
        if (options.predicates.includes(predicate)) {
            Utils.snackbar(`${predicate} already included!`)
        } else {
            toggle_predicate(predicate);
        }
    }

    onMount(() => {
        if (id !== undefined) {
            if (options.other_predicates === undefined) {
                options.other_predicates = [];
            }
            listeners.set(id, (input) => {
                program_predicates = new Set(Utils.predicates(input));
                input_predicates = Array.from([...new Set([...program_predicates, ...options.predicates, ...options.other_predicates])]).sort();
            });
        }
    });

    onDestroy(() => {
        if (id !== undefined) {
            listeners.delete(id);
        }
    });
</script>

<Operation {id} {operation} {options} {index} {default_extra_options} {add_to_recipe} {keybinding}>
    <div>
        {#each input_predicates as predicate}
            <InputGroup>
                <Button outline="{!options.predicates.includes(predicate)}" on:click={() => toggle_predicate(predicate)}
                    title="Include/exclude this predicate in the output"
                    data-testid="SelectPredicates-{predicate}">
                    <Icon name="{options.predicates.includes(predicate) ? 'eye' : 'eye-slash'}" />
                </Button>
                <Input disabled="{true}" value="{predicate}" />
                {#if !program_predicates.has(predicate)}
                    <Button on:click={(event) => { event.preventDefault(); remove_predicate(predicate); }}
                        title="Forget this predicate (not occurring in the program)">
                        <Icon name="trash" />
                    </Button>
                {/if}
            </InputGroup>
        {/each}
        <InputGroup>
            <Input type="text"
                   bind:value="{new_predicate}"
                   placeholder="predicate"
                   on:keydown={(event) => { if (event.key === 'Enter') { add_predicate(new_predicate) } }}
            />
            <Button on:click={() => add_predicate(new_predicate)}
                title="Add as selected predicate">
                <Icon name="cart-plus" />
            </Button>
        </InputGroup>
    </div>
</Operation>
