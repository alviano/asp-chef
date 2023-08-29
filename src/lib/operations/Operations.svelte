<script context="module">
    import {Recipe} from "$lib/recipe";

    const operation = "Operations";
    const default_extra_options = {
    };

    Recipe.register_operation_type(operation, async (input) => {
        return input;
    });
</script>

<script>
    import Operation from "$lib/Operation.svelte";
    import OperationsList from "$lib/operations/+OperationsList.svelte";

    export let id;
    export let options;
    export let index;
    export let add_to_recipe;
    export let keybinding;
</script>

<Operation {id} {operation} {options} {index} {default_extra_options} {add_to_recipe} {keybinding}>
    <div slot="description">
        <p>
            The <strong>{operation}</strong> operation does nothing... but can be used to add other ingredients above it!
        </p>
    </div>
    <OperationsList slot="output" {index} style="height: 50vh; overflow-y: scroll" />
</Operation>
