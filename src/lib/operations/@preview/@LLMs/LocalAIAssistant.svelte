<script context="module">
    import { Recipe } from "$lib/recipe";
    import { CreateServiceWorkerMLCEngine, prebuiltAppConfig } from "@mlc-ai/web-llm";
    import { writable } from "svelte/store";

    const operation = "@preview/@LLMs/Local AI Assistant";
    const default_extra_options = {
        model: "Qwen3-1.7B-q4f16_1-MLC",
        system_prompt: "You are a professional Sous-Chef assistant. Be concise.",
        temperature: 0.7,
        top_p: 0.95,
        max_tokens: 1024,
        repetition_penalty: 1.1
    };

    const availableModels = prebuiltAppConfig.model_list.map(m => m.model_id);

    export const kitchenState = writable({
        activeModel: null,
        isBusy: false,
        isLoading: false,
        progressText: '',
        progress: 0
    });

    export let sharedEngine = null;

    // --- PRIVATE INTERCOM ---
    let syncChannel;
    if (typeof window !== 'undefined') {
        syncChannel = new BroadcastChannel('kitchen_state_channel');

        syncChannel.onmessage = (event) => {
            if (event.data?.type === 'KITCHEN_STATE_UPDATE') {
                kitchenState.set(event.data.state);
            }
        };
    }

    export function mutateKitchen(payload) {
        if (syncChannel) {
            syncChannel.postMessage({
                type: 'KITCHEN_MUTATE_STATE',
                payload
            });
        }
    }

    Recipe.register_operation_type(operation, async (input) => input);
</script>

<script>
    import { onMount, onDestroy } from "svelte";
    import { Button, Input, InputGroup, InputGroupText, Progress, Collapse } from "@sveltestrap/sveltestrap";
    import Operation from "$lib/Operation.svelte";
    import { Utils } from "$lib/utils";

    export let id; export let options; export let index;
    export let add_to_recipe; export let keybinding;

    let isTuningOpen = false;
    let messages = [];
    let userInput = "";
    let isGeneratingLocally = false;
    let pendingClear = false;
    let chatContainer;
    let isUserScrolling = false;
    let editingIndex = -1;
    let editingContent = "";

    function editMessage(index) {
        editingIndex = index;
        editingContent = messages[index].content;
    }

    function cancelEdit() {
        editingIndex = -1;
        editingContent = "";
    }

    async function saveEdit() {
        if (editingIndex === -1) return;
        messages[editingIndex].content = editingContent;
        messages = [...messages];
        const prevIndex = editingIndex;
        cancelEdit();

        // If it was a user message, we might want to re-generate from here?
        // For now, just save it.
        if (messages[prevIndex].role === 'user' && prevIndex === messages.length - 1) {
            // Optional: auto-regenerate if it's the last message
        }
    }

    async function copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            Utils.snackbar("Copied to clipboard!");
        } catch (err) {
            console.error('Failed to copy: ', err);
        }
    }

    onMount(async () => {
        if ("serviceWorker" in navigator) {
            await navigator.serviceWorker.register('/service-worker.js', { type: 'module' });
            await navigator.serviceWorker.ready;

            // Ask for state via our private channel ONLY
            if (syncChannel) {
                syncChannel.postMessage({ type: 'KITCHEN_REQUEST_STATE' });
            }
        }
    });

    onDestroy(() => {
        if (isGeneratingLocally && sharedEngine) {
            sharedEngine.interruptGenerate();
            mutateKitchen({ isBusy: false });
        }
    });

    function edit() { Recipe.edit_operation(id, index, options); }

    // --- ENGINE ACTIONS ---

    async function load_model() {
        if (!options?.model || $kitchenState.isLoading) return;

        mutateKitchen({
            isLoading: true,
            progress: 0,
            progressText: "Prepping the Kitchen..."
        });

        try {
            sharedEngine = await CreateServiceWorkerMLCEngine(options.model, {
                initProgressCallback: (p) => {
                    mutateKitchen({
                        progress: Math.round((p?.progress ?? 0) * 100),
                        progressText: p?.text ?? ""
                    });
                }
            });

            mutateKitchen({ isLoading: false, activeModel: options.model });
            Utils.snackbar(`${options.model} is loaded and ready.`);
        } catch (error) {
            console.error("Load Error:", error);
            Utils.snackbar(`Load error: ${error.message}`);
            mutateKitchen({ isLoading: false });
        }
    }

    async function ensureEngineConnected(modelId) {
        // If another tab loaded the model, our local sharedEngine pointer might be null.
        // Re-establish the client-side binding to the active SW.
        if (!sharedEngine) {
            sharedEngine = await CreateServiceWorkerMLCEngine(modelId);
        }
    }

    function force_stop_global() {
        if (sharedEngine) sharedEngine.interruptGenerate();
        mutateKitchen({ isBusy: false });
        isGeneratingLocally = false;
    }

    async function clear_messages() {
        // 1. Instantly wipe the UI and flag the stream to stop
        messages = [];
        pendingClear = true;

        // 2. ONLY send the interrupt signal. Do NOT send resetChat().
        if (sharedEngine && isGeneratingLocally) {
            try {
                force_stop_global();
            } catch (e) {
                console.error("Interrupt failed:", e);
            }
        }

        // 3. Reset the flag immediately if we weren't generating
        if (!isGeneratingLocally) {
            pendingClear = false;
        }
    }

    async function send_message() {
        if (!userInput.trim() || !$kitchenState.activeModel || isGeneratingLocally || $kitchenState.isBusy) return;

        messages = [...messages, { role: "user", content: userInput.trim() }];
        userInput = "";
        await generate_response();
    }

    async function generate_response() {
        if (!$kitchenState.activeModel || isGeneratingLocally || $kitchenState.isBusy) return;

        isGeneratingLocally = true;
        mutateKitchen({ isBusy: true });
        pendingClear = false;

        messages = [...messages, { role: "assistant", content: "", showThinking: false }];

        try {
            await ensureEngineConnected($kitchenState.activeModel);

            const response = await sharedEngine.chat.completions.create({
                messages: [
                    { role: "system", content: options.system_prompt },
                    ...messages.slice(0, -1).map(m => ({ role: m.role, content: m.content }))
                ],
                temperature: options.temperature,
                top_p: options.top_p,
                max_tokens: options.max_tokens,
                stream: true,
            });

            for await (const chunk of response) {
                if (pendingClear) break;

                const cur = chunk.choices[0]?.delta?.content;

                // CRUCIAL FIX: Check messages.length > 0 to prevent crashes
                // if a chunk arrives the exact millisecond after clearing
                if (cur && messages.length > 0) {
                    messages[messages.length - 1].content += cur;
                    messages = [...messages]; // Forces Svelte to safely update the DOM

                    if (chatContainer && !isUserScrolling) {
                        chatContainer.scrollTop = chatContainer.scrollHeight;
                    }
                }
            }
        } catch (e) {
            if (e.name !== "AbortError") {
                console.error("Generation Error:", e);
                if (e.message.toLowerCase().includes("worker")) {
                    mutateKitchen({ activeModel: null, isBusy: false });
                    sharedEngine = null;
                }
            }
        } finally {
            isGeneratingLocally = false;
            mutateKitchen({ isBusy: false });

            if (pendingClear) {
                messages = [];
                pendingClear = false;
            }
        }
    }

    // Parses <think> tags for UI rendering
    function parseMessage(content) {
        const parts = [];
        let remaining = content;

        while (remaining.length > 0) {
            const thinkStart = remaining.indexOf('<think>');
            if (thinkStart === -1) {
                parts.push({ type: 'text', content: remaining });
                break;
            }

            if (thinkStart > 0) {
                parts.push({ type: 'text', content: remaining.slice(0, thinkStart) });
            }

            const thinkEnd = remaining.indexOf('</think>', thinkStart + 7);
            if (thinkEnd === -1) {
                // Unclosed thinking tag (still streaming or model forgot)
                parts.push({ type: 'thought', content: remaining.slice(thinkStart + 7), isOpen: true });
                break;
            } else {
                parts.push({ type: 'thought', content: remaining.slice(thinkStart + 7, thinkEnd), isOpen: false });
                remaining = remaining.slice(thinkEnd + 8);
            }
        }

        return parts;
    }
