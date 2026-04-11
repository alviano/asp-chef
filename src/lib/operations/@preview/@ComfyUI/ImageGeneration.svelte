<script context="module">
    import {Option, Recipe} from "$lib/recipe";
    import {Utils} from "$lib/utils";
    import {Base64} from "js-base64";

    const operation = "@preview/@ComfyUI/Image Generation";
    export const default_extra_options = {
        input_predicate: Option("__comfy__", "Predicate containing the ComfyUI configuration (a Base64-encoded JSON of an API workflow)", "predicate_name"),
        output_predicate: Option("__comfy_image__", "Predicate used to store the generated image (as data URL)", "predicate_name"),
        multistage: Option(false, "Reiterated expansion of Mustache queries in configuration", "boolean"),
        echo: Option(false, "Include configuration in output", "boolean"),
    };

    const DEFAULT_SERVER = "http://localhost:8188";

    Recipe.register_operation_type(operation, async (input, options, index, id) => {
        const res = [];
        for (const part of input) {
            const new_part = [];
            for (const atom of part) {
                if (atom.predicate !== options.input_predicate) {
                    new_part.push(atom);
                    continue;
                }
                if (options.echo) {
                    new_part.push(atom);
                }
                try {
                    const images = await generate_images(atom, index, part, options.multistage, id);
                    const new_atoms = Utils.parse_atoms(images.map(image => `${options.output_predicate}("${image}")`));
                    new_part.push(...new_atoms);
                } catch (error) {
                    Recipe.set_errors_at_index(index, error, res);
                }
            }
            res.push(new_part);
        }
        return res;
    });

    function bytes_to_base64(bytes) {
        let binary = "";
        for (let i = 0; i < bytes.length; i += 0x8000) {
            const chunk = bytes.subarray(i, i + 0x8000);
            binary += String.fromCharCode(...chunk);
        }
        return btoa(binary);
    }

    function normalize_server(server) {
        const raw = server.trim();
        const http_base = new URL(raw.includes("://") ? raw : `http://${raw}`);
        http_base.pathname = "/";
        http_base.search = "";
        http_base.hash = "";

        const ws_base = new URL(http_base.toString());
        ws_base.protocol = http_base.protocol === "https:" ? "wss:" : "ws:";

        return {http_base, ws_base};
    }

    async function queue_prompt(http_base, prompt, client_id) {
        const endpoint = new URL("/prompt", http_base).toString();
        const response = await fetch(endpoint, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({prompt, client_id})
        });
        if (!response.ok) {
            throw new Error(`POST /prompt failed (${response.status})`);
        }
        return await response.json();
    }

    function get_save_image_websocket_node_ids(prompt) {
        return new Set(
            Object.entries(prompt || {})
                .filter(([, node]) => node && typeof node === "object" && node.class_type === "SaveImageWebsocket")
                .map(([node_id]) => String(node_id))
        );
    }

    async function generate_images(configuration_atom, index, part, multistage) {
        let images = [];

        let atom = configuration_atom;
        if (atom.terms.length !== 1) {
            Utils.snackbar(`Unexpected predicate ${atom.predicate}/${atom.terms.length} in #${index + 1}. @ComfyUI/Image Generation`);
            return [];
        }
        atom = atom.terms[0];
        if (atom.string === undefined) {
            Utils.snackbar(`Unexpected non-string argument in #${index + 1}. @ComfyUI/Image Generation`);
            return [];
        }

        try {
            const content = Base64.decode(atom.string);
            const expanded_content = await Utils.expand_mustache_queries(part, content, index, multistage);
            const configuration = Utils.parse_relaxed_json(expanded_content);
            const prompt = configuration.workflow || configuration;
            const save_image_websocket_node_ids = get_save_image_websocket_node_ids(prompt);
            const server = configuration.server || DEFAULT_SERVER;
            const timeout_value = Number(configuration.timeout_ms || configuration.timeout || 120000);
            const timeout = Number.isFinite(timeout_value) && timeout_value > 0 ? timeout_value : 120000;
            const client_id = configuration.client_id || crypto.randomUUID();
            const {http_base, ws_base} = normalize_server(server);

            // Open the WebSocket BEFORE queuing the prompt so we never miss
            // messages on fast (e.g. cached) second-run executions.
            await new Promise((resolve, reject) => {
                let done = false;
                let current_node = "";
                let prompt_id;
                let prompt_started = false;
                let prompt_completed = false;
                let queue_drained = false;
                const ws = new WebSocket(`${new URL("/ws", ws_base).toString()}?clientId=${encodeURIComponent(client_id)}`);
                ws.binaryType = "arraybuffer";

                let timeout_handle;

                const cleanup = () => {
                    clearTimeout(timeout_handle);
                };

                const finish = () => {
                    if (done) {
                        return;
                    }
                    done = true;
                    cleanup();
                    ws.close();
                    resolve();
                };

                const maybe_finish = () => {
                    if (prompt_completed && (queue_drained || save_image_websocket_node_ids.size === 0)) {
                        finish();
                    }
                };

                timeout_handle = setTimeout(() => {
                    if (done) {
                        return;
                    }
                    done = true;
                    cleanup();
                    ws.close();
                    reject(new Error(`Timeout while waiting for ComfyUI`));
                }, timeout);

                ws.onopen = async () => {
                    try {
                        const queued = await queue_prompt(http_base, prompt, client_id);
                        prompt_id = queued.prompt_id;
                        if (!prompt_id) {
                            if (!done) {
                                done = true;
                                cleanup();
                                ws.close();
                                reject(new Error("No prompt_id returned by ComfyUI"));
                            }
                        }
                    } catch (err) {
                        if (!done) {
                            done = true;
                            cleanup();
                            ws.close();
                            reject(err);
                        }
                    }
                };

                ws.onmessage = (event) => {
                    if (typeof event.data === "string") {
                        const message = JSON.parse(event.data);

                        if (message.type === "executing") {
                            const data = message.data || {};
                            if (!prompt_id || data.prompt_id !== prompt_id) {
                                return;
                            }

                            prompt_started = true;
                            current_node = data.node === null ? "" : String(data.node);

                            if (data.node === null) {
                                prompt_completed = true;
                                maybe_finish();
                            }
                            return;
                        }

                        if (message.type === "status") {
                            const queue_remaining = Number(message.data?.status?.exec_info?.queue_remaining);
                            // Guard with prompt_started: the server sends an initial
                            // status on connect that may show queue_remaining=0 before
                            // our prompt has even been submitted.
                            if (prompt_started && queue_remaining === 0) {
                                queue_drained = true;
                                maybe_finish();
                            }
                        }
                    } else if (save_image_websocket_node_ids.has(current_node) && !done) {
                        const bytes = new Uint8Array(event.data);
                        // Bytes 0-3: event type; bytes 4-7: image format (1=JPEG, 2=PNG)
                        const image_type = new DataView(event.data).getUint32(4);
                        const mime = image_type === 1 ? "image/jpeg" : "image/png";
                        const payload = bytes.slice(8);
                        const image_data_url = bytes_to_base64(payload);
                        images.push(image_data_url);
                    }
                };

                ws.onerror = () => {
                    if (!done) {
                        done = true;
                        cleanup();
                        ws.close();
                        reject(new Error("WebSocket error while waiting for ComfyUI execution"));
                    }
                };

                ws.onclose = () => {
                    if (!done) {
                        done = true;
                        cleanup();
                        reject(new Error("ComfyUI WebSocket closed before execution completed"));
                    }
                };
            });
        } catch (err) {
            Utils.snackbar(`#${index + 1}. @ComfyUI/Image Generation: ${err}`);
        }

        return images;
    }
</script>

<script>
    import {Button, Input, InputGroup, InputGroupText} from "@sveltestrap/sveltestrap";
    import Operation from "$lib/Operation.svelte";

    export let id;
    export let options;
    export let index;
    export let add_to_recipe;
    export let keybinding;

    function edit() {
        Recipe.edit_operation(id, index, options);
    }
</script>

<Operation {id} {operation} {options} {index} {default_extra_options} {add_to_recipe} {keybinding}>
    <InputGroup>
        <InputGroupText style="min-width: 8em;">Configuration</InputGroupText>
        <Input type="text" placeholder="predicate" bind:value={options.input_predicate} on:input={edit} data-testid="ComfyUI-ImageGeneration-input-predicate" />
        <Button outline="{!options.multistage}" on:click={() => { options.multistage = !options.multistage; edit(); }}>Multi-Stage</Button>
        <Button outline="{!options.echo}" on:click={() => { options.echo = !options.echo; edit(); }}>Echo</Button>
    </InputGroup>
    <InputGroup>
        <InputGroupText style="min-width: 8em;">Output</InputGroupText>
        <Input type="text" placeholder="predicate" bind:value={options.output_predicate} on:input={edit} />
    </InputGroup>
</Operation>
