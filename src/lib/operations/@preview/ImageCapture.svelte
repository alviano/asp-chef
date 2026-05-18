<script context="module">
    import {Option, Recipe} from "$lib/recipe";
    import {Utils} from "$lib/utils";

    const operation = "@preview/Image Capture";
    export const default_extra_options = {
        crop_left: Option(null, "Number of pixels to crop from the left", "integer"),
        crop_right: Option(null, "Number of pixels to crop from the right", "integer"),
        crop_top: Option(null, "Number of pixels to crop from the top", "integer"),
        crop_bottom: Option(null, "Number of pixels to crop from the bottom", "integer"),
        output_predicate: Option('__png__', "Predicate to store the image", "predicate_name"),
        auto_output: Option(0, "Delay (ms) to automatically store the image when the recipe is executed (0 to disable)", "integer"),
    };

    const listeners = new Map();

    Recipe.register_operation_type(operation, async (input, options, index, id) => {
        let output_png = null;
        try {
            output_png = await listeners.get(id)(input, options);
        } catch (error) { /* component not mounted, possibly because of headless mode */ }
        if (options.output_predicate && output_png) {
            return input.map(model => [...model, Utils.parse_atom(`${options.output_predicate}("${output_png}")`)]);
        }
        return input;
    });
</script>

<script>
    import {Button, ButtonGroup, Input, InputGroup, InputGroupText} from "@sveltestrap/sveltestrap";
    import Operation from "$lib/Operation.svelte";
    import {onDestroy, onMount, tick} from "svelte";
    import html2canvas from "html2canvas";

    export let id;
    export let options;
    export let index;
    export let add_to_recipe;
    export let keybinding;

    let self;
    let output_png = null;

    function edit() {
        Recipe.edit_operation(id, index, options);
    }

    async function store_image(notify_edit) {
        if (!self) return;

        const xpath = "preceding::*[@slot='output'][1]";
        const output_div = document.evaluate(
            xpath,
            self,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
        ).singleNodeValue;

        if (!(output_div instanceof HTMLElement)) return;
        const canvas = await html2canvas(output_div);

        const crop_left = options.crop_left || 0;
        const crop_right = options.crop_right || 0;
        const crop_top = options.crop_top || 0;
        const crop_bottom = options.crop_bottom || 0;
        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = canvas.width - crop_left - crop_right;
        cropCanvas.height = canvas.height - crop_top - crop_bottom;
        const ctx = cropCanvas.getContext('2d');
        ctx.drawImage(
            canvas,
            crop_left, crop_top, cropCanvas.width, cropCanvas.height,
            0, 0, cropCanvas.width, cropCanvas.height
        );

        output_png = cropCanvas.toDataURL('image/png').substring("data:image/png;base64,".length);

        if (notify_edit) {
            edit();
        }
    }

    function clear_image() {
        output_png = null;
        edit();
    }

    onMount(() => {
        listeners.set(id, async (input, options) => {
            if (options.auto_output) {
                await Utils.delay(options.auto_output);
                await tick();
                await store_image(false);
            }
            return output_png;
        });
    });

    onDestroy(() => {
        listeners.delete(id);
    });
</script>

<div bind:this={self}>
    <Operation {id} {operation} {options} {index} {default_extra_options} {add_to_recipe} {keybinding}>
        <InputGroup>
            <InputGroupText>Crop</InputGroupText>
            <Input type="number" placeholder="left" bind:value={options.crop_left} min="0" max="1000" on:change={edit} />
            <Input type="number" placeholder="right" bind:value={options.crop_right} min="0" max="1000" on:change={edit} />
            <Input type="number" placeholder="top" bind:value={options.crop_top} min="0" max="1000" on:change={edit} />
            <Input type="number" placeholder="bottom" bind:value={options.crop_bottom} min="0" max="1000" on:change={edit} />
        </InputGroup>
        <InputGroup>
            <InputGroupText>Output Predicate</InputGroupText>
            <Input type="text" placeholder="predicate" bind:value={options.output_predicate} on:change={edit} />
            <InputGroupText>Auto capture delay (ms)</InputGroupText>
            <Input type="number" placeholder="ms" bind:value={options.auto_output} min="0" max="10000" on:change={edit} />
        </InputGroup>
        <div slot="output">
            <ButtonGroup class="w-100">
                <Button size="sm" color="primary" on:click={() => store_image(true)}>Store Image</Button>
                <Button size="sm" color="secondary" outline disabled={options.auto_output !== 0 || !output_png} on:click={clear_image}>Clear Image</Button>
            </ButtonGroup>
        </div>
    </Operation>
</div>