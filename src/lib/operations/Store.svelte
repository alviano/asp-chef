<script context="module">
    import {Recipe} from "$lib/recipe";

    const operation = "Store";
    const default_extra_options = {
    };

    Recipe.register_operation_type(operation, async (input, options, index, id) => {
        Recipe.store(id, input);
        return input;
    });
</script>

<script>
    import {Button, Icon, Input, InputGroup, InputGroupText} from "sveltestrap";
    import Operation from "$lib/Operation.svelte";
    import {Tooltip} from "dumbo-svelte";
    import {Utils} from "$lib/utils";

    export let id;
    export let options;
    export let index;
    export let add_to_recipe;
    export let keybinding;

    function edit() {
        Recipe.edit_operation(id, index, options);
    }

    async function copy_to_clipboard() {
        await navigator.clipboard.writeText(id);
        Utils.snackbar("ID ready to be pasted!");
    }
</script>

<Operation {id} {operation} {options} {index} {default_extra_options} {add_to_recipe} {keybinding}>
    <InputGroup>
        <InputGroupText>ID</InputGroupText>
        <Input value="{id}" readonly data-testid="Store-id" />
        <Button size="sm" on:click={() => copy_to_clipboard()}>
            <Tooltip value="Copy to clipboard" placement="top">
                <Icon name="clipboard-plus" />
            </Tooltip>
        </Button>
    </InputGroup>
</Operation>
