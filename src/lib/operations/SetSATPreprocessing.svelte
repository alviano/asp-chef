<script context="module">
    import {Recipe} from "$lib/recipe";
    import {Utils} from "$lib/utils";

    const operation = "Set SAT Preprocessing";
    const default_extra_options = {
        value: '2',
    };

    const values = {
        "1" : "Variable elimination with subsumption (VE)",
        "2" : "VE with limited blocked clause elimination (BCE)",
        "3" : "Full BCE followed by VE",
        "no": "Disable"
    };

    Recipe.register_operation_type(operation, async (input, options) => {
        Utils.change_clingo_option('--sat-prepro=', options.value);
        return input;
    });
    Recipe.new_uncachable_operation_type(operation);
</script>

<script>
    import {Input} from "@sveltestrap/sveltestrap";
    import Operation from "$lib/Operation.svelte";

    export let id;
    export let options;
    export let index;
    export let add_to_recipe;
    export let keybinding;

    function edit() {
        Recipe.edit_operation(id, index, options);
    }
</script>

<Operation {id} {operation} {options} {index} {default_extra_options} {add_to_recipe} {keybinding}>
    <div class="m-3">
        <Input type="select" bind:value={options.value} on:change={edit}>
            {#each Object.keys(values) as key}
                <option value="{key}">{key}: {values[key]}</option>
            {/each}
        </Input>
    </div>
</Operation>
