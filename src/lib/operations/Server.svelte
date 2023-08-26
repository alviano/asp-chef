<script context="module">
    import {Recipe} from "$lib/recipe";
    import {Base64} from "js-base64";
    import {Utils} from "$lib/utils";

    const operation = "Server";
    const default_extra_options = {
        url: '',
        options: '',
        decode_predicate: '__base64__',
        echo_encoded_content: false,
    };

    Recipe.register_operation_type(operation, async (input, options, index) => {
        const res = [];
        for (const part of input) {
            const input_part = [];
            const decoded_input = [];
            try {
                part.forEach(atom => {
                    if (atom.predicate === options.decode_predicate) {
                        decoded_input.push(Base64.decode(atom.terms[0].string))
                        if (!options.echo_encoded_content) {
                            return;
                        }
                    }
                    input_part.push(atom.str);
                });
                const models = await call_server(options, input_part, decoded_input);
                models.forEach(model => {
                    res.push(Utils.parse_atoms(model));
                });
            } catch (error) {
                Recipe.set_errors_at_index(index, error, res);
            }
        }
        return res;
    });

    async function call_server(options, input_part, decoded_input) {
        const response = await fetch(options.url, {
            method: "POST",
            mode: "cors",
            cache: Utils.browser_cache_policy,
            credentials: "same-origin",
            headers: new Headers([["Content-Type", "application/json"]]),
            body: JSON.stringify({
                input_part: input_part,
                decoded_input: decoded_input,
                options: options.options,
            }),
        });
        const json = await response.json();
        return json.models;
    }
</script>

<script>
    import {Button, Input, InputGroup, InputGroupText} from "sveltestrap";
    import Operation from "$lib/operations/Operation.svelte";

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
            The <strong>{operation}</strong> operation asks a remote or local server to process the input.
        </p>
        <p>
            Each part of the input is mapped to
            Input and output must be arrays of models.
            Additional options can be sent to the server;
            it is up to the server to interpret such options.
            For example, a server may implement the <em>Search Models</em> operation and accept options like a predicate to decode, the number of models to compute and so on.
        </p>
        <p>
            Note that the result is cached (as for many other operations).
            In order to fetch new data even if the input didn't change, add an <em>Invalidate Cache</em> operation.
        </p>
    </div>
    <InputGroup>
        <InputGroupText style="width: 6em;">Decode</InputGroupText>
        <Input type="text"
               bind:value={options.decode_predicate}
               placeholder="decode predicate"
               on:input={edit}
               data-testid="SearchModels-decode-predicate"
        />
        <Button outline="{!options.echo_encoded_content}" on:click={() => { options.echo_encoded_content = !options.echo_encoded_content; edit(); }}>Echo</Button>
    </InputGroup>
    <InputGroup>
        <InputGroupText style="width: 6em;">URL</InputGroupText>
        <Input type="text"
               bind:value={options.url}
               placeholder="https://..."
               on:change={edit}
               data-testid="Server-url"
        />
    </InputGroup>
    <InputGroup>
        <InputGroupText style="width: 6em;">Options</InputGroupText>
        <Input type="text"
               bind:value={options.options}
               placeholder="server options"
               on:input={edit}
               data-testid="Server-options"
        />
    </InputGroup>
</Operation>
