<script>
    import {Utils} from "$lib/utils";
    import {Recipe} from "$lib/recipe";
    import AspChef from "$lib/AspChef.svelte";
    import {consts} from "$lib/consts";
    import {Base64} from "js-base64";

    async function clingo_to_be_loaded() {
        while (window.clingo === undefined) {
            await Utils.delay(100);
        }
		await window.clingo.init(`${window.location.origin}/dist/clingo.wasm`);
    }

    async function process() {
        if (location.hash.length > 1) {
            let data;
            try {
                const [replacement, recipe] = location.hash.slice(1).split(';');
                const replace = Utils.uncompress(replacement);
                data = Recipe.deserialize(recipe);
                data.input = replace.input;
            } catch (error) {
                data = Recipe.deserialize(location.hash.slice(1));
            }

            const output = await Recipe.process(data.input || '', data.encode_input);
            return !data.decode_output ? Utils.flatten_output(output) : output.map(model =>
                model.map(atom => atom.predicate !== '__base64__' ? atom.str : Base64.decode(atom.terms[0].string)).join('\n'))
                .join(consts.SYMBOLS.MODELS_SEPARATOR);
        }
    }
</script>

<svelte:head>
    <script src="https://cdn.jsdelivr.net/npm/clingo-wasm@0.1.1"></script>
</svelte:head>

{#await clingo_to_be_loaded().then(process)}
    Processing...
{:then output}
    <pre data-testid="Headless-output">{output}</pre>
{/await}

<!-- keep <AspChef> just to load operations -->
{#if false}
    <AspChef />
{/if}
