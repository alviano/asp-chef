<!-- src/lib/operations/@DTDL/Config.svelte -->
<script context="module">
    import { Option, Recipe } from '$lib/recipe';
    import { Utils } from '$lib/utils';
    import { DTDL } from '$lib/operations/@DTDL/dtdl';

    const operation = '@DTDL/Config';
    export const default_extra_options = {
        endpoint: Option('', 'Azure Digital Twins endpoint URL (e.g. https://myadt.digitaltwins.azure.net)', 'string'),
        api_version: Option('2023-10-31', 'Azure DT API version', 'string'),
        model_filter: Option('', 'Filter instances by DTDL model ID (optional)', 'string'),
        predicate: Option('__dtdl_azure_config__', 'Predicate used for configuration facts', 'predicate_name'),
    };

    Recipe.register_operation_type(operation, async (input, options, index, id) => {
        const facts = [];
        if (options.endpoint) {
            facts.push(Utils.parse_atom(`${options.predicate}(endpoint, "${DTDL.escapeString(options.endpoint)}")`));
        }
        if (options.api_version) {
            facts.push(Utils.parse_atom(`${options.predicate}(api_version, "${DTDL.escapeString(options.api_version)}")`));
        }
        if (options.model_filter) {
            facts.push(Utils.parse_atom(`${options.predicate}(model_filter, "${DTDL.escapeString(options.model_filter)}")`));
        }
        return input.map((part) => [...part, ...facts]);
    });
</script>

<script>
    import { Input, InputGroup, InputGroupText, Modal, ModalBody, ModalHeader } from '@sveltestrap/sveltestrap';
    import Operation from '$lib/Operation.svelte';

    export let id;
    export let options;
    export let index;
    export let add_to_recipe;
    export let keybinding;

    let helpOpen = false;

    function edit() {
        Recipe.edit_operation(id, index, options);
    }
</script>

<Operation {id} {operation} {options} {index} {default_extra_options} {add_to_recipe} {keybinding}>
    <InputGroup>
        <InputGroupText style="width: 8em;">Endpoint</InputGroupText>
        <Input type="text" bind:value={options.endpoint}
            placeholder="https://myadt.digitaltwins.azure.net" on:input={edit}
            data-testid="@DTDL/Config-endpoint" />
    </InputGroup>
    <InputGroup>
        <InputGroupText style="width: 8em;">API Version</InputGroupText>
        <Input type="text" bind:value={options.api_version}
            placeholder="2023-10-31" on:input={edit}
            data-testid="@DTDL/Config-api-version" />
    </InputGroup>
    <InputGroup>
        <InputGroupText style="width: 8em;">Model Filter</InputGroupText>
        <Input type="text" bind:value={options.model_filter}
            placeholder="dtmi:myorg:mymodel;1 (optional)" on:input={edit}
            data-testid="@DTDL/Config-model-filter" />
    </InputGroup>
    <InputGroup>
        <InputGroupText style="width: 8em;">Predicate</InputGroupText>
        <Input type="text" bind:value={options.predicate}
            placeholder="__dtdl_azure_config__" on:input={edit}
            data-testid="@DTDL/Config-predicate" />
        <InputGroupText>
            <button class="btn btn-link p-0 text-secondary lh-1" title="Setup instructions"
                on:click={() => helpOpen = true}>
                <i class="bi bi-info-circle" style="font-size: 0.95em;"></i>
            </button>
        </InputGroupText>
    </InputGroup>
</Operation>

<Modal isOpen={helpOpen} toggle={() => helpOpen = false} size="lg">
    <ModalHeader toggle={() => helpOpen = false}>How to configure @DTDL/Config</ModalHeader>
    <ModalBody>
        <p>This operation injects the Azure Digital Twins connection parameters into the pipeline as ASP facts, which are then read by <strong>@DTDL/Instances</strong>.</p>

        <h6>Endpoint</h6>
        <p>The full HTTPS URL of your Azure Digital Twins instance. Find it in the Azure Portal under your ADT resource → <strong>Overview → Host name</strong>, then prepend <code>https://</code>.</p>
        <p>Example: <code>https://myadt.api.weu.digitaltwins.azure.net</code></p>

        <h6>API Version</h6>
        <p>The Azure Digital Twins REST API version to use. The default (<code>2023-10-31</code>) is the latest stable version and should not need to be changed.</p>

        <h6>Model Filter</h6>
        <p>Optional. A DTMI URI that restricts the query to twins of a specific model. When set, only twins whose <code>$metadata.$model</code> matches this ID are fetched.</p>
        <p>Example: <code>dtmi:com:example:Thermostat;1</code></p>
        <p>Leave empty to fetch all twins.</p>

        <h6>Predicate</h6>
        <p>The ASP predicate name used to emit the configuration facts. The default (<code>__dtdl_azure_config__</code>) matches the default expected by <strong>@DTDL/Instances</strong>. Change both if you need multiple ADT connections in the same recipe.</p>

        <h6>Recommended pipeline</h6>
        <pre style="background:#f8f9fa; padding:0.5em; border-radius:4px; font-size:0.85em;">@DTDL/Register Azure Key → @DTDL/Config → @DTDL/Parse → @DTDL/Instances</pre>
        <p>Use <strong>@DTDL/Register Azure Key</strong> first to store your Azure AD credentials. <strong>@DTDL/Parse</strong> is optional but recommended — it enables writable-property detection in the Instances panel.</p>
    </ModalBody>
</Modal>
