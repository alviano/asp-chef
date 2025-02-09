<script context="module">
    import {Recipe} from "$lib/recipe";
    import {Utils} from "$lib/utils";

    const operation = "Merge";
    const default_extra_options = {
        predicate: '__model__',
    };

    Recipe.register_operation_type(operation, async (input, options, index) => {
        const res = [];
        for (let part_index = 0; part_index < input.length; part_index++) {
            const part = input[part_index];
            try {
                const model = await Utils.search_model(`${options.predicate}(${part_index + 1}).` + part.map(atom => `${options.predicate}(${part_index + 1}, ${atom.str}).`).join('\n'));
                res.push(Utils.parse_atoms(model));
            } catch (error) {
                Recipe.set_errors_at_index(index, error, res);
            }
        }
        return [res.flatMap(model => model)];
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
           data-testid="Merge-predicate"
    />
</Operation>
