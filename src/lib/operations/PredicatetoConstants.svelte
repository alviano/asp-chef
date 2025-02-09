<script context="module">
    import {Recipe} from "$lib/recipe";
    import {Utils} from "$lib/utils";
    import {Base64} from "js-base64";

    const operation = "Predicate to Constants";
    const default_extra_options = {
        constants_predicate: '__const__',
        output_predicate: '__base64__',
        echo: false,
    };

    Recipe.register_operation_type(operation, async (input, options, index) => {
        const res = [];
        for (const part of input) {
            try {
                const model = [];
                const consts = [];
                part.forEach(atom => {
                    if (atom.predicate === options.constants_predicate && atom.terms.length === 2) {
                        consts.push(`#const ${atom.terms[0].str} = ${atom.terms[1].str}.\n`);
                        if (!options.echo) {
                            return;
                        }
                    }
                    model.push(atom);
                });
                const content = Base64.encode(consts.join(''));
                const encoded_content = Utils.parse_atom(`${options.output_predicate}("${content}")`);
                model.push(encoded_content);
                res.push(model);
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
        <InputGroupText>Constants Predicate</InputGroupText>
        <Input type="text" placeholder="__const__" bind:value={options.constants_predicate} on:input={edit} data-testid="PredicateToConstants-constants_predicate" />
        <Button outline="{!options.echo}" on:click={() => { options.echo = !options.echo; edit(); }}>Echo</Button>
        <InputGroupText>Output Predicate</InputGroupText>
        <Input type="text"
               bind:value="{options.output_predicate}"
               placeholder="predicate"
               on:input={edit}
               data-testid="PredicateToConstants-output_predicate"
        />
    </InputGroup>
</Operation>
