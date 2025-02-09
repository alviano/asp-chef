<script context="module">
    import {Recipe} from "$lib/recipe";
    import { Base64 } from "js-base64";
    import {Utils} from "$lib/utils";
    

    const operation = "Extract Facts";
    const default_extra_options = {
        predicate: '__base64__',
        echo: false,
        block_process: false,
        raise_error: false,
    };

    const regex = /\b[_']*[a-z][A-Za-z0-9'_]*\s*\([^)]*\)/g;

    function handle_error(error, raise_error, index, res) {
        if (raise_error) {
            Recipe.set_errors_at_index(index, error, res);
        } else {
            Utils.snackbar(`Error at index ${index}: ${error}`)
        }
    }

    Recipe.register_operation_type(operation, async (input, options, index) => {
        let res = [];
        for (const part of input) {
            try {
                const res_part = [];
                part.forEach(atom => {
                    if (atom.predicate === options.predicate) {
                        if (options.echo) {
                            res_part.push(atom);
                        }

                        const text = Base64.decode(atom.terms[0].string);
                        const matches = text.match(regex);
                        if (matches) {
                            matches.forEach(m => {
                                if (options.block_process) {
                                    res_part.push(Utils.parse_atom(m))
                                } else {
                                    try {
                                        res_part.push(Utils.parse_atom(m))
                                    } catch (error) {
                                        handle_error(error, options.raise_error, index, res);
                                    }
                                }
                            });
                        }
                    } else {
                        res_part.push(atom);
                    }
                });
                res.push(res_part);
            } catch (error) {
                handle_error(error, options.raise_error, index, res);
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
        <Input type="text"
               bind:value="{options.predicate}"
               placeholder="predicate"
               on:input={edit}
               data-testid="ExtractFacts-predicate"
        />
        <Button outline="{!options.echo}" on:click={() => { options.echo = !options.echo; edit(); }}>Echo</Button>
        <Button outline="{!options.block_process}" on:click={() => { options.block_process = !options.block_process; edit(); }}>Block Process</Button>
        <Button outline="{!options.raise_error}" on:click={() => { options.raise_error = !options.raise_error; edit(); }}>Raise Error</Button>
    </InputGroup>
</Operation>