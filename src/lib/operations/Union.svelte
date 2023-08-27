<script context="module">
    import {Recipe} from "$lib/recipe";
    import {Utils} from "$lib/utils";
    import {Base64} from "js-base64";

    const operation = "Union";
    const default_extra_options = {
        height: 200,
        rules: '',
        decode_predicate: '__base64__',
        echo_encoded_content: false,
    };

    Recipe.register_operation_type(operation, async (input, options, index) => {
        const mapper = atom => atom.str + '.';
        const res = [];
        for (const part of input) {
            try {
                const program = part.map(atom => {
                    if (atom.predicate === options.decode_predicate) {
                        return Base64.decode(atom.terms[0].string) + (options.echo_encoded_content ? '\n' + mapper(atom) : '');
                    }
                    return mapper(atom);
                }).join('\n') + options.rules;
                const consequences = await Utils.brave_consequences(program);
                res.push(Utils.parse_atoms(consequences));
            } catch (error) {
                Recipe.set_errors_at_index(index, error, res);
            }
        }
        return res;
    });
</script>

<script>
    import {Button, Input, InputGroup, InputGroupText} from "sveltestrap";
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
    <div slot="description">
        <p>
            The <strong>{operation}</strong> operation replaces each model in input with a sequence of <em>brave consequences</em>.
        </p>
        <p>
            A unary predicate is decoded as part of the program (default <code>__base64__/1</code>).
        </p>
        <p>
            Each model in input is used as the input of a program given in the recipe, and its brave consequences are computed.
            <em>Weak constraints should not be included in the program; use the <strong>Optimize</strong> operation.</em>
        </p>
    </div>
    <InputGroup>
        <InputGroupText>Height</InputGroupText>
        <Input type="number"
               bind:value={options.height}
               min="20"
               step="20"
               style="max-width: 5em;"
               on:input={edit}
        />
        <InputGroupText>Decode</InputGroupText>
        <Input type="text"
               bind:value={options.decode_predicate}
               on:input={edit}
        />
        <Button outline="{!options.echo_encoded_content}" on:click={() => { options.echo_encoded_content = !options.echo_encoded_content; edit(); }}>Echo</Button>
    </InputGroup>
    <div style="height: {options.height}px; overflow-y: auto" data-testid="Union-rules">
        <CodeMirror bind:value={options.rules}
                    placeholder={`One or more ASP rules...`}
                    lineWrapping="{true}"
                    on:change={edit}
        />
        <pre class="d-test">{options.content}</pre>
    </div>
</Operation>
