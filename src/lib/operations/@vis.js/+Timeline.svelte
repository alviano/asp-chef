<script>
    import { Timeline } from 'vis-timeline/standalone';
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
            Utils.snackbar(`Unexpected predicate ${atom.predicate}/${atom.terms.length} in #${index + 1}. @vis.js/Timeline`);
            return;
        }
        atom = atom.terms[0];
        if (atom.string === undefined) {
            Utils.snackbar(`Unexpected non-string argument in #${index + 1}. @vis.js/Timeline`);
            return;
        }

        try {
            const content = Base64.decode(atom.string);
            const expanded_content = await Utils.expand_mustache_queries(part, content, index, multistage);
            const configuration = Utils.parse_relaxed_json(expanded_content);
            const timeline = new Timeline(chart, configuration.items, configuration.options || {});
            if (configuration.groups) {
                timeline.setGroups(configuration.groups);
            }
        } catch (err) {
            Utils.snackbar(`#${index + 1}. @vis.js/Timeline: ${err}`);
        }
    });
</script>

<div bind:this={chart}>
</div>
