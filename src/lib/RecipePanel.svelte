<script>
    import {Recipe} from "$lib/recipe";
    import {flip} from "svelte/animate";
    import {dndzone} from "svelte-dnd-action";
    import {
        drag_disabled,
        errors_at_index,
        pause_baking,
        recipe,
        show_help,
        show_ingredient_details,
        readonly_ingredients,
        show_ingredient_headers, clingo_remote_on,
    } from "$lib/stores";
    import {Badge, Button, ButtonGroup, Card, CardBody, CardHeader, CardTitle, Icon} from "sveltestrap";
    import {keydown} from "dumbo-svelte";
    import Popover from "$lib/Popover.svelte";
    import {Utils} from "$lib/utils";
    import Nop from "$lib/operations/Nop.svelte";
    import {onDestroy, onMount} from "svelte";
    import {v4 as uuidv4} from "uuid";
    import OptionsModal from "$lib/OptionsModal.svelte";
    import SafelyLoadRecipeModal from "$lib/SafelyLoadRecipeModal.svelte";
	import { createEventDispatcher } from 'svelte';
    import Javascript from "$lib/operations/Javascript.svelte";
    import HiddenHeadersModal from "$lib/HiddenHeadersModal.svelte";

	const dispatch = createEventDispatcher();

    export let show_operations;
    export let show_io_panel;

    let set_options = false;
    let safely_open_recipe = false;
    let hidden_headers = false;

    function reload_recipe() {
        dispatch("reload_recipe");
        Utils.snackbar("Recipe reloaded!");
    }

    async function copy_to_clipboard() {
        const url = Recipe.as_url();
        await navigator.clipboard.writeText(url);
        Utils.snackbar("URL ready to be pasted!");
    }

    async function copy_short_url() {
        Utils.confirm({
            message: "The recipe contains no sensitive information and I want to create a non-deletable short URL for it?",
            onconfirm: async () => {
                try {
                    const url = await Recipe.shorten_link(Recipe.as_url().replace("http://localhost:5188", "https://asp-chef.alviano.net"));
                    await navigator.clipboard.writeText(url);
                    Utils.snackbar("Short URL ready to be pasted!");
                } catch (error) {
                    Utils.snackbar(error);
                }
            },
        });
    }

    function toggle_show_help() {
        $show_help = !$show_help;
    }

    function toggle_readonly_ingredients() {
        $readonly_ingredients = !$readonly_ingredients;
    }

    function toggle_show_ingredient_headers() {
        $show_ingredient_headers = !$show_ingredient_headers;
    }

    function toggle_show_details() {
        $show_ingredient_details = !$show_ingredient_details;
    }

    function toggle_pause_baking() {
        $pause_baking = !$pause_baking;
        $errors_at_index.length = 0;
        Recipe.invalidate_cached_output(0);
        Utils.snackbar("Baking " + ($pause_baking ? "disabled" : "enabled"));
    }

    function remove_all() {
        Utils.confirm({
            message: "Remove all ingredients from the recipe?",
            onconfirm: () => {
                Recipe.remove_all_operations();
            }
        });
    }

    let items = [];
    let dragDisabled;
    $: dragDisabled = $drag_disabled;
    const flipDurationMs = 300;
    async function handleDndConsider(e) {
        items = e.detail.items;
    }
    async function handleDndFinalize(e) {
        for (let index = 0; index < $recipe.length; index++) {
            if ($recipe[index] !== e.detail.items[index]) {
                Recipe.invalidate_cached_output(index);
                break;
            }
        }
        recipe.set(e.detail.items);
    }

    let unsubscribe = null;
    const keydown_uuid = uuidv4();

    onMount(async () => {
        unsubscribe = recipe.subscribe((value) => {
            items = value;
        });

        $keydown.push([keydown_uuid, (event) => {
            if (event.uKey === 'D') {
                toggle_show_details();
                return true;
            } else if (event.uKey === 'C') {
                copy_to_clipboard();
                return true;
            } else if (event.uKey === 'P') {
                toggle_pause_baking();
                return true;
            } else if (event.uKey === 'H') {
                toggle_show_help();
                return true;
            } else if (event.uKey === 'E') {
                toggle_readonly_ingredients();
                return true;
            } else if (event.uKey === 'B') {
                toggle_show_ingredient_headers();
                return true;
            } else if (event.uKey === 'O') {
                set_options = true;
                return true;
            } else if (event.uKey === 'S') {
                safely_open_recipe = true;
                return true;
            } else if (event.uKey === 'R') {
                reload_recipe();
                return true;
            }
        }]);

    });

    onDestroy(() => {
        unsubscribe();
        $keydown = $keydown.filter(key_value => key_value[0] !== keydown_uuid);
    });
