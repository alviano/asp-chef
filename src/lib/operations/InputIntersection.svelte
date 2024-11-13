<script context="module">
    import {Recipe} from "$lib/recipe";
    import {Utils} from "$lib/utils";

    const operation = "Input Intersection";
    const default_extra_options = {
    };

    Recipe.register_operation_type(operation, async (input) => {
        try {
            const program = input.flatMap((part, index) => {
                return part.map(atom => `#show ${atom.str} : __model__(${index + 1}).`)
            }).join('\n') + '\n#show.\n{__model__(1..' + input.length + ')} = 1.';
            const consequences = await Utils.cautious_consequences(program);
            return [Utils.parse_atoms(consequences)];
        } catch (error) {
            return [[{str: error}]];
        }
    });
</script>

<script>
    import Operation from "$lib/Operation.svelte";

    export let id;
    export let options;
    export let index;
    export let add_to_recipe;
    export let keybinding;
</script>

<Operation {id} {operation} {options} {index} {default_extra_options} {add_to_recipe} {keybinding}>
</Operation>
