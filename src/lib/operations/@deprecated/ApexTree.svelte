<script context="module">
    import {Recipe} from "$lib/recipe";

    const operation = "@deprecated/ApexTree";
    const default_extra_options = {
    };

    Recipe.register_operation_type(operation, async (input) => {
        return input;
    });
</script>

<script>
    import Operation from "$lib/Operation.svelte";
    import {InputGroupText} from "@sveltestrap/sveltestrap";

    export let id;
    export let options;
    export let index;
    export let add_to_recipe;
    export let keybinding;
</script>

<Operation {id} {operation} {options} {index} {default_extra_options} {add_to_recipe} {keybinding}>
    <InputGroupText>
        This operation is available only on local installations.
        Check the documentation for details.
    </InputGroupText>
</Operation>
