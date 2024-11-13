<script context="module">
    import {Recipe} from "$lib/recipe";

    const operation = "Open URLs";
    const default_extra_options = {
        predicate: '__url__',
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
    import {Button, Input, InputGroup, InputGroupText} from "sveltestrap";
    import Operation from "$lib/Operation.svelte";
    import {onDestroy, onMount} from "svelte";
    import {Base64} from "js-base64";

    export let id;
    export let options;
    export let index;
    export let add_to_recipe;
    export let keybinding;

    let urls = [];

    function edit() {
        Recipe.edit_operation(id, index, options);
    }

    onMount(() => {
        listeners.set(id, (the_input) => {
            urls.length = 0;
            the_input.forEach(part => {
                part.forEach(atom => {
                    if (atom.predicate === options.predicate) {
                        urls.push(Base64.decode(atom.terms[0].string));
                    }
                });
            });
        });
    });

    onDestroy(() => {
        listeners.set(id, null);
    });
</script>

<Operation {id} {operation} {options} {index} {default_extra_options} {add_to_recipe} {keybinding}>
    <InputGroup>
        <InputGroupText style="width: 7em;">Predicate</InputGroupText>
        <Input type="text"
               bind:value="{options.predicate}"
               placeholder="__url__"
               on:input={edit}
        />
    </InputGroup>
    <div slot="output">
        {#each urls as url}
            <Button block href={url} target="_blank">
                Open {url.substring(0, 50) + (url.length > 50 ? '...' : '')}
            </Button>
        {/each}
    </div>
</Operation>
