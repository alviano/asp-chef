<script context="module">
    import {Recipe} from "$lib/recipe";
    import {Utils} from "$lib/utils";

    const operation = "Index";
    const default_extra_options = {
        predicate: '__index__',
    };

    Recipe.register_operation_type(operation, async (input, options, index) => {
        const res = [];
        for (const part of input) {
            try {
                const model = await Utils.search_model(part.map((atom, index) => `${options.predicate}(${index + 1}, ${atom.str}).`).join('\n'));
                res.push(Utils.parse_atoms(model));
            } catch (error) {
                Recipe.set_errors_at_index(index, error, res);
            }
        }
        return res;
    });
</script>

<script>
    import {Input} from "sveltestrap";
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
    <div slot="description">
        <p>The <strong>{operation}</strong> operation associates each element of each model with the index of the element in the model.</p>
        <p>
            Each model in input is encoded by a sequence of facts of the form <br />
            <code class="ms-3">__index__(INDEX, ATOM).</code><br />
            where <code>INDEX</code> is an identifier for the atom in the model (starting from 1) and
            <code>ATOM</code> is an atom in the model.
        </p>
        <p>
            The name of the binary predicate <code>__index__</code> can be specified in the recipe.
        </p>
    </div>
    <Input type="text"
           bind:value="{options.predicate}"
           placeholder="predicate"
           on:input={edit}
           data-testid="Index-predicate"
    />
</Operation>
