<script>
    import {Button, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader} from "sveltestrap";
    import {io_panel_width, operations_panel_width} from "$lib/stores";

    export let open = false;

    function toggle() {
        open = !open;
    }
</script>

<Modal isOpen={open} {toggle}>
    <ModalHeader {toggle}>Options</ModalHeader>
    <ModalBody>
        <FormGroup>
            <Label>Operations panel ({$operations_panel_width}%)</Label>
            <Input
                    type="range"
                    name="operations"
                    min={10}
                    max={33}
                    bind:value={$operations_panel_width}
                    step={1}
            />
          </FormGroup>
        <FormGroup>
            <Label>I/O panel ({$io_panel_width}%)</Label>
            <Input
                    type="range"
                    name="io"
                    min={10}
                    max={33}
                    bind:value={$io_panel_width}
                    step={1}
            />
          </FormGroup>
    </ModalBody>
    <ModalFooter>
        <Button color="primary" on:click={toggle}>Close</Button>
    </ModalFooter>
</Modal>