<script context="module">
    import {Option, Recipe} from "$lib/recipe";

    const operation = "Output Encoded Content";
    export const default_extra_options = {
        height: Option(200, "Height of the output container", "number"),
        predicate: Option('__base64__', "Predicate containing the Base64-encoded content to display", "predicate_name"),
        echo: Option(false, "Include the original encoded atom in the output", "boolean"),
        readable_names: Option(true, "Rewrite opaque compiler variables to short display names (SDL ASP/MiniZinc)", "boolean"),
        minizinc: Option(false, "Use MiniZinc naming rules when Readable is on", "boolean"),
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
    import {Button, Input, InputGroup, InputGroupText} from "@sveltestrap/sveltestrap";
    import Operation from "$lib/Operation.svelte";
    import {onDestroy, onMount} from "svelte";
    import CodeMirror from "$lib/CodeMirror.svelte";
    import {AutoHideBadge} from "dumbo-svelte";
    import {consts} from "$lib/consts";
    import {Base64} from "js-base64";
    import {readable} from "$lib/operations/@dumbo/sdlDisplay";

    export let id;
    export let options;
    export let index;
    export let add_to_recipe;
    export let keybinding;

    let rawOutput = '';
    let displayOutput = '';
    let viewKey = 0;

    function edit() {
        Recipe.edit_operation(id, index, options);
    }

    // Missing key (old recipes) counts as on — same as the Option default.
    function readableOn() {
        return options.readable_names !== false;
    }

    function refreshDisplay() {
        if (!readableOn() || !rawOutput) {
            displayOutput = rawOutput;
        } else {
            try {
                const target = options.minizinc ? 'minizinc' : 'asp';
                displayOutput = rawOutput
                    .split(consts.SYMBOLS.MODELS_SEPARATOR)
                    .map((part) => readable(part, target))
                    .join(consts.SYMBOLS.MODELS_SEPARATOR);
            } catch (error) {
                console.error(error);
                displayOutput = rawOutput;
            }
        }
        viewKey += 1;
    }

    function toggleReadable() {
        options.readable_names = !readableOn();
        edit();
        refreshDisplay();
    }

    function toggleMiniZinc() {
        options.minizinc = !options.minizinc;
        edit();
        refreshDisplay();
    }

    onMount(() => {
        listeners.set(id, (input) => {
            rawOutput = input.map(model => model.filter(atom => atom.predicate === options.predicate).map(atom => {
                return Base64.decode(atom.terms[0].string);
            }).join('\n')).join(consts.SYMBOLS.MODELS_SEPARATOR);
            refreshDisplay();
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
        <Button outline="{!readableOn()}" on:click={toggleReadable} data-testid="OutputEncodedContent-readable">Readable</Button>
        <Button outline="{!options.minizinc}" disabled="{!readableOn()}" on:click={toggleMiniZinc}>MiniZinc</Button>
    </InputGroup>
    <div slot="output" style="height: {options.height}px; overflow-y: auto" data-testid="OutputEncodedContent-textarea">
        <AutoHideBadge color="warning">readonly</AutoHideBadge>
        {#key viewKey}
            <CodeMirror value={displayOutput} readonly placeholder="NO CONTENT" lineWrapping="{true}" />
        {/key}
        <pre class="d-test">{displayOutput}</pre>
    </div>
</Operation>
