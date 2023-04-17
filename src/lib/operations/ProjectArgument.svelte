<script context="module">
    import {Recipe} from "$lib/recipe";
    import {Utils} from "$lib/utils";

    const operation = "Project Argument";
    const default_extra_options = {
        index: 1,
    };

    Recipe.register_operation_type(operation, async (input, options, index) => {
        const mapper =
            atom => {
                return atom.terms ? `${atom.predicate}(` + atom.terms.filter(
                    (term, index) => index + 1 !== options.index
                ).map(term => term.str).join(',') + ').' : atom.str + '.'
            }
        ;
        const res = [];
        for (const part of input) {
            try {
                const model = await Utils.search_model(part.map(mapper).join('\n'));
                res.push(Utils.parse_atoms(model));
            } catch (error) {
                Recipe.set_errors_at_index(index, error, res);
            }
        }
        return res;
    });
</script>

<script>
    import Operation from "$lib/operations/Operation.svelte";
    import {Input, InputGroup, InputGroupText} from "sveltestrap";

    export let id;
    export let options;
    export let index;
    export let add_to_recipe;
    export let keybinding;

    function edit() {
        Recipe.edit_operation(index, options);
    }
</script>

<Operation {id} {operation} {options} {index} {default_extra_options} {add_to_recipe} {keybinding}>
    <div slot="description">
        <p>
            The <strong>{operation}</strong> operation drops arguments of the specified index.
        </p>
    </div>
    <InputGroup>
        <InputGroupText>Index</InputGroupText>
        <Input type="number"
               min="1"
               bind:value={options.index}
               on:input={edit}
               data-testid="ProjectArgument-index"
        />
    </InputGroup>
</Operation>
