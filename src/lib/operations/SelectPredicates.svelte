<script context="module">
    import {Recipe} from "$lib/recipe";
    import {Utils} from "$lib/utils";

    const operation = "Select Predicates";
    const default_extra_options = {
        predicates: [],
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
    import {Input, InputGroup, Label} from "sveltestrap";
    import Operation from "$lib/Operation.svelte";
    import {onDestroy, onMount} from "svelte";

    export let id;
    export let options;
    export let index;
    export let add_to_recipe;
    export let keybinding;

    let input_predicates = [];

    function edit() {
        Recipe.edit_operation(id, index, options);
    }

    function toggle_predicate(predicate) {
        const index_of_predicate = options.predicates.indexOf(predicate);
        if (index_of_predicate !== -1) {
            options.predicates.splice(index_of_predicate, 1);
        } else {
            options.predicates.push(predicate);
        }
        edit();
    }

    onMount(() => {
        if (id !== undefined) {
            listeners.set(id, (input) => {
                input_predicates = Utils.predicates(input);
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
    <div slot="description">
        <p>
            The <strong>{operation}</strong> operation selects some predicates from the models in input.
        </p>
    </div>
    <div class="m-3">
        {#each input_predicates as predicate}
            <div on:click={() => toggle_predicate(predicate)}>
                <InputGroup>
                    <Input type="switch" checked="{options.predicates.includes(predicate)}" />
                    <Label>{predicate}</Label>
                </InputGroup>
            </div>
        {/each}
    </div>
</Operation>
