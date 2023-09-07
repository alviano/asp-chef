<script>
    import {Button, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader} from "sveltestrap";
    import {io_panel_width, operations_panel_width, input_height, baking_delay} from "$lib/stores";
    import {consts} from "$lib/consts";

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
                    min={consts.OPERATIONS_PANEL_MIN_VALUE}
                    max={consts.OPERATIONS_PANEL_MAX_VALUE}
                    bind:value={$operations_panel_width}
                    step={1}
            />
        </FormGroup>
        <FormGroup>
            <Label>I/O panel ({$io_panel_width}%)</Label>
            <Input
                    type="range"
                    name="io"
                    min={consts.IO_PANEL_MIN_VALUE}
                    max={consts.IO_PANEL_MAX_VALUE}
                    bind:value={$io_panel_width}
                    step={1}
            />
        </FormGroup>
        <FormGroup>
            <Label>Input height ({$input_height}%)</Label>
            <Input
                    type="range"
                    name="io"
                    min={consts.INPUT_HEIGHT_MIN_VALUE}
                    max={consts.INPUT_HEIGHT_MAX_VALUE}
                    bind:value={$input_height}
                    step={1}
            />
        </FormGroup>
        <FormGroup>
            <Label>Baking delay ({$baking_delay}ms)</Label>
            <Input
                    type="range"
                    name="io"
                    min={consts.BAKING_DELAY_MIN_VALUE}
                    max={consts.BAKING_DELAY_MAX_VALUE}
                    bind:value={$baking_delay}
                    step={50}
            />
        </FormGroup>    </ModalBody>
    <ModalFooter>
        <Button color="primary" on:click={toggle}>Close</Button>
    </ModalFooter>
</Modal>