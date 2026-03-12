<script context="module">
	import { Option, Recipe } from '$lib/recipe';
	import { Base64 } from 'js-base64';
	import { Utils } from '$lib/utils.js';

	const operation = '@DTDL/Query';
	export const default_extra_options = {
		predicate: Option("__base64__", "Predicate containing the natural language query (a Base64-encoded string)", "predicate_name"),
		predicate_config: Option("__llms_config__", "Predicate containing the LLMs configuration (a Base64-encoded string)", "predicate_name"),
		echo: Option(false, "Whether to keep the query atoms in the output", "boolean")
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
	import QueryView from './+Query.svelte';

	export let id;
	export let options;
	export let index;
	export let add_to_recipe;
	export let keybinding;

	let inputData = [];

	onMount(() => {
		listeners.set(id, (input) => {
			inputData = input;
			debugger;
		});
	});

	onDestroy(() => {
		listeners.set(id, null);
	});
</script>

<Operation {id} {operation} {options} {index} {default_extra_options} {add_to_recipe} {keybinding}>
	<div slot="output">
		{#key inputData}
			<QueryView {id} {inputData} {options} {index} />
		{/key}
	</div>
</Operation>
