<script context="module">
    import {Recipe} from "$lib/recipe";
    import {Base64} from "js-base64";
    import {Utils} from "$lib/utils";

    const operation = "Regex Substitution";
    const default_extra_options = {
        decode_predicate: '__base64__',
        pattern: '',
        pattern_flags: '',
        replacement: '',
    };

    Recipe.register_operation_type(operation, async (input, options, index) => {
        if (!options.decode_predicate || !options.pattern) {
            return input;
        }

        let pattern, replacement;
        try {
            pattern = new RegExp(options.pattern.replaceAll("\\t", "\t").replaceAll("\\n", "\n").replaceAll("\\r", "\r"), options.pattern_flags);
            replacement = options.replacement.replaceAll("\\t", "\t").replaceAll("\\n", "\n").replaceAll("\\r", "\r");
        } catch (error) {
            Recipe.set_errors_at_index(index, error, []);
            return [];
        }

        const res = [];
        for (const part of input) {
            try {
                res.push(part.map(atom => {
                    if (atom.predicate !== options.decode_predicate) {
                        return atom;
                    }
                    const content = Base64.decode(atom.terms[0].string);
                    const encoded_content = Base64.encode(content.replace(pattern, replacement));
                    return Utils.parse_atom(`${options.decode_predicate}("${encoded_content}")`);
                }));
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
        <InputGroupText style="width: 10em;">Decode/Encode</InputGroupText>
        <Input type="text"
               bind:value={options.decode_predicate}
               placeholder="decode predicate"
               on:input={edit}
               data-testid="RegexSubstitution-predicate"
        />
    </InputGroup>
    <InputGroup>
        <InputGroupText style="width: 10em;">Pattern</InputGroupText>
        <InputGroupText><code>/</code></InputGroupText>
        <Input type="text"
               bind:value={options.pattern}
               placeholder="Person: (\w+)\s(\w+)\n"
               on:input={edit}
               data-testid="RegexSubstitution-pattern"
        />
        <InputGroupText><code>/</code></InputGroupText>
        <Input type="text" style="max-width: 5em;"
               bind:value={options.pattern_flags}
               placeholder="gi"
               on:input={edit}
               data-testid="RegexSubstitution-pattern-flags"
        />
    </InputGroup>
    <InputGroup>
        <InputGroupText style="width: 10em;">Replacement</InputGroupText>
        <Input type="text"
               bind:value={options.replacement}
               placeholder="Person: $2, $1."
               on:input={edit}
               data-testid="RegexSubstitution-replacement"
        />
    </InputGroup>
</Operation>
