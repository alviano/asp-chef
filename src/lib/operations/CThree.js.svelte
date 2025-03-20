<script context="module">
    import {Recipe} from "$lib/recipe";

    const operation = "C Three.js";
    const default_extra_options = {
        predicate: "__chart__",
        multistage: false,
        echo: false,
        show_model_index: false,
    };

    const listeners = new Map();

    Recipe.register_operation_type(operation, async (input, options, index, id) => {
        try {
            listeners.get(id)(input);
        } catch (error) { /* component not mounted, possibly because of headless mode */ }
        return options.echo ? input : input.map(part => part.filter(atom => atom.predicate !== options.predicate));
    });
</script>

<script>
    import {Button, Input, InputGroup, InputGroupText} from "@sveltestrap/sveltestrap";
    import Operation from "$lib/Operation.svelte";
    import {onDestroy, onMount} from "svelte";
    import C3JS from "./+CThree.js.svelte";

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
        <Input type="text" placeholder="predicate" bind:value={options.predicate} on:input={edit} data-testid="ChartJS-predicate" />
        <Button outline="{!options.multistage}" on:click={() => { options.multistage = !options.multistage; edit(); }}>Multi-Stage</Button>
        <Button outline="{!options.echo}" on:click={() => { options.echo = !options.echo; edit(); }}>Echo</Button>
        <Button outline="{!options.show_model_index}" on:click={() => { options.show_model_index = !options.show_model_index; edit(); }}>Model Index</Button>
    </InputGroup>
    <div slot="output">
        <div class="m-1" style="overflow-y: auto;">
            {#each models as model, model_index}
                {#if options.show_model_index}
                    <h6 class="text-center">Model #{model_index + 1}</h6>
                {/if}
                {#key model}
                    {#each model.filter(atom => atom.predicate === options.predicate) as configuration}
                        <C3JS part="{model}" index="{index}" configuration_atom="{configuration}" multistage="{options.multistage}" />
                    {/each}
                {/key}
            {/each}
        </div>
    </div>
</Operation>
