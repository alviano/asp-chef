<script context="module">
    import {Recipe} from "$lib/recipe";

    const operation = "Output Encoded Content";
    const default_extra_options = {
        height: 200,
        predicate: '__base64__',
        echo: false,
    };

    const listeners = new Map();

    Recipe.register_operation_type(operation, async (input, options, index, id) => {
        try {
            listeners.get(id)(input);
        } catch (error) { /* component not mounted, possibly because of headless mode */ }
        return options.echo ? input : input.map(model => model.filter(atom => atom.predicate !== options.predicate));
    });
</script>

<script>
    import {Button, Input, InputGroup, InputGroupText} from "sveltestrap";
    import Operation from "$lib/Operation.svelte";
    import {onDestroy, onMount} from "svelte";
    import CodeMirror from "svelte-codemirror-editor";
    import {AutoHideBadge} from "dumbo-svelte";
    import {consts} from "$lib/consts";
    import {Base64} from "js-base64";


    export let id;
    export let options;
    export let index;
    export let add_to_recipe;
    export let keybinding;

    let output = '';

    function edit() {
        Recipe.edit_operation(id, index, options);
    }

    onMount(() => {
        listeners.set(id, (input) => {
            output = input.map(model => model.filter(atom => atom.predicate === options.predicate).map(atom => {
                return Base64.decode(atom.terms[0].string);
            }).join('\n')).join(consts.SYMBOLS.MODELS_SEPARATOR);
        });
    });

    onDestroy(() => {
        listeners.set(id, null);
    });
</script>

<Operation {id} {operation} {options} {index} {default_extra_options} {add_to_recipe} {keybinding}>
    <InputGroup>
        <InputGroupText>Height</InputGroupText>
        <Input type="number"
               bind:value={options.height}
               min="20"
               step="20"
               on:input={edit}
        />
        <InputGroupText>Predicate</InputGroupText>
        <Input type="text" placeholder="predicate" bind:value={options.predicate} on:input={edit} data-testid="OutputEncodedContent-predicate" />
        <Button outline="{!options.echo}" on:click={() => { options.echo = !options.echo; edit(); }}>Echo</Button>
    </InputGroup>
    <div slot="output" style="height: {options.height}px; overflow-y: auto" data-testid="OutputEncodedContent-textarea">
        <AutoHideBadge color="warning">readonly</AutoHideBadge>
        <CodeMirror value={output} readonly placeholder="NO CONTENT" lineWrapping="{true}" />
        <pre class="d-test">{output}</pre>
    </div>
</Operation>
