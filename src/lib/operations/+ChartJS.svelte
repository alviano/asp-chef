<script>
    import {Chart} from 'chart.js/auto';
    import {Utils} from "$lib/utils";
    import {Base64} from "js-base64";
    import {onMount} from "svelte";

    export let part;
    export let index;
    export let configuration_atom;

    let chart;

    onMount(async () => {
        let atom = configuration_atom;
        if (atom.terms.length !== 1) {
            Utils.snackbar(`Unexpected predicate ${atom.predicate}/${atom.terms.length} in #${index}. ChartJS`);
            return;
        }
        atom = atom.terms[0];
        if (atom.string === undefined) {
            Utils.snackbar(`Unexpected non-string argument in #${index}. ChartJS`);
            return;
        }

        try {
            const content = Base64.decode(atom.string);
            const expanded_content = await Utils.markdown_expand_mustache_queries(part, content, index);
            const configuration = Utils.parse_relaxed_json(expanded_content);
            new Chart(chart, configuration);
        } catch (err) {
            Utils.snackbar(`#${index}. ChartJS: ${err}`);
        }
    });
</script>

<div>
    <canvas bind:this={chart}></canvas>
</div>
