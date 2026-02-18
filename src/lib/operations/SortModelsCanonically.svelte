<script context="module">
    import {Recipe} from "$lib/recipe";
    import _ from 'lodash';

    const operation = "Sort Models Canonically";
    const default_extra_options = {
        ignored_predicates: [],
    };

    const listeners = new Map();

    Recipe.register_operation_type(operation, async (input, options, index, id) => {
        try {
            listeners.get(id)(input);
        } catch (error) { /* component not mounted, possibly because of headless mode */ }

        return _.sortBy(input, model => {
            return model.filter(atom => !options.ignored_predicates.includes(atom.predicate))
                .map(atom => atom.str).toString();
        });
    });
</script>

<script>
    import Operation from "$lib/Operation.svelte";
    import {onDestroy, onMount} from "svelte";
    import {Utils} from "$lib/utils";
    import {Input, InputGroup, Label} from "@sveltestrap/sveltestrap";

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
    <div class="m-3">
        <Label>Excluded predicates</Label>
        {#each input_predicates as predicate}
            <div role="button" tabindex="0" on:click={() => toggle_predicate(predicate)} on:keydown={() => {}}>
                <InputGroup>
                    <Input type="switch" checked="{options.ignored_predicates.includes(predicate)}"/>
                    <Label>{predicate}</Label>
                </InputGroup>
            </div>
        {/each}
    </div>
</Operation>
