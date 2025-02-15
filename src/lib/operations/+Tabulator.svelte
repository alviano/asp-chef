<script>
    import {TabulatorFull as Tabulator} from 'tabulator-tables';
    import {onMount} from 'svelte';
    import {Utils} from "$lib/utils.js";
    import {Base64} from "js-base64";
    import {DateTime} from "luxon";
    import {Button} from "@sveltestrap/sveltestrap";
    import XLSX from "xlsx";
    import jsPDF from "jspdf";
    import {applyPlugin} from "jspdf-autotable";

    export let part;
    export let index;
    export let configuration_atom;

    let table;
    let tabulator;
    let download;

    onMount(async () => {
        let atom = configuration_atom;
        if (atom.terms.length !== 1) {
            Utils.snackbar(`Unexpected predicate ${atom.predicate}/${atom.terms.length} in #${index}. Tabulator`);
            return;
        }
        atom = atom.terms[0];
        if (atom.string === undefined) {
            Utils.snackbar(`Unexpected non-string argument in #${index}. Tabulator`);
            return;
        }

        try {
            const content = Base64.decode(atom.string);
            const expanded_content = await Utils.markdown_expand_mustache_queries(part, content, index);
            const configuration = Utils.parse_relaxed_json(expanded_content);
            applyPlugin(jsPDF);
            configuration.dependencies = {
                ...(configuration.dependencies || {}),
                XLSX: XLSX,
                jspdf: jsPDF,
                DateTime: DateTime,
            }
            if (configuration.download) {
                download = Array.isArray(configuration.download) ? configuration.download : [configuration.download];
                configuration.download = undefined;
            }
            tabulator = new Tabulator(table, configuration);
        } catch (err) {
            Utils.snackbar(`#${index}. Tabulator: ${err}`);
        }
    });
</script>

{#if download}
    <div class="mb-1">
        {#each download as download_config}
            <Button class="me-1" color="{download_config.color || 'secondary'}"
                on:click={() => tabulator.download(download_config.format || "csv", download_config.filename || `data.${download_config.format || "csv"}`, download_config.options || {})}>
                {download_config.label || `Download ${download_config.format}`}
            </Button>
        {/each}
    </div>
{/if}

<div bind:this={table}></div>

<style global>
  @import "https://unpkg.com/tabulator-tables@6.3.0/dist/css/tabulator.min.css";
</style>