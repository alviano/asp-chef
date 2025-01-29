<script context="module">
    import {Recipe} from "$lib/recipe";

    const operation = "Markdown";
    const default_extra_options = {
        predicate: '__base64__',
        echo: false,
    };

    const listeners = new Map();

    Recipe.register_operation_type(operation, async (input, options, index, id) => {
        try {
            await listeners.get(id)(input);
        } catch (error) { /* component not mounted, possibly because of headless mode */ }
        return options.echo ? input : input.map(model => model.filter(atom => atom.predicate !== options.predicate));
    });
</script>

<script>
    import {Button, Input, InputGroup, InputGroupText} from "sveltestrap";
    import Operation from "$lib/Operation.svelte";
    import {onDestroy, onMount, tick} from "svelte";
    import {consts} from "$lib/consts";
    import {Base64} from "js-base64";
    import {Utils} from "$lib/utils";
    import renderMathInElement from 'katex/dist/contrib/auto-render.mjs';
    import QrCode from "svelte-qrcode";


    export let id;
    export let options;
    export let index;
    export let add_to_recipe;
    export let keybinding;

    let output = '';
    let output_div;

    function edit() {
        Recipe.edit_operation(id, index, options);
    }

    onMount(() => {
        listeners.set(id, async (input) => {
            if (!output_div) {
                return;
            }
            const the_output = [];
            for (let model of input) {
                const output_part = [];
                for (let atom of model.filter(atom => atom.predicate === options.predicate)) {
                    const md = Base64.decode(atom.terms[0].string);
                    output_part.push(await Utils.markdown_expand_mustache_queries(model, md, index));
                }
                the_output.push(output_part.join('\n'));
            }
            output = the_output.join('\n\n');
            await tick();
            renderMathInElement(output_div,  {
                delimiters: [
                    { left: '\\(', right: '\\)', display: false },
                    { left: '\\[', right: '\\]', display: true },
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
                    new QrCode(
                        {
                            target: element,
                            props: {
                                value: content,
                            },
                        },
                    );
                });
        });
    });

    onDestroy(() => {
        listeners.set(id, null);
    });
</script>

<Operation {id} {operation} {options} {index} {default_extra_options} {add_to_recipe} {keybinding}>
    <InputGroup>
        <InputGroupText>Predicate</InputGroupText>
        <Input type="text" placeholder="predicate" bind:value={options.predicate} on:input={edit} data-testid="Markdown-predicate" />
        <Button outline="{!options.echo}" on:click={() => { options.echo = !options.echo; edit(); }}>Echo</Button>
    </InputGroup>
    <div slot="output" bind:this="{output_div}" class="p-2 output" data-testid="Markdown-output">
        {@html Utils.render_markdown(output)}
    </div>
</Operation>

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