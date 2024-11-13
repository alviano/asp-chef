<script context="module">
    import {Recipe} from "$lib/recipe";
    import {Utils} from "$lib/utils";
    import {Base64} from "js-base64";
    import {consts} from "$lib/consts";

    const operation = "Encode Input";
    const default_extra_options = {
        predicate: '__base64__',
        echo_input: false,
    };

    Recipe.register_operation_type(operation, async (input, options, index) => {
        const mapper = atom => atom.str + '.';
        const content = Base64.encode(input.map(part => part.map(mapper).join('\n')).join('\n' + consts.SYMBOLS.MODELS_SEPARATOR + '\n'));
        const encoded_content = `${options.predicate}("${content}").`;

        if (!options.echo_input) {
            const model = await Utils.search_model(encoded_content);
            return [Utils.parse_atoms(model)];
        }

        const res = [];
        for (const part of input) {
            try {
                const program = part.map(mapper).join('\n') + encoded_content;
                const model = await Utils.search_model(program);
                res.push(Utils.parse_atoms(model));
            } catch (error) {
                Recipe.set_errors_at_index(index, error, res);
            }
        }
        return res;
    });
</script>

<script>
    import {Button, Input, InputGroup, InputGroupText} from "sveltestrap";
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
        <InputGroupText>Predicate</InputGroupText>
        <Input type="text"
               bind:value="{options.predicate}"
               placeholder="predicate"
               on:input={edit}
               data-testid="EncodeInput-predicate"
        />
        <Button outline="{!options.echo_input}" on:click={() => { options.echo_input = !options.echo_input; edit(); }}>Echo</Button>
    </InputGroup>
</Operation>
