<script context="module">
    import {Recipe} from "$lib/recipe";
    import {Utils} from "$lib/utils";

    const operation = "Show";
    const default_extra_options = {
        height: 200,
        rules: '',
    };

    Recipe.register_operation_type(operation, async (input, options, index) => {
        const mapper = atom => atom.str + '.';
        const res = [];
        for (const part of input) {
            try {
                const program = part.map(mapper).join('\n') + '\n#show.\n' + options.rules;
                const model = await Utils.search_model(program);
                res.push(Utils.parse_atoms(model));
            } catch (error) {
                Recipe.set_errors_at_index(index, error, res);
            }
        }
        return res;
    });
</script>

<script>
    import {Input, InputGroup, InputGroupText} from "sveltestrap";
    import Operation from "$lib/Operation.svelte";
    import CodeMirror from "svelte-codemirror-editor";

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
               on:input={edit}
        />
    </InputGroup>
    <div style="height: {options.height}px; overflow-y: auto" data-testid="Show-content">
        <CodeMirror bind:value={options.rules}
                    placeholder={`One or more #show directives...`}
                    lineWrapping="{true}"
                    on:change={edit}
        />
        <pre class="d-test">{options.content}</pre>
    </div>
</Operation>
