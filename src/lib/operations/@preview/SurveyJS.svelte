<script context="module">
    import {Recipe} from "$lib/recipe";
    import {Utils} from "$lib/utils";
    import {Base64} from "js-base64";

    const operation = "@preview/SurveyJS";
    const default_extra_options = {
        predicate: "__survey__",
        IO_predicate: "__base64__",
        multistage: false,
        echo: false,
        show_model_index: false,
        data: null,
    };

    const listeners = new Map();

    Recipe.register_operation_type(operation, async (input, options, index, id) => {
        try {
            listeners.get(id)(input);
        } catch (error) { /* component not mounted, possibly because of headless mode */ }
        const result = options.echo ? input : input.map(part => part.filter(atom => atom.predicate !== options.predicate));
        return options.data ? result.map(part => [...part, Utils.parse_atom(`${options.IO_predicate}("${Base64.encode(JSON.stringify(options.data))}")`)]) : result;
    });
</script>

<script>
    import {Button, Input, InputGroup, InputGroupText} from "@sveltestrap/sveltestrap";
    import Operation from "$lib/Operation.svelte";
    import {onDestroy, onMount} from "svelte";
    import SurveyJS from "./+SurveyJS.svelte";

    export let id;
    export let options;
    export let index;
    export let add_to_recipe;
    export let keybinding;

    let models = [];

    function edit() {
        Recipe.edit_operation(id, index, options);
    }

    onMount(() => {
        listeners.set(id, (input) => {
            models = input;
        });
    });

    onDestroy(() => {
        listeners.delete(id);
    });
</script>

<Operation {id} {operation} {options} {index} {default_extra_options} {add_to_recipe} {keybinding}>
    <InputGroup>
        <InputGroupText>Predicate</InputGroupText>
        <Button outline="{!options.multistage}" on:click={() => { options.multistage = !options.multistage; edit(); }}>Multi-Stage</Button>
        <Input type="text" placeholder="predicate" bind:value={options.predicate} on:input={edit} data-testid="SurveyJS-predicate" />
        <Button outline="{!options.echo}" on:click={() => { options.echo = !options.echo; edit(); }}>Echo</Button>
        <Button outline="{!options.show_model_index}" on:click={() => { options.show_model_index = !options.show_model_index; edit(); }}>Model Index</Button>
    </InputGroup>
    <InputGroup>
        <InputGroupText>I/O Predicate</InputGroupText>
        <Input type="text" placeholder="predicate" bind:value={options.IO_predicate} on:input={edit} data-testid="SurveyJS-IOpredicate" />
    </InputGroup>
    <div slot="output">
        <div class="m-1" style="overflow-y: auto;">
            {#each models as model, model_index}
                {#if options.show_model_index}
                    <h6 class="text-center">Model #{model_index + 1}</h6>
                {/if}
                {#key model}
                    {#each model.filter(atom => atom.predicate === options.predicate) as configuration}
                        <SurveyJS part="{model}" index="{index}" configuration_atom="{configuration}" multistage="{options.multistage}" data="{options.data}"
                                  on_data_change="{(d) => { options.data = d; edit(); } }"  />
                    {/each}
                {/key}
            {/each}
        </div>
    </div>
</Operation>
