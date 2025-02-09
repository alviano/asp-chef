<script context="module">
    import {Recipe} from "$lib/recipe";
    import {Utils} from "$lib/utils";

    const operation = "Set HTTP Cache Policy";
    const default_extra_options = {
        value: 'default',
    };

    const values = Utils.browser_cache_policy_values;

    Recipe.register_operation_type(operation, async (input, options) => {
        Utils.browser_cache_policy = options.value;
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
