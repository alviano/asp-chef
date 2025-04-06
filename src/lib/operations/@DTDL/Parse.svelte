<script context="module">
	import { Recipe } from '$lib/recipe';
	import { Base64 } from 'js-base64';
	import { consts } from '$lib/consts';

	const operation = '@DTDL/Parse';
	const default_extra_options = {
		predicate: '__dtdl__',
		echo_input: false,
		height: 200,
		content: ''
	};

	Recipe.register_operation_type(operation, async (input, options, index) => {
		try {
			let jsonOriginale = JSON.parse(options.content);
			let jsonStringa = JSON.stringify(jsonOriginale);
			let outputParsed = await DTDL.parser(jsonStringa);
			return await Recipe.process_input(outputParsed, false);
		} catch (error) {
			Recipe.set_errors_at_index(index, error);
			return [];
		}
	});
</script>

<script lang="ts">
	import Operation from '$lib/Operation.svelte';
	import { Button, Input, InputGroup, InputGroupText } from '@sveltestrap/sveltestrap';
	import CodeMirror from 'svelte-codemirror-editor';
	import { json } from '@codemirror/lang-json';
	import { oneDark } from '@codemirror/theme-one-dark';
	import Parse from './+Parse.svelte';
	import { DTDL } from './dtdl';

	export let id;
	export let options;
	export let index;
	export let add_to_recipe;
	export let keybinding;

	let example = DTDL.load_example();
	function edit() {
		Recipe.edit_operation(id, index, options);
	}

	function loadExample() {
		options.content = JSON.stringify(example);
	}
</script>

<Operation {id} {operation} {options} {index} {default_extra_options} {add_to_recipe} {keybinding}>
	<InputGroup>
		<InputGroupText>Height</InputGroupText>
		<Input
			type="number"
			bind:value={options.height}
			min="20"
			step="20"
			style="max-width: 5em;"
			on:input={edit}
		/>
		<InputGroupText>Predicate</InputGroupText>
		<Input
			type="text"
			bind:value={options.predicate}
			placeholder="predicate"
			on:input={edit}
			data-testid="DTDLParse-predicate"
		/>
		<Button
			outline={!options.echo}
			on:click={() => {
				loadExample();
				edit();
			}}>Load Example</Button
		>
	</InputGroup>

	<div
		style="height: {options.height}px; overflow-y: auto; "
		data-testid="dtdl-content"
		class="my-codemirror-wrapper"
	>
		<CodeMirror
			bind:value={options.content}
			placeholder={`One or more lines...`}
			lineWrapping={true}
			on:change={edit}
			theme={oneDark}
			lang={json()}
			extensions={[json()]}
		/>
	</div>

	<div>
		<Parse
			bind:dataInput={options.content}
			index={0}
			options={{
				predicate: options.predicate,
				echo_input: options.echo_input,
				height: options.height
			}}
		></Parse>
	</div>
</Operation>

<style>
	.my-codemirror-wrapper div {
		height: 100% !important;
	}
</style>
