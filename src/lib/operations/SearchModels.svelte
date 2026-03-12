<script context="module">
    import {Option, Recipe} from "$lib/recipe";
    import {Utils} from "$lib/utils";
    import {Base64} from "js-base64";

    const operation = "Search Models";
    export const default_extra_options = {
        height: Option(200, "Height of the rules editor", "number"),
        rules: Option('', "ASP rules to search for models", "string"),
        number: Option(1, "Number of models to search for", "number"),
        raises: Option(true, "Whether to report errors regarding the expected number of models", "boolean"),
        input_as_constraints: Option(false, "Treat input atoms as integrity constraints", "boolean"),
        decode_predicate: Option('__base64__', "Predicate to decode from Base64 before adding to the program", "predicate_name"),
        echo_encoded_content: Option(false, "Include the original encoded atom in the program", "boolean"),
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
                    onchange={edit}
        />
        <pre type="textarea" class="d-test">{options.rules}</pre>
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
