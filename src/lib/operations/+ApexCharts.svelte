<script>
    import ApexCharts from 'apexcharts';
    import {Utils} from "$lib/utils";
    import {Base64} from "js-base64";
    import {onMount} from "svelte";

    export let part;
    export let index;
    export let configuration_atom;
    export let multistage;

    let chart;

    onMount(async () => {
        let atom = configuration_atom;
        if (atom.terms.length !== 1) {
            Utils.snackbar(`Unexpected predicate ${atom.predicate}/${atom.terms.length} in #${index + 1}. ApexCharts`);
            return;
        }
        atom = atom.terms[0];
        if (atom.string === undefined) {
            Utils.snackbar(`Unexpected non-string argument in #${index + 1}. ApexCharts`);
            return;
        }

        try {
            const content = Base64.decode(atom.string);
            const expanded_content = await Utils.expand_mustache_queries(part, content, index, multistage);
            const configuration = Utils.parse_relaxed_json(expanded_content);
            await (new ApexCharts(chart, configuration)).render();
        } catch (err) {
            Utils.snackbar(`#${index + 1}. ApexCharts: ${err}`);
        }
    });
</script>

<div class="chart" bind:this={chart}>
</div>

<style>
    div.chart {
        margin: 5px;
    }
</style>
