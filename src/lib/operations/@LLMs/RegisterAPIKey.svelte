<script context="module">
    import {Recipe} from "$lib/recipe";
    import {LLMs} from "$lib/operations/@LLMs/llms";

    const operation = "@LLMs/Register API Key";
    const default_extra_options = {
        server: LLMs.DEFAULT_SERVER(),
    };

    Recipe.register_operation_type(operation, async (input, options, index, id) => {
        return input;
    });

</script>

<script>
    import {Button, Input, InputGroup, InputGroupText} from "sveltestrap";
    import Operation from "$lib/Operation.svelte";
    import {Utils} from "$lib/utils";

    export let id;
    export let options;
    export let index;
    export let add_to_recipe;
    export let keybinding;

    let api_key = '';

    function edit() {
        Recipe.edit_operation(id, index, options);
    }

    function register_in_session_storage() {
        LLMs.add_api_key_in_session_storage(options.server, api_key);
        Utils.snackbar("LLMs API key registered in local storage!");
    }

    function register_in_local_storage() {
        LLMs.add_api_key_in_local_storage(options.server, api_key)
        LLMs.add_api_key_in_session_storage(options.server, api_key);
        Utils.snackbar("LLMs API key registered in local storage!");
    }
</script>

<Operation {id} {operation} {options} {index} {default_extra_options} {add_to_recipe} {keybinding}>
    <div slot="output">
        <InputGroup>
            <InputGroupText style="width: 7em;">Server</InputGroupText>
            <Input type="text"
                bind:value="{options.server}"
                placeholder="{LLMs.DEFAULT_SERVER()}"
                on:input={edit}
            />
        </InputGroup>
        <InputGroup>
            <InputGroupText style="width: 7em;">Api Key</InputGroupText>
            <Input type="password"
                bind:value="{api_key}"
                placeholder="gsk_...."
            />
        </InputGroup>
        <Button block color="primary" on:click={register_in_session_storage} disabled="{!options.server || !api_key}">Enable for this session only</Button>
        <Button block color="danger" on:click={register_in_local_storage} disabled="{!options.server || !api_key}">Enable and register permanently (in Local Storage)</Button>
    </div>
</Operation>
