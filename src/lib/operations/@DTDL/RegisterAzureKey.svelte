<!-- src/lib/operations/@DTDL/RegisterAzureKey.svelte -->
<script context="module">
    import { Option, Recipe } from '$lib/recipe';

    const operation = '@DTDL/Register Azure Key';
    export const default_extra_options = {};

    Recipe.register_operation_type(operation, async (input, options, index, id) => {
        return input;
    });
</script>

<script>
    import { Button, Input, InputGroup, InputGroupText, Modal, ModalBody, ModalHeader } from '@sveltestrap/sveltestrap';
    import Operation from '$lib/Operation.svelte';
    import { Utils } from '$lib/utils';
    import { AzureDT } from '$lib/operations/@DTDL/azure_dt';

    export let id;
    export let options;
    export let index;
    export let add_to_recipe;
    export let keybinding;

    let tenant_id = '';
    let client_id = '';
    let client_secret = '';
    let helpOpen = false;

    function register_in_session_storage() {
        if (!tenant_id || !client_id || !client_secret) return;
        AzureDT.save_credentials_in_session_storage(tenant_id, client_id, client_secret);
        Utils.snackbar('Azure credentials registered for this session.');
    }

    function register_in_local_storage() {
        if (!tenant_id || !client_id || !client_secret) return;
        AzureDT.save_credentials_in_local_storage(tenant_id, client_id, client_secret);
        Utils.snackbar('Azure credentials registered permanently (Local Storage).');
    }
</script>

<Operation {id} {operation} {options} {index} {default_extra_options} {add_to_recipe} {keybinding}>
    <div slot="output">
        <InputGroup>
            <InputGroupText style="width: 8em;">Tenant ID</InputGroupText>
            <Input type="text" bind:value={tenant_id} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
        </InputGroup>
        <InputGroup>
            <InputGroupText style="width: 8em;">Client ID</InputGroupText>
            <Input type="text" bind:value={client_id} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
        </InputGroup>
        <InputGroup>
            <InputGroupText style="width: 8em;">Client Secret</InputGroupText>
            <Input type="password" bind:value={client_secret} placeholder="your-client-secret" />
            <InputGroupText>
                <button class="btn btn-link p-0 text-secondary lh-1" title="Setup instructions"
                    on:click={() => helpOpen = true}>
                    <i class="bi bi-info-circle" style="font-size: 0.95em;"></i>
                </button>
            </InputGroupText>
        </InputGroup>
        <Button block color="primary" on:click={register_in_session_storage}
            disabled={!tenant_id || !client_id || !client_secret}>
            Enable for this session only
        </Button>
        <Button block color="danger" on:click={register_in_local_storage}
            disabled={!tenant_id || !client_id || !client_secret}>
            Enable and register permanently (Local Storage)
        </Button>
    </div>
</Operation>

<Modal isOpen={helpOpen} toggle={() => helpOpen = false} size="lg">
    <ModalHeader toggle={() => helpOpen = false}>How to configure Azure credentials</ModalHeader>
    <ModalBody>
        <p>This operation stores Azure Active Directory credentials used to authenticate against your Azure Digital Twins instance. Credentials are only sent to Microsoft's OAuth2 endpoint and your ADT instance.</p>

        <h6>1. Create an Azure Digital Twins instance</h6>
        <p>In the Azure Portal, create an <strong>Azure Digital Twins</strong> resource and note the <strong>Host name</strong> (e.g. <code>myadt.api.weu.digitaltwins.azure.net</code>). Prepend <code>https://</code> when entering it in <strong>@DTDL/Config</strong>.</p>

        <h6>2. Register an application in Azure AD</h6>
        <ol>
            <li>Go to <strong>Azure Active Directory → App registrations → New registration</strong>.</li>
            <li>Choose any name (e.g. <code>asp-chef-dtdl</code>), leave Redirect URI empty, and click <strong>Register</strong>.</li>
            <li>From the app overview, copy the <strong>Application (client) ID</strong> → paste it in <em>Client ID</em>.</li>
            <li>From the tenant overview (or the same page), copy the <strong>Directory (tenant) ID</strong> → paste it in <em>Tenant ID</em>.</li>
        </ol>

        <h6>3. Create a client secret</h6>
        <ol>
            <li>In the app registration, go to <strong>Certificates &amp; secrets → Client secrets → New client secret</strong>.</li>
            <li>Choose an expiry and click <strong>Add</strong>.</li>
            <li>Copy the <strong>Value</strong> immediately (it is only shown once) → paste it in <em>Client Secret</em>.</li>
        </ol>

        <h6>4. Assign a role on the ADT instance</h6>
        <ol>
            <li>Open your Azure Digital Twins resource → <strong>Access control (IAM) → Add role assignment</strong>.</li>
            <li>Select <strong>Azure Digital Twins Data Owner</strong> (read + write) or <strong>Azure Digital Twins Data Reader</strong> (read only).</li>
            <li>Assign it to the app registration created above.</li>
        </ol>

        <h6>Storage options</h6>
        <ul>
            <li><strong>Session only</strong>: credentials are stored in <code>sessionStorage</code> and cleared when the tab is closed.</li>
            <li><strong>Permanent (Local Storage)</strong>: credentials persist across page reloads. Use only on a trusted personal device.</li>
        </ul>
    </ModalBody>
</Modal>