</script>

<Operation {id} {operation} {options} {index} {default_extra_options} {add_to_recipe} {keybinding}>
    <div class="p-2 border rounded bg-light shadow-sm">

        <div class="mb-2 p-2 bg-white border rounded d-flex justify-content-between align-items-center">
            <span class="small fw-bold text-muted">Active Global Model:</span>
            {#if $kitchenState.activeModel}
                <span class="badge bg-success">{$kitchenState.activeModel}</span>
            {:else}
                <span class="badge bg-secondary">None Loaded</span>
            {/if}
        </div>

        <div class="d-flex gap-2 mb-2">
            <InputGroup size="sm">
                <InputGroupText>Model</InputGroupText>
                <Input type="text" bind:value={options.model} on:input={edit} disabled={$kitchenState.isBusy || $kitchenState.isLoading} list="model-options-{id}"/>
                <datalist id="model-options-{id}">
                    {#each availableModels as modelName}<option value={modelName}></option>{/each}
                </datalist>

                <Button color={$kitchenState.activeModel === options.model ? "warning" : "primary"} on:click={load_model} disabled={$kitchenState.isLoading || $kitchenState.isBusy || !options.model}>
                    {#if $kitchenState.isLoading} Loading...
                    {:else if !$kitchenState.activeModel} Load
                    {:else if $kitchenState.activeModel === options.model} Reload
                    {:else} Replace {/if}
                </Button>
            </InputGroup>
            <Button color="outline-secondary" size="sm" on:click={() => isTuningOpen = !isTuningOpen}>Tune ⚙️</Button>
        </div>

        <Collapse isOpen={isTuningOpen}>
            <div class="p-2 mb-2 border rounded bg-white" style="font-size: 0.85rem; border-style: dashed !important;">
                <div class="row g-2">
                    <div class="col-6">
                        <label class="small fw-bold d-block">
                            Temp: {options.temperature}
                            <input type="range" class="form-range" min="0" max="2" step="0.1" bind:value={options.temperature} on:change={edit} />
                        </label>
                    </div>
                    <div class="col-6">
                        <label class="small fw-bold d-block">
                            Top P: {options.top_p}
                            <input type="range" class="form-range" min="0" max="1" step="0.05" bind:value={options.top_p} on:change={edit} />
                        </label>
                    </div>
                </div>
            </div>
        </Collapse>

        <InputGroup size="sm" class="mb-2">
            <InputGroupText>System</InputGroupText>
            <Input type="textarea" bind:value={options.system_prompt} on:input={edit} rows={1} disabled={$kitchenState.isBusy} />
        </InputGroup>

        {#if $kitchenState.isLoading}
            <Progress animated striped={$kitchenState.progress === 0} color={$kitchenState.progress === 0 ? "info" : "primary"} value={$kitchenState.progress === 0 ? 100 : $kitchenState.progress} class="mb-2" />
            <div class="text-center small monospace mb-2">{$kitchenState.progressText}</div>
        {/if}

        {#if $kitchenState.activeModel}
            <div bind:this={chatContainer} class="chat-box mb-2" style="height:400px; overflow-y:auto; background:#fdfdfd; border:1px solid #dee2e6; padding:15px; border-radius:8px;" on:scroll={(e) => { isUserScrolling = (e.target.scrollHeight - e.target.scrollTop - e.target.clientHeight) > 30; }}>
                {#each messages as msg, i}
                    <div class="mb-3 p-2 rounded position-relative {msg.role === 'user' ? 'bg-light border-end border-primary border-3' : 'bg-white border shadow-sm border-start border-success border-3'} group">
                        <div class="d-flex justify-content-between align-items-center mb-1">
                            <div class="fw-bold small text-muted">{msg.role === 'user' ? '👨‍🍳 USER' : '🤖 AI'}</div>
                            <div class="d-flex gap-1 opacity-75">
                                <button class="btn btn-sm btn-link p-0 text-decoration-none" on:click={() => copyToClipboard(msg.content)} title="Copy message">
                                    <small>📋</small>
                                </button>
                                {#if msg.role === 'user'}
                                    <button class="btn btn-sm btn-link p-0 text-decoration-none" on:click={() => editMessage(i)} title="Edit message">
                                        <small>✏️</small>
                                    </button>
                                {/if}
                            </div>
                        </div>

                        {#if editingIndex === i}
                            <Input type="textarea" bind:value={editingContent} rows={3} class="mb-2" />
                            <div class="d-flex gap-2 justify-content-end">
                                <Button size="sm" color="secondary" on:click={cancelEdit}>Cancel</Button>
                                <Button size="sm" color="primary" on:click={saveEdit}>Save</Button>
                            </div>
                        {:else}
                            {#each parseMessage(msg.content) as part}
                                {#if part.type === 'thought'}
                                    <div class="mb-2 border-start border-2 ps-2 bg-light bg-opacity-50">
                                        <button class="btn btn-sm btn-link text-decoration-none py-0 px-1 text-muted" style="font-size: 0.75rem" on:click={() => msg.showThinking = !msg.showThinking}>
                                            {msg.showThinking ? '▼ Hide Thought' : '▶ Show Thought'} {part.isOpen ? '(thinking...)' : ''}
                                        </button>
                                        {#if msg.showThinking || (isGeneratingLocally && i === messages.length - 1 && part.isOpen)}
                                            <div class="small text-muted mt-1 fst-italic">{@html Utils.render_markdown(part.content)}</div>
                                        {/if}
                                    </div>
                                {:else}
                                    <div class="markdown-body">
                                        {@html Utils.render_markdown(part.content || (isGeneratingLocally && i === messages.length - 1 && msg.role === 'assistant' ? "..." : ""))}
                                    </div>
                                {/if}
                            {/each}
                        {/if}
                    </div>
                {/each}
            </div>

            <div class="d-flex gap-2">
                <Input type="textarea" bind:value={userInput} placeholder="Ask the model..." disabled={$kitchenState.isBusy || $kitchenState.isLoading} on:keydown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send_message())} />
                <div class="d-flex flex-column gap-1">
                    {#if isGeneratingLocally}
                        <Button color="danger" on:click={() => sharedEngine.interruptGenerate()}>Stop</Button>
                    {:else}
                        <Button color="primary" on:click={send_message} disabled={!userInput.trim() || $kitchenState.isBusy || $kitchenState.isLoading}>
                            {$kitchenState.isBusy ? 'Busy...' : 'Send'}
                        </Button>
                        {#if $kitchenState.isBusy}
                            <Button color="outline-danger" size="sm" style="font-size: 0.7rem;" on:click={force_stop_global}>Force Stop</Button>
                        {/if}
                    {/if}
                    <Button color="link" size="sm" class="text-decoration-none" on:click={clear_messages}>Clear</Button>
                </div>
            </div>
        {/if}
    </div>
</Operation>