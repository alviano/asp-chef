<script context="module">
    import {Recipe} from "$lib/recipe";

    const operation = "@config/Unregister Javascript";
    const default_extra_options = {
    };

    Recipe.register_operation_type(operation, async (input, options, index, id) => {
        return input;
    });
</script>

<script>
    import {Badge, Button, Input, InputGroup, InputGroupText} from "@sveltestrap/sveltestrap";
    import Operation from "$lib/Operation.svelte";
    import {Utils} from "$lib/utils";

    export let id;
    export let options;
    export let index;
    export let add_to_recipe;
    export let keybinding;

    let filter = '';
    let operations;
    $: get_operations(filter);

    function get_operations() {
        operations = Recipe.operation_components(filter).filter(operation => Recipe.is_remote_javascript_operation(operation));
    }

    function unregister(operation) {
        Recipe.unregister_remote_javascript_operation(operation);
        get_operations();
    }

    async function unregister_all() {
        await Utils.confirm({
            message: `Unregister ${operations.length} operations?`,
            onconfirm: () => {
                operations.forEach((operation, index) => {
                    Recipe.unregister_remote_javascript_operation(operation, index === operations.length - 1);
                    Utils.snackbar("Unregistered " + operation);
                });
                get_operations();
            }
        });
    }
</script>

<Operation {id} {operation} {options} {index} {default_extra_options} {add_to_recipe} {keybinding}>
    <InputGroup>
        <InputGroupText style="width: 7em;">Filter</InputGroupText>
        <Input type="search"
               bind:value="{filter}"
               placeholder="&amp;js-..."
        />
    </InputGroup>
    <div slot="output">
        {#each operations as operation}
            <InputGroup>
                <Input readonly value="{operation}" />
                <Button on:click={() => unregister(operation)}>Unregister</Button>
            </InputGroup>
        {/each}
        <Button block color="danger" disabled={operations.length === 0} on:click={unregister_all}>Unregister all</Button>
    </div>
</Operation>
