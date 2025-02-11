<script>
    import {TabulatorFull as Tabulator} from 'tabulator-tables';
    import {onMount} from 'svelte';
    import {Utils} from "$lib/utils.js";
    import {Base64} from "js-base64";
    import {DateTime} from "luxon";

    export let part;
    export let index;
    export let configuration_atom;


    let table;

    let configuration = {
    };

    onMount(async () => {
        let atom = configuration_atom;
        if (atom.terms.length !== 1) {
            Utils.snackbar(`Unexpected predicate ${atom.predicate}/${atom.terms.length} in #${index}. Tabulator`);
            return;
        }
        atom = atom.terms[0];
        if (atom.string === undefined) {
            Utils.snackbar(`Unexpected non-string argument in #${index}. Tabulator`);
            return;
        }

        try {
            const content = Base64.decode(atom.string);
            const expanded_content = await Utils.markdown_expand_mustache_queries(part, content, index);
            configuration = {
                ...configuration,
                ...Utils.parse_relaxed_json(expanded_content),
            };
            const tab = new Tabulator(table, configuration);
        } catch (err) {
            Utils.snackbar(`#${index}. Tabulator: ${err}`);
        }
    });
</script>

<div bind:this={table}></div>

<style global>
  @import "https://unpkg.com/tabulator-tables@6.3.0/dist/css/tabulator.min.css";
</style>