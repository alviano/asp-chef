<script context="module">
    import {Recipe} from "$lib/recipe";
    import {Base64} from "js-base64";
    import {Utils} from "$lib/utils";

    const operation = "Pack Program";
    const default_extra_options = {
        decode_predicate: '__base64__',
    };

    Recipe.register_operation_type(operation, async (input, options, index) => {
        const res = [];
        for (const part of input) {
            try {
                const input_part = [];
                part.forEach(atom => {
                    if (atom.predicate === options.decode_predicate) {
                        input_part.push(Base64.decode(atom.terms[0].string))
                    } else {
                        input_part.push(atom.str + '.');
                    }
                });
                const encoded_term = Base64.encode(input_part.join('\n'));
                res.push([Utils.parse_atom(`${options.decode_predicate}("${encoded_term}")`)]);
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
            The <strong>{operation}</strong> operation packs each input part to a program.
        </p>
        <p>
            Each program is stored in a <code>__base64__</code> predicate.
        </p>
    </div>
    <InputGroup>
        <InputGroupText>Decode/Encode</InputGroupText>
        <Input type="text"
               bind:value={options.decode_predicate}
               placeholder="decode predicate"
               on:input={edit}
        />
    </InputGroup>
</Operation>
