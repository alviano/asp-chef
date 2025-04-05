<script>
    import {Utils} from "$lib/utils";
    import {Base64} from "js-base64";
    import {onMount} from "svelte";
    import { DTDL } from "./dtdl";


    export let dataInput;
    export let index;
    export let configuration_atom;

    let outputParsed;

    onMount(async () => {

        try {
            outputParsed = await DTDL.parser(dataInput)
            
        } catch (err) {
            Utils.snackbar(`#${index + 1}. ApexCharts: ${err}`);
        }
    });
</script>

<div class="res" bind:this={outputParsed}>
    { outputParsed}
</div>

<style>
    div.chart {
        margin: 5px;
    }
</style>
