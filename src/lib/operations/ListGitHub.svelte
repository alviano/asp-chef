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

    async function fetch_urls(url, filter, predicate) {
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
        let response = await fetch(Utils.public_url_github(url), request_options);
        let json = await response.json();
        if (response.status === 200) {
            files = Array.from(json)
                .map(entry => entry.html_url)
                .filter(url => url.match(new RegExp(filter, 'i')));
        } else {  // second attempt via jsDelivr
            errors.push(json.message || json);
            response = await fetch(Utils.public_url_github(url, true), {
                cache: Utils.browser_cache_policy,
            });
            if (response.status === 200) {
                const text = await response.text();
                files = text.split('\n')
                    .map(line => line.trim())
                    .filter(line => line.startsWith('<a rel="nofollow" href="'))
                    .map(line => CDN_JSDELIVER_DOMAIN + line.substring(24).split('">')[0])
                    .filter(url => url.match(new RegExp(filter, 'i')));
            } else {
                json = await response.json();
                errors.push(json.message || json);
                throw new Error(errors.join('\n'));
            }
        }

        const encoded_content = files.map(file => `${predicate}("${Base64.encode(file)}")`);
        return Utils.parse_atoms(encoded_content);
    }

    Recipe.register_operation_type(operation, async (input, options, index) => {
        if (options.url === '') {
            return input;
        } else if (options.url !== "*" && !options.url.startsWith(`${GITHUB_DOMAIN}/`)) {
            Recipe.set_errors_at_index(index, `Error: invalid URL, must point to ${GITHUB_DOMAIN}. Forward input.`);
            return input;
        }

        let res = input;
        try {
            if (options.url === '*') {
                res = [];
                for (let part of input) {
                    const new_part = [];
                    res.push(new_part);
                    for (let atom of part) {
                        if (atom.predicate === options.predicate) {
                            let url = Base64.decode(atom.terms[0].string);
                            if (url.startsWith(consts.CDN_JSDELIVER_DOMAIN)) {
                                url = Utils.public_url_github_from_jsDelivr(url);
                            }
                            if (url.startsWith(`${GITHUB_DOMAIN}/`)) {
                                new_part.push(...await fetch_urls(url, options.filter, options.predicate));
                            } else {
                                Recipe.set_errors_at_index(index, `Error: invalid URL, must point to ${GITHUB_DOMAIN}. Forward input.`);
                                return input;
                            }
                        } else {
                            new_part.push(atom);
                        }
                    }
                }
            } else {
                const atoms = await fetch_urls(options.url, options.filter, options.predicate);
                res = res.map(part => [...part, ...atoms]);
            }
        } catch (error) {
            Recipe.set_errors_at_index(index, error, res);
        }
        return res;
    });
</script>

<script>
    import {Button, Icon, Input, InputGroup, InputGroupText} from "@sveltestrap/sveltestrap";
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
               placeholder="* | {GITHUB_DOMAIN}..."
               on:input={edit}
               data-testid="ListGitHub-url"
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
