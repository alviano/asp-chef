<script context="module">
    import {Recipe} from "$lib/recipe";

    const operation = "@config/Register Recipes";
    const default_extra_options = {
        predicate: '__base64__',
        prefix: 'user',
    };

    const listeners = new Map();

    Recipe.register_operation_type(operation, async (input, options, index, id) => {
        try {
            await listeners.get(id)(input);
        } catch (error) { /* component not mounted, possibly because of headless mode */ }

        return input;
    });
</script>

<script>
    import {Badge, Button, Input, InputGroup, InputGroupText} from "sveltestrap";
    import Operation from "$lib/Operation.svelte";
    import {onDestroy, onMount} from "svelte";
    import {Utils} from "$lib/utils";
    import {Base64} from "js-base64";

    export let id;
    export let options;
    export let index;
    export let add_to_recipe;
    export let keybinding;

    let input = [];

    function edit() {
        Recipe.edit_operation(id, index, options);
    }

    async function register_url(name, url, remappable_predicates, doc) {
        const operation = await Recipe.new_remote_recipe_operation(`${options.prefix}/${name}`, url, remappable_predicates, doc);
        Utils.snackbar("Registered " + operation);
    }

    async function register() {
        if (!options.prefix) {
            Recipe.set_errors_at_index(index, "Error: " + "Missing prefix")
            return;
        }

        try {
            for (const part of input) {
                for (const atom of part) {
                    if (atom.predicate === options.predicate) {
                        const data = Utils.split_with_limit(
                            Base64.decode(atom.terms[0].string),
                            '\n',
                            4,
                        );
                        const name = data[0];
                        const url = data[1];
                        const remappable_predicates = data.length > 2 ? data[2].split(' ') : [];
                        const doc = data.length > 3 ? data[3] : '';
                        await register_url(name, url, remappable_predicates, doc);
                    }
                }
            }
        } catch (error) {
            Recipe.set_errors_at_index(index, "Error: " + error);
        }
    }

    onMount(() => {
        listeners.set(id, (the_input) => {
            input = the_input;
        });
    });

    onDestroy(() => {
        listeners.set(id, null);
    });
</script>

<Operation {id} {operation} {options} {index} {default_extra_options} {add_to_recipe} {keybinding}>
    <InputGroup>
        <InputGroupText style="width: 7em;">&amp;r/</InputGroupText>
        <Input type="text"
               bind:value="{options.prefix}"
               placeholder="prefix"
               on:input={edit}
        />
    </InputGroup>
    <InputGroup>
        <InputGroupText style="width: 7em;">Predicate</InputGroupText>
        <Input type="text"
               bind:value="{options.predicate}"
               placeholder="__base64__"
               on:input={edit}
        />
    </InputGroup>
    <div slot="output">
        <Button block on:click={register}>Register</Button>
    </div>
</Operation>
