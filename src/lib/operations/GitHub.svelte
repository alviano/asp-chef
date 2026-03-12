<script context="module">
    import {Option, Recipe} from "$lib/recipe";
    import {Utils} from "$lib/utils";
    import {Base64} from "js-base64";
    import {consts} from "$lib/consts";

    const operation = "GitHub";
    export const default_extra_options = {
        predicate: Option('__base64__', "Predicate to wrap the fetched GitHub content in", "predicate_name"),
        url: Option('', "URL of the GitHub file to fetch content from", "string"),
    };

    const GITHUB_DOMAIN = consts.GITHUB_DOMAIN;

    Recipe.register_operation_type(operation, async (input, options, index) => {
        if (options.url === '') {
            return input;
        } else if (options.url !== "*" && !options.url.startsWith(`${GITHUB_DOMAIN}/`)) {
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
                                new_part.push(await Utils.fetch_github_content(url, options.predicate));
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
                const atom = await Utils.fetch_github_content(options.url, options.predicate);
                res = input.map(part => [...part, atom]);
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
