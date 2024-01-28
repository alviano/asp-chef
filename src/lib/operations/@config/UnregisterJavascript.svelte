<script context="module">
    import {Recipe} from "$lib/recipe";

    const operation = "@config/Unregister Javascript";
    const default_extra_options = {
    };

    const listeners = new Map();

    Recipe.register_operation_type(operation, async (input, options, index, id) => {
        try {
            await listeners.get(id)(input);
        } catch (error) { /* component not mounted, possibly because of headless mode */ }

        return input;
    });
</script>

<script>
    import {Badge, Button, Input, InputGroup, InputGroupText} from "sveltestrap";
    import Operation from "$lib/Operation.svelte";
    import {Utils} from "$lib/utils";

    export let id;
    export let options;
    export let index;
    export let add_to_recipe;
    export let keybinding;

    let filter = '';
    let counter = 0;
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
    <div slot="description">
        <p>The <strong>{operation}</strong> operation removes operations from the local storage of the browser.</p>
        <p>
            <strong>Important!</strong>
            Button <Badge>UNREGISTER</Badge> or <Badge color="danger">UNREGISTER ALL</Badge> must be clicked.
            The <strong>Operations</strong> panel is updated after a refresh or after modifying the filter, also for other recipes.
        </p>
        <p>
            Note that this operation is intended as a way to configure and customize ASP Chef.
            <strong>It is strongly suggested to unregister operations only on recently loaded pages, so that the list of registered operations is aligned to the local storage of the browser.</strong>
        </p>
    </div>
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
