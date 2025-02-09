<script>
    import { Network } from 'vis-network/standalone';
    import {Utils} from "$lib/utils";
    import {Base64} from "js-base64";

    export let part;
    export let index;
    export let configuration_atoms;
    export let height;

    let chart;

    let configuration = {};

    configuration_atoms.forEach(async (atom) => {
        if (atom.terms.length !== 1) {
            Utils.snackbar(`Unexpected predicate ${atom.predicate}/${atom.terms.length} in #${index}. @vis.js/Network`);
            return;
        }
        atom = atom.terms[0];
        if (atom.string === undefined) {
            Utils.snackbar(`Unexpected non-string argument in #${index}. @vis.js/Network`);
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
            Utils.snackbar(`#${index}. @vis.js/Network: ${err}`);
        }
        new Network(chart, configuration.data, configuration.options);
    });
</script>

<div bind:this={chart} style="height: {height}px;">
</div>
