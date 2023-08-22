<script>
    import {Button, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader} from "sveltestrap";
    import {Utils} from "$lib/utils";

    export let open = false;

    let value = '';

    function toggle() {
        open = !open;
    }

    function rewrite_url(url) {
        try {
            const hash = new URL(url).hash;
            return `/safe-open${hash}`;
        } catch (error) {
            Utils.snackbar("Invalid URL");
        }
    }

    function load() {
        const url = rewrite_url(value);
        if (url) {
            location = url;
        }
    }

    function open_in_new_tab() {
        const url = rewrite_url(value);
        if (url) {
            window.open(url);
            toggle();
        }
    }
</script>

<Modal isOpen={open} {toggle}>
    <ModalHeader {toggle}>Options</ModalHeader>
    <ModalBody>
        <FormGroup>
            <Label>Recipe URL</Label>
            <Input
                    type="text"
                    name="url"
                    bind:value
                    placeholder="URL recipe..."
            />
        </FormGroup>
    </ModalBody>
    <ModalFooter>
        <Button color="secondary" on:click={toggle}>Close</Button>
        <Button color="primary" on:click={load}>Load (here)</Button>
        <Button color="primary" on:click={open_in_new_tab}>Open (in new tab)</Button>
    </ModalFooter>
</Modal>