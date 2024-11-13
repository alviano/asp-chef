<script context="module">
    import {Recipe} from "$lib/recipe";

    const operation = "@config/Register Javascript";
    const default_extra_options = {
        local: '__local__',
        url: '__url__',
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

    async function register_url(url) {
        try {
            url = Utils.public_url(url);
        } catch (error) { /* empty */ }

        const operation = await Recipe.new_remote_javascript_operation(options.prefix, url);
        Utils.snackbar("Registered " + operation);
    }

    async function register() {
        if (!options.prefix) {
            Recipe.set_errors_at_index(index, "Error: " + "Missing prefix")
            return;
        }
        if (options.url && options.url.match("http[s]://")) {
            try {
                await register_url(options.url);
            } catch (error) {
                Recipe.set_errors_at_index(index, "Error: " + error);
            }
        }

        try {
            for (const part of input) {
                for (const atom of part) {
                    if (atom.predicate === options.local) {
                        await register_url('data:text/plain;base64,' + atom.terms[0].string);
                    } else if (atom.predicate === options.url) {
                        const urls = Base64.decode(atom.terms[0].string).split('\n').map(url => url.trim()).filter(url => url);
                        for (const url of urls) {
                            await register_url(url);
                        }
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
        <InputGroupText style="width: 7em;">&amp;js-</InputGroupText>
        <Input type="text"
               bind:value="{options.prefix}"
               placeholder="prefix"
               on:input={edit}
        />
    </InputGroup>
    <InputGroup>
        <InputGroupText style="width: 7em;">URL(s)</InputGroupText>
        <Input type="text"
               bind:value="{options.url}"
               placeholder="predicate or https://..."
               on:input={edit}
        />
    </InputGroup>
    <InputGroup>
        <InputGroupText style="width: 7em;">Local</InputGroupText>
        <Input type="text"
               bind:value="{options.local}"
               placeholder="predicate"
               on:input={edit}
        />
    </InputGroup>
    <div slot="output">
        <Button block on:click={register}>Register</Button>
    </div>
</Operation>
