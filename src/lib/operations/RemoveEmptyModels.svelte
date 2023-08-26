<script context="module">
    import {Recipe} from "$lib/recipe";

    const operation = "Remove Empty Models";
    const default_extra_options = {
        ignored_predicates: [],
    };

    const listeners = new Map();

    Recipe.register_operation_type(operation, async (input, options, index, id) => {
        try {
            listeners.get(id)(input);
        } catch (error) { /* component not mounted, possibly because of headless mode */ }

        return input.filter(part => part.filter(atom => !options.ignored_predicates.includes(atom.predicate)).length > 0);
    });
</script>

<script>
    import Operation from "$lib/operations/Operation.svelte";
    import {Input, InputGroup, Label} from "sveltestrap";
    import {onDestroy, onMount} from "svelte";
    import {Utils} from "$lib/utils";

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
        const index_of_predicate = options.ignored_predicates.indexOf(predicate);
        if (index_of_predicate !== -1) {
            options.ignored_predicates.splice(index_of_predicate, 1);
        } else {
            options.ignored_predicates.push(predicate);
        }
        edit();
    }

    onMount(() => {
        listeners.set(id, (input) => {
            input_predicates = Utils.predicates(input);
        });
    });

    onDestroy(() => {
        listeners.delete(id);
    });
</script>

<Operation {id} {operation} {options} {index} {default_extra_options} {add_to_recipe} {keybinding}>
    <div slot="description">
        <p>
            The <strong>{operation}</strong> operation discards empty models.
        </p>
        <p>
            A list of predicates can be ignored, and a model is discarded if it is empty after discarding instances of the ignored predicates.
        </p>
    </div>
    <div class="m-3">
        <Label>Excluded predicates</Label>
        {#each input_predicates as predicate}
            <div on:click={() => toggle_predicate(predicate)}>
                <InputGroup>
                    <Input type="switch" checked="{options.ignored_predicates.includes(predicate)}" />
                    <Label>{predicate}</Label>
                </InputGroup>
            </div>
        {/each}
    </div>
</Operation>