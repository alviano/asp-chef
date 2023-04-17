<script context="module">
    import {Recipe} from "$lib/recipe";
    import _ from "lodash";

    const operation = "Sort by Increasing Size";
    const default_extra_options = {
    };

    Recipe.register_operation_type(operation, async (input) => {
        return _.sortBy(input, [model => model.length])
    });
</script>

<script>
    import Operation from "$lib/operations/Operation.svelte";

    export let id;
    export let options;
    export let index;
    export let add_to_recipe;
    export let keybinding;
</script>

<Operation {id} {operation} {options} {index} {default_extra_options} {add_to_recipe} {keybinding}>
    <div slot="description">
        <p>
            The <strong>{operation}</strong> operation sorts the models in input by increasing size.
        </p>
        <p>
            Models with less atoms will come first.
        </p>
    </div>
</Operation>
