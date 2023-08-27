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
    <div slot="description">
        <p>The <strong>{operation}</strong> operation establishes the position of the new ingredients added to the recipe.</p>
        <p>
            The input is forwarded to the next ingredient (like a <strong>Nop</strong> operation).
        </p>
        <p>
            There can be at most one <strong>{operation}</strong> ingredient in the recipe.
            Adding an <strong>{operation}</strong> ingredient removes any previous <strong>{operation}</strong> in the recipe.
            Moreover, the <strong>{operation}</strong> ingredient is not intercepted (it is always added at a specified index or otherwise at the end of the recipe).
        </p>
    </div>
    <div class="alert-warning p-3" style="color: white">
        <h5 class="alert-heading">Attention!</h5>
        New ingredients intercepted here.
    </div>
</Operation>
