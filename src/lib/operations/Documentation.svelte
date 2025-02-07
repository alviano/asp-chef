<script context="module">
    import {Recipe} from "$lib/recipe";
    import {Base64} from "js-base64";
    import {Utils} from "$lib/utils";

    const operation = "Documentation";
    const default_extra_options = {
        height: 500,
        filter: "",
        output_predicate: "",
        html: false,
    };

    const listeners = new Map();

    Recipe.register_operation_type(operation, async (input, options, index, id) => {
        try {
            await listeners.get(id)(input, options);
        } catch (error) { /* component not mounted, possibly because of headless mode */ }

        if (!options.output_predicate) {
            return input;
        }

        const new_atoms = [];
        for (let operation of Recipe.operations(options.filter)) {
            const doc = await Recipe.operation_doc(operation, false, !options.html);
            const content = Base64.encode(
                options.html ? `<h2>${operation}</h2>\n${doc}` : `## ${operation}\n\n${doc}`
            );
            const encoded_content = `${options.output_predicate}("${content}")`;
            new_atoms.push(Utils.parse_atom(encoded_content));
        }
        return input.map(part => [...part, ...new_atoms]);
    });
</script>

<script>
    import {Button, Input, InputGroup, InputGroupText} from "sveltestrap";
    import Operation from "$lib/Operation.svelte";
    import {onDestroy, onMount, tick} from "svelte";

    export let id;
    export let options;
    export let index;
    export let add_to_recipe;
    export let keybinding;

    let output_div;

    let operations = [];
    let docs = [];

    function edit() {
        Recipe.edit_operation(id, index, options);
    }

    onMount(() => {
        listeners.set(id, async (input, options) => {
            if (!output_div) {
                return;
            }
            operations = Recipe.operations(options.filter);
            docs = await Promise.all(operations.map(operation => Recipe.operation_doc(operation)));
            await tick();
            Array.from(output_div.getElementsByTagName('pre')).forEach(Utils.add_copy_button);
        });
    });

    onDestroy(() => {
        listeners.set(id, null);
    });
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
        <InputGroupText>Output predicate</InputGroupText>
        <Input type="text"
               bind:value="{options.output_predicate}"
               placeholder="predicate"
               on:input={edit}
        />
        <Button outline="{!options.html}" on:click={() => { options.html = !options.html; edit(); }}>HTML</Button>
    </InputGroup>
    <InputGroup>
        <Input type="search"
               id="doc-search"
               bind:value={options.filter}
               placeholder="Filter operations..."
               autocomplete="off"
               on:input={edit}
        />
    </InputGroup>
    <div slot="output" style="height: {options.height}px; overflow-y: auto" data-testid="Documentation-content" bind:this={output_div}>
        {#each operations as operation, index}
            <div style="margin: 0.5em">
                <h2>{operation}</h2>
                {@html docs[index]}
            </div>
            <hr />
        {/each}
    </div>
</Operation>
