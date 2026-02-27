<script context="module">
    import { Recipe } from "$lib/recipe";
    import { CreateServiceWorkerMLCEngine, prebuiltAppConfig } from "@mlc-ai/web-llm";
    import { writable } from "svelte/store";

    const operation = "@preview/@LLMs/Local AI Assistant";
    const default_extra_options = {
        model: "Qwen3-1.7B-q4f16_1-MLC",
        system_prompt: `
You are the "ASP Chef Sous-Chef," a technical assistant for ASP Chef, a pipeline manager for Answer Set Programming.
**ENVIRONMENT:**
The user is building a "Recipe" composed of a list of "Operations." You will be provided with a YAML list representing these operations. Treat this YAML as the current state of the kitchen.
**DATA STRUCTURE:**
* \`operation\`: The functional name of the step (e.g., "Search Models", "Solve").
* \`options\`: The parameters or logic rules for that step.


**CONTEXT FORMAT:**
The recipe is provided in YAML format.
* Lines starting with \`|\` indicate a multi-line ASP code block. Interpret these as raw ASP logic.
* Ignore metadata like \`id\` unless specifically asked.


**YOUR MISSION:**
1. **Contextual Awareness:** Use the provided YAML context to understand the user's current logic flow.
2. **Technical Support:** Explain the ASP logic (the \`rules\` or \`predicates\`) found within the \`options\`.
3. **Formatting:** When quoting rules, use Markdown code blocks. Clean up any literal \`\\n\` characters so the code is readable.
4. **Guidance:** Suggest improvements or explain dependencies between operations (e.g., how a "Search" feeds into a "Solve").
5. **Constraint:** Be technical and extremely concise. If context is missing, ask the user to provide their recipe.
        `.trim(),
        temperature: 0.7,
        top_p: 0.95,
        max_tokens: 1024,
        repetition_penalty: 1.1,
        context_ingredients: 0
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

    export let id;
    export let options;
    export let index;
    export let add_to_recipe;
    export let keybinding;

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

    function deleteMessage(index) {
        if (isGeneratingLocally) return;
        messages = messages.filter((_, i) => i !== index);
        if (editingIndex === index) {
            cancelEdit();
        } else if (editingIndex > index) {
            editingIndex--;
        }
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

    async function reset_service_worker() {
        Utils.confirm({
            message: "This will unregister the service worker and reload the page to fix stuck states. Continue?",
            onconfirm: async () => {
                if ("serviceWorker" in navigator) {
                    try {
                        const registrations = await navigator.serviceWorker.getRegistrations();
                        for (let registration of registrations) {
                            await registration.unregister();
                        }
                        Utils.snackbar("Service Worker reset. Reloading...");
                        setTimeout(() => window.location.reload(), 500);
                    } catch (e) {
                        console.error("Reset failed:", e);
                        Utils.snackbar("Reset failed: " + e.message);
                    }
                }
            }
        });
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

        // --- PREPARE CONTEXT ---
        const numIngredients = Math.min(options.context_ingredients || index, index);
        const context_prompt = numIngredients > 0 ? Recipe.ingredients_to_yaml(index - numIngredients, numIngredients) : "";

        messages = [...messages, { role: "assistant", content: "", showThinking: false }];

        try {
            await ensureEngineConnected($kitchenState.activeModel);
            const response = await sharedEngine.chat.completions.create({
                messages: [
                    { role: "system", content: options.system_prompt },
                    ...messages.slice(0, -1).map((m, i) => ({ role: m.role, content: context_prompt && i !== messages.length - 2 ? m.content : m.content +  `\n\n--- RECIPE CONTEXT (YAML) ---\n${context_prompt}\n---` }))
                ],
                temperature: options.temperature,
                top_p: options.top_p,
                max_tokens: options.max_tokens,
                repetition_penalty: options.repetition_penalty,
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

<style>
    /* Custom Scrollbar for the Kitchen */
    .chat-box::-webkit-scrollbar { width: 6px; }
    .chat-box::-webkit-scrollbar-track { background: transparent; }
    .chat-box::-webkit-scrollbar-thumb { background: #cbd5e0; border-radius: 10px; }

    /* Message Bubbles */
    .message-container {
        transition: transform 0.2s ease;
    }

    .message-bubble {
        border-radius: 12px;
        position: relative;
        transition: all 0.2s ease;
        max-width: 95%;
    }

    .user-bubble {
        background: #f8fbff;
        border-right: 4px solid #0d6efd !important;
        box-shadow: 0 2px 4px rgba(13, 110, 253, 0.05);
        margin-left: auto;
    }

    .assistant-bubble {
        background: #ffffff;
        border-left: 4px solid #198754 !important;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        margin-right: auto;
    }

    /* Action buttons visible on hover */
    .message-actions {
        opacity: 0;
        transition: opacity 0.2s ease;
        background: rgba(255, 255, 255, 0.9);
        border-radius: 6px;
        padding: 2px 8px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        z-index: 10;
    }

    .message-bubble:hover .message-actions {
        opacity: 1;
    }

    /* Thinking block styling */
    .thought-section {
        background: #fff9eb;
        border-radius: 6px;
        border: 1px dashed #ffeeba;
    }

    .status-pill {
        font-size: 0.7rem;
        letter-spacing: 0.5px;
        text-transform: uppercase;
    }

    /* Alignment Fix for Input Area */
    .input-row {
        display: grid;
        grid-template-columns: 1fr 100px;
        gap: 10px;
        align-items: start;
    }

    .kitchen-closed-overlay {
        background: rgba(241, 245, 249, 0.8);
        backdrop-filter: blur(2px);
        border-radius: 12px;
        z-index: 20;
    }
</style>

<Operation {id} {operation} {options} {index} {default_extra_options} {add_to_recipe} {keybinding}>
    <div class="p-3 border-0 rounded-3 bg-white shadow-sm overflow-hidden" style="border: 1px solid #e2e8f0 !important;">

        <div class="mb-3 p-2 bg-light border rounded-pill d-flex justify-content-between align-items-center px-3">
            <div class="d-flex align-items-center gap-2">
                <div class="rounded-circle { ($kitchenState.activeModel && $kitchenState.activeModel === options.model) ? 'bg-success' : 'bg-secondary' }" style="width: 8px; height: 8px; box-shadow: 0 0 5px { ($kitchenState.activeModel && $kitchenState.activeModel === options.model) ? '#198754' : '#6c757d' }"></div>
                <span class="small fw-bold text-muted status-pill">
                    {($kitchenState.activeModel && $kitchenState.activeModel === options.model) ? 'Kitchen Online' : 'Kitchen Closed'}
                </span>
            </div>
            {#if $kitchenState.activeModel}
                <span class="badge rounded-pill bg-white text-dark border shadow-sm px-3" style="font-size: 0.75rem;">
                    {$kitchenState.activeModel}
                </span>
            {/if}
        </div>

        <div class="d-flex gap-2 mb-3">
            <InputGroup size="sm" class="shadow-sm rounded">
                <InputGroupText class="bg-white border-end-0">🤖</InputGroupText>
                <Input type="text" bind:value={options.model} on:input={edit} disabled={$kitchenState.isBusy || $kitchenState.isLoading} list="model-options-{id}" class="border-start-0 border-end-0" placeholder="Select model..."/>
                <datalist id="model-options-{id}">
                    {#each availableModels as modelName}<option value={modelName}></option>{/each}
                </datalist>

                <Button color={$kitchenState.activeModel === options.model ? "warning" : "primary"} on:click={load_model} disabled={$kitchenState.isLoading || $kitchenState.isBusy || !options.model} class="px-3 fw-bold">
                    {#if $kitchenState.isLoading} <span class="spinner-border spinner-border-sm me-1"></span> Prep...
                    {:else if !$kitchenState.activeModel} Load
                    {:else if $kitchenState.activeModel === options.model} Reload
                    {:else} Swap Chef {/if}
                </Button>
            </InputGroup>
            <Button color="outline-secondary" size="sm" class="rounded shadow-sm" on:click={() => isTuningOpen = !isTuningOpen}>⚙️</Button>
            <Button color="outline-danger" size="sm" class="rounded shadow-sm" on:click={reset_service_worker} title="Reset Service Worker">🔄</Button>
        </div>

        <Collapse isOpen={isTuningOpen}>
            <div class="p-3 mb-3 border rounded-3 bg-white shadow-inner" style="border-style: dashed !important; border-color: #cbd5e0 !important;">
                <div class="row g-3">
                    <div class="col-6">
                        <!-- svelte-ignore a11y_label_has_associated_control -->
                        <label class="small fw-bold text-muted d-flex justify-content-between mb-1">
                            <span>HEAT (TEMP)</span>
                            <span>{options.temperature}</span>
                        </label>
                        <input type="range" class="form-range" min="0" max="2" step="0.1" bind:value={options.temperature} on:change={edit} />
                    </div>
                    <div class="col-6">
                        <!-- svelte-ignore a11y_label_has_associated_control -->
                        <label class="small fw-bold text-muted d-flex justify-content-between mb-1">
                            <span>PRECISION (TOP P)</span>
                            <span>{options.top_p}</span>
                        </label>
                        <input type="range" class="form-range" min="0" max="1" step="0.05" bind:value={options.top_p} on:change={edit} />
                    </div>
                    <div class="col-6 mt-2">
                        <!-- svelte-ignore a11y_label_has_associated_control -->
                        <label class="small fw-bold text-muted d-flex justify-content-between mb-1">
                            <span>MAX OUTPUT</span>
                            <span>{options.max_tokens}</span>
                        </label>
                        <input type="range" class="form-range" min="64" max="4096" step="64" bind:value={options.max_tokens} on:change={edit} />
                    </div>
                    <div class="col-6 mt-2">
                        <!-- svelte-ignore a11y_label_has_associated_control -->
                        <label class="small fw-bold text-muted d-flex justify-content-between mb-1">
                            <span>REPETITION</span>
                            <span>{options.repetition_penalty}</span>
                        </label>
                        <input type="range" class="form-range" min="1.0" max="2.0" step="0.01" bind:value={options.repetition_penalty} on:change={edit} />
                    </div>
                    <div class="col-12 mt-2">
                        <!-- svelte-ignore a11y_label_has_associated_control -->
                        <label class="small fw-bold text-muted d-flex justify-content-between mb-1">
                            <span>CONTEXT INGREDIENTS (steps above this one)</span>
                            <span>{options.context_ingredients}</span>
                        </label>
                        <input type="range" class="form-range" min="0" max={index} step="1" bind:value={options.context_ingredients} on:change={edit} />
                    </div>
                    <div class="col-12 mt-2">
                        <InputGroup size="sm" class="mb-3 shadow-sm rounded overflow-hidden">
                            <InputGroupText class="bg-dark text-white border-0"><small class="fw-bold px-1">SYSTEM</small></InputGroupText>
                            <Input type="textarea" bind:value={options.system_prompt} on:input={edit} rows={10} disabled={$kitchenState.isBusy} class="border-0 bg-light" style="resize: none;" />
                        </InputGroup>
                    </div>
                </div>
            </div>
        </Collapse>

        {#if $kitchenState.isLoading}
            <div class="mb-3 px-1">
                <Progress animated striped={$kitchenState.progress === 0} color="primary" value={$kitchenState.progress === 0 ? 100 : $kitchenState.progress} style="height: 8px;" class="rounded-pill shadow-sm" />
                <div class="text-center mt-2 monospace text-primary" style="font-size: 0.7rem;">{$kitchenState.progressText}</div>
            </div>
        {/if}

        <div class="position-relative">
            {#if !$kitchenState.activeModel || $kitchenState.activeModel !== options.model || $kitchenState.isLoading}
                <div class="kitchen-closed-overlay position-absolute w-100 h-100 d-flex flex-column align-items-center justify-content-center text-center p-4">
                    <span style="font-size: 3rem;" class="mb-2">⏳</span>
                    <h6 class="fw-bold text-muted">Kitchen Station Blocked</h6>
                    <p class="small text-muted px-4">
                        {#if $kitchenState.isLoading} Prepping the environment... {:else} Please load <strong>{options.model}</strong> to start the session. {/if}
                    </p>
                    {#if !$kitchenState.isLoading}
                        <Button color="primary" size="sm" class="rounded-pill px-4 shadow-sm" on:click={load_model}>Load Chef</Button>
                    {/if}
                </div>
            {/if}

            <div bind:this={chatContainer} class="chat-box mb-3 d-flex flex-column gap-3" style="height:400px; overflow-y:auto; background:#f1f5f9; border:1px solid #e2e8f0; padding:20px; border-radius:12px;" on:scroll={() => { if (chatContainer) isUserScrolling = (chatContainer.scrollHeight - chatContainer.scrollTop - chatContainer.clientHeight) > 30; }}>

                {#if messages.length === 0}
                    <div class="h-100 d-flex flex-column align-items-center justify-content-center text-muted opacity-50">
                        <span style="font-size: 3rem;">🥘</span>
                        <p class="small mt-2 fw-bold">The station is ready. Ask for a recipe or technique.</p>
                    </div>
                {/if}

                {#each messages as msg, i}
                    <div class="message-container d-flex flex-column">
                        <div class="message-bubble p-3 border {msg.role === 'user' ? 'user-bubble' : 'assistant-bubble'}">

                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <div class="fw-bold text-uppercase text-muted" style="font-size: 0.65rem; letter-spacing: 1px;">
                                    {msg.role === 'user' ? '👨‍🍳 Executive Chef' : '🤖 Sous Chef'}
                                </div>
                                <div class="message-actions position-absolute top-0 end-0 m-2 d-flex gap-1 border">
                                    <button class="btn btn-sm btn-link p-0 px-1 text-decoration-none" on:click={() => copyToClipboard(msg.content)} title="Copy">📋</button>
                                    <button class="btn btn-sm btn-link p-0 px-1 text-decoration-none" on:click={() => editMessage(i)} title="Edit">✏️</button>
                                    <button class="btn btn-sm btn-link p-0 px-1 text-decoration-none text-danger" on:click={() => deleteMessage(i)} title="Delete" disabled={isGeneratingLocally}>🗑️</button>
                                </div>
                            </div>

                            {#if editingIndex === i}
                                <Input type="textarea" bind:value={editingContent} rows={3} class="mb-2 shadow-inner bg-white" />
                                <div class="d-flex gap-2 justify-content-end">
                                    <Button size="sm" color="light" class="border" on:click={cancelEdit}>Cancel</Button>
                                    <Button size="sm" color="primary" on:click={saveEdit}>Save</Button>
                                </div>
                            {:else}
                                {#each parseMessage(msg.content) as part}
                                    {#if part.type === 'thought'}
                                        <div class="thought-section mb-2 p-2 ps-3">
                                            <button class="btn btn-sm btn-link text-decoration-none p-0 text-warning fw-bold d-flex align-items-center" style="font-size: 0.7rem" on:click={() => msg.showThinking = !msg.showThinking}>
                                                <span class="me-1">{msg.showThinking ? '▼' : '▶'}</span>
                                                INTERNAL MONOLOGUE {part.isOpen ? '(THINKING...)' : ''}
                                            </button>
                                            {#if msg.showThinking || (isGeneratingLocally && i === messages.length - 1 && part.isOpen)}
                                                <div class="small text-muted mt-2 fst-italic border-top pt-2 opacity-75">{@html Utils.render_markdown(part.content)}</div>
                                            {/if}
                                        </div>
                                    {:else}
                                        <div class="markdown-body text-dark" style="font-size: 0.95rem; line-height: 1.6;">
                                            {@html Utils.render_markdown(part.content || (isGeneratingLocally && i === messages.length - 1 && msg.role === 'assistant' ? "..." : ""))}
                                        </div>
                                    {/if}
                                {/each}
                            {/if}
                        </div>
                    </div>
                {/each}
            </div>

            <div class="input-row align-items-stretch">
                <div class="bg-white border rounded-3 p-1 shadow-sm d-flex align-items-center">
                    <Input type="textarea" bind:value={userInput} placeholder="Ask your Sous-Chef..."
                        class="border-0 shadow-none bg-transparent"
                        style="max-height: 150px; min-height: 50px; resize: none; width: 100%;"
                        disabled={$kitchenState.isBusy || $kitchenState.isLoading || $kitchenState.activeModel !== options.model}
                        on:keydown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send_message(); } }} />
                </div>

                <div class="d-flex flex-column gap-1 justify-content-between">
                    {#if isGeneratingLocally}
                        <Button color="danger" class="rounded-3 shadow-sm fw-bold w-100" style="height: 50px;" on:click={() => sharedEngine.interruptGenerate()}>STOP</Button>
                    {:else}
                        <Button color="success" class="rounded-3 shadow-sm fw-bold w-100" style="height: 50px;" on:click={send_message} disabled={!userInput.trim() || $kitchenState.isBusy || $kitchenState.isLoading || $kitchenState.activeModel !== options.model}>
                            { $kitchenState.isBusy ? '...' : 'SEND' }
                        </Button>
                    {/if}
                    <div class="d-flex flex-column align-items-center mt-1">
                        {#if $kitchenState.isBusy && !isGeneratingLocally}
                            <Button color="link" size="sm" class="text-danger text-decoration-none fw-bold p-0 mb-1" style="font-size: 0.6rem;" on:click={force_stop_global}>KILL</Button>
                        {/if}
                        <Button color="link" size="sm" class="text-muted text-decoration-none fw-bold p-0" style="font-size: 0.7rem;" on:click={clear_messages}>CLEAR</Button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</Operation>