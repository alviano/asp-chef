<script context="module">
    import {Option, Recipe} from "$lib/recipe";
    import SWIPL from "swipl-wasm";
    import {Base64} from "js-base64";
    import {Utils} from "$lib/utils";

    const operation = "@preview/SWI Prolog";
    export const default_extra_options = {
        program_predicate: Option("__program__", "Predicate containing the SWI Prolog program (a Base64-encoded string, possibly with Mustache queries)", "predicate_name"),
        query_predicate: Option("__query__", "Predicate containing the SWI Prolog query (a Base64-encoded string, possibly with Mustache queries)", "predicate_name"),
        output_predicate: Option("__answer__", "Predicate to store the answers to the given query", "predicate_name"),
        multistage: Option(false, "Reiterated expansion of Mustache queries in content", "boolean"),
    };

    async function answer(program, query) {
        const swipl = await SWIPL({ arguments: ["-q"] });
        const prolog = swipl.prolog;

        await prolog.load_string(program);

        const q = prolog.query(query);
        const sol = [];

        for await (const res of q) {
            // Create a clean copy of the bindings object
            // removing internal properties like '$tag'
            const keys = Object.keys(res)
                .filter(variable => variable !== "$tag")
                .sort();

            sol.push(keys.map(key => {
                const val = res[key];

                if (typeof val === 'number') {
                    if (Number.isInteger(val)) {
                        return val;
                    }
                    return `real("${val}")`;
                }

                return JSON.stringify(val);
            }));
        }

        q.close();

        return sol;
    }

    Recipe.register_operation_type(operation, async (input, options, index, id) => {
        const res = [];
        for (const part of input) {
            const program_atoms = [];
            const query_atoms = [];
            const new_part = [...part];
            const facts = [];

            res.push(new_part);

            part.forEach(atom => {
                if (atom.predicate === options.program_predicate) {
                    program_atoms.push(Base64.decode(atom.terms[0].string));
                } else if (atom.predicate === options.query_predicate) {
                    query_atoms.push(Base64.decode(atom.terms[0].string));
                } else {
                    facts.push(`${atom.str}.`);
                }
            });

            try {
                const program = await Utils.expand_mustache_queries(part, program_atoms.join("\n") + "\n" + facts.join('\n'), index, options.multistage);
                const query = await Utils.expand_mustache_queries(part, query_atoms.join("\n"), index, options.multistage);
                const answers = await answer(program, query);
                answers.forEach(answer => {
                    new_part.push(Utils.parse_atom(`${options.output_predicate}(${answer.join(', ')})`));
                });
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
        <InputGroupText>Program and Query Predicates</InputGroupText>
        <Input type="text" placeholder="predicate" bind:value={options.program_predicate} on:input={edit} data-testid="SWIProgram-program_predicate" />
        <Input type="text" placeholder="predicate" bind:value={options.query_predicate} on:input={edit} data-testid="SWIProgram-query_predicate" />
        <Button outline="{!options.multistage}" on:click={() => { options.multistage = !options.multistage; edit(); }}>Multi-Stage</Button>
    </InputGroup>
    <InputGroup>
        <InputGroupText>Output Predicate</InputGroupText>
        <Input type="text" placeholder="predicate" bind:value={options.output_predicate} on:input={edit} data-testid="SWIProgram-output_predicate" />
    </InputGroup>
</Operation>
