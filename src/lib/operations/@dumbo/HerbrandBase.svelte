<script context="module">
    import {Recipe} from "$lib/recipe";
    import {Dumbo} from "$lib/operations/@dumbo/dumbo";
    import {Base64} from "js-base64";

    const operation = "@dumbo/Herbrand Base";
    const default_extra_options = {
        program_predicate: '__program__',
        echo_program: false,
        herbrand_base_predicate: '__herbrand_base__',
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
                        if (!options.echo_program) {
                            return;
                        }
                    }
                    input_part.push(atom);
                });
                const json = await Dumbo.fetch("herbrand-base/", {
                    program: program.join('\n'),
                });
                input_part.push(Dumbo.encode_program(json.herbrand_base, options.herbrand_base_predicate));
                res.push(input_part);
            } catch (error) {
                Recipe.set_errors_at_index(index, error, res);
            }
        }
        return res;
    });
</script>

<script>
    import Operation from "$lib/Operation.svelte";
    import {Button, Input, InputGroup, InputGroupText} from "sveltestrap";

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
            The <strong>{operation}</strong> operation returns the Herbrand base of the program stored in <code>__program__</code>.
        </p>
        <p>
            The result is stored in predicate<code>__herbrand_base__</code>.
            Atoms with predicate <code>__false__</code> are excluded from the base.
        </p>
    </div>
    <InputGroup>
        <InputGroupText style="width: 8em;">Program</InputGroupText>
        <Input type="text"
               bind:value={options.program_predicate}
               placeholder="program predicate"
               on:input={edit}
        />
        <Button outline="{!options.echo_program}" on:click={() => { options.echo_program = !options.echo_program; edit(); }}>Echo</Button>
    </InputGroup>
    <InputGroup>
        <InputGroupText style="width: 8em;">Result</InputGroupText>
        <Input type="text"
               bind:value={options.herbrand_base_predicate}
               placeholder="Herbrand base predicate"
               on:input={edit}
        />
    </InputGroup>
</Operation>
