<script context="module">
    import {Recipe} from "$lib/recipe";
    import {Base64} from "js-base64";
    import {Utils} from "$lib/utils";

    const operation = "Expand Mustache Queries";
    const default_extra_options = {
        predicate: '__base64__',
        recursively: false,
    };

    Recipe.register_operation_type(operation, async (input, options, index, id) => {
        const res = [];
        for (const part of input) {
            try {
                const res_part = [];
                for (const atom of part) {
                    if (atom.predicate !== options.predicate) {
                        res_part.push(atom);
                    } else {
                        const content = Base64.decode(atom.terms[0].string);
                        const expanded = await Utils.expand_mustache_queries(part, content, index, options.recursively);
                        res_part.push(Utils.parse_atom(`${options.predicate}("${Base64.encode(expanded)}")`));
                    }
                }
                res.push(res_part);
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
        <InputGroupText>Predicate</InputGroupText>
        <Input type="text" placeholder="predicate" bind:value={options.predicate} on:input={edit} data-testid="ExpandMustacheQueries-predicate" />
        <Button outline="{!options.recursively}" on:click={() => { options.recursively = !options.recursively; edit(); }}>Multi-Stage</Button>
    </InputGroup>
</Operation>
