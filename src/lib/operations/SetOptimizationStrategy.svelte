<script context="module">
    import {Recipe} from "$lib/recipe";
    import {Utils} from "$lib/utils";

    const operation = "Set Optimization Strategy";
    const default_extra_options = {
        algorithm: 'usc,k',
        disjoint: true,
        succinct: false,
        stratify: true,
        k_parameter: 0,
        shrink_algorithm: 'rgs',
        shrink_limit: 0,
    };

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
    import {Input, InputGroup, InputGroupText} from "sveltestrap";
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
            The <strong>{operation}</strong> operation sets the optimization strategy of clingo.
        </p>
        <p>
            Model-guided and code-guided algorithms are available.
        <p>
            Algorithm <code>k</code> comes with a parameter for setting the size of the cardinality constraints added by the unsatisfiable core analysis.
            Value <code>0</code> means <em>dynamic</em>.
        </p>
        <p>
            The number of conflicts in the shrinking can be limited (value <code>0</code> for no limit).
        </p>
        <p>
            Additional options:
        </p>
        <ul>
            {#each Object.keys(usc_options) as key}
                <li><code>{key}:</code> {usc_options[key]}</li>
            {/each}
        </ul>
    </div>
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
