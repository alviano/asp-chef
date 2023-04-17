<script context="module">
    import {Recipe} from "$lib/recipe";
    import {Utils} from "$lib/utils";
    import {Base64} from "js-base64";

    const operation = "Lua";
    const default_extra_options = {
        height: 200,
        content: '',
        encode_predicate: '__base64__',
    };

    Recipe.register_operation_type(operation, async (input, options, index) => {
        const content = Base64.encode(`
#script (lua)

${options.content}

#end.
        `.trim());
        const encoded_content = `${options.encode_predicate}("${content}").`;
        const mapper = atom => atom.str + '.';
        const res = [];
        for (const part of input) {
            try {
                const program = part.map(mapper).join('\n') + encoded_content;
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
    import Operation from "$lib/operations/Operation.svelte";
    import CodeMirror from "svelte-codemirror-editor";

    export let id;
    export let options;
    export let index;
    export let add_to_recipe;
    export let keybinding;

    function edit() {
        Recipe.edit_operation(index, options);
    }
</script>

<Operation {id} {operation} {options} {index} {default_extra_options} {add_to_recipe} {keybinding}>
    <div slot="description">
        <p>
            The <strong>{operation}</strong> operation extends models in input with some encoded Lua content
            (usually functions defining @-terms or propagators).
        </p>
        <p>
            For example
            <code class="d-block ms-3">function successor(x)</code>
            <code class="d-block ms-3">&nbsp;&nbsp;&nbsp;&nbsp;return x.number + 1</code>
            <code class="d-block ms-3">end</code>
            to later use <code>@successor(1)</code> and obtain <code>2</code>.
        </p>
        <p>
            The content is base64 encoded and wrapped by predicate <code>__base64__</code>.
        </p>
        <p>
            The name of the unary predicate <code>__base64__</code> can be specified in the recipe.
        </p>
    </div>
    <InputGroup>
        <InputGroupText>Height</InputGroupText>
        <Input type="number"
               bind:value={options.height}
               min="20"
               step="20"
               on:input={edit}
        />
    </InputGroup>
    <div style="height: {options.height}px; overflow-y: auto" data-testid="Lua-content">
        <CodeMirror bind:value={options.content}
                    placeholder={`One or more lines...`}
                    lineWrapping="{true}"
                    on:change={edit}
        />
        <pre class="d-test">{options.content}</pre>
    </div>
    <InputGroup>
        <InputGroupText style="width: 10em;">Encode predicate</InputGroupText>
        <Input type="text"
               bind:value={options.encode_predicate}
               placeholder="encode predicate"
               on:input={edit}
               data-testid="Lua-encode-predicate"
        />
    </InputGroup>
</Operation>
