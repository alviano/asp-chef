<script context="module">
    import {Recipe} from "$lib/recipe";
    import {Utils} from "$lib/utils";
    import {Base64} from "js-base64";
    import {consts} from "$lib/consts";

    const operation = "HackMD";
    const default_extra_options = {
        predicate: '__base64__',
        url: '',
    };

    const HACK_MD_DOMAIN = consts.HACK_MD_DOMAIN;

    Recipe.register_operation_type(operation, async (input, options, index) => {
        if (options.url === '') {
            return input;
        } else  if (!options.url.startsWith(`${HACK_MD_DOMAIN}/`)) {
            Recipe.set_errors_at_index(index, `Error: invalid URL, must point to ${HACK_MD_DOMAIN}. Forward input.`);
            return input;
        }

        let res = input;
        try {
            const url = Utils.public_url_hack_md(options.url);
            const response = await fetch(url, {
                cache: Utils.browser_cache_policy,
            });
            const text = await response.text();
            const content = Base64.encode(text);
            const encoded_content = `${options.predicate}("${content}")`;
            const atom = Utils.parse_atom(encoded_content);
            res = res.map(part => [...part, atom]);
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
        <InputGroupText>Predicate</InputGroupText>
        <Input type="text"
               bind:value="{options.predicate}"
               placeholder="predicate"
               on:input={edit}
        />
        <Button href="{HACK_MD_DOMAIN}" target="_blank">
            Visit HackMD
        </Button>
    </InputGroup>
    <InputGroup>
        <Input type="text"
               bind:value="{options.url}"
               placeholder="{HACK_MD_DOMAIN}..."
               on:input={edit}
               data-testid="HackMD-url"
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
