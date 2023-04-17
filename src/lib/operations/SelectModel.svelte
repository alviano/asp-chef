<script context="module">
    import {Recipe} from "$lib/recipe";

    const operation = "Select Model";
    const default_extra_options = {
        model_index: 1,
    };

    const listeners = new Map();

    Recipe.register_operation_type(operation, async (input, options, index, id) => {
        try {
            listeners.get(id)(input);
        } catch (error) { /* component not mounted, possibly because of headless mode */ }
        if (options.model_index <= input.length) {
            return [input[options.model_index - 1]];
        }
        throw('Error: invalid index ' + options.model_index);
    });
</script>

<script>
    import {Input} from "sveltestrap";
    import Operation from "$lib/operations/Operation.svelte";
    import {onDestroy, onMount} from "svelte";

    export let id;
    export let options;
    export let index;
    export let add_to_recipe;
    export let keybinding;

    let number_of_models = options ? options.model_index : 100;

    function edit() {
        Recipe.edit_operation(index, options);
    }

    onMount(() => {
        listeners.set(id, (input) => {
            number_of_models = input.length;
        });
    });

    onDestroy(() => {
        listeners.delete(id);
    });
</script>

<Operation {id} {operation} {options} {index} {default_extra_options} {add_to_recipe} {keybinding}>
    <div slot="description">
        <p>
            The <strong>{operation}</strong> operation selects one model among those in input.
        </p>
    </div>
    <div class="m-3">
        <Input type="range"
               min="{1}"
               max="{number_of_models}"
               bind:value="{options.model_index}"
               on:change={edit}
               />
        <code class="float-end">
            model {options.model_index} of {number_of_models}
        </code>
    </div>
</Operation>
