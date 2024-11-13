<script context="module">
    import {Recipe} from "$lib/recipe";

    const operation = "Invalidate Cache";
    const default_extra_options = {
    };

    Recipe.register_operation_type(operation, async (input, options, index) => {
        Recipe.invalidate_cached_output(index);
        return input;
    });

    Recipe.new_uncachable_operation_type(operation);
</script>

<script>
    import Operation from "$lib/Operation.svelte";

    export let id;
    export let options;
    export let index;
    export let add_to_recipe;
    export let keybinding;
</script>

<Operation {id} {operation} {options} {index} {default_extra_options} {add_to_recipe} {keybinding}>
</Operation>
