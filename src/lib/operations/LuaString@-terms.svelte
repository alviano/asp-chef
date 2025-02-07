<script context="module">
    import {Recipe} from "$lib/recipe";
    import {Utils} from "$lib/utils";
    import {Base64} from "js-base64";

    const operation = "Lua String @-terms";
    const default_extra_options = {
        encode_predicate: '__base64__',
        prefix: 'string_',
    };

    Recipe.register_operation_type(operation, async (input, options, index) => {
        const content = Base64.encode(Utils.lua_lib_string(options.prefix));

        const encoded_content = `${options.encode_predicate}("${content}").`;
        const mapper = atom => atom.str + '.';
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
    import {Input, InputGroup, InputGroupText} from "sveltestrap";
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
        <InputGroupText style="width: 10em;">Encode predicate</InputGroupText>
        <Input type="text"
               bind:value={options.encode_predicate}
               placeholder="encode predicate"
               on:input={edit}
               data-testid="LuaString@-terms-encode-predicate"
        />
    </InputGroup>
    <InputGroup>
        <InputGroupText style="width: 10em;">Prefix</InputGroupText>
        <Input type="text"
               bind:value={options.prefix}
               placeholder="string_"
               on:input={edit}
               data-testid="LuaString@-terms-prefix}"
        />
    </InputGroup>
</Operation>
