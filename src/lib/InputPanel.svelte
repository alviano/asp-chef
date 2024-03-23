<script>
    import {Button, Card, CardBody, CardHeader, CardTitle, Icon} from "sveltestrap";
    import {consts} from "$lib/consts";
    import {keydown} from "dumbo-svelte";
    import Popover from "$lib/Popover.svelte";
    import {Utils} from "$lib/utils";
    import CodeMirror from "svelte-codemirror-editor";
    import {onDestroy, onMount} from "svelte";
    import {v4 as uuidv4} from "uuid";

    export let value;
    export let encode;

    let editor;

    const keydown_uuid = uuidv4();

    function clear_input() {
        Utils.confirm({
            message: "Remove input content?",
            onconfirm: () => {
                value = '';
            }
        })
    }

    onMount(() => {
        $keydown.push([keydown_uuid, (event) => {
            if (event.uKey === 'I') {
                editor.$$.ctx[15].focus();  // a bit fragile, but I have not found any other way to get the EditorView
                Utils.snackbar("Focus on Input...");
                return true;
            }
        }]);
    });

    onDestroy(() => {
        $keydown = $keydown.filter(key_value => key_value[0] !== keydown_uuid);
    });
</script>

<Card class="p-0" data-testid="InputPanel">
    <CardHeader>
        <CardTitle>
            Input
            <span class="float-end">
                <code class="me-3" style="font-size: 70%;">models: {value.split(consts.SYMBOLS.MODELS_SEPARATOR).length}</code>
                <Popover title="Clear input" value="Remove input content.">
                    <Button size="sm" color="danger" on:click={clear_input}><Icon name="trash" /></Button>
                </Popover>
                <Popover title="Encode input" value="If active, the input is Base64 encoded as a single fact.">
                    <Button size="sm" outline="{!encode}" on:click={() => encode = !encode}>Encode</Button>
                </Popover>
            </span>
        </CardTitle>
    </CardHeader>
    <CardBody class="p-0">
        <Popover block placement="left" title="Input panel">
            <div slot="value">
                <p>Provide one or more models separated by {consts.SYMBOLS.MODELS_SEPARATOR}</p>
                <p>Jump to this textarea with the keybinding <code>I</code></p>
            </div>
            <div data-testid="InputPanel-textarea">
                <CodeMirror bind:this={editor} bind:value
                            placeholder={`One or more models separated by ${consts.SYMBOLS.MODELS_SEPARATOR}\n\nDON'T KNOW HOW TO USE ASP CHEF?!?\nHave a look at our tutorials and examples at\n    ${consts.DOMAIN}/s/`}
                            lineWrapping="{true}"
                />
                <pre class="d-test">{value}</pre>
            </div>
        </Popover>
    </CardBody>
</Card>
