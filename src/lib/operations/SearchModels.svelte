<script context="module">
    import {Recipe} from "$lib/recipe";
    import {Utils} from "$lib/utils";
    import {Base64} from "js-base64";

    const operation = "Search Models";
    const default_extra_options = {
        height: 200,
        rules: '',
        number: 1,
        raises: true,
        input_as_constraints: false,
        decode_predicate: '__base64__',
        echo_encoded_content: false,
    };

    Recipe.register_operation_type(operation, async (input, options, index) => {
        const mapper = options.input_as_constraints ?
            atom => `:- not ${atom.str}.` :
            atom => atom.str + '.';
        const res = [];
        for (const part of input) {
            try {
                const program = part.map(atom => {
                    if (atom.predicate === options.decode_predicate) {
                        return Base64.decode(atom.terms[0].string) + (options.echo_encoded_content ? '\n' + atom.str + '.' : '');
                    }
                    return mapper(atom);
                }).join('\n') + '\n' + options.rules;
                const models = await Utils.search_models(program, options.number, options.raises);
                models.forEach(model => {
                    res.push(Utils.parse_atoms(model));
                });
            } catch (error) {
                Recipe.set_errors_at_index(index, error, res);
            }
        }
        return res;
    });
</script>

<script>
    import {Button, Input, InputGroup, InputGroupText} from "sveltestrap";
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
            The <strong>{operation}</strong> operation replaces each model in input with a sequence of models.
        </p>
        <p>
            Each model in input is used as the input of a program given in the recipe, either as facts (the defaults) or as constraints.
            <em>Weak constraints should not be included in the program; use the <strong>Optimize</strong> operation.</em>
        </p>
        <p>
            A unary predicate is decoded as part of the program (default <code>__base64__/1</code>).
        </p>
        <p>
            In addition to the rules of the program, the number of models can be specified (0 for unbounded).
            An error can be raised if the specified number of models is not produced (if 0, the program is expected to be incoherent).
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
               placeholder="decode predicate"
               on:input={edit}
               data-testid="SearchModels-decode-predicate"
        />
        <Button outline="{!options.echo_encoded_content}" on:click={() => { options.echo_encoded_content = !options.echo_encoded_content; edit(); }}>Echo</Button>
        <Button outline="{!options.input_as_constraints}" on:click={() => { options.input_as_constraints = !options.input_as_constraints; edit(); }}>Use constraints</Button>
    </InputGroup>
    <div style="height: {options.height}px; overflow-y: auto" data-testid="SearchModels-rules">
        <CodeMirror bind:value={options.rules}
                    placeholder={`One or more ASP rules...`}
                    lineWrapping="{true}"
                    on:change={edit}
        />
        <pre type="textarea" class="d-test">{options.content}</pre>
    </div>
    <InputGroup>
        <InputGroupText># of models</InputGroupText>
        <Input type="number"
               bind:value={options.number}
               min="0"
               on:input={edit}
               data-testid="SearchModels-models"
        />
        <Button outline="{!options.raises}" on:click={() => { options.raises = !options.raises; edit(); }}>Raise error</Button>
    </InputGroup>
</Operation>
