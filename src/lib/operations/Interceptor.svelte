<script context="module">
    import {Recipe} from "$lib/recipe";

    const operation = "Interceptor";
    const default_extra_options = {
    };

    Recipe.register_operation_type(operation, async (input) => {
        return input;
    });
</script>

<script>
    import Operation from "$lib/Operation.svelte";

    export let id;
    export let options;
    export let index;
    export let add_to_recipe;
    export let keybinding;

    function edit() {
        Recipe.edit_operation(id, index, options);
    }
</script>

<Operation {id} {operation} {options} {index} {default_extra_options} {add_to_recipe} {keybinding}>
    <div class="alert-warning p-3" style="color: white">
        <h5 class="alert-heading">Attention!</h5>
        New ingredients intercepted here.
    </div>
</Operation>
