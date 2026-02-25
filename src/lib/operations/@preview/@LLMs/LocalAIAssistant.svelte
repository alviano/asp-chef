<script context="module">
    import { Recipe } from "$lib/recipe";
    import { CreateServiceWorkerMLCEngine, prebuiltAppConfig } from "@mlc-ai/web-llm";

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

    Recipe.register_operation_type(operation, async (input) => input);
</script>

<script>
    import { Button, Input, InputGroup, InputGroupText, Progress, Collapse } from "@sveltestrap/sveltestrap";
    import Operation from "$lib/Operation.svelte";
    import { Utils } from "$lib/utils";

    export let id; export let options; export let index;
    export let add_to_recipe; export let keybinding;

    let engine = null;
    let loadProgress = 0;
    let loadText = "";
    let isLoading = false;
    let isModelLoaded = false;
    let isTuningOpen = false;

    // Chat State
    let messages = [];
    let userInput = "";
    let isGenerating = false;
    let chatContainer;

    // Editing State
    let editingIndex = -1;
    let editingContent = "";

    function edit() { Recipe.edit_operation(id, index, options); }

    function handle_model_change() {
        isModelLoaded = false;
        edit();
    }

    async function load_model() {
        if (!options?.model || isLoading) return;
        handle_model_change();
        isLoading = true;
        loadProgress = 0;

        try {
            if ("serviceWorker" in navigator) {
                const registration = await navigator.serviceWorker.register('/service-worker.js', { type: 'module' });
                await navigator.serviceWorker.ready;

                if (!navigator.serviceWorker.controller) {
                    await new Promise((resolve) => {
                        navigator.serviceWorker.addEventListener("controllerchange", resolve, { once: true });
                    });
                }
                if (navigator.storage?.persist) await navigator.storage.persist();
            }

            // If an engine already exists, Web-LLM handles the re-initialization natively
            engine = await CreateServiceWorkerMLCEngine(options.model, {
                initProgressCallback: (p) => {
                    loadProgress = Math.round((p?.progress ?? 0) * 100);
                    loadText = p?.text ?? "";
                }
            });

            isModelLoaded = true;
            Utils.snackbar("Kitchen is ready! Service Worker connected.");
        } catch (error) {
            console.error("Engine Load Error:", error);
            Utils.snackbar(`Chef, we have a problem: ${error.message}`);
        } finally {
            isLoading = false;
        }
    }

    function parseMessage(content) {
        const thinkMatch = content.match(/<think>([\s\S]*?)(?:<\/think>|$)/);
        const thinking = thinkMatch ? thinkMatch[1].trim() : "";
        const finalAnswer = content.replace(/<think>[\s\S]*?(?:<\/think>|$)/, "").trim();

        return { thinking, finalAnswer };
    }

    async function send_message() {
        if (!userInput.trim() || !isModelLoaded || isGenerating) return;

        const text = userInput.trim();
        userInput = "";
        messages = [...messages, { role: "user", content: text }];

        await generate_response();
    }

    async function generate_response() {
        if (!isModelLoaded || isGenerating) return;
        isGenerating = true;

        messages = [...messages, { role: "assistant", content: "", showThinking: false }];
        scroll_to_bottom();

        try {
            const response = await engine.chat.completions.create({
                messages: [
                    { role: "system", content: options.system_prompt },
                    ...messages.slice(0, -1).map(m => ({ role: m.role, content: m.content }))
                ],
                temperature: options.temperature,
                top_p: options.top_p,
                max_tokens: options.max_tokens,
                repetition_penalty: options.repetition_penalty,
                stream: true,
            });

            for await (const chunk of response) {
                const cur = chunk.choices[0]?.delta?.content;
                if (cur) {
                    messages[messages.length - 1].content += cur;
                    messages = messages;
                    scroll_to_bottom();
                }
            }
        } catch (e) {
            if (e.name !== "AbortError") {
                console.error("Generation Error:", e);
                Utils.snackbar(`Engine Error: ${e.message}`);
                // If the worker crashes or WebGPU loses context, force a reload state
                if (e.message.toLowerCase().includes("worker") || e.message.toLowerCase().includes("context")) {
                    isModelLoaded = false;
                    engine = null;
                }
            }
        } finally {
            isGenerating = false;
        }
    }

    function scroll_to_bottom() {
        setTimeout(() => { if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight; }, 50);
    }

    function save_edit(i) {
        messages[i].content = editingContent;
        // Trim history back to the edited message
        messages = messages.slice(0, i + 1);
        editingIndex = -1;
        edit();
        // We no longer call generate_response() automatically here!
    }
</script>

