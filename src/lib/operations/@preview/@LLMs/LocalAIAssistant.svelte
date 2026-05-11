<script context="module">
    import { Recipe, Option } from "$lib/recipe";
    import { CreateServiceWorkerMLCEngine, prebuiltAppConfig } from "@mlc-ai/web-llm";
    import { writable } from "svelte/store";
    import { AIAssistantUtils } from "./ai_assistant";
    import { recipe_input } from "$lib/stores";

    const operation = "@preview/@LLMs/Local AI Assistant";
    export const default_extra_options = {
        model: Option("Qwen3-1.7B-q4f16_1-MLC", "The model ID to use", "string"),
        ...AIAssistantUtils.common_extra_options(),
        repetition_penalty: Option(1.1, "Repetition penalty", "number")
    };
    const availableModels = prebuiltAppConfig.model_list.map(m => m.model_id);
    export const kitchenState = writable({
        activeModel: null,
        isBusy: false,
        isLoading: false,
        progressText: "",
        progress: 0
    });
    export let sharedEngine = null;
    // --- PRIVATE INTERCOM ---
    let syncChannel;
    if (typeof window !== "undefined") {
        syncChannel = new BroadcastChannel("kitchen_state_channel");
        syncChannel.onmessage = (event) => {
            if (event.data?.type === "KITCHEN_STATE_UPDATE") {
                kitchenState.set(event.data.state);
            }
        };
    }
    export function mutateKitchen(payload) {
        if (syncChannel) {
            syncChannel.postMessage({
                type: "KITCHEN_MUTATE_STATE",
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
    import AIAssistantChat from "./+AIAssistant.svelte";
    export let id;
    export let options;
    export let index;
    export let add_to_recipe;
    export let keybinding;
    let isTuningOpen = false;
    let messages = [];
    let userInput = "";
    let isGeneratingLocally = false;
    let isSystemWorking = false;
    let interactionCount = 0;
    let pendingClear = false;
    let chatContainer;
    let isUserScrolling = false;
    let editingIndex = -1;
    let editingContent = "";

    let input_of_operation = [];
    Recipe.register_operation_type(operation, async (input) => {
        input_of_operation = input;
        return input;
    });

    $: cl = AIAssistantUtils.common_logic(messages, userInput, isGeneratingLocally, interactionCount, generate_response);
    function editMessage(index) {
        ({ editingIndex, editingContent } = cl.editMessage(index));
    }
    function deleteMessage(index) {
        if (isGeneratingLocally) return;
        ({ messages, editingIndex, editingContent } = cl.deleteMessage(index, editingIndex));
    }
    function cancelEdit() {
        editingIndex = -1;
        editingContent = "";
    }
    async function saveEdit() {
        ({ messages, editingIndex, editingContent } = cl.saveEdit(editingIndex, editingContent));
    }
    onMount(async () => {
        if ("serviceWorker" in navigator) {
            await navigator.serviceWorker.register("/service-worker.js", { type: "module" });
            await navigator.serviceWorker.ready;
            if (syncChannel) {
                syncChannel.postMessage({ type: "KITCHEN_REQUEST_STATE" });
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
        messages = [];
        pendingClear = true;
        if (sharedEngine && isGeneratingLocally) {
            try {
                force_stop_global();
            } catch (e) {
                console.error("Interrupt failed:", e);
            }
        }
        if (!isGeneratingLocally) {
            pendingClear = false;
        }
    }
    async function send_message() {
        const result = await cl.send_message();
        if (result) {
            ({ messages, userInput, interactionCount } = result);
            await generate_response();
        }
    }
    async function generate_response() {
        if (!$kitchenState.activeModel || isGeneratingLocally || $kitchenState.isBusy) return;

        isGeneratingLocally = true;
        mutateKitchen({ isBusy: true });
        pendingClear = false;

        // --- PREPARE CONTEXT ---
        const context_prompt = cl.prepareContext(options, index);

        messages = [...messages, { role: "assistant", content: "", showThinking: false }];

        try {
            await ensureEngineConnected($kitchenState.activeModel);

            let continue_interaction = true;
            let current_assistant_content = "";

            while (continue_interaction) {
                isSystemWorking = false;
                const response = await sharedEngine.chat.completions.create({
                    messages: [
                        { role: "system", content: options.system_prompt },
                        ...messages.slice(0, messages.length - 1).map((m, i) => {
                            const isLastUserContextTrigger = context_prompt && m.role === 'user' && i === messages.length - 2;
                            return {
                                role: m.role,
                                content: isLastUserContextTrigger
                                    ? m.content + `\n\n--- RECIPE CONTEXT (YAML) ---\n${context_prompt}\n---`
                                    : m.content
                            };
                        })
                    ],
                    temperature: options.temperature,
                    top_p: options.top_p,
                    max_tokens: options.max_tokens,
                    repetition_penalty: options.repetition_penalty,
                    stream: true,
                });

                current_assistant_content = "";
                for await (const chunk of response) {
                    if (pendingClear) break;

                    const cur = chunk.choices[0]?.delta?.content;

                    if (cur && messages.length > 0) {
                        current_assistant_content += cur;
                        messages[messages.length - 1].content = current_assistant_content;
                        messages = [...messages];

                        if (chatContainer && !isUserScrolling) {
                            chatContainer.scrollTop = chatContainer.scrollHeight;
                        }
                    }
                }

                if (pendingClear) break;

                const docResult = await AIAssistantUtils.handleDocRequests(current_assistant_content, interactionCount);
                const inputResult = await AIAssistantUtils.handleInputRequests(current_assistant_content, $recipe_input, interactionCount);
                const opsResult = await AIAssistantUtils.handleOperationsListRequest(current_assistant_content, interactionCount);
                const protocolResult = docResult || inputResult || opsResult;

                if (protocolResult) {
                    if (protocolResult.stop) {
                        continue_interaction = false;
                    } else {
                        interactionCount = protocolResult.interactionCount;
                        isSystemWorking = true;
                        messages = [...messages, protocolResult.systemMessage, {
                            role: "assistant",
                            content: "",
                            showThinking: false
                        }];
                    }
                } else {
                    continue_interaction = false;
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
            isSystemWorking = false;
            mutateKitchen({ isBusy: false });
            if (pendingClear) {
                messages = [];
                pendingClear = false;
            }
        }
    }
</script>
<style>
    .input-row {
        display: grid;
        grid-template-columns: 1fr 100px;
        gap: 10px;
        align-items: start;
    }
    .status-pill {
        font-size: 0.7rem;
        letter-spacing: 0.5px;
        text-transform: uppercase;
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
                <Button color={$kitchenState.activeModel === options.model ? 'warning' : 'primary'} on:click={load_model} disabled={$kitchenState.isLoading || $kitchenState.isBusy || !options.model} class="px-3 fw-bold">
                    {#if $kitchenState.isLoading} <span class='spinner-border spinner-border-sm me-1'></span> Prep...
                    {:else if !$kitchenState.activeModel} Load
                    {:else if $kitchenState.activeModel === options.model} Reload
                    {:else} Swap Chef {/if}
                </Button>
            </InputGroup>
            <Button color='outline-secondary' size='sm' class='rounded shadow-sm' on:click={() => isTuningOpen = !isTuningOpen}>⚙️</Button>
            <Button color='outline-danger' size='sm' class='rounded shadow-sm' on:click={reset_service_worker} title='Reset Service Worker'>🔄</Button>
        </div>
        <Collapse isOpen={isTuningOpen}>
            <div class="p-3 mb-3 border rounded-3 bg-white shadow-inner" style='border-style: dashed !important; border-color: #cbd5e0 !important;'>
                <div class='row g-3'>
                    <div class='col-6'>
                        <!-- svelte-ignore a11y_label_has_associated_control -->
                        <label class='small fw-bold text-muted d-flex justify-content-between mb-1'>
                            <span>HEAT (TEMP)</span>
                            <span>{options.temperature}</span>
                        </label>
                        <input type='range' class='form-range' min='0' max='2' step='0.1' bind:value={options.temperature} on:change={edit} />
                    </div>
                    <div class='col-6'>
                        <!-- svelte-ignore a11y_label_has_associated_control -->
                        <label class='small fw-bold text-muted d-flex justify-content-between mb-1'>
                            <span>PRECISION (TOP P)</span>
                            <span>{options.top_p}</span>
                        </label>
                        <input type='range' class='form-range' min='0' max='1' step='0.05' bind:value={options.top_p} on:change={edit} />
                    </div>
                    <div class='col-6 mt-2'>
                        <!-- svelte-ignore a11y_label_has_associated_control -->
                        <label class='small fw-bold text-muted d-flex justify-content-between mb-1'>
                            <span>MAX OUTPUT</span>
                            <span>{options.max_tokens}</span>
                        </label>
                        <input type='range' class='form-range' min='64' max='4096' step='64' bind:value={options.max_tokens} on:change={edit} />
                    </div>
                    <div class='col-6 mt-2'>
                        <!-- svelte-ignore a11y_label_has_associated_control -->
                        <label class='small fw-bold text-muted d-flex justify-content-between mb-1'>
                            <span>REPETITION</span>
                            <span>{options.repetition_penalty}</span>
                        </label>
                        <input type='range' class='form-range' min='1.0' max='2.0' step='0.01' bind:value={options.repetition_penalty} on:change={edit} />
                    </div>
                    <div class='col-12 mt-2'>
                        <!-- svelte-ignore a11y_label_has_associated_control -->
                        <label class='small fw-bold text-muted d-flex justify-content-between mb-1'>
                            <span>CONTEXT INGREDIENTS (steps above this one)</span>
                            <span>{options.context_ingredients}</span>
                        </label>
                        <input type='range' class='form-range' min='0' max={index} step='1' bind:value={options.context_ingredients} on:change={edit} />
                    </div>
                    <div class='col-12 mt-2'>
                        <!-- svelte-ignore a11y_label_has_associated_control -->
                        <label class='small fw-bold text-muted d-flex justify-content-between mb-1'>
                            <span>HEIGHT (PX)</span>
                            <span>{options.height}</span>
                        </label>
                        <input type='range' class='form-range' min='200' max='1000' step='50' bind:value={options.height} on:change={edit} />
                    </div>
                    <div class='col-12 mt-2'>
                        <InputGroup size='sm' class='mb-3 shadow-sm rounded overflow-hidden'>
                            <InputGroupText class='bg-dark text-white border-0'><small class='fw-bold px-1'>SYSTEM</small></InputGroupText>
                            <Input type='textarea' bind:value={options.system_prompt} on:input={edit} rows={10} disabled={$kitchenState.isBusy} class='border-0 bg-light' style='resize: none;' />
                        </InputGroup>
                    </div>
                </div>
            </div>
        </Collapse>
        {#if $kitchenState.isLoading}
            <div class='mb-3 px-1'>
                <Progress animated striped={$kitchenState.progress === 0} color='primary' value={$kitchenState.progress === 0 ? 100 : $kitchenState.progress} style='height: 8px;' class='rounded-pill shadow-sm' />
                <div class='text-center mt-2 monospace text-primary' style='font-size: 0.7rem;'>{$kitchenState.progressText}</div>
            </div>
        {/if}
        <div class='position-relative'>
            {#if isSystemWorking}
                <div class="position-absolute top-0 start-50 translate-middle-x mt-2 z-index-20">
                    <div class="badge rounded-pill bg-info text-white shadow-sm p-2 px-3 d-flex align-items-center gap-2 animate-pulse" style="z-index: 100;">
                        <div class="spinner-border spinner-border-sm" role="status"></div>
                        <span class="small fw-bold">SYSTEM IS FETCHING DOCUMENTATION...</span>
                    </div>
                </div>
            {/if}

            {#if !$kitchenState.activeModel || $kitchenState.activeModel !== options.model || $kitchenState.isLoading}
                <div class='kitchen-closed-overlay position-absolute w-100 h-100 d-flex flex-column align-items-center justify-content-center text-center p-4'>
                    <span style='font-size: 3rem;' class='mb-2'>⏳</span>
                    <h6 class='fw-bold text-muted'>Kitchen Station Blocked</h6>
                    <p class='small text-muted px-4'>
                        {#if $kitchenState.isLoading} Prepping the environment... {:else} Please load <strong>{options.model}</strong> to start the session. {/if}
                    </p>
                    {#if !$kitchenState.isLoading}
                        <Button color='primary' size='sm' class='rounded-pill px-4 shadow-sm' on:click={load_model}>Load Chef</Button>
                    {/if}
                </div>
            {/if}
            <AIAssistantChat
                bind:messages
                isGenerating={isGeneratingLocally}
                bind:editingIndex
                bind:editingContent
                bind:chatContainer
                bind:isUserScrolling
                onEditMessage={editMessage}
                onDeleteMessage={deleteMessage}
                onCancelEdit={cancelEdit}
                onSaveEdit={saveEdit}
            />
            <div class='input-row align-items-stretch'>
                <div class='bg-white border rounded-3 p-1 shadow-sm d-flex align-items-center'>
                    <Input type='textarea' bind:value={userInput} placeholder='Ask your Sous-Chef...'
                        class='border-0 shadow-none bg-transparent'
                        style='max-height: 150px; min-height: 50px; resize: none; width: 100%;'
                        disabled={isGeneratingLocally || $kitchenState.isLoading || $kitchenState.activeModel !== options.model}
                        on:keydown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send_message(); } }} />
                </div>
                <div class='d-flex flex-column gap-1 justify-content-between'>
                    {#if isGeneratingLocally}
                        <Button color='danger' class='rounded-3 shadow-sm fw-bold w-100' style='height: 50px;' on:click={() => sharedEngine.interruptGenerate()}>STOP</Button>
                    {:else}
                        <Button color='success' class='rounded-3 shadow-sm fw-bold w-100' style='height: 50px;' on:click={send_message} disabled={!userInput.trim() || isGeneratingLocally || $kitchenState.isLoading || $kitchenState.activeModel !== options.model}>
                            { $kitchenState.isBusy ? '...' : 'SEND' }
                        </Button>
                    {/if}
                    <div class='d-flex flex-column align-items-center mt-1'>
                        {#if $kitchenState.isBusy && !isGeneratingLocally}
                            <Button color='link' size='sm' class='text-danger text-decoration-none fw-bold p-0 mb-1' style='font-size: 0.6rem;' on:click={force_stop_global}>KILL</Button>
                        {/if}
                        <Button color='link' size='sm' class='text-muted text-decoration-none fw-bold p-0' style='font-size: 0.7rem;' on:click={clear_messages}>CLEAR</Button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</Operation>
