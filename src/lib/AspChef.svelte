<script>
    import Operations from "$lib/OperationsPanel.svelte";
    import {Col, Progress, Row} from "sveltestrap";
    import {Recipe} from "$lib/recipe";
    import InputPanel from "$lib/InputPanel.svelte";
    import OutputPanel from "$lib/OutputPanel.svelte";
    import {
        input_height,
        io_panel_width,
        operations_panel_width,
        pause_baking,
        processing_index,
        readonly_ingredients,
        recipe,
        show_help,
        show_ingredient_details, show_ingredient_headers
    } from "$lib/stores";
    import RecipePanel from "$lib/RecipePanel.svelte";
    import {onDestroy, onMount} from "svelte";
    import {Utils} from "$lib/utils";
    import AsyncLock from "async-lock";
    import {keydown} from "dumbo-svelte";
    import {v4 as uuidv4} from 'uuid';

    let input_value = '';
    let encode_input = false;
    let output_value = [];
    let decode_output = false;

    let process_timeout = null;
    let processing = false;

    async function update_url(input_value, encode_input, decode_output) {
        if (recipe_unsubscribe !== null) {
            location.hash = Recipe.serialize(input_value, {
                encode_input,
                decode_output,
                show_help: $show_help,
                show_operations: show_operations,
                show_io_panel: show_io_panel,
                show_ingredient_details: $show_ingredient_details,
                readonly_ingredients: $readonly_ingredients,
                show_ingredient_headers: $show_ingredient_headers,
                pause_baking: $pause_baking,
            });
        }
    }

    async function process(input_value, encode_input, decode_output) {
        output_value = await Recipe.process(input_value, encode_input);
        await update_url(input_value, encode_input, decode_output);
    }

    const lock = new AsyncLock();
    let delayed_process_counter = 0;
    async function delayed_process(input_value, encode_input, decode_output, pause_baking) {
        let id;
        lock.acquire('process', async () => {
            delayed_process_counter++;
            id = delayed_process_counter;
        });
        if (process_timeout !== null) {
            clearTimeout(process_timeout);
        }
        if (pause_baking) {
            await Utils.clingo_terminate();
            $processing_index = Recipe.number_of_ingredients;
            if (process_timeout) {
                clearTimeout(process_timeout);
                process_timeout = null;
            }
            return;
        }
        for (let count_attempt = 0; processing; count_attempt++) {
            if (id !== delayed_process_counter) {
                return;
            }
            if (count_attempt % 30 === 0) {
                await Utils.snackbar('Waiting for previous process to terminate...', { position: 'is-bottom-right' });
            }
            await Recipe.abort();
            await Utils.delay(100);
        }
        process_timeout = setTimeout(async () => {
            if (id !== delayed_process_counter) {
                return;
            }
            processing = true;
            await process(input_value, encode_input, decode_output);
            process_timeout = null;
            processing = false;
        }, 100);
    }

    $: input_value, encode_input, Recipe.invalidate_cached_output(0);
    $: delayed_process(input_value, encode_input, decode_output, $pause_baking);

    let recipe_unsubscribe = null;
    let input_panel_div;
    let output_panel_div;
    let progress_panel_div;
    let show_operations = true;
    let show_io_panel = true;

    const keydown_uuid = uuidv4();

    $: $show_help, show_operations, show_io_panel,
        $show_ingredient_details, $readonly_ingredients, $show_ingredient_headers, $pause_baking,
        update_url(input_value, encode_input, decode_output);

    onMount(() => {
        const recipe_panel = document.getElementById('recipe_panel_column');

        if (location.hash.length > 1) {
            const data = Recipe.deserialize(location.hash.slice(1));
            if (data !== null) {
                input_value = data.input;
                encode_input = data.encode_input;
                decode_output = data.decode_output;
                $show_help = data.show_help;
                show_operations = data.show_operations;
                show_io_panel = data.show_io_panel;
                $show_ingredient_details = data.show_ingredient_details;
                $readonly_ingredients = data.readonly_ingredients;
                $show_ingredient_headers = data.show_ingredient_headers;
                $pause_baking = data.pause_baking;
            }
        }
        recipe_unsubscribe = recipe.subscribe(() => {
            delayed_process(input_value, encode_input, decode_output, $pause_baking);
        });
        input_panel_div.style.height = `${input_panel_div.offsetHeight - progress_panel_div.offsetHeight / 2}px`;
        output_panel_div.style.height = `${output_panel_div.offsetHeight - progress_panel_div.offsetHeight / 2}px`;

        $keydown.push([keydown_uuid, (event) => {
            if (event.uKey === 'L' || event.key === 'ArrowLeft') {
                show_operations = !show_operations;
                Utils.snackbar(show_operations ? "Operations panel shown..." : "Operations panel hidden...");
                return true;
            } else if (event.uKey === 'R' || event.key === 'ArrowRight') {
                show_io_panel = !show_io_panel;
                Utils.snackbar(show_io_panel ? "I/O panel shown..." : "I/O panel hidden...");
                return true;
            } else if (event.key === 'PageDown') {
                recipe_panel.scrollTop += recipe_panel.offsetHeight * 0.9;
                return true;
            } else if (event.key === 'PageUp') {
                recipe_panel.scrollTop -= recipe_panel.offsetHeight * 0.9;
                return true;
            } else if (event.key === 'ArrowDown') {
                recipe_panel.scrollTop += recipe_panel.offsetHeight * 0.1;
                return true;
            } else if (event.key === 'ArrowUp') {
                recipe_panel.scrollTop -= recipe_panel.offsetHeight * 0.1;
                return true;
            } else if (event.key === 'Home') {
                recipe_panel.scrollTop = 0;
                return true;
            } else if (event.key === 'End') {
                recipe_panel.scrollTop = recipe_panel.scrollHeight;
                return true;
            }
        }]);
    });

    onDestroy(() => {
        recipe_unsubscribe();
        $keydown = $keydown.filter(key_value => key_value[0] !== keydown_uuid);
    });
