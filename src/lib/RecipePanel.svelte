<script>
    import {flip} from "svelte/animate";
    import {dndzone} from "svelte-dnd-action";
    import {drag_disabled, errors_at_index, pause_baking, recipe, show_ingredient_details} from "$lib/stores";
    import {Alert, Button, ButtonGroup, Card, CardBody, CardHeader, CardTitle, Icon} from "sveltestrap";
    import SearchModels from "$lib/operations/SearchModels.svelte";
    import RemoveErrors from "$lib/operations/RemoveErrors.svelte";
    import Wrap from "$lib/operations/Wrap.svelte";
    import Merge from "$lib/operations/Merge.svelte";
    import Intersection from "$lib/operations/Intersection.svelte";
    import Union from "$lib/operations/Union.svelte";
    import InputIntersection from "$lib/operations/InputIntersection.svelte";
    import InputUnion from "$lib/operations/InputUnion.svelte";
    import Table from "$lib/operations/Table.svelte";
    import {keydown, Popover} from "dumbo-svelte";
    import {Recipe} from "$lib/recipe";
    import Unwrap from "$lib/operations/Unwrap.svelte";
    import Split from "$lib/operations/Split.svelte";
    import {Utils} from "$lib/utils";
    import Optimize from "$lib/operations/Optimize.svelte";
    import Show from "$lib/operations/Show.svelte";
    import Output from "$lib/operations/Output.svelte";
    import Nop from "$lib/operations/Nop.svelte";
    import Filter from "$lib/operations/Filter.svelte";
    import SelectPredicates from "$lib/operations/SelectPredicates.svelte";
    import Encode from "$lib/operations/Encode.svelte";
    import Markdown from "$lib/operations/Markdown.svelte";
    import {onDestroy, onMount} from "svelte";
    import SelectModel from "$lib/operations/SelectModel.svelte";
    import Operations from "$lib/operations/Operations.svelte";
    import SymmetricClosure from "$lib/operations/SymmetricClosure.svelte";
    import TransitiveClosure from "$lib/operations/TransitiveClosure.svelte";
    import Lua from "$lib/operations/Lua.svelte";
    import SortByIncreasingSize from "$lib/operations/SortbyIncreasingSize.svelte";
    import SortByDecreasingSize from "$lib/operations/SortbyDecreasingSize.svelte";
    import SortByPredicateOrArgument from "$lib/operations/SortbyPredicateorArgument.svelte";
    import SetConfiguration from "$lib/operations/SetConfiguration.svelte";
    import SetSATPreprocessing from "$lib/operations/SetSATPreprocessing.svelte";
    import SetTransformationOfExtendedRules from "$lib/operations/SetTransformationofExtendedRules.svelte";
    import SetOptimizationStrategy from "$lib/operations/SetOptimizationStrategy.svelte";
    import Graph from "$lib/operations/Graph.svelte";
    import ExtensionalRelation from "$lib/operations/ExtensionalRelation.svelte";
    import JSONPath from "$lib/operations/JSONPath.svelte";
    import ParseCSV from "$lib/operations/ParseCSV.svelte";
    import GenerateCSV from "$lib/operations/GenerateCSV.svelte";
    import OutputEncodedContent from "$lib/operations/OutputEncodedContent.svelte";
    import {v4 as uuidv4} from "uuid";
    import Index from "$lib/operations/Index.svelte";
    import SortCanonical from "$lib/operations/SortCanonical.svelte";
    import Unique from "$lib/operations/Unique.svelte";
    import SortModelsCanonically from "$lib/operations/SortModelsCanonically.svelte";
    import RecipeOperation from "$lib/operations/Recipe.svelte";
    import EncodeInput from "$lib/operations/EncodeInput.svelte";
    import DecodeInput from "$lib/operations/DecodeInput.svelte";
    import RemoveEmptyModels from "$lib/operations/RemoveEmptyModels.svelte";
    import ProjectArgument from "$lib/operations/ProjectArgument.svelte";
    import IntrospectionTerms from "$lib/operations/IntrospectionTerms.svelte";
    import ReifyProgram from "$lib/operations/ReifyProgram.svelte";
    import UnreifyProgram from "$lib/operations/UnreifyProgram.svelte";
    import MetaStableModels from "$lib/operations/MetaStableModels.svelte";
    import MetaClassicalModels from "$lib/operations/MetaClassicalModels.svelte";
    import MetaSupportedModels from "$lib/operations/MetaSupportedModels.svelte";
    import MetaHereAndThereModels from "$lib/operations/MetaHereandThereModels.svelte";
    import Slider from "$lib/operations/Slider.svelte";
    import Server from "$lib/operations/Server.svelte";
    import InvalidateCache from "$lib/operations/InvalidateCache.svelte";
    import SetTimeout from "$lib/operations/SetTimeout.svelte";
    import Store from "$lib/operations/Store.svelte";
    import Restore from "$lib/operations/Restore.svelte";

    export let show_operations;
    export let show_io_panel;

    async function copy_to_clipboard() {
        const url = Recipe.as_url();
        await navigator.clipboard.writeText(url);
        Utils.snackbar("URL ready to be pasted!");
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

    onMount(() => {
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
                        <Button size="sm" color="danger" on:click={() => Recipe.remove_all_operations()}><Icon name="trash" /></Button>
                    </Popover>
                </ButtonGroup>
                <ButtonGroup>
                    <Popover title="Hide/show Operations panel">
                        <div slot="value">
                            <p>Keybinding: <code>L</code></p>
                        </div>
                        <Button size="sm"
                                outline={!show_operations}
                                on:click={() => show_operations = !show_operations}>
                            <Icon name="box-arrow-left" />
                        </Button>
                    </Popover>
                    <Popover title="Hide/show I/O panel">
                        <div slot="value">
                            <p>Keybinding: <code>R</code></p>
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
                                color={$show_ingredient_details ? "success" : "secondary"}
                                outline={!$show_ingredient_details}
                                on:click={() => toggle_show_details()}>
                            <Icon name="binoculars" />
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
                    <Popover title="Copy recipe">
                        <div slot="value">
                            <p>Copy the recipe URL in the clipboard.</p>
                            <p>Keybinding: <code>C</code></p>
                        </div>
                        <Button size="sm" on:click={() => copy_to_clipboard()}><Icon name="clipboard-plus" /></Button>
                    </Popover>
                </ButtonGroup>
            </span>
        </CardTitle>
    </CardHeader>
    <CardBody class="p-0" style="background-color: lightgray;">
        <section style="padding-bottom: 20em;" use:dndzone="{{items, dragDisabled, flipDurationMs}}" on:consider="{handleDndConsider}" on:finalize="{handleDndFinalize}">
            {#each items as item, index (item.id)}
                <div animate:flip="{{duration: flipDurationMs}}" class="mt-1">
                    {#if item.operation === 'Search Models'}
                        <SearchModels id={item.id} options={item.options} index={index} add_to_recipe={undefined} keybinding={undefined} />
                    {:else if item.operation === 'Remove Errors'}
                        <RemoveErrors id={item.id} options={item.options} index={index} add_to_recipe={undefined} keybinding={undefined} />
                    {:else if item.operation === 'Wrap'}
                        <Wrap id={item.id} options={item.options} index={index} add_to_recipe={undefined} keybinding={undefined} />
                    {:else if item.operation === 'Merge'}
                        <Merge id={item.id} options={item.options} index={index} add_to_recipe={undefined} keybinding={undefined} />
                    {:else if item.operation === 'Intersection'}
                        <Intersection id={item.id} options={item.options} index={index} add_to_recipe={undefined} keybinding={undefined} />
                    {:else if item.operation === 'Union'}
                        <Union id={item.id} options={item.options} index={index} add_to_recipe={undefined} keybinding={undefined} />
                    {:else if item.operation === 'Input Intersection'}
                        <InputIntersection id={item.id} options={item.options} index={index} add_to_recipe={undefined} keybinding={undefined} />
                    {:else if item.operation === 'Input Union'}
                        <InputUnion id={item.id} options={item.options} index={index} add_to_recipe={undefined} keybinding={undefined} />
                    {:else if item.operation === 'Table'}
                        <Table id={item.id} options={item.options} index={index} add_to_recipe={undefined} keybinding={undefined} />
                    {:else if item.operation === 'Unwrap'}
                        <Unwrap id={item.id} options={item.options} index={index} add_to_recipe={undefined} keybinding={undefined} />
                    {:else if item.operation === 'Split'}
                        <Split id={item.id} options={item.options} index={index} add_to_recipe={undefined} keybinding={undefined} />
                    {:else if item.operation === 'Optimize'}
                        <Optimize id={item.id} options={item.options} index={index} add_to_recipe={undefined} keybinding={undefined} />
                    {:else if item.operation === 'Show'}
                        <Show id={item.id} options={item.options} index={index} add_to_recipe={undefined} keybinding={undefined} />
                    {:else if item.operation === 'Output'}
                        <Output id={item.id} options={item.options} index={index} add_to_recipe={undefined} keybinding={undefined} on:change_input />
                    {:else if item.operation === 'Nop'}
                        <Nop id={item.id} options={item.options} index={index} add_to_recipe={undefined} keybinding={undefined} />
                    {:else if item.operation === 'Operations'}
                        <Operations id={item.id} options={item.options} index={index} add_to_recipe={undefined} keybinding={undefined} />
                    {:else if item.operation === 'Filter'}
                        <Filter id={item.id} options={item.options} index={index} add_to_recipe={undefined} keybinding={undefined} />
                    {:else if item.operation === 'Select Predicates'}
                        <SelectPredicates id={item.id} options={item.options} index={index} add_to_recipe={undefined} keybinding={undefined} />
                    {:else if item.operation === 'Select Model'}
                        <SelectModel id={item.id} options={item.options} index={index} add_to_recipe={undefined} keybinding={undefined} />
                    {:else if item.operation === 'Encode'}
                        <Encode id={item.id} options={item.options} index={index} add_to_recipe={undefined} keybinding={undefined} />
                    {:else if item.operation === 'Symmetric Closure'}
                        <SymmetricClosure id={item.id} options={item.options} index={index} add_to_recipe={undefined} keybinding={undefined} />
                    {:else if item.operation === 'Transitive Closure'}
                        <TransitiveClosure id={item.id} options={item.options} index={index} add_to_recipe={undefined} keybinding={undefined} />
                    {:else if item.operation === 'Lua'}
                        <Lua id={item.id} options={item.options} index={index} add_to_recipe={undefined} keybinding={undefined} />
                    {:else if item.operation === 'Sort by Increasing Size'}
                        <SortByIncreasingSize id={item.id} options={item.options} index={index} add_to_recipe={undefined} keybinding={undefined} />
                    {:else if item.operation === 'Sort by Decreasing Size'}
                        <SortByDecreasingSize id={item.id} options={item.options} index={index} add_to_recipe={undefined} keybinding={undefined} />
                    {:else if item.operation === 'Sort by Predicate or Argument'}
                        <SortByPredicateOrArgument id={item.id} options={item.options} index={index} add_to_recipe={undefined} keybinding={undefined} />
                    {:else if item.operation === 'Set Timeout'}
                        <SetTimeout id={item.id} options={item.options} index={index} add_to_recipe={undefined} keybinding={undefined} />
                    {:else if item.operation === 'Set Configuration'}
                        <SetConfiguration id={item.id} options={item.options} index={index} add_to_recipe={undefined} keybinding={undefined} />
                    {:else if item.operation === 'Set SAT Preprocessing'}
                        <SetSATPreprocessing id={item.id} options={item.options} index={index} add_to_recipe={undefined} keybinding={undefined} />
                    {:else if item.operation === 'Set Transformation of Extended Rules'}
                        <SetTransformationOfExtendedRules id={item.id} options={item.options} index={index} add_to_recipe={undefined} keybinding={undefined} />
                    {:else if item.operation === 'Set Optimization Strategy'}
                        <SetOptimizationStrategy id={item.id} options={item.options} index={index} add_to_recipe={undefined} keybinding={undefined} />
                    {:else if item.operation === 'Graph'}
                        <Graph id={item.id} options={item.options} index={index} add_to_recipe={undefined} keybinding={undefined} />
                    {:else if item.operation === 'Extensional Relation'}
                        <ExtensionalRelation id={item.id} options={item.options} index={index} add_to_recipe={undefined} keybinding={undefined} />
                    {:else if item.operation === 'JSON Path'}
                        <JSONPath id={item.id} options={item.options} index={index} add_to_recipe={undefined} keybinding={undefined} />
                    {:else if item.operation === 'Parse CSV'}
                        <ParseCSV id={item.id} options={item.options} index={index} add_to_recipe={undefined} keybinding={undefined} />
                    {:else if item.operation === 'Generate CSV'}
                        <GenerateCSV id={item.id} options={item.options} index={index} add_to_recipe={undefined} keybinding={undefined} />
                    {:else if item.operation === 'Output Encoded Content'}
                        <OutputEncodedContent id={item.id} options={item.options} index={index} add_to_recipe={undefined} keybinding={undefined} />
                    {:else if item.operation === 'Index'}
                        <Index id={item.id} options={item.options} index={index} add_to_recipe={undefined} keybinding={undefined} />
                    {:else if item.operation === 'Sort Canonical'}
                        <SortCanonical id={item.id} options={item.options} index={index} add_to_recipe={undefined} keybinding={undefined} />
                    {:else if item.operation === 'Sort Models Canonically'}
                        <SortModelsCanonically id={item.id} options={item.options} index={index} add_to_recipe={undefined} keybinding={undefined} />
                    {:else if item.operation === 'Unique'}
                        <Unique id={item.id} options={item.options} index={index} add_to_recipe={undefined} keybinding={undefined} />
                    {:else if item.operation === 'Recipe'}
                        <RecipeOperation id={item.id} options={item.options} index={index} add_to_recipe={undefined} keybinding={undefined} />
                    {:else if item.operation === 'Encode Input'}
                        <EncodeInput id={item.id} options={item.options} index={index} add_to_recipe={undefined} keybinding={undefined} />
                    {:else if item.operation === 'Decode Input'}
                        <DecodeInput id={item.id} options={item.options} index={index} add_to_recipe={undefined} keybinding={undefined} />
                    {:else if item.operation === 'Remove Empty Models'}
                        <RemoveEmptyModels id={item.id} options={item.options} index={index} add_to_recipe={undefined} keybinding={undefined} />
                    {:else if item.operation === 'Project Argument'}
                        <ProjectArgument id={item.id} options={item.options} index={index} add_to_recipe={undefined} keybinding={undefined} />
                    {:else if item.operation === 'Introspection Terms'}
                        <IntrospectionTerms id={item.id} options={item.options} index={index} add_to_recipe={undefined} keybinding={undefined} />
                    {:else if item.operation === 'Reify Program'}
                        <ReifyProgram id={item.id} options={item.options} index={index} add_to_recipe={undefined} keybinding={undefined} />
                    {:else if item.operation === 'Unreify Program'}
                        <UnreifyProgram id={item.id} options={item.options} index={index} add_to_recipe={undefined} keybinding={undefined} />
                    {:else if item.operation === 'Meta Stable Models'}
                        <MetaStableModels id={item.id} options={item.options} index={index} add_to_recipe={undefined} keybinding={undefined} />
                    {:else if item.operation === 'Meta Classical Models'}
                        <MetaClassicalModels id={item.id} options={item.options} index={index} add_to_recipe={undefined} keybinding={undefined} />
                    {:else if item.operation === 'Meta Supported Models'}
                        <MetaSupportedModels id={item.id} options={item.options} index={index} add_to_recipe={undefined} keybinding={undefined} />
                    {:else if item.operation === 'Meta Here and There Models'}
                        <MetaHereAndThereModels id={item.id} options={item.options} index={index} add_to_recipe={undefined} keybinding={undefined} />
                    {:else if item.operation === 'Slider'}
                        <Slider id={item.id} options={item.options} index={index} add_to_recipe={undefined} keybinding={undefined} />
                    {:else if item.operation === 'Server'}
                        <Server id={item.id} options={item.options} index={index} add_to_recipe={undefined} keybinding={undefined} />
                    {:else if item.operation === 'Invalidate Cache'}
                        <InvalidateCache id={item.id} options={item.options} index={index} add_to_recipe={undefined} keybinding={undefined} />
                    {:else if item.operation === 'Store'}
                        <Store id={item.id} options={item.options} index={index} add_to_recipe={undefined} keybinding={undefined} />
                    {:else if item.operation === 'Restore'}
                        <Restore id={item.id} options={item.options} index={index} add_to_recipe={undefined} keybinding={undefined} />
                    {:else if item.operation === 'Markdown'}
                        <Markdown id={item.id} options={item.options} index={index} add_to_recipe={undefined} keybinding={undefined} />
                    {:else}
                        <Nop id={item.id} options={item.options} index={index} add_to_recipe={undefined} keybinding={undefined} />
                        <Alert color="danger">
                            Unknown operation replaced by Nop: {item.operation}
                        </Alert>
                    {/if}
                </div>
            {/each}
        </section>
    </CardBody>
</Card>
