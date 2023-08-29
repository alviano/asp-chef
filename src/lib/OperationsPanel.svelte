<script>
    import {Card, CardBody, CardHeader, CardTitle} from "sveltestrap";
    import Nav from '$lib/Nav.svelte';
    import OperationsList from "$lib/operations/+OperationsList.svelte";
    import {Recipe} from "$lib/recipe";
    import {consts} from "$lib/consts";
</script>

<Nav />

<Card>
    <CardHeader>
        <CardTitle>
            Operations
            {#if consts.DEBUG}
                <span class="float-end small">
                    <code>({Recipe.number_of_operations})</code>
                </span>
            {/if}
        </CardTitle>
    </CardHeader>
    <CardBody class="p-0" data-testid="OperationsPanel-list">
        <OperationsList index="{undefined}" />
    </CardBody>
</Card>
