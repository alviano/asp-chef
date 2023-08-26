<script context="module">
    import {Recipe} from "$lib/recipe";
    import {Utils} from "$lib/utils";

    const operation = "Split";
    const default_extra_options = {
        predicate: '__model__',
    };

    Recipe.register_operation_type(operation, async (input, options, index) => {
        const res = [];
        for (let part_index = 0; part_index < input.length; part_index++) {
            const part = input[part_index];
            try {
                const models = await Utils.search_models(part.map(atom => `${atom.str}.`).join('\n') + `
{${options.predicate}'(Index) : ${options.predicate}(Index)} = 1.
#show.
#show Atom : ${options.predicate}'(Index), ${options.predicate}(Index, Atom).
                `, 0, false);
                res.push(...models.map(model => Utils.parse_atoms(model)));
            } catch (error) {
                Recipe.set_errors_at_index(index, error, res);;
            }
        }
        return res;
    });
</script>

<script>
    import {Input} from "sveltestrap";
    import Operation from "$lib/operations/Operation.svelte";

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
        <p>The <strong>{operation}</strong> operation reverses the Merge operation.</p>
        <p>
            Atoms in input of the form<br />
            <code class="ms-3">__model__(INDEX, ATOM).</code><br />
            are mapped to model #<code>INDEX</code>.
        </p>
        <p>
            The name of the binary predicate <code>__model__</code> can be specified in the recipe.
        </p>
        <p>
            The order of models is not necessarily preserved.
        </p>
    </div>
    <Input type="text"
           bind:value="{options.predicate}"
           placeholder="predicate"
           on:input={edit}
           data-testid="Split-predicate"
    />
</Operation>
