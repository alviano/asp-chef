<script>
    import {Chart} from 'chart.js/auto';
    import {Utils} from "$lib/utils";
    import {Base64} from "js-base64";

    export let part;
    export let index;
    export let configuration_atoms;

    let chart;

    let configuration = {};

    configuration_atoms.forEach(async (atom) => {
        if (atom.terms.length !== 1) {
            Utils.snackbar(`Unexpected predicate ${atom.predicate}/${atom.terms.length} in #${index}. ChartJS`);
            return;
        }
        atom = atom.terms[0];
        if (atom.string === undefined) {
            Utils.snackbar(`Unexpected non-string argument in ChartJS`);
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
            Utils.snackbar(`#${index}. ChartJS: ${err}`);
        }
        new Chart(chart, configuration);
    });
</script>

<div>
    <canvas bind:this={chart}></canvas>
</div>
