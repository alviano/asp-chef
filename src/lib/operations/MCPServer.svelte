<script context="module" lang="ts">
    import { Option, Recipe } from '$lib/recipe';
    import { encode_input } from '$lib/stores';

    const operation = 'MCP Server';

    export const default_extra_options = {
        server_url: Option('http://localhost:8000', 'MCP Server base URL', 'string'),
        auto_reconnect: Option(true, 'Auto-reconnect on disconnect', 'boolean')
    };

    Recipe.register_operation_type(operation, async (input, _options, _index, _id) => {
        return input;
    });
</script>

<script lang="ts">
    import { Button, Badge, Input, InputGroup, InputGroupText } from '@sveltestrap/sveltestrap';
    import Operation from '$lib/Operation.svelte';
    import { onDestroy } from 'svelte';
    import { Base64 } from 'js-base64';
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

    export let id: string;
    export let options: any;
    export let index: number;
    export let add_to_recipe: any;
    export let keybinding: any;

    let eventSource: EventSource | null = null;
    let status: 'Disconnected' | 'Connecting...' | 'Connected' | 'Error' = 'Disconnected';
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let log: { ts: string; msg: string; ok: boolean }[] = [];
    let syncTimer: ReturnType<typeof setTimeout> | null = null;
    let consecutiveErrors = 0;

    let this_index = index;
    $: this_index = index;

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

    function hydrateIngredients(ingredients: any[]) {
        return ingredients.map((ing) => {
            return {
                ...ing,
                options: {
                    ...Recipe.operation_default_options(ing.operation),
                    ...ing.options
                }
            };
        });
    }

    async function syncRecipe() {
        if (status !== 'Connected') return;

        try {
            const rawIngredients = JSON.parse(Recipe.ingredients_to_json_string(0));

            const hydratedIngredients = hydrateIngredients(rawIngredients);

            await fetch(`${base_url()}/sync`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipe: hydratedIngredients,
                    input: $inputStore,
                    connector_index: this_index,
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

    function debouncedSync() {
        if (syncTimer) clearTimeout(syncTimer);
        syncTimer = setTimeout(syncRecipe, 300);
    }

    $: if (status === 'Connected' && $recipeStore && $inputStore !== undefined) {
        debouncedSync();
    }

    type ActionHandler = (data: any) => Promise<void>;

    const ACTION_HANDLERS: Record<string, ActionHandler> = {
        get_recipe: async (_data) => {
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
            const at = data.at_index ?? this_index;
            const mergedOptions = {
                ...Recipe.operation_default_options(data.operation),
                ...(data.options || {})
            };

            await Recipe.add_operation(data.operation, mergedOptions, at);
            addLog(`add_operation "${data.operation}" at ${at}`);
        },

        remove_all_operations: async (_data) => {
            Recipe.remove_all_except(this_index);
            addLog('remove_all_operations (preserved MCP Server)');
        },

        remove_operations: async (data) => {
            const start = data.at_index;
            const count = data.how_many ?? 0;

            if (start === undefined || start < 0) {
                addLog(`remove_operations failed: invalid at_index`, false);
                return;
            }

            if (start <= this_index && (count === 0 || start + count > this_index)) {
                addLog(
                    `remove_operations ignored (range includes protected MCP Server at ${this_index})`,
                    false
                );
                return;
            }

            Recipe.remove_operations(start, count);
            addLog(`remove_operations at ${start} (count: ${count})`);
        },

        edit_operation: async (data) => {
            const the_recipe = (Recipe as any).recipe as any[];
            const ingredient =
                the_recipe.find((ing) => ing.id === data.op_id) || the_recipe[data.at_index];

            if (!ingredient) {
                addLog(`edit_operation failed: ingredient not found`, false);
                return;
            }

            const target_index = the_recipe.indexOf(ingredient);
            const mergedOptions = {
                ...ingredient.options,
                ...(data.options || {})
            };

            Recipe.edit_operation(ingredient.id, target_index, mergedOptions);

            addLog(`edit_operation id=${ingredient.id} (merged)`);
        },

        fix_operation: async (data) => {
            const the_recipe = (Recipe as any).recipe as any[];
            const ingredient =
                the_recipe.find((ing) => ing.id === data.op_id) || the_recipe[data.at_index];

            if (!ingredient) {
                addLog(`fix_operation failed: ingredient not found`, false);
                return;
            }

            const target_index = the_recipe.indexOf(ingredient);
            Recipe.fix_operation(ingredient.id, target_index, data.operation);
            addLog(`fix_operation id=${ingredient.id} → "${data.operation}"`);
        },

        swap_operations: async (data) => {
            Recipe.swap_operations(data.index_1, data.index_2);
            addLog(`swap_operations ${data.index_1} ↔ ${data.index_2}`);
        },

        duplicate_operation: async (data) => {
            if (data.at_index === undefined || data.at_index < 0) {
                addLog(`duplicate_operation failed: invalid at_index`, false);
                return;
            }
            Recipe.duplicate_operation(data.at_index);
            addLog(`duplicate_operation at ${data.at_index}`);
        },

        toggle_stop_at_operation: async (data) => {
            if (data.at_index === undefined || data.at_index < 0) return;
            Recipe.toggle_stop_at_operation(data.at_index);
            addLog(`toggle_stop at ${data.at_index}`);
        },

        toggle_apply_operation: async (data) => {
            if (data.at_index === undefined || data.at_index < 0) return;
            Recipe.toggle_apply_operation(data.at_index);
            addLog(`toggle_apply at ${data.at_index}`);
        },

        toggle_show_operation: async (data) => {
            if (data.at_index === undefined || data.at_index < 0) return;
            Recipe.toggle_show_operation(data.at_index);
            addLog(`toggle_show at ${data.at_index}`);
        },

        toggle_readonly_operation: async (data) => {
            if (data.at_index === undefined || data.at_index < 0) return;
            Recipe.toggle_readonly_operation(data.at_index);
            addLog(`toggle_readonly at ${data.at_index}`);
        },

        toggle_hide_header_operation: async (data) => {
            if (data.at_index === undefined || data.at_index < 0) return;
            Recipe.toggle_hide_header_operation(data.at_index);
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

        const url = `${base_url()}/events`;
        addLog(`connecting to ${url}…`);
        status = 'Connecting...';
        Recipe.set_errors_at_index(this_index, undefined);
        eventSource = new EventSource(url);

        eventSource.onopen = async () => {
            status = 'Connected';
            consecutiveErrors = 0;
            addLog('SSE connected ✓');
            Recipe.set_errors_at_index(this_index, undefined);
            await syncRecipe();
            await syncDocs();
        };

        eventSource.addEventListener('command', (e: MessageEvent) => dispatch(e.data));

        eventSource.onmessage = (e: MessageEvent) => dispatch(e.data);

        eventSource.onerror = () => {
            addLog('SSE error — disconnected', false);
            status = 'Error';
            Recipe.set_errors_at_index(this_index, 'SSE error — disconnected from ' + url);
            eventSource?.close();
            eventSource = null;

            consecutiveErrors++;
            if (consecutiveErrors >= 5) {
                addLog('Connessione disattivata automaticamente dopo 5 fallimenti consecutivi', false);
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
        Recipe.set_errors_at_index(this_index, undefined);
        addLog('disconnected by user');
    }

    function toggleConnection() {
        if (eventSource || reconnectTimer) {
            disconnect();
        } else {
            connect();
        }
    }

    onDestroy(disconnect);

    $: badgeColor =
        status === 'Connected'
            ? 'success'
            : status === 'Connecting...'
              ? 'warning'
              : status === 'Error'
                ? 'danger'
                : 'secondary';
</script>

<Operation {id} {operation} {options} {index} {default_extra_options} {add_to_recipe} {keybinding}>
    <InputGroup>
        <InputGroupText>Server URL</InputGroupText>
        <Input
            type="text"
            bind:value={options.server_url}
            placeholder="http://localhost:8000"
            disabled={status === 'Connected' || status === 'Connecting...'}
            on:input={edit}
        />
        <Button color={status === 'Connected' ? 'danger' : 'primary'} on:click={toggleConnection}>
            {status === 'Connected' || status === 'Error' ? 'Disconnect' : 'Connect'}
        </Button>
        <InputGroupText>
            <Badge color={badgeColor}>{status}</Badge>
        </InputGroupText>
    </InputGroup>

    <InputGroup class="mt-1">
        <Button
            outline={!options.auto_reconnect}
            on:click={() => {
                options.auto_reconnect = !options.auto_reconnect;
                edit();
            }}
        >
            Auto-reconnect
        </Button>
        <InputGroupText class="text-muted small flex-grow-1">
            SSE: <code>{base_url()}/events</code> &nbsp;·&nbsp; Sync: <code>{base_url()}/sync</code>
        </InputGroupText>
    </InputGroup>

    {#if log.length > 0}
        <details class="mt-1">
            <summary class="small text-muted" style="cursor:pointer">
                Activity log ({log.length})
            </summary>
            <div
                class="mt-1 p-1 border rounded bg-white"
                style="max-height:120px;overflow-y:auto;font-size:0.75rem;font-family:monospace;"
            >
                {#each log as entry}
                    <div class:text-danger={!entry.ok}>
                        <span class="text-muted">[{entry.ts}]</span>
                        {entry.msg}
                    </div>
                {/each}
            </div>
        </details>
    {/if}
</Operation>
