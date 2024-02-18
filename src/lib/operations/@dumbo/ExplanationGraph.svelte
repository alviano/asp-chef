<script context="module">
    import {Recipe} from "$lib/recipe";
    import {Dumbo} from "$lib/operations/@dumbo/dumbo";
    import {Base64} from "js-base64";

    const operation = "@dumbo/Explanation Graph";
    const default_extra_options = {
        program_predicate: '__program__',
        answer_set_predicate: '__answer_set__',
        herbrand_base_predicate: '__herbrand_base__',
        query_predicate: '__query__',
        url_predicate: '__url__',
    };

    Recipe.register_operation_type(operation, async (input, options, index) => {
        const res = [];
        for (const part of input) {
            try {
                const input_part = [];
                const program = [];
                const answer_set = [];
                const herbrand_base = [];
                const query = [];
                part.forEach(atom => {
                    if (atom.predicate === options.program_predicate) {
                        program.push(Base64.decode(atom.terms[0].string));
                    } else if (atom.predicate === options.answer_set_predicate) {
                        answer_set.push(atom.terms[0].str);
                    } else if (atom.predicate === options.herbrand_base_predicate) {
                        herbrand_base.push(Base64.decode(atom.terms[0].string));
                    } else if (atom.predicate === options.query_predicate) {
                        query.push(atom.terms[0].str);
                    }
                    input_part.push(atom);
                });
                const json = await Dumbo.fetch("explanation-graph/", {
                    program: program.join('\n'),
                    answer_set,
                    herbrand_base: herbrand_base.join('\n'),
                    query,
                });
                 input_part.push(Dumbo.encode_program(json.url, options.url_predicate));
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
            The <strong>{operation}</strong> operation computes an explanation graph for
            the program stored in <code>__program__</code>,
            the answer set stored in <code>__answer_set__</code>,
            the Herbrand base stored in <code>__herbrand_base__</code>, and
            the query atoms stored in <code>__query__</code>.
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
    </InputGroup>
    <InputGroup>
        <InputGroupText style="width: 8em;">Answer set</InputGroupText>
        <Input type="text"
               bind:value={options.answer_set_predicate}
               placeholder="answer set predicate"
               on:input={edit}
        />
    </InputGroup>
    <InputGroup>
        <InputGroupText style="width: 8em;">Herbrand base</InputGroupText>
        <Input type="text"
               bind:value={options.herbrand_base_predicate}
               placeholder="Herbrand base predicate"
               on:input={edit}
        />
    </InputGroup>
    <InputGroup>
        <InputGroupText style="width: 8em;">Query</InputGroupText>
        <Input type="text"
               bind:value={options.query_predicate}
               placeholder="query predicate"
               on:input={edit}
        />
    </InputGroup>
    <InputGroup>
        <InputGroupText style="width: 8em;">URL (result)</InputGroupText>
        <Input type="text"
               bind:value={options.url_predicate}
               placeholder="URL predicate"
               on:input={edit}
        />
    </InputGroup>
</Operation>
