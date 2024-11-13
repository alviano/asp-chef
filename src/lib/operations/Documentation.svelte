<script context="module">
    import {Recipe} from "$lib/recipe";

    const operation = "Documentation";
    const default_extra_options = {
        height: 200,
        filter: "",
    };

    Recipe.register_operation_type(operation, async (input) => {
        return input;
    });
</script>

<script>
    import {Input, InputGroup, InputGroupText} from "sveltestrap";
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
        <InputGroupText>Height</InputGroupText>
        <Input type="number"
               bind:value={options.height}
               min="20"
               step="20"
               style="max-width: 5em;"
               on:input={edit}
        />
        <Input type="search"
               id="doc-search"
               bind:value={options.filter}
               placeholder="Filter operations..."
               autocomplete="off"
               on:input={edit}
        />
    </InputGroup>
    <div style="height: {options.height}px; overflow-y: auto" data-testid="Documentation-content">
        {#each Recipe.operations(options.filter) as operation}
            <div style="margin: 0.5em">
                <h2>{operation}</h2>
                {@html Recipe.operation_doc(operation)}
            </div>
        {/each}
    </div>
</Operation>
