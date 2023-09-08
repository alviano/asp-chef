<script context="module">
    import {Recipe} from "$lib/recipe";
    import {Dumbo} from "$lib/operations/@dumbo/dumbo";
    import {Base64} from "js-base64";

    const operation = "@dumbo/Move Up";
    const default_extra_options = {
        program_predicate: '__program__',
        atoms: '',
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
                        return;
                    }
                    input_part.push(atom);
                });
                const json = await Dumbo.fetch("move-up/", {
                    program: program.join('\n'),
                    atoms: options.atoms,
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
    import {Input, InputGroup, InputGroupText} from "sveltestrap";

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
            The <strong>{operation}</strong> operation can be used to reorder the program stored in <code>__program__</code>.
        </p>
        <p>
            One or more <em>atom patterns</em> can be specified.
            (Each atom pattern is terminated by a dot, as for facts, but may contain variables.)
            Rules matching (i.e., unifying with) any given pattern are moved up in the program.
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
        <InputGroupText class="w-100"><strong>Patterns</strong></InputGroupText>
    </InputGroup>
    <CodeMirror bind:value={options.atoms}
                lineWrapping="{true}"
                placeholder="predicate(const,Var,...). ..."
                on:change={edit}
    />
</Operation>
