<script context="module">
    import { Recipe, Option } from "$lib/recipe";
    import { LLMs } from "$lib/operations/@LLMs/llms";
    import { Utils } from "$lib/utils";
    import { AIAssistantUtils } from "./ai_assistant";

    const operation = "@preview/@LLMs/Remote AI Assistant";
    export const default_extra_options = {
        server_type: Option("Groq", "Server type (Groq, OpenAI, Ollama, OpenRouter)", "string"),
        server: Option("https://api.groq.com/openai/v1", "The LLM server URL", "string"),
        endpoint: Option("chat/completions", "API endpoint", "string"),
        model: Option("openai/gpt-oss-120b", "Model ID", "string"),
        ...AIAssistantUtils.common_extra_options()
    };

    Recipe.register_operation_type(operation, async (input) => input);
</script>

<script>
    import { Button, Input, InputGroup, InputGroupText, Collapse } from "@sveltestrap/sveltestrap";
    import Operation from "$lib/Operation.svelte";
    import AIAssistantChat from "./+AIAssistant.svelte";

    export let id;
    export let options;
    export let index;
    export let add_to_recipe;
    export let keybinding;

    let input_of_operation = [];
    Recipe.register_operation_type(operation, async (input) => {
        input_of_operation = input;
        return input;
    });

    let isTuningOpen = false;
    let messages = [];
    let userInput = "";
    let isGenerating = false;
    let isSystemWorking = false;
    let interactionCount = 0;
    let chatContainer;
    let isUserScrolling = false;
    let editingIndex = -1;
    let editingContent = "";
    let abortController = null;

    $: cl = AIAssistantUtils.common_logic(messages, userInput, isGenerating, interactionCount, generate_response);
    function editMessage(index) {
        ({ editingIndex, editingContent } = cl.editMessage(index));
    }
    function deleteMessage(index) {
        if (isGenerating) return;
        ({ messages, editingIndex, editingContent } = cl.deleteMessage(index, editingIndex));
    }
    function cancelEdit() {
        editingIndex = -1;
        editingContent = "";
    }
    async function saveEdit() {
        ({ messages, editingIndex, editingContent } = cl.saveEdit(editingIndex, editingContent));
    }

    function edit() { Recipe.edit_operation(id, index, options); }

    async function clear_messages() {
        if (isGenerating && abortController) {
            abortController.abort();
        }
        messages = [];
        isGenerating = false;
    }

    async function send_message() {
        const result = await cl.send_message();
        if (result) {
            ({ messages, userInput, interactionCount } = result);
            await generate_response();
        }
    }

    async function generate_response() {
        if (isGenerating) return;

        isGenerating = true;
        abortController = new AbortController();

        // --- PREPARE CONTEXT ---
        const context_prompt = cl.prepareContext(options, index);

        messages = [...messages, { role: "assistant", content: "", showThinking: false }];

        try {
            const api_key = await LLMs.access_api_key(options.server);

            const props = {};
            LLMs.add_temperature(options.server_type, options.temperature, props);

            let continue_interaction = true;
            let current_assistant_content = "";

            while (continue_interaction) {
                isSystemWorking = false;
                const payload = {
                    model: options.model,
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
                    max_tokens: options.max_tokens,
                    stream: true,
                    ...props
                };

                const response = await fetch(`${options.server}${options.endpoint.startsWith("/") ? "" : "/"}${options.endpoint}`, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${api_key}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(payload),
                    signal: abortController.signal
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error?.message || response.statusText);
                }

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = "";
                current_assistant_content = "";

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split("\n");
                    buffer = lines.pop();

                    for (const line of lines) {
                        const message = line.replace(/^data: /, "").trim();
                        if (message === "" || message === "[DONE]") continue;

                        try {
                            const parsed = JSON.parse(message);
                            // Support both OpenAI/Groq (choices[0].delta.content) and Ollama (message.content) formats
                            // Support for 'reasoning' outside 'delta' if some proxies do that, though standard is inside delta
                            const content = parsed.choices?.[0]?.delta?.content ?? parsed.message?.content ?? "";
                            const reasoning = parsed.choices?.[0]?.delta?.reasoning ?? parsed.choices?.[0]?.delta?.reasoning_content ?? parsed.message?.reasoning ?? parsed.message?.reasoning_content ?? "";

                            if (reasoning || content) {
                                if (reasoning) {
                                    // If thinking started, wrap it in <think> tags for the UI parser
                                    if (!messages[messages.length - 1].content.includes("<think>")) {
                                        messages[messages.length - 1].content += "<think>";
                                    }
                                    messages[messages.length - 1].content += reasoning;
                                } else {
                                    // Close think tag if we were thinking but now have normal content
                                    if (messages[messages.length - 1].content.includes("<think>") && !messages[messages.length - 1].content.includes("</think>")) {
                                        messages[messages.length - 1].content += "</think>";
                                    }
                                    messages[messages.length - 1].content += content;
                                }

                                current_assistant_content = messages[messages.length - 1].content;
                                messages = [...messages];
                                if (chatContainer && !isUserScrolling) {
                                    chatContainer.scrollTop = chatContainer.scrollHeight;
                                }
                            }
                        } catch (e) {
                            console.error("Error parsing stream line", e);
                        }
                    }
                }

                const docResult = await AIAssistantUtils.handleDocRequests(current_assistant_content, interactionCount);
                const inputResult = await AIAssistantUtils.handleInputRequests(current_assistant_content, input_of_operation, interactionCount);
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
                console.error("Generation Error: " + e);
            }
        } finally {
            isGenerating = false;
            isSystemWorking = false;
            abortController = null;
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
</style>

<Operation {id} {operation} {options} {index} {default_extra_options} {add_to_recipe} {keybinding}>
    <div class="p-3 border-0 rounded-3 bg-white shadow-sm overflow-hidden" style="border: 1px solid #e2e8f0 !important;">

        <div class="mb-3 p-2 bg-light border rounded-pill d-flex justify-content-between align-items-center px-3">
            <div class="d-flex align-items-center gap-2">
                <div class="rounded-circle bg-success" style="width: 8px; height: 8px; box-shadow: 0 0 5px #198754"></div>
                <span class="small fw-bold text-muted status-pill">Remote Station Online</span>
            </div>
            <span class="badge rounded-pill bg-white text-dark border shadow-sm px-3" style="font-size: 0.75rem;">
                {options.model}
            </span>
        </div>

        <div class="d-flex gap-2 mb-3">
            <InputGroup size="sm" class="shadow-sm rounded">
                <InputGroupText class="bg-white border-end-0">🌐</InputGroupText>
                <Input type="text" bind:value={options.model} on:input={edit} disabled={isGenerating} class="border-start-0 border-end-0" placeholder="Model ID..."/>
                <Button color="outline-secondary" size="sm" class="rounded-end shadow-sm" on:click={() => isTuningOpen = !isTuningOpen}>⚙️ Settings</Button>
            </InputGroup>
        </div>

        <Collapse isOpen={isTuningOpen}>
            <div class="p-3 mb-3 border rounded-3 bg-white shadow-inner" style="border-style: dashed !important; border-color: #cbd5e0 !important;">
                <div class="row g-3">
                    <div class="col-6">
                        <!-- svelte-ignore a11y_label_has_associated_control -->
                        <label class="small fw-bold text-muted d-flex justify-content-between mb-1">
                            <span>SERVER TYPE</span>
                        </label>
                        <Input type="select" bind:value={options.server_type} on:change={edit}>
                            {#each LLMs.SERVER_TYPES() as type}<option value={type}>{type}</option>{/each}
                        </Input>
                    </div>
                    <div class="col-6">
                        <!-- svelte-ignore a11y_label_has_associated_control -->
                        <label class="small fw-bold text-muted d-flex justify-content-between mb-1">
                            <span>SERVER URL</span>
                        </label>
                        <Input type="text" bind:value={options.server} on:input={edit} placeholder="https://api.groq.com/openai/v1" />
                    </div>
                    <div class="col-12 mt-2">
                        <!-- svelte-ignore a11y_label_has_associated_control -->
                        <label class="small fw-bold text-muted d-flex justify-content-between mb-1">
                            <span>ENDPOINT</span>
                        </label>
                        <Input type="text" bind:value={options.endpoint} on:input={edit} placeholder="chat/completions" />
                    </div>
                    <div class="col-6 mt-2">
                        <!-- svelte-ignore a11y_label_has_associated_control -->
                        <label class="small fw-bold text-muted d-flex justify-content-between mb-1">
                            <span>HEAT (TEMP)</span>
                            <span>{options.temperature}%</span>
                        </label>
                        <input type="range" class="form-range" min="0" max="100" step="1" bind:value={options.temperature} on:change={edit} />
                    </div>
                    <div class="col-6 mt-2">
                        <!-- svelte-ignore a11y_label_has_associated_control -->
                        <label class="small fw-bold text-muted d-flex justify-content-between mb-1">
                            <span>MAX OUTPUT</span>
                            <span>{options.max_tokens}</span>
                        </label>
                        <input type="range" class="form-range" min="64" max="8192" step="64" bind:value={options.max_tokens} on:change={edit} />
                    </div>
                    <div class="col-12 mt-2">
                        <!-- svelte-ignore a11y_label_has_associated_control -->
                        <label class="small fw-bold text-muted d-flex justify-content-between mb-1">
                            <span>CONTEXT INGREDIENTS</span>
                            <span>{options.context_ingredients}</span>
                        </label>
                        <input type="range" class="form-range" min="0" max={index} step="1" bind:value={options.context_ingredients} on:change={edit} />
                    </div>
                    <div class="col-12 mt-2">
                        <!-- svelte-ignore a11y_label_has_associated_control -->
                        <label class="small fw-bold text-muted d-flex justify-content-between mb-1">
                            <span>HEIGHT (PX)</span>
                            <span>{options.height}</span>
                        </label>
                        <input type="range" class="form-range" min="200" max="1000" step="50" bind:value={options.height} on:change={edit} />
                    </div>
                    <div class="col-12 mt-2">
                        <InputGroup size="sm" class="mb-3 shadow-sm rounded overflow-hidden">
                            <InputGroupText class="bg-dark text-white border-0"><small class="fw-bold px-1">SYSTEM</small></InputGroupText>
                            <Input type="textarea" bind:value={options.system_prompt} on:input={edit} rows={5} disabled={isGenerating} class="border-0 bg-light" style="resize: none;" />
                        </InputGroup>
                    </div>
                </div>
            </div>
        </Collapse>

        <div class="position-relative">
            {#if isSystemWorking}
                <div class="position-absolute top-0 start-50 translate-middle-x mt-2 z-index-20">
                    <div class="badge rounded-pill bg-info text-white shadow-sm p-2 px-3 d-flex align-items-center gap-2 animate-pulse" style="z-index: 100;">
                        <div class="spinner-border spinner-border-sm" role="status"></div>
                        <span class="small fw-bold">SYSTEM IS FETCHING DOCUMENTATION...</span>
                    </div>
                </div>
            {/if}

            <AIAssistantChat
                bind:messages
                {isGenerating}
                bind:editingIndex
                bind:editingContent
                bind:chatContainer
                bind:isUserScrolling
                onEditMessage={editMessage}
                onDeleteMessage={deleteMessage}
                onCancelEdit={cancelEdit}
                onSaveEdit={saveEdit}
                height={options.height}
            />

            <div class="input-row align-items-stretch">
                <div class="bg-white border rounded-3 p-1 shadow-sm d-flex align-items-center">
                    <Input type="textarea" bind:value={userInput} placeholder="Ask your Remote Sous-Chef..."
                        class="border-0 shadow-none bg-transparent"
                        style="max-height: 150px; min-height: 50px; resize: none; width: 100%;"
                        disabled={isGenerating}
                        on:keydown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send_message(); } }} />
                </div>

                <div class="d-flex flex-column gap-1 justify-content-between">
                    {#if isGenerating}
                        <Button color="danger" class="rounded-3 shadow-sm fw-bold w-100" style="height: 50px;" on:click={() => abortController.abort()}>STOP</Button>
                    {:else}
                        <Button color="success" class="rounded-3 shadow-sm fw-bold w-100" style="height: 50px;" on:click={send_message} disabled={!userInput.trim() || isGenerating}>
                            SEND
                        </Button>
                    {/if}
                    <div class="d-flex flex-column align-items-center mt-1">
                        <Button color="link" size="sm" class="text-muted text-decoration-none fw-bold p-0" style="font-size: 0.7rem;" on:click={clear_messages}>CLEAR</Button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</Operation>



