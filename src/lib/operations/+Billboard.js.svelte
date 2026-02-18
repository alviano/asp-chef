<script>
    //import "c3/c3.css";
    //import {generate} from 'c3';
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
            Utils.snackbar(`Unexpected predicate ${atom.predicate}/${atom.terms.length} in #${index + 1}. Billboard.js`);
            return;
        }
        atom = atom.terms[0];
        if (atom.string === undefined) {
            Utils.snackbar(`Unexpected non-string argument in #${index + 1}. Billboard.js`);
            return;
        }

        try {
            const content = Base64.decode(atom.string);
            const expanded_content = await Utils.expand_mustache_queries(part, content, index, multistage);
            const configuration = Utils.parse_relaxed_json(expanded_content);
            /*generate({
                ...configuration,
                bindto: chart,
            });*/
        } catch (err) {
            Utils.snackbar(`#${index + 1}. Billboard.js: ${err}`);
        }
    });
</script>

<div bind:this={chart}></div>
