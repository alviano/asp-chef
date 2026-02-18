<script context="module">
    import {Recipe} from "$lib/recipe";
    import {Dumbo} from "$lib/operations/@dumbo/dumbo";
    import {Base64} from "js-base64";
    import {get} from "svelte/store";
    import {clingo_remote_uuid} from "$lib/stores.js";
    import {Utils} from "$lib/utils.js";

    const operation = "@dumbo/Casper";
    const default_extra_options = {
        program_predicate: '__program__',
        echo: false,
        enumerate: false,
    };

    Recipe.register_operation_type(operation, async (input, options, index) => {
        const res = [];
        for (const part of input) {
            try {
                const input_part = [];
                const program = [];
                part.forEach(atom => {
                    if (atom.predicate === options.program_predicate) {
                        program.push(Base64.decode(atom.terms[0].string));
                        if (!options.echo) {
                            return;
                        }
                    }
                    input_part.push(atom);
                });
                const json = await Dumbo.fetch("casper/", {
                    uuid: get(clingo_remote_uuid),
                    program: program.join('\n'),
                    enumerate: options.enumerate,
                    timeout: Utils.clingo_timeout,
                });
                const new_models = json.models.map(model => {
                    const new_model = Utils.parse_atoms(model);
                    new_model.push(...input_part);
                    return new_model;
                });
                res.push(...new_models);
            } catch (error) {
                Recipe.set_errors_at_index(index, error, res);
            }
        }
        return res;
    });
</script>

<script>
    import Operation from "$lib/Operation.svelte";
    import {Button, Input, InputGroup, InputGroupText} from "@sveltestrap/sveltestrap";

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
        <InputGroupText style="width: 8em;">Program</InputGroupText>
        <Input type="text"
               bind:value={options.program_predicate}
               placeholder="program predicate"
               on:input={edit}
        />
        <Button outline="{!options.echo}" on:click={() => { options.echo = !options.echo; edit(); }}>Echo</Button>
        <Button outline="{!options.enumerate}" on:click={() => { options.enumerate = !options.enumerate; edit(); }}>Enumerate</Button>
    </InputGroup>
</Operation>
