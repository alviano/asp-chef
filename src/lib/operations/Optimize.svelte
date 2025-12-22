<script context="module">
    import {Recipe} from "$lib/recipe";
    import {Utils} from "$lib/utils";
    import {Base64} from "js-base64";

    const operation = "Optimize";
    const default_extra_options = {
        height: 200,
        rules: '',
        number: 1,
        raises: true,
        input_as_constraints: false,
        decode_predicate: '__base64__',
        echo_encoded_content: false,
        cost_predicate: '__costs__',
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
                }).join('\n') + options.rules;
                const models = await Utils.search_optimal_models(program, options.number, options.raises, options.cost_predicate);
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
    import {Button, Input, InputGroup, InputGroupText} from "@sveltestrap/sveltestrap";
    import Operation from "$lib/Operation.svelte";
    import CodeMirror from "$lib/CodeMirror.svelte";

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
        <InputGroupText>Decode</InputGroupText>
        <Input type="text"
               bind:value={options.decode_predicate}
               on:input={edit}
               data-testid="Optimize-decode-predicate"
        />
        <Button outline="{!options.echo_encoded_content}" on:click={() => { options.echo_encoded_content = !options.echo_encoded_content; edit(); }}>Echo</Button>
        <Button outline="{!options.input_as_constraints}" on:click={() => { options.input_as_constraints = !options.input_as_constraints; edit(); }}>Use constraints</Button>
    </InputGroup>
    <div style="height: {options.height}px; overflow-y: auto" data-testid="Optimize-rules">
        <CodeMirror bind:value={options.rules}
                    placeholder={`One or more ASP rules...`}
                    lineWrapping="{true}"
                    onchange={edit}
        />
        <pre class="d-test">{options.rules}</pre>
    </div>
    <InputGroup>
        <InputGroupText>Costs</InputGroupText>
        <Input type="text"
               bind:value={options.cost_predicate}
               on:input={edit}
               data-testid="Optimize-cost-predicate"
        />
        <InputGroupText># of models</InputGroupText>
        <Input type="number"
               bind:value={options.number}
               min="0"
               on:input={edit}
               data-testid="Optimize-models"
        />
        <Button outline="{!options.raises}" on:click={() => { options.raises = !options.raises; edit(); }}>Raise error</Button>
    </InputGroup>
</Operation>
