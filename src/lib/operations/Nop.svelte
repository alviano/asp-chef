<script context="module">
    import {Recipe} from "$lib/recipe";

    const operation = "Nop";
    const default_extra_options = {
    };

    Recipe.register_operation_type(operation, async (input) => {
        return input;
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
            The <strong>{operation}</strong> operation does nothing!
        </p>
        <p>
            It can be used to set breakpoints in the recipe.
        </p>
    </div>
</Operation>
