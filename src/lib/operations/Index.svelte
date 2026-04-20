<script context="module">
    import {Option, Recipe} from "$lib/recipe";
    import {Utils} from "$lib/utils";

    const operation = "Index";
    export const default_extra_options = {
        predicate: Option('__index__', "Predicate to wrap each atom with its index", "predicate_name"),
    };

    Recipe.register_operation_type(operation, async (input, options, index) => {
        const res = [];
        for (const part of input) {
            try {
                const atoms = part.map((atom, index) => `${options.predicate}(${index + 1}, ${atom.str})`);
                res.push(Utils.parse_atoms(atoms));
            } catch (error) {
                Recipe.set_errors_at_index(index, error, res);
            }
        }
        return res;
    });
</script>

<script>
    import {Input} from "@sveltestrap/sveltestrap";
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
    <Input type="text"
           bind:value="{options.predicate}"
           placeholder="predicate"
           on:input={edit}
           data-testid="Index-predicate"
    />
</Operation>
