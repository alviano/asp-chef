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

			// console.log('json originale', jsonOriginale);
			// console.log('json stringa', jsonStringa);

			//return await Recipe.process_input(expanded, false);

			let outputParsed = await DTDL.parser(jsonStringa);
			return await Recipe.process_input(outputParsed, false);
		} catch (error) {
			//Recipe.set_errors_at_index(index, error);
			return [];
		}
	});
</script>

<script>
	import Operation from '$lib/Operation.svelte';
	import { Button, Input, InputGroup, InputGroupText } from '@sveltestrap/sveltestrap';
	import CodeMirror from 'svelte-codemirror-editor';

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

	<div style="height: {options.height}px; overflow-y: auto" data-testid="Encode-content">
		<CodeMirror
			bind:value={options.content}
			placeholder={`One or more lines...`}
			lineWrapping={true}
			on:change={edit}
		/>
		<pre class="d-test">{options.content}</pre>
	</div>

	<div>
		<Parse
			bind:dataInput={options.content}
			index={0}
			configuration_atom={{
				predicate: 'ciao',
				terms: [
					{
						number: 3,
						str: '3'
					}
				],
				str: 'ciao(3)'
			}}
		></Parse>
	</div>
</Operation>
