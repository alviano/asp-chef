<script context="module">
    import {Recipe} from "$lib/recipe";
    import {Base64} from "js-base64";
    import {DTDL} from "$lib/operations/@DTDL/dtdl.js";
    import {Utils} from "$lib/utils.js";

    const operation = "@DTDL/Parse";
    const default_extra_options = {
        predicate: '__base64__',
    };

    Recipe.register_operation_type(operation, async (input, options, index) => {
        const res = [];
        for (const part of input) {
            try {
                const input_part = [];
                for (const atom of part) {
                    if (atom.predicate === options.predicate) {
                        const content = Base64.decode(atom.terms[0].string);
                        const program = await DTDL.parser(content);
                        const encoded_term = Base64.encode(program);
                        input_part.push(Utils.parse_atom(`${options.predicate}("${encoded_term}")`));
                    } else {
                        input_part.push(atom);
                    }
                }
                res.push(input_part);
            } catch (error) {
                Recipe.set_errors_at_index(index, error, res);
            }
        }
        return res;
    });
</script>

<script>
    import {Input, InputGroup, InputGroupText} from "@sveltestrap/sveltestrap";
    import Operation from "$lib/Operation.svelte";

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
        <InputGroupText>Predicate</InputGroupText>
        <Input type="text" placeholder="predicate" bind:value={options.predicate} on:input={edit} data-testid="DTDL-predicate" />
    </InputGroup>
</Operation>
