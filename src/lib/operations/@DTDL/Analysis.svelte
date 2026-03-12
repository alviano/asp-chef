<script context="module">
    import { Option, Recipe } from '$lib/recipe';
    import { Base64 } from 'js-base64';
    import { Utils } from '$lib/utils.js';

    const operation = '@DTDL/Analysis';
    export const default_extra_options = {
        predicate: Option('__base64__', 'Predicate to wrap the analysis results in (Base64)', 'predicate_name'),
        prefix: Option('', 'Prefix for analysis labels', 'string')
    };
    const listeners = new Map();

    Recipe.register_operation_type(operation, async (input, options, index, id) => {
        try {
            await listeners.get(id)(input);
        } catch (error) {
            /* component not mounted, possibly because of headless mode */
        }
        return options.echo
            ? input
            : input.map((model) => model.filter((atom) => atom.predicate !== options.predicate));
    });
</script>

<script>
	import Operation from '$lib/Operation.svelte';
	import { onMount, onDestroy } from 'svelte';
	import AnalysisView from './+Analysis.svelte';

    export let id;
    export let options;
    export let index;
    export let add_to_recipe;
    export let keybinding;

	let inputData = [];

	onMount(() => {
		listeners.set(id, (input) => {
			inputData = input;
		});
	});

    onDestroy(() => {
        listeners.set(id, null);
    });
</script>

<Operation {id} {operation} {options} {index} {default_extra_options} {add_to_recipe} {keybinding}>
	<div slot="output">
		{#key inputData}
			<AnalysisView {id} {inputData} {options} {index} />
		{/key}
	</div>
</Operation>
