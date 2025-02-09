<script>
    import {Recipe} from "$lib/recipe";
    import {Input} from "sveltestrap";
    import {onMount, tick} from "svelte";
    import {Utils} from "$lib/utils";

    let filter = "";
    $: load(filter);

    let output_div;
    let operations = null;
    let docs = [];

    async function load(filter) {
        if (!output_div) {
            return;
        }
        await Recipe.load_operation_components();
        const the_operations = Recipe.operations(filter);
        docs = await Promise.all(the_operations.map(operation => Recipe.operation_doc(operation)));
        operations = the_operations;
        await tick();
        Array.from(output_div.getElementsByTagName('pre')).forEach(Utils.add_copy_button);
    }

    onMount(async () => {
        await load(filter);
    });
</script>

<Input type="search"
       id="doc-search"
       bind:value={filter}
       placeholder="Filter operations..."
       autocomplete="off"
       autofocus
/>

<div bind:this={output_div}>
    {#if operations === null}
        <em>Loading operations...</em>
    {:else}
        {#each operations as operation, index}
            <div class="mb-2">
                <h2>{operation}</h2>
                {@html docs[index]}
            </div>
            <hr />
        {/each}
    {/if}
</div>
