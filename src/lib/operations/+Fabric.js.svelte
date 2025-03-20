<script>
    import {Canvas} from 'fabric';
    import {Utils} from "$lib/utils";
    import {Base64} from "js-base64";
    import {onMount} from "svelte";

    export let part;
    export let index;
    export let configuration_atom;
    export let multistage;

    let canvas;
    let chart;
    let height = 400;
    let style = '';

    onMount(async () => {
        let atom = configuration_atom;
        if (atom.terms.length !== 1) {
            Utils.snackbar(`Unexpected predicate ${atom.predicate}/${atom.terms.length} in #${index + 1}. Fabric.js`);
            return;
        }
        atom = atom.terms[0];
        if (atom.string === undefined) {
            Utils.snackbar(`Unexpected non-string argument in #${index + 1}. Fabric.js`);
            return;
        }

        try {
            const content = Base64.decode(atom.string);
            const expanded_content = await Utils.expand_mustache_queries(part, content, index, multistage);
            const configuration = Utils.parse_relaxed_json(expanded_content);
            canvas = new Canvas(chart);
            await canvas.loadFromJSON({ objects: configuration.objects });
            if (configuration.dimensions !== undefined) {
                canvas.setDimensions(configuration.dimensions);
            }
            if (configuration.height !== undefined) {
                height = configuration.height;
            }
            if (configuration.style !== undefined) {
                style = configuration.style;
            }
            if (configuration.debug === true) {
                console.log(canvas.toJSON());
            }
            canvas.renderAll();
        } catch (err) {
            Utils.snackbar(`#${index + 1}. Fabric.js: ${err}`);
        }
    });
</script>

<div style="height: {height}px;">
    <canvas bind:this={chart} style="{style}"></canvas>
</div>

