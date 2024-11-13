<script context="module">
    import {Recipe} from "$lib/recipe";

    Recipe.load_operation_components();
</script>
<script>
    import {Col, Input, Row} from "sveltestrap";

    let filter = "";
</script>

<Input type="search"
       id="doc-search"
       bind:value={filter}
       placeholder="Filter operations..."
       autocomplete="off"
       autofocus
/>
{#each Recipe.operations(filter) as operation}
    <div class="mb-2">
        <h2>{operation}</h2>
        {@html Recipe.operation_doc(operation)}
    </div>
{/each}