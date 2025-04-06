<script>
	import { Utils } from '$lib/utils';
	import { Base64 } from 'js-base64';
	import { onMount } from 'svelte';
	import { DTDL } from './dtdl';

	export let dataInput;
	export let index;
	export let configuration_atom;

	let outputParsed;
	let outputElement;

	onMount(async () => {
		try {
			outputParsed = await DTDL.parser(dataInput);
		} catch (err) {
			Utils.snackbar(`#${index + 1}. DTDLParse: ${err}`);
		}
	});

	$: if (dataInput) {
		(async () => {
			try {
				outputParsed = await DTDL.parser(dataInput);
			} catch (err) {
				Utils.snackbar(`#${index + 1}. DTDLParse: ${err}`);
			}
		})();
	}
</script>

<div class="res" bind:this={outputElement}>
	{outputParsed}
</div>

<style>
	div.chart {
		margin: 5px;
	}
</style>
