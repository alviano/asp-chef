<script context="module">
    import {Recipe} from "$lib/recipe";
    import {Dumbo} from "$lib/operations/@dumbo/dumbo";
    import {Base64} from "js-base64";

    const operation = "@dumbo/To Zero Simplification Version";
    const default_extra_options = {
        program_predicate: '__program__',
        extra_atoms_predicate: '',
        echo_extra_atoms_predicate: false,
        extra_atoms: '',
    };

    Recipe.register_operation_type(operation, async (input, options, index) => {
        const res = [];
        for (const part of input) {
            try {
                const input_part = [];
                const program = [];
                const extra_atoms = [...options.extra_atoms];
                part.forEach(atom => {
                    if (atom.predicate === options.program_predicate) {
                        program.push(Base64.decode(atom.terms[0].string));
                        return;
                    }
                    if (atom.predicate === options.extra_atoms_predicate) {
                        extra_atoms.push(atom.terms[0].str)
                        if (!options.echo_extra_atoms_predicate) {
                            return;
                        }
                    }
                    input_part.push(atom);
                });
                const json = await Dumbo.fetch("to-zero-simplification-version/", {
                    program: program.join('\n'),
                    extra_atoms,
                });
                input_part.push(Dumbo.encode_program(json.program, options.program_predicate));
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
    import CodeMirror from "svelte-codemirror-editor";
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
            The <strong>{operation}</strong> operation rewrites the program stored in <code>__base64__</code> into an equivalent version that inhibit grounding simplifications.
        </p>
        <p>
            Atoms with predicate <code>__false__</code> are injected in the input program, which is assumed to not already mentions the <code>__false__</code> predicate.
        </p>
        <p>
            Atoms that are expected to be part of the Herbrand base of the program can be given (from a dumbo key or in the format facts).
        </p>
    </div>
    <InputGroup>
        <InputGroupText style="width: 8em;">Program</InputGroupText>
        <Input type="text"
               bind:value={options.program_predicate}
               placeholder="program predicate"
               on:input={edit}
        />
    </InputGroup>
    <InputGroup>
        <InputGroupText style="width: 8em;">Extra atoms</InputGroupText>
        <Input type="text"
               bind:value={options.extra_atoms_predicate}
               placeholder="extra atoms predicate"
               on:input={edit}
        />
        <Button outline="{!options.echo_extra_atoms_predicate}" on:click={() => { options.echo_extra_atoms_predicate = !options.echo_extra_atoms_predicate; edit(); }}>Echo</Button>
    </InputGroup>
    <CodeMirror bind:value={options.extra_atoms}
                lineWrapping="{true}"
                placeholder="more_extra_atoms(const,Var,...). ..."
                on:change={edit}
    />
</Operation>
