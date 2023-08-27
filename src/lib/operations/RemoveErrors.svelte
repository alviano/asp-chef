<script context="module">
    import {Recipe} from "$lib/recipe";

    const operation = "Remove Errors";
    const default_extra_options = {
        filter: "",
    };

    Recipe.register_operation_type(operation, async (input, options) => {
        return input.filter(part =>
            part.length !== 1 ||
            !String(part[0].str).startsWith('Error: ') ||
            !String(part[0].str).match(new RegExp(options.filter, 'i'))
        );
    });
</script>

<script>
    import Operation from "$lib/Operation.svelte";
    import {Input} from "sveltestrap";

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
        <p>
            The <strong>{operation}</strong> operation discards input parts being errors.
        </p>
        <p>
            The errors to be discarded can be specified by means of a regular expression.
        </p>
    </div>
    <Input type="search"
           bind:value="{options.filter}"
           placeholder="filter..."
           on:input={edit}
    />
</Operation>