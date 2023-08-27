<script context="module">
    import {Recipe} from "$lib/recipe";
    import {Utils} from "$lib/utils";

    const operation = "Set Transformation of Extended Rules";
    const default_extra_options = {
        value: 'all',
    };

    const values = {
        "all" : "Transform all extended rules to basic rules",
        "choice" : "Transform choice rules, but keep cardinality and weight rules",
        "card" : "Transform cardinality rules, but keep choice and weight rules",
        "weight" : "Transform cardinality and weight rules, but keep choice rules",
        "scc" : "Transform \"recursive\" cardinality and weight rules",
        "integ" : "Transform cardinality integrity constraints",
        "dynamic" : "Transform \"simple\" extended rules, but keep more complex ones",
        "no": "Disable"
    };

    Recipe.register_operation_type(operation, async (input, options) => {
        Utils.change_clingo_option('--trans-ext=', options.value);
        return input;
    });
    Recipe.new_uncachable_operation_type(operation);
</script>

<script>
    import {Input} from "sveltestrap";
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
    <div slot="description">
        <p>
            The <strong>{operation}</strong> operation configure handling of extended rules in clingo.
        </p>
        <p>
            Default value is 2. Possible values:
        </p>
        <ul>
            {#each Object.keys(values) as key}
                <li><code>{key}:</code> {values[key]}</li>
            {/each}
        </ul>
    </div>
    <div class="m-3">
        <Input type="select" bind:value={options.value} on:change={edit}>
            {#each Object.keys(values) as key}
                <option value="{key}">{key}: {values[key]}</option>
            {/each}
        </Input>
    </div>
</Operation>
