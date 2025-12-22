<script context="module">
    import {Recipe} from "$lib/recipe";

    const operation = "Output";
    const default_extra_options = {
        height: 200,
    };

    const listeners = new Map();

    Recipe.register_operation_type(operation, async (input, options, index, id) => {
        try {
            listeners.get(id)(input);
        } catch (error) { /* component not mounted, possibly because of headless mode */ }
        return input;
    });
</script>

<script>
    import {Input, InputGroup, InputGroupText} from "@sveltestrap/sveltestrap";
    import Operation from "$lib/Operation.svelte";
    import {onDestroy, onMount} from "svelte";
    import CodeMirror from "$lib/CodeMirror.svelte";
    import {AutoHideBadge} from "dumbo-svelte";
    import {Utils} from "$lib/utils";

    export let id;
    export let options;
    export let index;
    export let add_to_recipe;
    export let keybinding;

    let models = [];
    $: text_value = Utils.flatten_output(models);

    function edit() {
        Recipe.edit_operation(id, index, options);
    }

    onMount(() => {
        listeners.set(id, (input) => {
            models = input;
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
        <InputGroupText><code>models: {models.length}</code></InputGroupText>
    </InputGroup>
    <div slot="output" style="height: {options.height}px; overflow-y: auto" data-testid="Output-textarea">
        <AutoHideBadge color="warning">readonly</AutoHideBadge>
        <CodeMirror bind:value={text_value} readonly placeholder="NO MODELS" lineWrapping="{true}" />
        <pre class="d-test">{text_value}</pre>
    </div>
</Operation>
