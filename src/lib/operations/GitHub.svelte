<script context="module">
    import {Recipe} from "$lib/recipe";
    import {Utils} from "$lib/utils";
    import {Base64} from "js-base64";
    import {consts} from "$lib/consts";

    const operation = "GitHub";
    const default_extra_options = {
        predicate: '__base64__',
        url: '',
    };

    const GITHUB_DOMAIN = consts.GITHUB_DOMAIN;

    async function fetch_content_internal(url, predicate, errors) {
        const request_options = {
            cache: Utils.browser_cache_policy,
        };
        const github_api_token = localStorage.getItem('github-api-token')
        if (github_api_token) {
            request_options.headers = {
                Authorization: `Bearer ${github_api_token}`
            };
        }
        const response = await fetch(url, request_options);
        if (response.status !== 200) {
            const json = await response.json();
            errors.push(json.message || json);
            return;
        }
        const contentType = response.headers.get("content-type");
        let content;
        if (contentType.startsWith("application/json")) {
            const json = await response.json();
            content = json.content.replace(/[\n\r]/g, "");
            console.log(content)
        } else {
            const text = await response.text();
            content = Base64.encode(text);
        }
        const encoded_content = `${predicate}("${content}")`;
        return Utils.parse_atom(encoded_content);
    }

    async function fetch_content(url, predicate) {
        let errors = [];
        let res = await fetch_content_internal(Utils.public_url_github(url), predicate, errors);
        if (res !== undefined) {
            return res;
        }
        res = await fetch_content_internal(Utils.public_url_github(url, true), predicate, errors);
        if (res !== undefined) {
            return res;
        }
        throw new Error(errors.join('\n'));
    }


    Recipe.register_operation_type(operation, async (input, options, index) => {
        if (options.url === '') {
            return input;
        } else  if (options.url !== "*" && !options.url.startsWith(`${GITHUB_DOMAIN}/`)) {
            Recipe.set_errors_at_index(index, `Error: invalid URL, must point to ${GITHUB_DOMAIN}. Forward input.`);
            return input;
        }

        let res = input;
        try {
            if (options.url === "*") {
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
                                new_part.push(await fetch_content(url, options.predicate));
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
                const atom = await fetch_content(options.url, options.predicate);
                res = input.map(part => [...part, atom]);
            }
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
    <div slot="description">
        <p>The <strong>{operation}</strong> operation takes a URL pointing to a public file on GitHub and fetches its content (possibly via jsDelivr).</p>
        <p>
            <strong>Important!</strong> The URL must be in the format <code>https://github.com/user/repo/blob/version/filepath</code>.
            Use <strong>Set HTTP Cache Policy</strong> to configure the cache policy.
            Note that the GitHub API has a rate limit, while jsDelivr may take some time to update.
        </p>
        <p>
            The content is base64 encoded and wrapped by predicate <code>__base64__</code>.
        </p>
        <p>
            The name of the unary predicate <code>__base64__</code> can be specified in the recipe.
            If the wildcard <code>*</code> is used as URL, URLs are actually taken from the <code>__base64__</code> atoms.
        </p>
        <p>
            The encoded content can be consumed by operations such as <strong>Markdown</strong> and <strong>Search Models</strong>.
        </p>
    </div>
    <InputGroup>
        <InputGroupText>Predicate</InputGroupText>
        <Input type="text"
               bind:value="{options.predicate}"
               placeholder="predicate"
               on:input={edit}
        />
        <Button href="{GITHUB_DOMAIN}" target="_blank">
            Visit GitHub
        </Button>
    </InputGroup>
    <InputGroup>
        <Input type="text"
               bind:value="{options.url}"
               placeholder="* | {GITHUB_DOMAIN}..."
               on:input={edit}
               data-testid="GitHub-url"
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
    <div slot="output">
        {#if readonly && options.url}
            <Button block on:click={edit}>Reload {options.url}</Button>
        {/if}
    </div>
</Operation>
