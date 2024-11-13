<script context="module">
    import {Recipe} from "$lib/recipe";

    const operation = "Restore";
    const default_extra_options = {
        store: '',
        echo: false,
    };

    Recipe.register_operation_type(operation, async (input, options, index) => {
        try {
            let restored = Recipe.restore(options.store);
            return options.echo ?
                input.flatMap(part => restored.map(restored_part => [...part, ...restored_part])) :
                restored;
        } catch (error) {
            Recipe.set_errors_at_index(index, error, []);
            return [];
        }
    });
</script>

<script>
    import {Button, Input, InputGroup, InputGroupText} from "sveltestrap";
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
    <InputGroup>
        <InputGroupText>Store</InputGroupText>
        <Input bind:value="{options.store}" on:input={edit} data-testid="Restore-store" />
        <Button outline="{!options.echo}" on:click={() => { options.echo = !options.echo; edit(); }}>Echo</Button>
    </InputGroup>
</Operation>
