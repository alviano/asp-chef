<script context="module">
    import {Recipe} from "$lib/recipe";
    import {Utils} from "$lib/utils";
    import { Base64 } from "js-base64";
    

    const operation = "@llm/Config";
    const default_extra_options = {
        predicate: '__config__',
        server: '',
        key: '',
        selected: '',
    };

    const listeners = new Map();
    
    Recipe.register_operation_type(operation, async (input, options, index, id) => {
        const res = [];
        try {
            listeners.get(id)(input);
            const content = Base64.encode(JSON.stringify(options.selected));
            const encoded_content = Utils.parse_atom(`${options.predicate}("${content}")`);
            input.forEach(part => res.push([...part, encoded_content]))
        } catch (error) { /* component not mounted, possibly because of headless mode */ }
        return res;
    });

</script>

<script>
    import {Button, Input, InputGroup, InputGroupText} from "sveltestrap";
    import {onDestroy, onMount} from "svelte";
    import Operation from "$lib/Operation.svelte";
    import _ from 'lodash';

    export let id;
    export let options;
    export let index;
    export let add_to_recipe;
    export let keybinding;

    let models = [];
    let dummy_servers = [
        {
            url: "https://api.groq.com/openai/v1",
            key: "lnonoineruvbuirvbruievbruievbrieuvb"
        },
        {
            url: "https://api.openai.com/v1",
            key: "asoirnveirnv64we"
        },
        {
            url: "https://api.llama-api.com",
            key: "pr6evr61ervwev"
        }
    ]

    function edit() {
        Recipe.edit_operation(id, index, options);
    }

    function register() {
        // will register the domain and api key in the localstorage
        // the user must be warned about the key being saved in the localstorage
        // if registered domains is empty, the first registered domain becomes in use automatically
        const config = {
            url: options.server,
            key: options.key
        }
        if (dummy_servers.length == 0) {
            options.selected = config
        }
        dummy_servers = [...dummy_servers, config]
        return
    }

    function use(domain) {
        // domain to use for llm calls
        options.selected = domain;
        options.server = domain.url
        options.key = domain.key
        Recipe.edit_operation(id, index, options)
    }

    function unregister(domain) {
        // remove domain from saved domains
        dummy_servers = dummy_servers.filter(server => server.url != domain.url)
        if (_.isEqual(domain, options.selected)) {
            options.selected = ''
            options.server = ''
            options.key = ''
        }
    }

    function unregister_all() {
        // remove all domains
        dummy_servers = []
    }

    onMount(() => {
        listeners.set(id, (input) => {
            models = input;
        });
    });

    onDestroy(() => {
        listeners.set(id, null);
    });
</script>

<Operation {id} {operation} {options} {index} {default_extra_options} {add_to_recipe} {keybinding}>
    <InputGroup>
        <InputGroupText style="width: 7em;">Server</InputGroupText>
        <Input type="text"
            bind:value="{options.server}"
            placeholder="https://api.groq.com/openai/v1"
            on:input={edit}
        />
    </InputGroup>
    <InputGroup>
        <InputGroupText style="width: 7em;">Api Key</InputGroupText>
        <Input type="text"
            bind:value="{options.key}"
            placeholder="api_key"
        />
    </InputGroup>
    <InputGroup>
        <InputGroupText style="width: 7em;">Output</InputGroupText>
        <Input type="text"
            bind:value="{options.predicate}"
            placeholder="predicate"
            on:input={edit}
        />
    </InputGroup>
    <div slot="output">
        <Button block on:click={register}>Register</Button>
        {#each dummy_servers as remote}
            <InputGroup>
                <Input readonly value="{remote.url}" />
                <Button on:click={() => use(remote)}>Use</Button>
                <Button color="danger" on:click={() => unregister(remote)}>UnRegister</Button>
            </InputGroup>
        {/each}
        <Button block color="danger" disabled={dummy_servers.length === 0} on:click={unregister_all}>Unregister all</Button>
    </div>
</Operation>