<Operation {id} {operation} {options} {index} {default_extra_options} {add_to_recipe} {keybinding}>
    <div class="p-2 border rounded bg-light shadow-sm">
        <div class="d-flex gap-2 mb-2">
            <InputGroup size="sm">
                <InputGroupText>Model</InputGroupText>
                <Input
                    type="text"
                    bind:value={options.model}
                    disabled={isGenerating || isLoading}
                    list="model-options-{id}"
                    placeholder="Search or type model ID..."
                />

                <datalist id="model-options-{id}">
                    {#each availableModels as modelName}
                        <option value={modelName}></option>
                    {/each}
                </datalist>
                <Button color={isModelLoaded ? "warning" : "primary"} on:click={load_model} disabled={isLoading}>
                    {isModelLoaded ? 'Reload' : 'Load'}
                </Button>
            </InputGroup>
            <Button color="outline-secondary" size="sm" on:click={() => isTuningOpen = !isTuningOpen}>
                {isTuningOpen ? 'Hide Tuning' : 'Tune ⚙️'}
            </Button>
        </div>

        <Collapse isOpen={isTuningOpen}>
            <div class="tuning-panel p-2 mb-2 border rounded bg-white">
                <div class="row g-2">
                    <div class="col-6">
                        <label class="small fw-bold">Temp: {options.temperature}</label>
                        <input type="range" class="form-range" min="0" max="2" step="0.1" bind:value={options.temperature} on:change={edit} />
                    </div>
                    <div class="col-6">
                        <label class="small fw-bold">Top P: {options.top_p}</label>
                        <input type="range" class="form-range" min="0" max="1" step="0.05" bind:value={options.top_p} on:change={edit} />
                    </div>
                    <div class="col-6">
                        <InputGroup size="sm">
                            <InputGroupText>Max Tokens</InputGroupText>
                            <Input type="number" bind:value={options.max_tokens} on:input={edit} />
                        </InputGroup>
                    </div>
                    <div class="col-6">
                        <InputGroup size="sm">
                            <InputGroupText>Rep. Penalty</InputGroupText>
                            <Input type="number" step="0.1" bind:value={options.repetition_penalty} on:input={edit} />
                        </InputGroup>
                    </div>
                </div>
            </div>
        </Collapse>

        <InputGroup size="sm" class="mb-2">
            <InputGroupText>System</InputGroupText>
            <Input type="textarea" bind:value={options.system_prompt} on:input={edit} rows={1} />
        </InputGroup>

        {#if isLoading}
            <Progress animated value={loadProgress} class="mb-2" />
            <div class="text-center x-small monospace mb-2">{loadText}</div>
        {/if}

        {#if isModelLoaded}
            <div bind:this={chatContainer} class="chat-box mb-2" class:generating={isGenerating}>
                {#each messages as msg, i}
                    {@const { thinking, finalAnswer } = parseMessage(msg.content)}
                    <div class="message {msg.role} mb-3">
                        <div class="d-flex justify-content-between x-small mb-1 align-items-center opacity-75">
                            <span class="fw-bold">{msg.role === 'user' ? '👨‍🍳 HEAD CHEF' : '🤖 SOUS-CHEF'}</span>
                            {#if !isGenerating}
                                <div class="actions">
                                    <button on:click={() => navigator.clipboard.writeText(msg.content)} title="Copy Raw">📋</button>
                                    <button on:click={() => { editingIndex = i; editingContent = msg.content; }} title="Edit">✎</button>
                                    <button on:click={() => messages = messages.filter((_, idx) => idx !== i)} title="Delete">✕</button>
                                </div>
                            {/if}
                        </div>

                        <div class="content p-2 rounded shadow-sm">
                            {#if editingIndex === i}
                                <Input type="textarea" bind:value={editingContent} rows={4} class="edit-area mb-2" />
                                <div class="d-flex gap-2 justify-content-end">
                                    <Button size="sm" color="success" on:click={() => save_edit(i)}>Save Edit</Button>
                                    <Button size="sm" color="secondary" on:click={() => editingIndex = -1}>Cancel</Button>
                                </div>
                            {:else}
                                {#if thinking}
                                    <div class="thinking-container mb-2">
                                        <button class="btn-think" on:click={() => messages[i].showThinking = !messages[i].showThinking}>
                                            {msg.showThinking ? '▼ Hide Thought' : '▶ Show Thought'}
                                        </button>
                                        {#if msg.showThinking || (isGenerating && i === messages.length - 1)}
                                            <div class="thinking-process mt-1 p-2">{@html Utils.render_markdown(thinking)}</div>
                                        {/if}
                                    </div>
                                {/if}
                                <div class="markdown-body">
                                    {@html Utils.render_markdown(finalAnswer || (isGenerating && i === messages.length - 1 ? "..." : ""))}
                                </div>
                            {/if}
                        </div>
                    </div>
                {/each}
            </div>

            <div class="d-flex gap-2">
                <Input type="textarea" bind:value={userInput} placeholder="Chef, what's the order? (Tip: conclude with /no_think to try to disable thinking)"
                       disabled={isGenerating} on:keydown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send_message())} />
                <div class="d-flex flex-column gap-1">
                    {#if isGenerating}
                        <Button color="danger" on:click={() => engine.interruptGenerate()}>STOP</Button>
                    {:else}
                        <Button color="primary" on:click={send_message} disabled={!userInput.trim()}>SEND</Button>
                    {/if}
                    <Button color="link" size="sm" on:click={() => messages = []} class="text-decoration-none">Clear</Button>
                </div>
            </div>
        {/if}
    </div>
</Operation>

<style>
    .tuning-panel { font-size: 0.85rem; border: 1px dashed #ccc !important; }
    .chat-box { height: 400px; overflow-y: auto; background: #fff; border: 1px solid #ced4da; padding: 15px; border-radius: 8px; }
    .chat-box.generating { border-color: #0d6efd; }
    .message.user .content { background: #f0f7ff; border-right: 3px solid #0d6efd; }
    .message.assistant .content { background: #f8f9fa; border-left: 3px solid #198754; }
    .btn-think { border: none; background: #eee; font-size: 0.7rem; padding: 2px 8px; border-radius: 4px; color: #666; }
    .thinking-process { font-size: 0.85rem; color: #888; background: #fcfcfc; border-left: 2px solid #dee2e6; }
    .edit-area { font-family: monospace; font-size: 0.85rem; background: #fffbe6; }
    .x-small { font-size: 0.7rem; }
    .actions button { border: none; background: transparent; font-size: 0.8rem; padding: 0 4px; opacity: 0.6; }
    .actions button:hover { opacity: 1; }
    .pointer { cursor: pointer; }
</style>