<script>
    import TreeSpider from 'treespider';
    import {Utils} from "$lib/utils";
    import {Base64} from "js-base64";
    import {onMount} from "svelte";
    import newUniqueId from 'locally-unique-id-generator';

    export let part;
    export let index;
    export let configuration_atom;
    export let multistage;

    const container_id = newUniqueId();

    onMount(async () => {
        let atom = configuration_atom;
        if (atom.terms.length !== 1) {
            Utils.snackbar(`Unexpected predicate ${atom.predicate}/${atom.terms.length} in #${index + 1}. TreeSpider`);
            return;
        }
        atom = atom.terms[0];
        if (atom.string === undefined) {
            Utils.snackbar(`Unexpected non-string argument in #${index + 1}. TreeSpider`);
            return;
        }

        try {
            const content = Base64.decode(atom.string);
            const expanded_content = await Utils.expand_mustache_queries(part, content, index, multistage);
            const configuration = Utils.parse_relaxed_json(expanded_content);
            new TreeSpider({
                ...configuration,
                targetContainer: `#${container_id}`,
            });
        } catch (err) {
            Utils.snackbar(`#${index + 1}. TreeSpider: ${err}`);
        }
    });
</script>

<svelte:head>
    <link rel="stylesheet" href="https://unpkg.com/treespider@latest/dist/css/treeSpider.css">
</svelte:head>

<div class="chart" id={container_id}>
</div>

<style>
    div.chart {
        margin: 5px;
    }
</style>