</script>

<Row class="vw-100 vh-100" style="overflow: hidden;">
    {#if show_operations}
        <Col class="p-0 vh-100" style="min-width: {$operations_panel_width}%; max-width: {$operations_panel_width}%; overflow-x: hidden; overflow-y: scroll;">
            <Operations />
        </Col>
    {/if}
    <Col id="recipe_panel_column" class="p-0 vh-100" style="background-color: lightgray; overflow-x: hidden; overflow-y: scroll;">
        <RecipePanel
                on:change_input={(event) => input_value = event.detail}
                bind:show_operations
                bind:show_io_panel
        />
    </Col>
    {#if show_io_panel}
        <Col class="p-0 vh-100" style="min-width: {$io_panel_width}%; max-width: {$io_panel_width}%; overflow: hidden;">
            <div bind:this={input_panel_div} style="height: {$input_height}vh; overflow-x: hidden; overflow-y: scroll;">
                <InputPanel bind:value={input_value} bind:encode={encode_input} />
            </div>
            <div bind:this={progress_panel_div} data-testid="AspChef-baking-bar">
                <span class="d-test">{process_timeout ? "Baking..." : "Ready!"}</span>
                <Progress class="mb-0" multi style="font-family: monospace; font-weight: bold;">
                    <Progress bar animated color="danger" value={process_timeout ? 100 : 0}>
                        <span style="color: white;">Baking...</span>
                    </Progress>
                    <Progress bar color="success" value={process_timeout ? 0 : 100}>
                        <span style="color: white;">Ready!</span>
                    </Progress>
                </Progress>
            </div>
            <div bind:this={output_panel_div} style="height: {100 - $input_height}vh; overflow-x: hidden; overflow-y: scroll;">
                <OutputPanel value={output_value} bind:decode={decode_output} on:change_input={(event) => input_value = event.detail} />
            </div>
        </Col>
    {/if}
</Row>
