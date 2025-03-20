<script context="module">
    import { Graph3d } from 'vis-graph3d/standalone';

    function mouse_up(event) {
        this.frame.style.cursor = "auto";
        this.leftButtonDown = false;
        document.removeEventListener("mousemove", this.onmousemove);
        document.removeEventListener("mouseup", this.onmousemove);
        if (event) {
            event.preventDefault();
        }
    }

    Graph3d.prototype._onMouseUp = mouse_up;
</script>

<script>
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
            Utils.snackbar(`Unexpected predicate ${atom.predicate}/${atom.terms.length} in #${index + 1}. @vis.js/Graph3d`);
            return;
        }
        atom = atom.terms[0];
        if (atom.string === undefined) {
            Utils.snackbar(`Unexpected non-string argument in #${index + 1}. @vis.js/Graph3d`);
            return;
        }

        try {
            const content = Base64.decode(atom.string);
            const expanded_content = await Utils.expand_mustache_queries(part, content, index, multistage);
            const configuration = Utils.parse_relaxed_json(expanded_content);
            new Graph3d(chart, configuration.data || [], configuration.options || {});
        } catch (err) {
            Utils.snackbar(`#${index + 1}. @vis.js/Graph3d: ${err}`);
        }
    });
</script>

<div bind:this={chart}>
</div>
