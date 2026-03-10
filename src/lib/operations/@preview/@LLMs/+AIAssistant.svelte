<script>
    import { Utils } from "$lib/utils";
    import { AIAssistantUtils } from "./ai_assistant";

    export let messages = [];
    export let isGenerating = false;
    export let editingIndex = -1;
    export let editingContent = "";
    export let chatContainer;
    export let isUserScrolling = false;

    // Callbacks
    export let onEditMessage;
    export let onDeleteMessage;
    export let onCancelEdit;
    export let onSaveEdit;

    export let height = 400;

    let chat_box;

    $: if (chat_box && messages) {
        // Run after the DOM has likely updated due to message changes
        setTimeout(() => {
            Array.from(chat_box.getElementsByTagName('pre')).forEach(Utils.add_copy_button);
        }, 0);
    }

    function handleScroll() {
        if (chatContainer) {
            isUserScrolling = (chatContainer.scrollHeight - chatContainer.scrollTop - chatContainer.clientHeight) > 30;
        }
    }
</script>

<style>
    /* Custom Scrollbar */
    .chat-box::-webkit-scrollbar { width: 6px; }
    .chat-box::-webkit-scrollbar-track { background: transparent; }
    .chat-box::-webkit-scrollbar-thumb { background: #cbd5e0; border-radius: 10px; }

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

    .thought-section {
        background: #fff9eb;
        border-radius: 6px;
        border: 1px dashed #ffeeba;
    }

    .markdown-body {
        font-size: 0.95rem;
        line-height: 1.6;
    }
</style>

<div bind:this={chatContainer} class="chat-box mb-3 d-flex flex-column gap-3"
     style="height:{height}px; overflow-y:auto; background:#f1f5f9; border:1px solid #e2e8f0; padding:20px; border-radius:12px;"
     on:scroll={handleScroll}
     bind:this={chat_box}>

    {#if messages.length === 0}
        <div class="h-100 d-flex flex-column align-items-center justify-content-center text-muted opacity-50">
            <span style="font-size: 3rem;">🤖</span>
            <p class="small mt-2 fw-bold">Sous-Chef ready. Ask for assistance.</p>
        </div>
    {/if}

    {#each messages as msg, i}
        <div class="message-container d-flex flex-column">
            {#if msg.content.startsWith('SYSTEM:') && msg.role === 'user'}
                <div class="alert alert-info border-0 shadow-sm p-3 mb-3" style="font-size: 0.85rem; background: #e0f2fe; color: #0369a1; border-radius: 12px;">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <div class="fw-bold text-uppercase" style="font-size: 0.65rem; letter-spacing: 1px;">
                            ⚙️ ASP Chef
                        </div>
                        <div class="d-flex gap-2">
                            <button class="btn btn-sm btn-link p-0 text-decoration-none" on:click={() => AIAssistantUtils.copyToClipboard(msg.content)} title="Copy">📋</button>
                            <button class="btn btn-sm btn-link p-0 text-decoration-none" on:click={() => { msg.collapsed = !msg.collapsed; messages = [...messages]; }}>
                                {msg.collapsed ? '▶ Show Details' : '▼ Hide Details'}
                            </button>
                        </div>
                    </div>
                    {#if !msg.collapsed}
                        <div class="mt-2 pt-2 border-top border-info border-opacity-25 markdown-body">
                            {@html Utils.render_markdown(msg.content.replace(/^SYSTEM:\s*/, ''))}
                        </div>
                    {/if}
                </div>
            {:else}
                <div class="message-bubble p-3 border {msg.role === 'user' ? 'user-bubble' : 'assistant-bubble'}">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <div class="fw-bold text-uppercase text-muted" style="font-size: 0.65rem; letter-spacing: 1px;">
                            {msg.role === 'user' ? '👨‍🍳 Executive Chef' : '🤖 Sous Chef'}
                        </div>
                        <div class="message-actions position-absolute top-0 end-0 m-2 d-flex gap-1 border">
                            <button class="btn btn-sm btn-link p-0 px-1 text-decoration-none" on:click={() => AIAssistantUtils.copyToClipboard(msg.content)} title="Copy">📋</button>
                            <button class="btn btn-sm btn-link p-0 px-1 text-decoration-none" on:click={() => onEditMessage(i)} title="Edit">✏️</button>
                            <button class="btn btn-sm btn-link p-0 px-1 text-decoration-none text-danger" on:click={() => onDeleteMessage(i)} title="Delete" disabled={isGenerating}>🗑️</button>
                        </div>
                    </div>

                    {#if editingIndex === i}
                        <!-- svelte-ignore a11y_autofocus -->
                        <textarea bind:value={editingContent} rows={3} class="form-control mb-2 shadow-inner bg-white" autofocus></textarea>
                        <div class="d-flex gap-2 justify-content-end">
                            <button class="btn btn-sm btn-light border" on:click={onCancelEdit}>Cancel</button>
                            <button class="btn btn-sm btn-primary" on:click={onSaveEdit}>Save</button>
                        </div>
                    {:else}
                        {#each AIAssistantUtils.parseMessage(msg.content) as part}
                            {#if part.type === 'thought'}
                                <div class="thought-section mb-2 p-2 ps-3">
                                    <button class="btn btn-sm btn-link text-decoration-none p-0 text-warning fw-bold d-flex align-items-center" style="font-size: 0.7rem" on:click={() => { msg.showThinking = !msg.showThinking; messages = [...messages]; }}>
                                        <span class="me-1">{msg.showThinking ? '▼' : '▶'}</span>
                                        MISE EN PLACE {part.isOpen ? '(THINKING...)' : ''}
                                    </button>
                                    {#if msg.showThinking || (isGenerating && i === messages.length - 1 && part.isOpen)}
                                        <div class="small text-muted mt-2 fst-italic border-top pt-2 opacity-75">{@html Utils.render_markdown(part.content)}</div>
                                    {/if}
                                </div>
                            {:else}
                                <div class="markdown-body text-dark">
                                    {@html Utils.render_markdown(part.content || (isGenerating && i === messages.length - 1 && msg.role === 'assistant' ? "..." : ""))}
                                </div>
                            {/if}
                        {/each}
                    {/if}
                </div>
            {/if}
        </div>
    {/each}
</div>
