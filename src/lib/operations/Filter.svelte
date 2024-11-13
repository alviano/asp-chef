<script context="module">
    import {Recipe} from "$lib/recipe";

    const operation = "Filter";
    const default_extra_options = {
        pattern: '',
    };

    Recipe.register_operation_type(operation, async (input, options) => {
        return input.map(part => {
            return part.filter(atom => atom.str.match(new RegExp(options.pattern, 'i')) );
        });
    });
</script>

<script>
    import {Input} from "sveltestrap";
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
    <Input type="search"
           bind:value="{options.pattern}"
           placeholder="Filter..."
           on:input={edit}
    />
</Operation>
