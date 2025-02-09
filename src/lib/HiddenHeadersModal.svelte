<script>
    import {Button, Modal, ModalBody, ModalFooter, ModalHeader} from "@sveltestrap/sveltestrap";
    import {recipe} from "$lib/stores";
    import {Recipe} from "$lib/recipe";

    export let open = false;

    function toggle() {
        open = !open;
    }
</script>

<Modal isOpen={open} {toggle}>
    <ModalHeader {toggle}>Ingredient Header Bars</ModalHeader>
    <ModalBody>
        {#each $recipe as ingredient, index}
            <Button
                    block
                    outline="{ingredient.options.hide_header}"
                    on:click={() => Recipe.toggle_hide_header_operation(index)}
            >#{index + 1} {ingredient.operation}</Button>
        {/each}
    </ModalBody>
    <ModalFooter>
        <Button color="primary" on:click={toggle}>Close</Button>
    </ModalFooter>
</Modal>