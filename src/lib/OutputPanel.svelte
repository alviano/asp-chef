<script>
    import CodeMirror from "svelte-codemirror-editor";
    import {Badge, Button, Card, CardBody, CardHeader, CardTitle, Icon} from "sveltestrap";
    import {AutoHideBadge, Popover} from "dumbo-svelte";
    import {createEventDispatcher} from "svelte";
    import {Utils} from "$lib/utils";
    import {consts} from "$lib/consts";
    import {Base64} from "js-base64";
    import {errors_at_index} from "$lib/stores";

    const dispatch = createEventDispatcher();

    export let value = [];
    export let decode = false;

    $: text_value = !decode ? Utils.flatten_output(value) : value.map(model =>
        model.length === 0 ? 'EMPTY MODEL' :
        model.map(atom => atom.predicate !== '__base64__' ? atom.str + '.' : Base64.decode(atom.terms[0].string))
            .join('\n')).join('\n' + consts.SYMBOLS.MODELS_SEPARATOR +'\n');
    $: errors = $errors_at_index.map((value, index) => value ? `#${index + 1}. ${value}` : value).filter(value => value);
</script>

<Card class="p-0" data-testid="OutputPanel">
    <CardHeader>
        <CardTitle>
            Output
            <span class="float-end">
                {#if errors.length > 0}
                    <Popover title="Errors in the Recipe">
                        <div slot="value">
                            {#each errors as error}
                                <p><code>{error}</code></p>
                            {/each}
                        </div>
                        <Badge color="danger" class="me-3">Errors</Badge>
                    </Popover>
                {/if}
                <code class="h6 me-3">models: {value.length}</code>
                <Popover title="Set as input" value="Replace input with the current content in output.">
                    <Button size="sm" on:click={() => dispatch('change_input', Utils.flatten_output(value, ''))}>
                        <Icon name="arrow-up-square" />
                    </Button>
                </Popover>
                <Popover title="Decode output" value="If active, Base64 encoded content in __base64__/1 instances is decoded.">
                    <Button size="sm" outline="{!decode}" on:click={() => decode = !decode}>Decode</Button>
                </Popover>
            </span>
        </CardTitle>
    </CardHeader>
    <CardBody class="p-0">
        <AutoHideBadge color="warning">readonly</AutoHideBadge>
        <div data-testid="OutputPanel-textarea">
            <CodeMirror bind:value={text_value} readonly placeholder="NO MODELS" lineWrapping="{true}" />
            <pre class="d-test">{text_value}</pre>
        </div>
    </CardBody>
</Card>