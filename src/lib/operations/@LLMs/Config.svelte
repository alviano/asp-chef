<script context="module">
    import {Recipe} from "$lib/recipe";
    import {LLMs} from "$lib/operations/@LLMs/llms";
    import {Utils} from "$lib/utils";

    const operation = "@LLMs/Config";
    const default_extra_options = {
        server_type: LLMs.SERVER_TYPES()[0],
        server: LLMs.DEFAULT_SERVER(),
        endpoint: '/chat/completions',
        model: 'llama3-70b-8192',
        temperature: 80,
        predicate: '__llms_config__',
    };

    Recipe.register_operation_type(operation, async (input, options, index, id) => {
        const facts = [];
        if (options.server) {
            facts.push(Utils.parse_atom(`${options.predicate}(server, "${LLMs.encode_string(options.server)}")`));
            facts.push(Utils.parse_atom(`${options.predicate}(server_type, "${LLMs.encode_string(options.server_type)}")`));
        }
        if (options.endpoint) {
            facts.push(Utils.parse_atom(`${options.predicate}(endpoint, "${LLMs.encode_string(options.endpoint)}")`));
        }
        if (options.model) {
            facts.push(Utils.parse_atom(`${options.predicate}(model, "${LLMs.encode_string(options.model)}")`));
        }
        if (options.temperature || options.temperature === 0) {
            facts.push(Utils.parse_atom(`${options.predicate}(temperature, "${LLMs.encode_string(options.temperature)}")`));
        }
        return input.map(part => [...part, ...facts]);
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
        <InputGroupText style="width: 7em;">Server</InputGroupText>
        <Input type="text"
               bind:value="{options.server}"
               placeholder="{LLMs.DEFAULT_SERVER()}"
               on:input={edit}
               data-testid="@LLMs/Config-server"
        />
        <InputGroupText style="width: 4em;">Type</InputGroupText>
        <Input type="select"
               bind:value="{options.server_type}"
               on:input={edit}
               data-testid="@LLMs/Config-server-type"
        >
            {#each LLMs.SERVER_TYPES() as type}
                <option>{type}</option>
            {/each}
        </Input>
    </InputGroup>
    <InputGroup>
        <InputGroupText style="width: 7em;">Endpoint</InputGroupText>
        <Input type="text"
               bind:value={options.endpoint}
               placeholder="/chat/completions"
               on:input={edit}
               data-testid="@LLMs/Config-endpoint"
        />
    </InputGroup>
    <InputGroup>
        <InputGroupText style="width: 7em;">Model</InputGroupText>
        <Input type="text"
               bind:value={options.model}
               placeholder="llamaX.Y:70b"
               on:input={edit}
               data-testid="@LLMs/Config-model"
        />
    </InputGroup>
    <InputGroup>
        <InputGroupText style="width: 7em;">Temperature</InputGroupText>
        <Input type="number"
               bind:value={options.temperature}
               min={0} max={100} step={1}
               placeholder="percentage"
               on:input={edit}
               data-testid="@LLMs/Config-temperature"
        />
        <InputGroupText>%</InputGroupText>
    </InputGroup>
    <InputGroup>
        <InputGroupText style="width: 7em;">Predicate</InputGroupText>
        <Input type="text"
               bind:value="{options.predicate}"
               placeholder="__llms_config__"
               on:input={edit}
               data-testid="@LLMs/Config-predicate"
        />
    </InputGroup>
</Operation>