</script>

<Card class="p-0">
    <CardHeader>
        <CardTitle class="h4">
            Recipe
            <span class="float-end">
                <ButtonGroup>
                    <Popover title="Remove operation" value="Remove all ingredients from the recipe.">
                        <Button size="sm" color="danger" on:click={remove_all}><Icon name="trash" /></Button>
                    </Popover>
                </ButtonGroup>
                <ButtonGroup>
                    <Popover title="Show help">
                        <div slot="value">
                            <p>Enable/disable inline help (pop-ups on top of operations and main controls).</p>
                            <p>Keybinding: <code>H</code></p>
                        </div>
                        <Button size="sm"
                                outline={!$show_help}
                                on:click={() => toggle_show_help()}>
                            <Icon name="question-square" />
                        </Button>
                    </Popover>
                    <Popover title="Options">
                        <div slot="value">
                            <p>Set options of ASP Chef (saved in the local storage of your browser).</p>
                            <p>Keybinding: <code>O</code></p>
                        </div>
                        <Button size="sm"
                                on:click={() => set_options = true}>
                            <Icon name="gear" />
                        </Button>
                    </Popover>
                    <Popover title="Remote clingo">
                        <div slot="value">
                            <p>Replace clingo-wasm with native clingo served by a remote server.</p>
                        </div>
                        <Button size="sm"
                                color={$clingo_remote_on ? "warning" : "secondary"}
                                outline={!$clingo_remote_on}
                                on:click={() => $clingo_remote_on = !$clingo_remote_on}>
                            <Icon name="cloud-check" />
                        </Button>
                    </Popover>
                </ButtonGroup>
                <ButtonGroup>
                    <Popover title="Hide/show Operations panel">
                        <div slot="value">
                            <p>Keybinding: <code>Arrow Left</code></p>
                        </div>
                        <Button size="sm"
                                outline={!show_operations}
                                on:click={() => show_operations = !show_operations}>
                            <Icon name="box-arrow-left" />
                        </Button>
                    </Popover>
                    <Popover title="Hide/show I/O panel">
                        <div slot="value">
                            <p>Keybinding: <code>Arrow Right</code></p>
                        </div>
                        <Button size="sm"
                                outline={!show_io_panel}
                                on:click={() => show_io_panel = !show_io_panel}>
                            <Icon name="box-arrow-right" />
                        </Button>
                    </Popover>
                </ButtonGroup>
                <ButtonGroup>
                    <Popover title="Show details">
                        <div slot="value">
                            <p>You may want to hide details when ordering your recipe.</p>
                            <p>Keybinding: <code>D</code></p>
                        </div>
                        <Button size="sm"
                                color="secondary"
                                outline={!$show_ingredient_details}
                                on:click={() => toggle_show_details()}>
                            <Icon name="binoculars" />
                        </Button>
                    </Popover>
                    <Popover title="Edit ingredients">
                        <div slot="value">
                            <p>Enable/disable editing of ingredients.</p>
                            <p>Note that the editing of some options is always enabled (e.g., search keys in <strong>Graph</strong> and <strong>Table</strong>).</p>
                            <p>Keybinding: <code>E</code></p>
                        </div>
                        <Button size="sm"
                                color="secondary"
                                outline={$readonly_ingredients}
                                on:click={() => toggle_readonly_ingredients()}>
                            <Icon name="pencil" />
                        </Button>
                    </Popover>
                    <Popover title="Show ingredient header bars">
                        <div slot="value">
                            <p>Show/hide ingredient header bars, and consequently enable/disable ingredient movement in the recipe.</p>
                            <p>You may want to hide ingredient header bars (and disable editing) when distributing your final recipe.</p>
                            <p>Keybinding: <code>B</code></p>
                        </div>
                        <Button size="sm"
                                color="secondary"
                                outline={!$show_ingredient_headers}
                                on:click={(event) => {event.target.id === "number_of_hidden_headers_badge" ? hidden_headers = true : toggle_show_ingredient_headers()}}>
                            <Icon name="arrow-down-up" />
                            <Badge id="number_of_hidden_headers_badge">{$recipe ? Recipe.number_of_hidden_headers : 0}</Badge>
                        </Button>
                    </Popover>
                    <Popover title="Pause baking">
                        <div slot="value">
                            <p>You may want to pause the baking of your recipe if it becomes too expensive.</p>
                            <p>Keybinding: <code>P</code></p>
                        </div>
                        <Button size="sm"
                                color={$pause_baking ? "danger" : "secondary"}
                                outline={!$pause_baking}
                                on:click={() => toggle_pause_baking()}
                                data-testid="RecipePanel-pause-baking"
                        >
                            <Icon name="pause-fill" />
                        </Button>
                    </Popover>
                </ButtonGroup>
                <ButtonGroup>
                    <Popover title="Safely load recipe">
                        <div slot="value">
                            <p>Load a recipe from a URL without baking it.</p>
                            <p>Keybinding: <code>S</code></p>
                        </div>
                        <Button size="sm" on:click={() => safely_open_recipe = true}><Icon name="envelope-open" /></Button>
                    </Popover>
                    <Popover title="Copy short recipe URL">
                        <div slot="value">
                            <p>Shorten recipe URL with a random short URL provided by <code>bitly.com</code> and copy it in the clipboard.</p>
                            <p>Note that a new URL is created every time the button is clicked and an API token must be given in the options.</p>
                            <p><strong>Important!</strong> Short URLs are easy to guess.</p>
                        </div>
                        <Button size="sm" on:click={copy_short_url}>
                            <Icon name="arrows-angle-contract" />
                        </Button>
                    </Popover>
                    <Popover title="Copy recipe">
                        <div slot="value">
                            <p>Copy the recipe URL in the clipboard.</p>
                            <p>Keybinding: <code>C</code></p>
                        </div>
                        <Button size="sm" on:click={() => copy_to_clipboard()}><Icon name="clipboard-plus" /></Button>
                    </Popover>
                    <Popover title="Reload recipe">
                        <div slot="value">
                            <p>Reload recipe from URL.</p>
                            <p>
                                Your browser history keeps track of changes you do to your recipe.
                                Moving back and forth in the history does not automatically reload the recipe.
                                If you don't want to reload the page, you can use this button to reload just the recipe.
                            </p>
                            <p>Keybinding: <code>R</code></p>
                        </div>
                        <Button size="sm" on:click={reload_recipe}><Icon name="arrow-repeat" /></Button>
                    </Popover>
                </ButtonGroup>
            </span>
        </CardTitle>
    </CardHeader>
    <CardBody class="p-0" style="background-color: lightgray;">
        <section style="padding-bottom: 20em;" use:dndzone="{{items, dragDisabled, flipDurationMs}}" on:consider="{handleDndConsider}" on:finalize="{handleDndFinalize}">
            {#each items as item, index (item.id)}
                <div animate:flip="{{duration: flipDurationMs}}" class:mt-1={$show_ingredient_headers && !item.options.hide_header}>
                    {#if Recipe.is_remote_javascript_operation(item.operation)}
                        <Javascript remote_name={item.operation} id="{item.id}" options="{item.options}" {index} add_to_recipe="{undefined}" keybinding={undefined} />
                    {:else if Recipe.has_operation_type(item.operation)}
                        <svelte:component this={Recipe.operation_component(item.operation)} id="{item.id}" options="{item.options}" {index} add_to_recipe="{undefined}" keybinding={undefined}
                                          on:change_input />
                    {:else}
                        <Nop id={item.id} options={item.options} index={index} add_to_recipe={undefined} keybinding={undefined} />
                        <div class="alert-warning" style="color: white">
                            <h5 class="alert-heading">Oops!</h5>
                            Unknown operation replaced by Nop: {item.operation}
                        </div>
                    {/if}
                </div>
            {/each}
        </section>
    </CardBody>
</Card>

<OptionsModal bind:open="{set_options}" />
<SafelyLoadRecipeModal bind:open="{safely_open_recipe}" />
<HiddenHeadersModal bind:open="{hidden_headers}" />
