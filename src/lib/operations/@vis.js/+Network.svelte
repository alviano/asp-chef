<script>
    import { Network } from 'vis-network/standalone';
    import {Utils} from "$lib/utils";
    import {Base64} from "js-base64";
    import {onMount} from "svelte";

    export let part;
    export let index;
    export let configuration_atom;
    export let height;

    let chart;

    onMount(async () => {
        let atom = configuration_atom;
        if (atom.terms.length !== 1) {
            Utils.snackbar(`Unexpected predicate ${atom.predicate}/${atom.terms.length} in #${index + 1}. @vis.js/Network`);
            return;
        }
        atom = atom.terms[0];
        if (atom.string === undefined) {
            Utils.snackbar(`Unexpected non-string argument in #${index + 1}. @vis.js/Network`);
            return;
        }

        try {
            const content = Base64.decode(atom.string);
            const expanded_content = await Utils.markdown_expand_mustache_queries(part, content, index);
            const configuration = Utils.parse_relaxed_json(expanded_content);
            new Network(chart, configuration.data, configuration.options || {});
        } catch (err) {
            Utils.snackbar(`#${index + 1}. @vis.js/Network: ${err}`);
        }
    });
</script>

<div bind:this={chart} style="height: {height}px;">
</div>
