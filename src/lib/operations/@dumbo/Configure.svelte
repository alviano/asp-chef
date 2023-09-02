<script context="module">
    import {Recipe} from "$lib/recipe";
    import {Dumbo} from "$lib/operations/@dumbo/dumbo";

    const operation = "@dumbo/Configure";
    const default_extra_options = {
        url: Dumbo.url,
    };

    Recipe.register_operation_type(operation, async (input, options) => {
        Dumbo.url = options.url;
        return input;
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
    <div slot="description">
        <p>
            The <strong>{operation}</strong> operation sets the configuration for interacting with a <strong>REST Dumbo ASP server</strong>.
        </p>
        <p>
            <strong>Important!</strong>
            Interacting with different REST Dumbo ASP servers can result in calls to the wrong server due to the caching mechanism of ASP Chef.
        </p>
    </div>
    <InputGroup>
        <InputGroupText style="width: 6em;">URL</InputGroupText>
        <Input type="text"
               bind:value={options.url}
               placeholder="https://..."
               on:change={edit}
               data-testid="DumboBegin-url"
        />
    </InputGroup>
</Operation>
