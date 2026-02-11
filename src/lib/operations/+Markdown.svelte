<script>
    import {Button, Input, InputGroup, InputGroupText} from "@sveltestrap/sveltestrap";
    import Operation from "$lib/Operation.svelte";
    import {onDestroy, onMount, tick} from "svelte";
    import {consts} from "$lib/consts";
    import {Base64} from "js-base64";
    import {Utils} from "$lib/utils";
    import renderMathInElement from 'katex/dist/contrib/auto-render.mjs';
    import QrCode from "svelte-qrcode";
    import { mount } from 'svelte';

    export let part;
    export let index;
    export let configuration_atom;
    export let multistage;

    let output_div;

    onMount(async () => {
        if (!output_div) {
            return;
        }
        let atom = configuration_atom;
        if (atom.terms.length !== 1) {
            Utils.snackbar(`Unexpected predicate ${atom.predicate}/${atom.terms.length} in #${index + 1}. Markdown`);
            return;
        }

        atom = atom.terms[0];
        if (atom.string === undefined) {
            Utils.snackbar(`Unexpected non-string argument in #${index + 1}. Markdown`);
            return;
        }

        try {
            const content = Base64.decode(atom.string);
            const expanded_content = await Utils.expand_mustache_queries(part, content, index, multistage);
            output_div.innerHTML = Utils.render_markdown(expanded_content);  // render_markdown sanifies the content
        } catch (err) {
            Utils.snackbar(`#${index + 1}. Markdown: ${err}`);
        }
        await tick();
        renderMathInElement(output_div, {
            delimiters: [
                {left: '\\(', right: '\\)', display: false},
                {left: '\\[', right: '\\]', display: true},
            ],
        });
        Array.from(output_div.getElementsByTagName('pre')).forEach(Utils.add_copy_button);
        Array.from(output_div.getElementsByTagName('a'))
            .filter(element => element.href === `${consts.DOMAIN}/qrcode`)
            .forEach(element => {
                const content = element.text;
                element.innerHTML = "";
                element.removeAttribute("href");
                element.removeAttribute("target");
                mount(QrCode, {
                    target: element,
                    props: {
                        value: content,
                    },
                });
            });
    });
</script>

<div bind:this={output_div} class="p-2 output">
</div>

<style>
    .output :global(td), .output :global(th) {
        border: 1px solid #ddd;
        padding: 8px;
    }

    .output :global(tr:nth-child(even)) {
        background-color: #f2f2f2;
    }

    .output :global(tr:hover) {
        background-color: #ddd;
    }

    .output :global(th) {
        padding-top: 12px;
        padding-bottom: 12px;
        text-align: left;
        background-color: #777;
        color: white;
    }
</style>