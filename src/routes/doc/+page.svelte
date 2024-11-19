<script context="module">
    import {Recipe} from "$lib/recipe";

    Recipe.load_operation_components();
</script>
<script>
    import {Input} from "sveltestrap";

    let filter = "";
</script>

<Input type="search"
       id="doc-search"
       bind:value={filter}
       placeholder="Filter operations..."
       autocomplete="off"
       autofocus
/>
{#await Recipe.load_operation_components()}
    <em>Loading operations...</em>
{:then _}
    {#each Recipe.operations(filter) as operation}
        <div class="mb-2">
            <h2>{operation}</h2>
            {#await Recipe.operation_doc(operation)}
                <em>Loading documentation...</em>
            {:then doc}
                {@html doc}
            {/await}
        </div>
    {/each}
{/await}