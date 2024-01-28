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

    async function register_url(name, url, doc) {
        const operation = await Recipe.new_remote_recipe_operation(`${options.prefix}/${name}`, url, doc);
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
                            3,
                        );
                        const name = data[0];
                        const url = data[1];
                        const doc = data.length > 2 ? data[2] : '';
                        await register_url(name, url, doc);
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
    <div slot="description">
        <p>The <strong>{operation}</strong> operation adds operations to the local storage of the browser.</p>
        <p>
            New operations are given in predicate <code>__base64__</code> (it can be changed).
            Each Base64-encoded atom must provide a name in the first line, a URL in the second line, and an optional
            (but strongly suggested) documentation in the remaining lines (Markdown can be used).
            The <strong>Encode</strong> operation can be used to pack data for a new Recipe operation.
        </p>
        <p>
            URLs are not rewritten (and will not work if they are not ASP Chef recipes).
            URLs can be short links (expanded at running time, so to essentially have automatic updates).
        </p>
        <p>
            The input is forwarded to the next ingredient.
        </p>
        <p>
            <strong>Important!</strong>
            Button <Badge>REGISTER</Badge> must be clicked.
            The new operations are available in the <strong>Operations</strong> panel after a refresh or after modifying the filter, also for other recipes.
        </p>
        <p>
            Note that this operation is intended as a way to configure and customize ASP Chef.
            <strong>It is strongly suggested to register new operations only on recently loaded pages, so that the list of registered operations is aligned to the local storage of the browser.</strong>
        </p>
    </div>
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
