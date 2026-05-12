<script context="module" lang="ts">
    import { Option, Recipe } from '$lib/recipe';
    import { encode_input } from '$lib/stores';

    const operation = '@LLMs/MCP AI Assistant';

    export const default_extra_options = {
        server_url: Option('http://localhost:8000', 'MCP Server base URL', 'string'),
        auto_reconnect: Option(true, 'Auto-reconnect on disconnect', 'boolean'),
        context_ingredients: Option(
            0,
            'Number of previous operations to include as context (0 for all)',
            'number'
        )
    };

    Recipe.register_operation_type(operation, async (input, _options, _index, _id) => {
        return input;
    });
</script>

<script lang="ts">
    import { Button, Badge, Input, InputGroup, InputGroupText, Collapse } from '@sveltestrap/sveltestrap';
    import Operation from '$lib/Operation.svelte';
    import { onDestroy } from 'svelte';
    import {
        recipe as recipeStore,
        recipe_input as inputStore,
        pause_baking,
        readonly_ingredients,
        show_ingredient_headers,
        show_ingredient_details,
        show_help,
        errors_at_index
    } from '$lib/stores';

    export let id;
    export let options;
    export let index;
    export let add_to_recipe;
    export let keybinding;

    let eventSource: EventSource | null = null;
    let status: 'Disconnected' | 'Connecting...' | 'Connected' | 'Error' = 'Disconnected';
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let log: { ts: string; msg: string; ok: boolean }[] = [];
    let syncTimer: ReturnType<typeof setTimeout> | null = null;
    let consecutiveErrors = 0;
    let isTuningOpen = false;

    const syncChannel = new BroadcastChannel('asp-chef-mcp-exclusive-connection');

    syncChannel.onmessage = (event) => {
        if (event.data.action === 'connect' && event.data.id !== id) {
            if (status === 'Connected' || status === 'Connecting...') {
                addLog(`Connection closed: another instance became active`, false);
                disconnect();
            }
        }
    };

    $: start_index =
        !options || options.context_ingredients === 0
            ? 0
            : Math.max(0, index - options.context_ingredients);
    $: num_ingredients = index - start_index;

    const RECONNECT_DELAY_MS = 3000;

    function edit() {
        Recipe.edit_operation(id, index, options);
    }

    function base_url(): string {
        return (options?.server_url || 'http://localhost:8000').replace(/\/$/, '');
    }

    function addLog(msg: string, ok = true) {
        const ts = new Date().toLocaleTimeString();
        log = [{ ts, msg, ok }, ...log].slice(0, 50);
    }

    async function syncRecipe() {
        if (status !== 'Connected') return;

        try {
            const recipe = JSON.parse(
                Recipe.ingredients_to_json_string(start_index, num_ingredients + 1)
            );

            await fetch(`${base_url()}/sync`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipe,
                    input: $inputStore,
                    connector_index: num_ingredients,
                    connector_id: id,
                    global_options: {
                        pause_baking: $pause_baking,
                        readonly_ingredients: $readonly_ingredients,
                        show_ingredient_headers: $show_ingredient_headers,
                        show_ingredient_details: $show_ingredient_details,
                        show_help: $show_help
                    }
                })
            });
        } catch (err) {
            addLog(`sync failed: ${err}`, false);
        }
    }

    async function syncDocs() {
        if (status !== 'Connected') return;
        try {
            const ops = Recipe.operations('.*');
            const docs: Record<string, string> = {};
            for (const op of ops) {
                docs[op] = await Recipe.operation_doc(op, false, true, true);
            }
            await fetch(`${base_url()}/docs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ docs })
            });
        } catch (err) {
            addLog(`docs sync failed: ${err}`, false);
        }
    }

    $: if (status === 'Connected' && ($recipeStore || $inputStore !== undefined)) {
        if (syncTimer) clearTimeout(syncTimer);
        syncTimer = setTimeout(syncRecipe, 300);
    }

    type ActionHandler = (data: any) => Promise<void>;

    const ACTION_HANDLERS: Record<string, ActionHandler> = {
        get_recipe: async () => {
            await syncRecipe();
            addLog('get_recipe → synced');
        },

        set_input: async (data) => {
            $inputStore = data.input || '';
            if (data.encode !== undefined) {
                encode_input.set(!!data.encode);
            }
            addLog(`set_input (encode: ${!!data.encode})`);
        },

        set_global_option: async (data) => {
            const val = !!data.value;
            switch (data.option) {
                case 'pause_baking':
                    $pause_baking = val;
                    $errors_at_index.length = 0;
                    Recipe.invalidate_cached_output(0);
                    break;
                case 'readonly_ingredients':
                    $readonly_ingredients = val;
                    break;
                case 'show_ingredient_headers':
                    $show_ingredient_headers = val;
                    break;
                case 'show_ingredient_details':
                    $show_ingredient_details = val;
                    break;
                case 'show_help':
                    $show_help = val;
                    break;
                default:
                    addLog(`unknown global option "${data.option}"`, false);
                    return;
            }
            addLog(`set_global_option ${data.option}=${val}`);
        },

        add_operation: async (data) => {
            const at =
                data.at_index !== undefined
                    ? Math.min(index, start_index + data.at_index)
                    : index;
            const mergedOptions = {
                ...Recipe.operation_default_options(data.operation),
                ...(data.options || {})
            };
            await Recipe.add_operation(data.operation, mergedOptions, at);
            addLog(`add_operation "${data.operation}" at ${at}`);
        },

        remove_all_operations: async () => {
            if (num_ingredients > 0) {
                Recipe.remove_operations(start_index, num_ingredients);
            }
            addLog('remove_all_operations (in context)');
        },

        remove_operations: async (data) => {
            const requested_start = data.at_index ?? 0;
            const requested_count = data.how_many ?? 0;

            if (requested_start < 0 || requested_start >= num_ingredients) {
                addLog('remove_operations failed: invalid at_index', false);
                return;
            }

            const start = start_index + requested_start;
            const count = Math.min(requested_count, num_ingredients - requested_start);

            Recipe.remove_operations(start, count);
            addLog(`remove_operations at ${start} (count: ${count})`);
        },

        edit_operation: async (data) => {
            const recipe = (Recipe as any).recipe as any[];
            const ingredient =
                recipe.find((ing) => ing.id === data.op_id) ||
                (data.at_index !== undefined && data.at_index < num_ingredients
                    ? recipe[start_index + data.at_index]
                    : null);

            if (!ingredient) {
                addLog('edit_operation failed: ingredient not found or out of context', false);
                return;
            }

            const target_index = recipe.indexOf(ingredient);
            if (target_index >= index) {
                addLog('edit_operation ignored: target is at or after connector', false);
                return;
            }

            Recipe.edit_operation(ingredient.id, target_index, {
                ...ingredient.options,
                ...(data.options || {})
            });
            addLog(`edit_operation id=${ingredient.id}`);
        },

        fix_operation: async (data) => {
            const recipe = (Recipe as any).recipe as any[];
            const ingredient =
                recipe.find((ing) => ing.id === data.op_id) ||
                (data.at_index !== undefined && data.at_index < num_ingredients
                    ? recipe[start_index + data.at_index]
                    : null);

            if (!ingredient) {
                addLog('fix_operation failed: ingredient not found or out of context', false);
                return;
            }

            const target_index = recipe.indexOf(ingredient);
            if (target_index >= index) {
                addLog('fix_operation ignored: target is at or after connector', false);
                return;
            }

            Recipe.fix_operation(ingredient.id, target_index, data.operation);
            addLog(`fix_operation id=${ingredient.id} → "${data.operation}"`);
        },

        swap_operations: async (data) => {
            if (data.index_1 >= num_ingredients || data.index_2 >= num_ingredients) {
                addLog('swap_operations ignored: index out of context', false);
                return;
            }
            Recipe.swap_operations(start_index + data.index_1, start_index + data.index_2);
            addLog(`swap_operations ${data.index_1} ↔ ${data.index_2}`);
        },

        duplicate_operation: async (data) => {
            if (
                data.at_index === undefined ||
                data.at_index < 0 ||
                data.at_index >= num_ingredients
            ) {
                addLog('duplicate_operation failed: invalid at_index', false);
                return;
            }
            Recipe.duplicate_operation(start_index + data.at_index);
            addLog(`duplicate_operation at ${data.at_index}`);
        },

        toggle_apply_operation: async (data) => {
            if (data.at_index === undefined || data.at_index < 0 || data.at_index >= num_ingredients)
                return;
            Recipe.toggle_apply_operation(start_index + data.at_index);
            addLog(`toggle_apply at ${data.at_index}`);
        },

        toggle_stop_at_operation: async (data) => {
            if (data.at_index === undefined || data.at_index < 0 || data.at_index >= num_ingredients)
                return;
            Recipe.toggle_stop_at_operation(start_index + data.at_index);
            addLog(`toggle_stop at ${data.at_index}`);
        },

        toggle_show_operation: async (data) => {
            if (data.at_index === undefined || data.at_index < 0 || data.at_index >= num_ingredients)
                return;
            Recipe.toggle_show_operation(start_index + data.at_index);
            addLog(`toggle_show at ${data.at_index}`);
        },

        toggle_readonly_operation: async (data) => {
            if (data.at_index === undefined || data.at_index < 0 || data.at_index >= num_ingredients)
                return;
            Recipe.toggle_readonly_operation(start_index + data.at_index);
            addLog(`toggle_readonly at ${data.at_index}`);
        },

        toggle_hide_header_operation: async (data) => {
            if (data.at_index === undefined || data.at_index < 0 || data.at_index >= num_ingredients)
                return;
            Recipe.toggle_hide_header_operation(start_index + data.at_index);
            addLog(`toggle_hide_header at ${data.at_index}`);
        }
    };

    async function dispatch(raw: string) {
        let data: any;
        try {
            data = JSON.parse(raw);
        } catch {
            return;
        }
        if (!data?.action) return;

        const handler = ACTION_HANDLERS[data.action];
        if (!handler) {
            addLog(`unknown action "${data.action}"`, false);
            return;
        }
        try {
            await handler(data);
        } catch (err) {
            addLog(`error in "${data.action}": ${err}`, false);
        }
    }

    function connect() {
        if (eventSource) return;
        if (reconnectTimer) {
            clearTimeout(reconnectTimer);
            reconnectTimer = null;
        }

        syncChannel.postMessage({ action: 'connect', id });

        const url = `${base_url()}/events`;
        addLog(`connecting to ${url}…`);
        status = 'Connecting...';
        Recipe.set_errors_at_index(index, undefined);
        eventSource = new EventSource(url);

        eventSource.onopen = async () => {
            status = 'Connected';
            consecutiveErrors = 0;
            addLog('SSE connected ✓');
            Recipe.set_errors_at_index(index, undefined);
            await syncRecipe();
            await syncDocs();
        };

        eventSource.addEventListener('command', (e: MessageEvent) => dispatch(e.data));
        eventSource.onmessage = (e: MessageEvent) => dispatch(e.data);

        eventSource.onerror = () => {
            addLog('SSE error — disconnected', false);
            status = 'Error';
            Recipe.set_errors_at_index(index, 'SSE error — disconnected from ' + url);
            eventSource?.close();
            eventSource = null;

            consecutiveErrors++;
            if (consecutiveErrors >= 5) {
                addLog('Connection disabled automatically after 5 consecutive failures', false);
                disconnect();
                return;
            }

            if (options?.auto_reconnect !== false) {
                addLog(`reconnecting in ${RECONNECT_DELAY_MS / 1000}s…`);
                reconnectTimer = setTimeout(connect, RECONNECT_DELAY_MS);
            }
        };
    }

    function disconnect() {
        if (reconnectTimer) {
            clearTimeout(reconnectTimer);
            reconnectTimer = null;
        }
        if (syncTimer) {
            clearTimeout(syncTimer);
            syncTimer = null;
        }
        eventSource?.close();
        eventSource = null;
        status = 'Disconnected';
        consecutiveErrors = 0;
        Recipe.set_errors_at_index(index, undefined);
    }

    onDestroy(() => {
        disconnect();
        syncChannel.close();
    });
</script>

<style>
    .status-pill {
        font-size: 0.7rem;
        letter-spacing: 0.5px;
        text-transform: uppercase;
    }
</style>

<Operation {id} {operation} {options} {index} {default_extra_options} {add_to_recipe} {keybinding}>
    {#if options}
        <div class="p-3 border-0 rounded-3 bg-white shadow-sm overflow-hidden" style="border: 1px solid #e2e8f0 !important;">
            <div class="mb-3 p-2 bg-light border rounded-pill d-flex justify-content-between align-items-center px-3">
                <div class="d-flex align-items-center gap-2">
                    <div class="rounded-circle bg-{status === 'Connected' ? 'success' : status === 'Connecting...' ? 'warning' : status === 'Error' ? 'danger' : 'secondary'}"
                         style="width: 8px; height: 8px; box-shadow: 0 0 5px {status === 'Connected' ? '#198754' : status === 'Connecting...' ? '#ffc107' : status === 'Error' ? '#dc3545' : '#6c757d'}"></div>
                    <span class="small fw-bold text-muted status-pill">MCP Server: {status}</span>
                </div>
            </div>

            <div class="d-flex gap-2 mb-3">
                <InputGroup size="sm" class="shadow-sm rounded">
                    <InputGroupText class="bg-white border-end-0">🌐</InputGroupText>
                    <Input type="text" bind:value={options.server_url} on:input={edit} disabled={status === 'Connected' || status === 'Connecting...'} class="border-start-0 border-end-0" placeholder="http://localhost:8000" />
                    <Button color={status === 'Disconnected' ? 'success' : 'danger'} size="sm" on:click={() => status === 'Disconnected' ? connect() : disconnect()}>
                        {status === 'Disconnected' ? 'Connect' : 'Disconnect'}
                    </Button>
                    <Button color="outline-secondary" size="sm" class="rounded-end shadow-sm" on:click={() => (isTuningOpen = !isTuningOpen)}>⚙️ Settings</Button>
                </InputGroup>
            </div>

            <Collapse isOpen={isTuningOpen}>
                <div class="p-3 mb-3 border rounded-3 bg-white shadow-inner" style="border-style: dashed !important; border-color: #cbd5e0 !important;">
                    <div class="row g-3">
                        <div class="col-12">
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" role="switch" id="autoReconnectSwitch" bind:checked={options.auto_reconnect} on:change={edit} />
                                <label class="small fw-bold text-muted" for="autoReconnectSwitch">AUTO-RECONNECT</label>
                            </div>
                        </div>
                        <div class="col-12 mt-2">
                            <!-- svelte-ignore a11y_label_has_associated_control -->
                            <label class="small fw-bold text-muted d-flex justify-content-between mb-1">
                                <span>CONTEXT INGREDIENTS</span>
                                <span>{options.context_ingredients === 0 ? 'ALL' : options.context_ingredients}</span>
                            </label>
                            <input type="range" class="form-range" min="0" max={index} step="1" bind:value={options.context_ingredients} on:change={edit} />
                        </div>
                    </div>
                </div>
            </Collapse>

            {#if log.length > 0}
                <details class="mt-1">
                    <summary class="small text-muted" style="cursor:pointer">Activity log ({log.length})</summary>
                    <div class="mt-1 p-1 border rounded bg-white" style="max-height:120px;overflow-y:auto;font-size:0.75rem;font-family:monospace;">
                        {#each log as entry}
                            <div class:text-danger={!entry.ok}>
                                <span class="text-muted">[{entry.ts}]</span>
                                {entry.msg}
                            </div>
                        {/each}
                    </div>
                </details>
            {/if}
        </div>
    {/if}
</Operation>