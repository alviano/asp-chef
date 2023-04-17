<script context="module">
    import {Recipe} from "$lib/recipe";

    const operation = "Unique";
    const default_extra_options = {
        ignored_predicates: [],
    };

    const listeners = new Map();

    Recipe.register_operation_type(operation, async (input, options, index, id) => {
        try {
            listeners.get(id)(input);
        } catch (error) { /* component not mounted, possibly because of headless mode */ }

        const res = [];
        const models = new Set();
        for (let index = 0; index < input.length; index++) {
            const part = input[index];
            const key = part.filter(atom => !options.ignored_predicates.includes(atom.predicate))
                .map(atom => atom.str).toString();
            if (!models.has(key)) {
                models.add(key);
                res.push(part);
            }
        }
        return res;
    });
</script>

<script>
    import Operation from "$lib/operations/Operation.svelte";
    import {onDestroy, onMount} from "svelte";
    import {Utils} from "$lib/utils";
    import {Input, InputGroup, Label} from "sveltestrap";

    export let id;
    export let options;
    export let index;
    export let add_to_recipe;
    export let keybinding;

    let input_predicates = [];

    function edit() {
        Recipe.edit_operation(index, options);
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
        <p>The <strong>{operation}</strong> operation removes each model that is preceded by another copy of the model.</p>
        <p>
            Each model is compared with previous models and provided in output only if it is unique.
            A list of predicates can be ignored.
        </p>
        <p>
            Note that order of elements in models does matter, that is, models with the same elements but in different orders will be considered different models.
            A <strong>Sort Canonical</strong> operation can be used to make the ordering immaterial.
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
