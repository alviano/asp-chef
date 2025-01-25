<script context="module">
    import {Recipe} from "$lib/recipe";
    import {Utils} from "$lib/utils";
    import {LLMs} from "$lib/operations/@LLMs/llms";


    const operation = "@LLMs/Unregister API Keys";
    const default_extra_options = {
    };

    const listeners = new Map();
    
    Recipe.register_operation_type(operation, async (input, options, index, id) => {
        try {
            listeners.get(id)(input);
        } catch (error) { /* component not mounted, possibly because of headless mode */ }
        return input;
    });

</script>

<script>
    import {Button, Input, InputGroup} from "sveltestrap";
    import Operation from "$lib/Operation.svelte";

    export let id;
    export let options;
    export let index;
    export let add_to_recipe;
    export let keybinding;

    let api_keys = LLMs.api_keys_in_local_storage();
    let session_api_keys = LLMs.api_keys_in_session_storage();

    function unregister(server) {
        LLMs.remove_api_key_from_local_storage(server);
        api_keys = LLMs.api_keys_in_local_storage();
    }

    async function unregister_all() {
        Utils.confirm({
            message: `Unregister ${Object.keys(api_keys).length} API keys?`,
            onconfirm: () => {
                Object.keys(api_keys).forEach((server) => {
                    LLMs.remove_api_key_from_local_storage(server);
                    Utils.snackbar("Unregistered " + server);
                });
                api_keys = LLMs.api_keys_in_local_storage();
            }
        });
    }

    async function disable_all() {
        Utils.confirm({
            message: `Disable ${Object.keys(api_keys).length} API keys?`,
            onconfirm: () => {
                Object.keys(session_api_keys).forEach((server) => {
                    LLMs.remove_api_key_from_session_storage(server);
                    Utils.snackbar("Disabled " + server);
                });
                session_api_keys = LLMs.api_keys_in_session_storage();
            }
        });
    }

</script>

<Operation {id} {operation} {options} {index} {default_extra_options} {add_to_recipe} {keybinding}>
    <div slot="output">
        <Button block color="warning" disabled={Object.keys(session_api_keys).length === 0} on:click={disable_all}>Disable {Object.keys(session_api_keys).length} API keys in this session</Button>
        {#each Object.keys(api_keys) as server}
            <InputGroup>
                <Input readonly value="{server}" />
                <Button on:click={() => unregister(server)}>Unregister</Button>
            </InputGroup>
        {/each}
        <Button block color="danger" disabled={Object.keys(api_keys).length === 0} on:click={unregister_all}>Unregister all (from Local Storage)</Button>
    </div>
</Operation>