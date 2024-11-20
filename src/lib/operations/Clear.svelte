<script context="module">
    import {Recipe} from "$lib/recipe";

    const operation = "Clear";
    const default_extra_options = {
    };

    Recipe.register_operation_type(operation, async () => {
        return [[]];
    });
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
