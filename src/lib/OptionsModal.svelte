<script>
    import {
        Button,
        FormGroup,
        Input,
        InputGroup,
        InputGroupText,
        Label,
        Modal,
        ModalBody,
        ModalFooter,
        ModalHeader
    } from "sveltestrap";
    import {
        baking_delay,
        clingo_remote_url,
        github_api_token,
        github_path,
        github_repository,
        github_username,
        input_height,
        io_panel_width,
        operations_panel_width
    } from "$lib/stores";
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
                    name="height"
                    min={consts.INPUT_HEIGHT_MIN_VALUE}
                    max={consts.INPUT_HEIGHT_MAX_VALUE}
                    bind:value={$input_height}
                    step={1}
            />
        </FormGroup>
        <FormGroup>
            <Label>Baking delay ({$baking_delay}ms)</Label>
            <Input
                    type="delay"
                    name="io"
                    min={consts.BAKING_DELAY_MIN_VALUE}
                    max={consts.BAKING_DELAY_MAX_VALUE}
                    bind:value={$baking_delay}
                    step={50}
            />
        </FormGroup>
        <FormGroup>
            <Label>Remote clingo</Label>
            <Input
                    name="clingo"
                    bind:value={$clingo_remote_url}
            />
        </FormGroup>
        <FormGroup>
            <Label>GitHub API Token (set it only on trusted browsers)</Label>
            <Input
                    type="password"
                    name="github-token"
                    bind:value={$github_api_token}
            />
        </FormGroup>
        <FormGroup>
            <Label>GitHub short links configuration</Label>
            <InputGroup>
                <Input
                        name="github-username"
                        bind:value={$github_username}
                        placeholder="username"
                />
                <Input
                        name="github-repository"
                        bind:value={$github_repository}
                        placeholder="repository"
                />
            </InputGroup>
            <InputGroup>
                <InputGroupText>/</InputGroupText>
                <Input
                        name="github-path"
                        bind:value={$github_path}
                        placeholder="path"
                />
            </InputGroup>
        </FormGroup>
    </ModalBody>
    <ModalFooter>
        <Button color="primary" on:click={toggle}>Close</Button>
    </ModalFooter>
</Modal>