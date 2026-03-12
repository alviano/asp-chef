<script context="module">
    import { Option, Recipe } from '$lib/recipe';
    import { Base64 } from 'js-base64';
    import { get } from 'svelte/store';
    import { Utils } from '$lib/utils';
    import { Opa } from '$lib/operations/@opa/opa';
    import { clingo_remote_uuid } from '$lib/stores.js';

    const operation = '@opa/Opa Eval';
    export const default_extra_options = {
        policy: Option('__policy__', "Predicate containing the Opa policy (a Base64-encoded string)", "predicate_name"),
        json: Option('__json__', "Predicate containing the JSON input (a Base64-encoded string)", "predicate_name"),
        policy_name: Option('policy', "Name of the policy to evaluate", "string"),
        idx: Option(1, "Index of the term containing the JSON input", "number"),
        key: Option('data', "Key to use for the JSON input in the Opa evaluation", "string"),
        allow: Option(false, "Whether to only return the 'allow' result", "boolean"),
        output_predicate: Option('__opa_eval__', "Predicate to use for the output", "predicate_name")
    };

    Recipe.register_operation_type(operation, async (input, options, index, id) => {
        const res = [];

        for (const part of input) {
            try {
                let { policy, json, policy_name, idx, key, allow, output_predicate } = options;

                part.forEach((atom) => {
                    if (atom.predicate === options.policy) {
                        policy = Base64.decode(atom.terms[0].string);
                    } else if (atom.predicate === options.json) {
                        if (isNaN(idx) || idx < 1) {
                            throw new Error('Index variable must be a number greater or equal to 0');
                        }
                        json = Base64.decode(atom.terms[idx - 1].string);
                    } else if (atom.predicate === options.output_predicate) {
                        output_predicate = atom.terms[0].string;
                    }
                });

                if (!policy_name) {
                    throw new Error('Policy name must be a non-empty string');
                }

                const accepted_inputs = await Opa.fetch('opa-eval/', {
                    uuid: get(clingo_remote_uuid),
                    policy,
                    json,
                    key,
                    policy_name,
                    allow
                });

                const encoded_output = Utils.parse_atom(
                    `${output_predicate}("${Base64.encode(accepted_inputs['result'])}")`
                );
                res.push([encoded_output]);
            } catch (error) {
                Recipe.set_errors_at_index(index, error, res);
            }
        }
        return res;
    });
</script>

<script>
    import { Button, Input, InputGroup, InputGroupText } from '@sveltestrap/sveltestrap';
    import Operation from '$lib/Operation.svelte';

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
        <InputGroupText style="width: 8em;">Policy</InputGroupText>
        <Input
            type="text"
            bind:value={options.policy}
            placeholder="__policy__"
            on:input={edit}
            data-testid="@dumbo/OpaEval-policy"
        />
    </InputGroup>
    <InputGroup>
        <InputGroupText style="width: 8em;">JSON</InputGroupText>
        <Input
            type="text"
            bind:value={options.json}
            placeholder="__json__"
            on:input={edit}
            data-testid="@dumbo/OpaEval-json"
        />
        <InputGroupText style="width: 8em;">Index</InputGroupText>
        <Input
            type="number"
            bind:value={options.idx}
            placeholder="1"
            on:input={edit}
            data-testid="@dumbo/OpaEval-json"
        />
    </InputGroup>
    <InputGroup>
        <InputGroupText style="width: 8em;">Key</InputGroupText>
        <Input
            type="text"
            bind:value={options.key}
            placeholder="data"
            on:input={edit}
            data-testid="@dumbo/OpaEval-key"
        />
    </InputGroup>
    <InputGroup>
        <InputGroupText style="width: 8em;">Policy Name</InputGroupText>
        <Input
            type="text"
            bind:value={options.policy_name}
            placeholder="policy"
            on:input={edit}
            data-testid="@dumbo/OpaEval-policy_name"
        />
    </InputGroup>
    <InputGroup>
        <InputGroupText style="width: 8em;">Output</InputGroupText>
        <Input
            type="text"
            bind:value={options.output_predicate}
            placeholder="__opa_eval__"
            on:input={edit}
            data-testid="@dumbo/OpaEval-output_predicate"
        />
        <Button
            outline={!options.allow}
            on:click={() => {
                options.allow = !options.allow;
                edit();
            }}>Allow</Button
        >
    </InputGroup>
</Operation>
