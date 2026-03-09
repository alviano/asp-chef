<script context="module">
    import {Option, Recipe} from "$lib/recipe";
    import {Utils} from "$lib/utils";


    const algorithms = {
        "bb,lin" : "Model-guided optimization with Basic lexicographical descent",
        "bb,hier" : "Model-guided optimization with Hierarchical (highest priority criteria first) descent",
        "bb,inc" : "Model-guided optimization with Hierarchical descent with exponentially increasing steps",
        "bb,dec" : "Model-guided optimization with Hierarchical descent with exponentially decreasing steps",
        "usc,oll" : "Core-guided optimization with Relaxation algorithm Use strategy from unclasp",
        "usc,one" : "Core-guided optimization with Relaxation algorithm Add one cardinality constraint per core",
        "usc,k" : "Core-guided optimization with Relaxation algorithm Add cardinality constraints of bounded size",
        "usc,pmres" : "Core-guided optimization with Relaxation algorithm Add clauses of size 3",
    };

    const usc_options = {
        "disjoint" : "Disjoint-core preprocessing",
        "succinct" : "No redundant (symmetry) constraints",
        "stratify" : "Stratification heuristic for handling weights",
    };

    const shrink_algorithms = {
        "lin" : "Forward linear search unsat",
        "inv" : "Inverse linear search not unsat",
        "bin" : "Binary search",
        "rgs" : "Repeated geometric sequence until unsat",
        "exp" : "Exponential search until unsat",
        "min" : "Linear search for subset minimal core",
    };

    const operation = "Set Optimization Strategy";
    export const default_extra_options = {
        algorithm: Option('usc,k', "The optimization algorithm to use", Object.keys(algorithms).join('|')),
        disjoint: Option(true, "Enable disjoint-core preprocessing", "boolean"),
        succinct: Option(false, "Avoid redundant (symmetry) constraints", "boolean"),
        stratify: Option(true, "Use stratification heuristic for handling weights", "boolean"),
        k_parameter: Option(0, "The k parameter for the usc,k algorithm", "number"),
        shrink_algorithm: Option('rgs', "The algorithm to use for core shrinking", Object.keys(shrink_algorithms).join('|')),
        shrink_limit: Option(0, "The maximum number of conflicts for core shrinking", "number"),
    };

    Recipe.register_operation_type(operation, async (input, options) => {
        let value = options.algorithm;
        if (value === 'usc,k') {
            value += ',' + options.k_parameter;
        }
        if (value.startsWith('usc,')) {
            value += ',' + ((options.disjoint ? 1 : 0) | (options.succinct ? 2 : 0) | (options.stratify ? 4 : 0));
            Utils.change_clingo_option('--opt-usc-shrink=', options.shrink_algorithm + ',' + options.shrink_limit);
        }
        Utils.change_clingo_option('--opt-strategy=', value);
        return input;
    });
    Recipe.new_uncachable_operation_type(operation);
</script>

<script>
    import {Input, InputGroup, InputGroupText} from "@sveltestrap/sveltestrap";
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
        <InputGroup>
            <InputGroupText style="width: 9em;">Algorithm</InputGroupText>
            <Input type="select" bind:value={options.algorithm} on:change={edit}>
                {#each Object.keys(algorithms) as key}
                    <option value="{key}">{key}: {algorithms[key]}</option>
                {/each}
            </Input>
        </InputGroup>
        {#if options.algorithm.startsWith('usc,')}
            {#if options.algorithm === 'usc,k'}
                <InputGroup>
                    <InputGroupText style="width: 9em;">k size</InputGroupText>
                    <Input type="number" bind:value={options.k_parameter} min="0" />
                </InputGroup>
            {/if}

            <InputGroup>
                <InputGroupText style="width: 9em;">Shrinking</InputGroupText>
                <Input type="select" bind:value={options.shrink_algorithm} on:change={edit}>
                    {#each Object.keys(shrink_algorithms) as key}
                        <option value="{key}">{key}: {shrink_algorithms[key]}</option>
                    {/each}
                </Input>
            </InputGroup>
            <InputGroup>
                <InputGroupText style="width: 9em;">Limit conflicts</InputGroupText>
                <Input type="number" name="limit" bind:value={options.shrink_limit} min="0" />
            </InputGroup>

            <Input class='mt-3' type="switch" label={usc_options['disjoint']} bind:checked={options.disjoint} on:change={edit} />
            <Input type="switch" label={usc_options['succinct']} bind:checked={options.succinct} on:change={edit} />
            <Input type="switch" label={usc_options['stratify']} bind:checked={options.stratify} on:change={edit} />
        {/if}
    </div>
</Operation>
