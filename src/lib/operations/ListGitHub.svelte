<script context="module">
    import {Recipe} from "$lib/recipe";
    import {Utils} from "$lib/utils";
    import {Base64} from "js-base64";
    import {consts} from "$lib/consts";

    const operation = "List GitHub";
    const default_extra_options = {
        predicate: '__base64__',
        url: '',
        filter: '',
    };

    const GITHUB_DOMAIN = consts.GITHUB_DOMAIN;
    const CDN_JSDELIVER_DOMAIN = consts.CDN_JSDELIVER_DOMAIN;

    Recipe.register_operation_type(operation, async (input, options, index) => {
        if (options.url === '') {
            return input;
        } else  if (!options.url.startsWith(`${GITHUB_DOMAIN}/`)) {
            Recipe.set_errors_at_index(index, `Error: invalid URL, must point to ${GITHUB_DOMAIN}. Forward input.`);
            return input;
        }

        let res = input;
        try {
            let errors = [];
            let files;
            const request_options = {
                cache: Utils.browser_cache_policy,
            };
            const github_api_token = localStorage.getItem('github-api-token')
            if (github_api_token) {
                request_options.headers = {
                    Authorization: `Bearer ${github_api_token}`
                };
            }
            let response = await fetch(Utils.public_url_github(options.url), request_options);
            let json = await response.json();
            if (response.status === 200) {
                files = Array.from(json)
                    .map(entry => entry.html_url)
                    .filter(url => url.match(new RegExp(options.filter, 'i')));
            } else {  // second attempt via jsDelivr
                errors.push(json.message || json);
                response = await fetch(Utils.public_url_github(options.url, true), {
                    cache: Utils.browser_cache_policy,
                });
                if (response.status === 200) {
                    const text = await response.text();
                    files = text.split('\n')
                        .map(line => line.trim())
                        .filter(line => line.startsWith('<a rel="nofollow" href="'))
                        .map(line => CDN_JSDELIVER_DOMAIN + line.substring(24).split('">')[0])
                } else {
                    json = await response.json();
                    errors.push(json.message || json);
                    Recipe.set_errors_at_index(index, errors.join('\n'), res);
                    return res;
                }
            }

            const encoded_content = files.map(file => `${options.predicate}("${Base64.encode(file)}")`);
            const atoms = Utils.parse_atoms(encoded_content);
            res = res.map(part => [...part, ...atoms]);
        } catch (error) {
            Recipe.set_errors_at_index(index, error, res);
        }
        return res;
    });
</script>

<script>
    import {Button, Icon, Input, InputGroup, InputGroupText} from "sveltestrap";
    import Operation from "$lib/Operation.svelte";
    import {readonly_ingredients} from "$lib/stores";

    export let id;
    export let options;
    export let index;
    export let add_to_recipe;
    export let keybinding;

    $: readonly = (options && options.readonly) || $readonly_ingredients;

    function edit() {
        Recipe.edit_operation(id, index, options);
    }

    async function copy_to_clipboard(url) {
        await navigator.clipboard.writeText(url);
        Utils.snackbar("URL ready to be pasted!");
    }
</script>

<Operation {id} {operation} {options} {index} {default_extra_options} {add_to_recipe} {keybinding}>
    <InputGroup>
        <InputGroupText style="width: 7em;">Predicate</InputGroupText>
        <Input type="text"
               bind:value="{options.predicate}"
               placeholder="predicate"
               on:input={edit}
        />
        <Button href="{consts.GITHUB_DOMAIN}" target="_blank">
            Visit GitHub
        </Button>
    </InputGroup>
    <InputGroup>
        <Input type="text"
               bind:value="{options.url}"
               placeholder="{GITHUB_DOMAIN}..."
               on:input={edit}
               data-testid="npm-url"
        />
        <Button size="sm" title="Copy to clipboard" on:click={() => copy_to_clipboard(options.url)}>
            <Icon name="clipboard-plus" />
        </Button>
        <Button href="{options.url}" target="_blank">
            Open in new tab
        </Button>
        <Button size="sm" title="Reload" on:click={edit}>
            <Icon name="arrow-repeat" />
        </Button>
    </InputGroup>
    <InputGroup>
        <InputGroupText style="width: 7em;">Filter</InputGroupText>
        <Input type="text"
               bind:value="{options.filter}"
               placeholder="filter"
               on:input={edit}
        />
    </InputGroup>
    <div slot="output">
        {#if readonly && options.url}
            <Button block on:click={edit}>Reload {options.url}</Button>
        {/if}
    </div>
</Operation>
