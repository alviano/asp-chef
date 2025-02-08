<script>
    import ApexCharts from 'apexcharts';
    import {Utils} from "$lib/utils";
    import {Base64} from "js-base64";

    export let part;
    export let index;
    export let configuration_atoms;

    let chart;

    let configuration = {};

    configuration_atoms.forEach(async (atom) => {
        if (atom.terms.length !== 1) {
            Utils.snackbar(`Unexpected predicate ${atom.predicate}/${atom.terms.length} in #${index}. ApexCharts`);
            return;
        }
        atom = atom.terms[0];
        if (atom.string === undefined) {
            Utils.snackbar(`Unexpected non-string argument in ApexCharts`);
            return;
        }

        try {
            const content = Base64.decode(atom.string);
            const expanded_content = await Utils.markdown_expand_mustache_queries(part, content, index);
            configuration = {
                ...configuration,
                ...Utils.parse_related_json(expanded_content),
            };
        } catch (err) {
            Utils.snackbar(`#${index}. ApexCharts: ${err}`);
        }
        await (new ApexCharts(chart, configuration)).render();
    });
</script>

<div class="chart" bind:this={chart} />

<style>
    div.chart {
        margin: 5px;
    }
</style>
