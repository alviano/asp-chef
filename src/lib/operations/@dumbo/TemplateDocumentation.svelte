<script context="module">
    import {Recipe} from "$lib/recipe";
    import {Base64} from "js-base64";
    import {Utils} from "$lib/utils";
    import {Dumbo} from "$lib/operations/@dumbo/dumbo";

    const operation = "@dumbo/Template Documentation";
    const default_extra_options = {
        height: 500,
        filter: "",
        output_predicate: "",
    };

    const listeners = new Map();

    Recipe.register_operation_type(operation, async (input, options, index, id) => {
        try {
            await listeners.get(id)(input, options, templates);
        } catch (error) { /* component not mounted, possibly because of headless mode */ }


        if (!options.output_predicate) {
            return input;
        }

        const templates = await Dumbo.fetch_core_templates();
        const new_atoms = [];
        for (let template of templates.filter(template => template.match(new RegExp(options.filter, 'i')))) {
            const doc = Dumbo.core_template_documentation(template);
            const content = Base64.encode(
                `## ${template}\n\n${doc}`
            );
            const encoded_content = `${options.output_predicate}("${content}")`;
            new_atoms.push(Utils.parse_atom(encoded_content));
        }
        return input.map(part => [...part, ...new_atoms]);
    });
</script>

<script>
    import {Input, InputGroup, InputGroupText} from "@sveltestrap/sveltestrap";
    import Operation from "$lib/Operation.svelte";
    import {onDestroy, onMount, tick} from "svelte";

    export let id;
    export let options;
    export let index;
    export let add_to_recipe;
    export let keybinding;

    let output_div;

    let templates = [];

    function edit() {
        Recipe.edit_operation(id, index, options);
    }

    onMount(async () => {
        if (id !== undefined) {
            templates = await Dumbo.fetch_core_templates();
        }

        listeners.set(id, async (input, options) => {
            if (!output_div) {
                return;
            }
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
        {#each templates.filter(template => template.match(new RegExp(options.filter, 'i'))) as template}
            <div style="margin: 0.5em">
                <h2>{template}</h2>
                {@html Utils.render_markdown(Dumbo.core_template_documentation(template))}
            </div>
            <hr />
        {/each}
    </div>
</Operation>
