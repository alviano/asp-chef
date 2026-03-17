<!-- src/lib/operations/@DTDL/+Instances.svelte -->
<script>
    import {
        Alert,
        Button,
        Input,
        InputGroup,
        InputGroupText,
        Modal,
        ModalBody,
        ModalFooter,
        ModalHeader,
        Nav,
        NavItem,
        NavLink,
        Spinner,
        Table
    } from '@sveltestrap/sveltestrap';
    import { Base64 } from 'js-base64';
    import { onDestroy } from 'svelte';
    import { Utils } from '$lib/utils.js';
    import { set_derived_facts } from '$lib/operations/@DTDL/Instances.svelte';
    import { AzureDT } from '$lib/operations/@DTDL/azure_dt';

    export let id;
    export let inputData;
    export let options;
    export let index;

    let activeTab = 'instances';
    let helpOpen = false;
    let isLoading = false;
    let errorMessage = '';
    let twins = [];
    let writableProps = {};
    let selectedTwinId = '';
    let editValues = {};
    let pushError = '';
    let pushSuccess = false;

    let rulesText = options.rules || '';
    let derivedFacts = [];
    let rulesError = '';
    let rulesRunning = false;
    let rulesFactCount = 0;

    function read_config() {
        const config = { endpoint: '', api_version: '2023-10-31', model_filter: '' };
        if (!inputData) return config;
        for (const part of inputData) {
            for (const atom of part) {
                if (atom.predicate === options.predicate_config) {
                    if (!atom.terms || atom.terms.length < 2) continue;
                    const key = atom.terms[0].functor;
                    const val = atom.terms[1].string;
                    if (!key || val === undefined) continue;
                    if (key === 'endpoint') config.endpoint = val;
                    else if (key === 'api_version') config.api_version = val;
                    else if (key === 'model_filter') config.model_filter = val;
                }
            }
        }
        return config;
    }

    function read_writable_props() {
        const result = {};
        if (!inputData) return result;

        for (const part of inputData) {
            for (const atom of part) {
                if (atom.predicate === options.predicate_dtdl) {
                    if (!atom.terms?.length) continue;
                    const decoded = Base64.decode(atom.terms[0].string);
                    const lines = decoded.split('\n');

                    const has_property = [];
                    const writable_ids = new Set();

                    for (const line of lines) {
                        const hp = line.match(/^has_property\((.+),\s*"([^"]+)",\s*(.+?)\)\.$/);
                        if (hp) {
                            has_property.push({
                                ownerId: hp[1].trim(),
                                propName: hp[2],
                                propId: hp[3].trim()
                            });
                        }
                        const w = line.match(/^writable\((.+?)\)\.$/);
                        if (w) {
                            writable_ids.add(w[1].trim());
                        }
                    }

                    for (const { ownerId, propName, propId } of has_property) {
                        if (writable_ids.has(propId)) {
                            if (!result[ownerId]) result[ownerId] = new Set();
                            result[ownerId].add(propName);
                        }
                    }
                }
            }
        }
        return result;
    }

    function is_scalar(value) {
        if (value === null || value === undefined) return false;
        const t = typeof value;
        return t === 'string' || t === 'number' || t === 'boolean';
    }

    // Fetch instances from Azure DT
    async function fetchInstances() {
        // MOCK LIVE UPDATE — remove once Azure DT access is available
        if (_mockInterval) {
            clearInterval(_mockInterval);
            _mockInterval = null;
        }
        isLoading = true;
        errorMessage = '';
        twins = [];

        try {
            const config = read_config();
            if (!config.endpoint) {
                throw new Error('Endpoint not configured. Add @DTDL/Config before this component.');
            }

            let query = 'SELECT * FROM digitaltwins';
            if (config.model_filter) {
                if (!/^dtmi:[a-z0-9_:]+;[0-9]+$/i.test(config.model_filter)) {
                    throw new Error(
                        `Invalid model filter: "${config.model_filter}". Expected a valid DTMI URI (e.g. dtmi:example:model;1).`
                    );
                }
                query = `SELECT * FROM digitaltwins WHERE IS_OF_MODEL('${config.model_filter}')`;
            }

            twins = await AzureDT.query_twins(config.endpoint, config.api_version, query);

            relationships = [];
            if (fetchRelationships) {
                for (const twin of twins) {
                    try {
                        const rels = await AzureDT.get_relationships(
                            config.endpoint,
                            config.api_version,
                            twin['$dtId']
                        );
                        relationships.push(...rels);
                    } catch (err) {
                        console.warn(
                            `[DTDL/Instances] Failed to fetch relationships for ${twin['$dtId']}:`,
                            err
                        );
                    }
                }
            }

            writableProps = read_writable_props();

            if (twins.length > 0 && !selectedTwinId) {
                selectedTwinId = twins[0]['$dtId'];
                buildEditValues();
            }
        } catch (err) {
            errorMessage = err.message || String(err);
        } finally {
            isLoading = false;
        }
    }

    function buildEditValues() {
        editValues = {};
        const twin = twins.find((t) => t['$dtId'] === selectedTwinId);
        if (!twin) return;
        for (const [key, val] of Object.entries(twin)) {
            if (key.startsWith('$')) continue;
            if (is_scalar(val)) editValues[key] = val;
        }
    }

    function onTwinSelect(e) {
        selectedTwinId = e.target.value;
        buildEditValues();
        pushError = '';
        pushSuccess = false;
    }

    function is_writable(propName) {
        const twin = twins.find((t) => t['$dtId'] === selectedTwinId);
        if (!twin) return false;
        const modelId = twin['$metadata']?.['$model'];
        if (!modelId) return true;
        const key = `"${modelId}"`;
        return writableProps[key]?.has(propName) ?? true;
    }

    async function pushToAzure(externalPatches) {
        pushError = '';
        pushSuccess = false;
        isLoading = true;

        try {
            const config = read_config();
            if (!config.endpoint) throw new Error('Endpoint not configured.');
            if (!selectedTwinId) throw new Error('No twin selected.');

            const twin = twins.find((t) => t['$dtId'] === selectedTwinId);
            if (!twin) throw new Error('Twin not found.');

            let patches;
            if (externalPatches && externalPatches.length > 0) {
                patches = externalPatches;
            } else {
                patches = [];
                for (const [propName, newVal] of Object.entries(editValues)) {
                    if (twin[propName] !== newVal) {
                        const op = twin[propName] === undefined ? 'add' : 'replace';
                        patches.push({ op, path: `/${propName}`, value: newVal });
                    }
                }
            }

            if (patches.length === 0) {
                Utils.snackbar('[DTDL/Instances] No changes to send.');
                isLoading = false;
                return;
            }

            await AzureDT.patch_twin(config.endpoint, config.api_version, selectedTwinId, patches);
            pushSuccess = true;

            const idx = twins.findIndex((t) => t['$dtId'] === selectedTwinId);
            if (idx >= 0) {
                if (externalPatches && externalPatches.length > 0) {
                    for (const patch of externalPatches) {
                        const propName = patch.path.replace(/^\//, '');
                        twins[idx][propName] = patch.value;
                    }
                } else {
                    for (const [k, v] of Object.entries(editValues)) {
                        twins[idx][k] = v;
                    }
                }
                twins = [...twins];
            }
        } catch (err) {
            pushError = err.message || String(err);
        } finally {
            isLoading = false;
        }
    }

    function esc(s) {
        return String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    }

    function get_asp_facts() {
        const prefix = options.predicate_output || 'dtdl_';
        const lines = [];
        for (const twin of twins) {
            const dtId = twin['$dtId'];
            const model = twin['$metadata']?.['$model'] || '';
            lines.push(`${prefix}instance("${esc(dtId)}", "${esc(model)}").`);
            for (const [key, val] of Object.entries(twin)) {
                if (key.startsWith('$')) continue;
                if (!is_scalar(val)) continue;
                const asp_val = typeof val === 'string' ? `"${esc(val)}"` : val;
                lines.push(`${prefix}property_value("${esc(dtId)}", "${esc(key)}", ${asp_val}).`);
            }
        }
        for (const rel of relationships) {
            const src = rel['$sourceId'] || '';
            const name = rel['$relationshipName'] || '';
            const tgt = rel['$targetId'] || '';
            if (src && name && tgt) {
                lines.push(`${prefix}relationship("${esc(src)}", "${esc(name)}", "${esc(tgt)}").`);
            }
        }
        return lines.join('\n');
    }

    function scalar_keys(twinsArr) {
        const keys = new Set();
        for (const t of twinsArr) {
            for (const k of Object.keys(t)) {
                if (!k.startsWith('$') && is_scalar(t[k])) keys.add(k);
            }
        }
        return Array.from(keys);
    }

    async function run_rules() {
        rulesError = '';
        rulesRunning = true;
        derivedFacts = [];
        rulesFactCount = 0;

        try {
            const program = get_asp_facts() + '\n' + rulesText;
            const result = await Utils.clingo_run(program, 1);

            if (result.Result === 'ERROR') {
                rulesError = result.Error || 'Unknown solver error.';
                return;
            }
            if (!result.Call?.[0]?.Witnesses) {
                rulesError =
                    result.Models?.Number === 0
                        ? 'UNSATISFIABLE — no model found.'
                        : 'Unexpected solver response format.';
                return;
            }
            if (result.Call[0].Witnesses.length === 0) {
                rulesError = 'UNSATISFIABLE — no model found.';
                return;
            }

            const atoms = result.Call[0].Witnesses[0].Value;
            const prefix = options.predicate_output || 'dtdl_';
            derivedFacts = atoms.filter((a) => !a.startsWith(prefix));
            rulesFactCount = derivedFacts.length;
        } catch (err) {
            rulesError = err.message || String(err);
        } finally {
            rulesRunning = false;
            set_derived_facts(id, derivedFacts);
        }
    }

    let detailTwinId = '';
    let searchText = '';
    let sortCol = '';
    let sortDir = '';
    let groupByModel = false;
    let exportMenuOpen = false;
    let confirmModalOpen = false;
    let pendingPatches = [];
    let pendingAzurePatches = [];
    let fetchRelationships = false;
    let relationships = [];

    $: options.rules = rulesText;
    $: columns = scalar_keys(twins);
    $: detailFacts = detailTwinId ? correlated_facts_for(detailTwinId) : [];

    function shortId(dtmi) {
        if (!dtmi) return '';
        const parts = dtmi.split(':');
        return parts[parts.length - 1] || dtmi;
    }

    $: filteredTwins = (() => {
        const needle = searchText.trim().toLowerCase();
        let result = twins;
        if (needle) {
            result = result.filter((twin) => {
                if (twin['$dtId']?.toLowerCase().includes(needle)) return true;
                for (const [k, v] of Object.entries(twin)) {
                    if (k.startsWith('$')) continue;
                    if (
                        (typeof v === 'string' || typeof v === 'number') &&
                        String(v).toLowerCase().includes(needle)
                    )
                        return true;
                }
                return false;
            });
        }
        if (sortCol && sortDir) {
            result = [...result].sort((a, b) => {
                let aVal, bVal;
                if (sortCol === '$dtId') {
                    aVal = a['$dtId'] ?? '';
                    bVal = b['$dtId'] ?? '';
                } else if (sortCol === '$model') {
                    aVal = a['$metadata']?.['$model'] ?? '';
                    bVal = b['$metadata']?.['$model'] ?? '';
                } else {
                    aVal = a[sortCol] ?? '';
                    bVal = b[sortCol] ?? '';
                }
                let cmp = 0;
                if (aVal === '' && bVal === '') cmp = 0;
                else if (aVal === '') cmp = -1;
                else if (bVal === '') cmp = 1;
                else if (typeof aVal === 'number' && typeof bVal === 'number') cmp = aVal - bVal;
                else cmp = String(aVal).localeCompare(String(bVal));
                return sortDir === 'asc' ? cmp : -cmp;
            });
        }
        return result;
    })();

    $: modelGroups = (() => {
        const map = new Map();
        for (const twin of filteredTwins) {
            const model = twin['$metadata']?.['$model'] || '';
            if (!map.has(model)) map.set(model, []);
            map.get(model).push(twin);
        }
        return Array.from(map.entries());
    })();

    $: if (inputData) {
        writableProps = read_writable_props();
    }

    $: signalPredicates = new Set(
        (options.label_predicates || '')
            .split(',')
            .map((s) => s.trim().replace(/\/\d+$/, ''))
            .filter(Boolean)
    );

    function upstream_labels_for(dtId) {
        if (signalPredicates.size === 0) return [];
        const labels = [];
        if (!inputData) return labels;
        for (const part of inputData) {
            for (const atom of part) {
                if (!signalPredicates.has(atom.predicate)) continue;
                if (!atom.terms) continue;
                const matches = atom.terms.some((t) => t.string === dtId);
                if (!matches) continue;
                const labelTerm = atom.terms.find((t, i) => i > 0 && t.string !== undefined);
                const label = labelTerm ? labelTerm.string : atom.predicate;
                labels.push({ label, source: 'upstream' });
            }
        }
        return labels;
    }

    function rules_labels_for(dtId) {
        return derivedFacts
            .filter((f) => f.includes(`"${dtId}"`))
            .map((f) => {
                const m = f.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\(/);
                const predName = m ? m[1] : '';
                const argM = f.match(/"[^"]*",\s*"([^"]+)"/);
                const label = argM ? argM[1] : predName;
                return { label, source: 'rules' };
            });
    }

    const LABEL_COLOR_MAP = {
        hot: '#fd7e14',
        alert: '#dc3545',
        error: '#dc3545',
        critical: '#dc3545',
        ok: '#198754',
        safe: '#198754',
        normal: '#198754'
    };

    function badge_color(label, source) {
        if (source === 'upstream') return '#6c757d';
        const lower = label.toLowerCase();
        for (const [kw, color] of Object.entries(LABEL_COLOR_MAP)) {
            if (lower.includes(kw)) return color;
        }
        return '#0d6efd';
    }

    function toggle_detail(dtId) {
        detailTwinId = detailTwinId === dtId ? '' : dtId;
    }

    function correlated_facts_for(dtId) {
        const result = [];

        const emitted = get_asp_facts()
            .split('\n')
            .filter((f) => f.includes(`"${dtId}"`));
        for (const f of emitted) result.push({ fact: f, source: 'emitted' });

        for (const f of derivedFacts) {
            if (f.includes(`"${dtId}"`)) result.push({ fact: f + '.', source: 'rules' });
        }

        if (inputData) {
            for (const part of inputData) {
                for (const atom of part) {
                    if (!atom.terms) continue;
                    if (!atom.terms.some((t) => t.string === dtId)) continue;
                    const args = atom.terms
                        .map((t) =>
                            t.string !== undefined
                                ? `"${t.string}"`
                                : t.functor !== undefined
                                  ? t.functor
                                  : t.number !== undefined
                                    ? String(t.number)
                                    : '?'
                        )
                        .join(', ');
                    result.push({ fact: `${atom.predicate}(${args}).`, source: 'upstream' });
                }
            }
        }

        return result;
    }

    // MOCK LIVE UPDATE — remove once Azure DT access is available (remove onDestroy call too)
    let _mockInterval = null;
    onDestroy(() => {
        if (_mockInterval) {
            clearInterval(_mockInterval);
            _mockInterval = null;
        }
    });
    function _mockTick() {
        if (twins.length === 0) return;
        twins = twins.map((t) => {
            const m = t['$metadata']?.['$model'] || '';
            if (m === 'dtmi:example:Room;1')
                return {
                    ...t,
                    temperature: +(t.temperature + (Math.random() - 0.5) * 0.4).toFixed(1),
                    humidity: Math.min(
                        100,
                        Math.max(0, +(t.humidity + (Math.random() - 0.5) * 1).toFixed(0))
                    )
                };
            if (m === 'dtmi:example:TemperatureSensor;2')
                return {
                    ...t,
                    currentTemperature: +(
                        t.currentTemperature +
                        (Math.random() - 0.5) * 0.3
                    ).toFixed(1)
                };
            return t;
        });
    }

    function handleWindowClick(e) {
        if (exportMenuOpen && !e.target.closest('[data-export-menu]')) {
            exportMenuOpen = false;
        }
    }

    function buildCSV(data) {
        const cols = scalar_keys(data);
        const quoteField = (v) => '"' + String(v).replace(/"/g, '""') + '"';
        const header = ['$dtId', '$model', ...cols].map(quoteField).join(',');
        const rows = data.map((twin) => {
            const dtId = twin['$dtId'] ?? '';
            const model = twin['$metadata']?.['$model'] ?? '';
            const cells = [dtId, model, ...cols.map((k) => twin[k] ?? '')].map((v) => {
                if (typeof v === 'number' || typeof v === 'boolean') return v;
                return quoteField(v);
            });
            return cells.join(',');
        });
        return [header, ...rows].join('\n');
    }

    function buildJSON(data) {
        return data.map((twin) => {
            const obj = { $dtId: twin['$dtId'], $model: twin['$metadata']?.['$model'] || '' };
            for (const [k, v] of Object.entries(twin)) {
                if (k.startsWith('$')) continue;
                if (is_scalar(v)) obj[k] = v;
            }
            return obj;
        });
    }

    function exportCSVAll() {
        Utils.download(buildCSV(twins), 'twins-all.csv');
    }
    function exportCSVFiltered() {
        Utils.download(buildCSV(filteredTwins), 'twins-filtered.csv');
    }
    function exportJSONAll() {
        Utils.download(JSON.stringify(buildJSON(twins), null, 2), 'twins-all.json');
    }
    function exportJSONFiltered() {
        Utils.download(JSON.stringify(buildJSON(filteredTwins), null, 2), 'twins-filtered.json');
    }

    function requestPush() {
        pendingPatches = [];
        pendingAzurePatches = [];
        const twin = twins.find((t) => t['$dtId'] === selectedTwinId);
        if (!twin) return;
        for (const [propName, newVal] of Object.entries(editValues)) {
            if (twin[propName] !== newVal) {
                pendingPatches.push({ propName, oldValue: twin[propName], newValue: newVal });
                const op = twin[propName] === undefined ? 'add' : 'replace';
                pendingAzurePatches.push({ op, path: `/${propName}`, value: newVal });
            }
        }
        if (pendingPatches.length === 0) {
            Utils.snackbar('[DTDL/Instances] No changes to send.');
            return;
        }
        confirmModalOpen = true;
    }

    function confirmPush() {
        confirmModalOpen = false;
        pushToAzure(pendingAzurePatches);
    }

    function toggleSort(col) {
        if (sortCol !== col) {
            sortCol = col;
            sortDir = 'asc';
        } else if (sortDir === 'asc') {
            sortDir = 'desc';
        } else {
            sortCol = '';
            sortDir = '';
        }
    }

    // MOCK DATA — remove once Azure DT access is available
    function loadMockData() {
        twins = [
            {
                $dtId: 'room-001',
                $metadata: {
                    $model: 'dtmi:example:Room;1',
                    $lastUpdateTime: '2024-01-10T09:00:00Z'
                },
                temperature: 22.5,
                humidity: 45,
                occupied: true,
                name: 'Conference Room A'
            },
            {
                $dtId: 'room-002',
                $metadata: {
                    $model: 'dtmi:example:Room;1',
                    $lastUpdateTime: '2024-01-10T09:15:00Z'
                },
                temperature: 19.0,
                humidity: 55,
                occupied: false,
                name: 'Office 102'
            },
            {
                $dtId: 'sensor-temp-01',
                $metadata: {
                    $model: 'dtmi:example:TemperatureSensor;2',
                    $lastUpdateTime: '2024-01-10T09:30:00Z'
                },
                currentTemperature: 21.3,
                unit: 'Celsius',
                batteryLevel: 87,
                active: true
            },
            {
                $dtId: 'floor-1',
                $metadata: {
                    $model: 'dtmi:example:Floor;1',
                    $lastUpdateTime: '2024-01-09T18:00:00Z'
                },
                floorNumber: 1,
                area: 450.0,
                label: 'Ground Floor'
            }
        ];
        writableProps = {
            '"dtmi:example:Room;1"': new Set(['temperature', 'humidity', 'occupied']),
            '"dtmi:example:TemperatureSensor;2"': new Set(['active'])
        };
        selectedTwinId = twins[0]['$dtId'];
        buildEditValues();
        relationships = [
            { $sourceId: 'room-001', $relationshipName: 'contains', $targetId: 'sensor-temp-01' },
            { $sourceId: 'room-002', $relationshipName: 'contains', $targetId: 'sensor-temp-01' },
            { $sourceId: 'floor-1', $relationshipName: 'hasRoom', $targetId: 'room-001' },
            { $sourceId: 'floor-1', $relationshipName: 'hasRoom', $targetId: 'room-002' }
        ];
        errorMessage = '';
        // MOCK LIVE UPDATE — remove with loadMockData
        if (_mockInterval) clearInterval(_mockInterval);
        _mockInterval = setInterval(_mockTick, 2000);
    }
</script>

<div class="p-2">
    <div class="d-flex align-items-center mb-2 gap-2">
        <Button color="primary" size="sm" on:click={fetchInstances} disabled={isLoading}>
            {#if isLoading}
                <Spinner size="sm" /> Loading...
            {:else}
                <i class="bi bi-arrow-clockwise"></i> Refresh
            {/if}
        </Button>
        <!-- MOCK — remove once Azure DT access is available -->
        <Button
            color="warning"
            size="sm"
            on:click={loadMockData}
            disabled={isLoading}
            title="Load fake data for UI development"
        >
            <i class="bi bi-database-fill-gear"></i> Load MOCK Data
        </Button>
        <Button
            color={groupByModel ? 'secondary' : 'outline-secondary'}
            size="sm"
            on:click={() => (groupByModel = !groupByModel)}
            title="Group twins by model"
        >
            <i class="bi bi-collection"></i> Group by model
        </Button>
        <div style="position:relative;" data-export-menu>
            <Button
                color="outline-secondary"
                size="sm"
                on:click={() => (exportMenuOpen = !exportMenuOpen)}
                disabled={twins.length === 0}
            >
                Export ▾
            </Button>
            {#if exportMenuOpen}
                <div
                    style="position:absolute; background:white; border:1px solid #dee2e6; border-radius:4px; z-index:10; min-width:200px;"
                >
                    <button
                        class="dropdown-item"
                        style="display:block; width:100%; padding:0.4em 0.75em; background:none; border:none; text-align:left; cursor:pointer;"
                        on:click={() => {
                            exportCSVAll();
                            exportMenuOpen = false;
                        }}>Download CSV (tutti)</button
                    >
                    <button
                        class="dropdown-item"
                        style="display:block; width:100%; padding:0.4em 0.75em; background:none; border:none; text-align:left; cursor:pointer;"
                        on:click={() => {
                            exportCSVFiltered();
                            exportMenuOpen = false;
                        }}>Download CSV (filtrati)</button
                    >
                    <button
                        class="dropdown-item"
                        style="display:block; width:100%; padding:0.4em 0.75em; background:none; border:none; text-align:left; cursor:pointer;"
                        on:click={() => {
                            exportJSONAll();
                            exportMenuOpen = false;
                        }}>Download JSON (tutti)</button
                    >
                    <button
                        class="dropdown-item"
                        style="display:block; width:100%; padding:0.4em 0.75em; background:none; border:none; text-align:left; cursor:pointer;"
                        on:click={() => {
                            exportJSONFiltered();
                            exportMenuOpen = false;
                        }}>Download JSON (filtrati)</button
                    >
                </div>
            {/if}
        </div>
        <label
            style="font-size:0.85em; display:flex; align-items:center; gap:0.3em; margin:0; cursor:pointer;"
        >
            <input type="checkbox" bind:checked={fetchRelationships} />
            Fetch relationships
        </label>
        {#if twins.length > 0}
            <span class="text-muted" style="font-size: 0.85em;"
                >{twins.length} twin{twins.length !== 1 ? 's' : ''}</span
            >
        {/if}
        <button
            class="btn btn-link p-0 text-secondary lh-1 ms-auto"
            title="Setup instructions"
            on:click={() => (helpOpen = true)}
        >
            <i class="bi bi-info-circle" style="font-size: 0.95em;"></i>
        </button>
    </div>

    {#if errorMessage}
        <Alert color="danger" class="mb-2 py-2" style="font-size: 0.85em;">{errorMessage}</Alert>
    {/if}

    {#if twins.length > 0}
        <!-- Tab navigation -->
        <Nav tabs class="mb-2">
            <NavItem>
                <NavLink
                    active={activeTab === 'instances'}
                    on:click={() => (activeTab = 'instances')}
                >
                    Instances
                </NavLink>
            </NavItem>
            <NavItem>
                <NavLink
                    active={activeTab === 'relationships'}
                    on:click={() => (activeTab = 'relationships')}
                >
                    Relationships{relationships.length > 0 ? ` (${relationships.length})` : ''}
                </NavLink>
            </NavItem>
            <NavItem>
                <NavLink active={activeTab === 'edit'} on:click={() => (activeTab = 'edit')}>
                    Edit
                </NavLink>
            </NavItem>
            <NavItem>
                <NavLink active={activeTab === 'rules'} on:click={() => (activeTab = 'rules')}>
                    Rules
                </NavLink>
            </NavItem>
            <NavItem>
                <NavLink active={activeTab === 'raw'} on:click={() => (activeTab = 'raw')}>
                    Raw ASP
                </NavLink>
            </NavItem>
        </Nav>

        {#if activeTab === 'instances'}
            <div style="overflow-x: auto;">
                <div class="mb-2">
                    <Input type="text" placeholder="Search twins..." bind:value={searchText} />
                </div>

                {#if !groupByModel}
                    <Table bordered size="sm" class="instances-table">
                        <thead>
                            <tr>
                                <th>
                                    <button
                                        style="background:none; border:none; cursor:pointer; font-weight:bold; padding:0; color:inherit;"
                                        on:click={() => toggleSort('$dtId')}
                                    >
                                        $dtId{sortCol === '$dtId'
                                            ? sortDir === 'asc'
                                                ? ' ▲'
                                                : ' ▼'
                                            : ''}
                                    </button>
                                </th>
                                <th>
                                    <button
                                        style="background:none; border:none; cursor:pointer; font-weight:bold; padding:0; color:inherit;"
                                        on:click={() => toggleSort('$model')}
                                    >
                                        Model{sortCol === '$model'
                                            ? sortDir === 'asc'
                                                ? ' ▲'
                                                : ' ▼'
                                            : ''}
                                    </button>
                                </th>
                                {#each columns as key}
                                    <th>
                                        <button
                                            style="background:none; border:none; cursor:pointer; font-weight:bold; padding:0; color:inherit;"
                                            on:click={() => toggleSort(key)}
                                        >
                                            {key}{sortCol === key
                                                ? sortDir === 'asc'
                                                    ? ' ▲'
                                                    : ' ▼'
                                                : ''}
                                        </button>
                                    </th>
                                {/each}
                                <th>Labels</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each filteredTwins as twin}
                                {@const allLabels = [
                                    ...upstream_labels_for(twin['$dtId']),
                                    ...rules_labels_for(twin['$dtId'])
                                ]}
                                {@const rowBg =
                                    allLabels.length > 0
                                        ? badge_color(allLabels[0].label, allLabels[0].source) +
                                          '22'
                                        : ''}
                                <tr
                                    style={rowBg
                                        ? `background:${rowBg}; cursor:pointer;`
                                        : 'cursor:pointer;'}
                                    on:click={() => toggle_detail(twin['$dtId'])}
                                >
                                    <td><code>{twin['$dtId']}</code></td>
                                    <td
                                        style="font-size: 0.75em; color: #666;"
                                        title={twin['$metadata']?.['$model'] || ''}
                                        >{shortId(twin['$metadata']?.['$model'])}</td
                                    >
                                    {#each columns as key}
                                        <td>{twin[key] ?? ''}</td>
                                    {/each}
                                    <td>
                                        {#each allLabels as badge}
                                            <span
                                                style="display:inline-block; background:{badge_color(
                                                    badge.label,
                                                    badge.source
                                                )}; color:white; border-radius:3px; padding:1px 6px; font-size:0.78em; margin-right:3px; white-space:nowrap;"
                                            >
                                                {badge.source === 'upstream'
                                                    ? '↑ '
                                                    : ''}{badge.label}
                                            </span>
                                        {/each}
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </Table>
                {:else}
                    {#each modelGroups as [model, groupTwins]}
                        {@const groupColumns = scalar_keys(groupTwins)}
                        <details open style="margin-bottom: 0.75em;">
                            <summary
                                style="font-weight: bold; cursor: pointer; margin-bottom: 0.4em;"
                            >
                                {shortId(model)} — {groupTwins.length} twin{groupTwins.length !== 1
                                    ? 's'
                                    : ''}
                            </summary>
                            <Table bordered size="sm" class="instances-table">
                                <thead>
                                    <tr>
                                        <th>
                                            <button
                                                style="background:none; border:none; cursor:pointer; font-weight:bold; padding:0; color:inherit;"
                                                on:click={() => toggleSort('$dtId')}
                                            >
                                                $dtId{sortCol === '$dtId'
                                                    ? sortDir === 'asc'
                                                        ? ' ▲'
                                                        : ' ▼'
                                                    : ''}
                                            </button>
                                        </th>
                                        <th>
                                            <button
                                                style="background:none; border:none; cursor:pointer; font-weight:bold; padding:0; color:inherit;"
                                                on:click={() => toggleSort('$model')}
                                            >
                                                Model{sortCol === '$model'
                                                    ? sortDir === 'asc'
                                                        ? ' ▲'
                                                        : ' ▼'
                                                    : ''}
                                            </button>
                                        </th>
                                        {#each groupColumns as key}
                                            <th>
                                                <button
                                                    style="background:none; border:none; cursor:pointer; font-weight:bold; padding:0; color:inherit;"
                                                    on:click={() => toggleSort(key)}
                                                >
                                                    {key}{sortCol === key
                                                        ? sortDir === 'asc'
                                                            ? ' ▲'
                                                            : ' ▼'
                                                        : ''}
                                                </button>
                                            </th>
                                        {/each}
                                        <th>Labels</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {#each groupTwins as twin}
                                        {@const allLabels = [
                                            ...upstream_labels_for(twin['$dtId']),
                                            ...rules_labels_for(twin['$dtId'])
                                        ]}
                                        {@const rowBg =
                                            allLabels.length > 0
                                                ? badge_color(
                                                      allLabels[0].label,
                                                      allLabels[0].source
                                                  ) + '22'
                                                : ''}
                                        <tr
                                            style={rowBg
                                                ? `background:${rowBg}; cursor:pointer;`
                                                : 'cursor:pointer;'}
                                            on:click={() => toggle_detail(twin['$dtId'])}
                                        >
                                            <td><code>{twin['$dtId']}</code></td>
                                            <td
                                                style="font-size: 0.75em; color: #666;"
                                                title={twin['$metadata']?.['$model'] || ''}
                                                >{shortId(twin['$metadata']?.['$model'])}</td
                                            >
                                            {#each groupColumns as key}
                                                <td>{twin[key] ?? ''}</td>
                                            {/each}
                                            <td>
                                                {#each allLabels as badge}
                                                    <span
                                                        style="display:inline-block; background:{badge_color(
                                                            badge.label,
                                                            badge.source
                                                        )}; color:white; border-radius:3px; padding:1px 6px; font-size:0.78em; margin-right:3px; white-space:nowrap;"
                                                    >
                                                        {badge.source === 'upstream'
                                                            ? '↑ '
                                                            : ''}{badge.label}
                                                    </span>
                                                {/each}
                                            </td>
                                        </tr>
                                    {/each}
                                </tbody>
                            </Table>
                        </details>
                    {/each}
                {/if}
            </div>

            {#if detailTwinId}
                {@const detailTwin = twins.find((t) => t['$dtId'] === detailTwinId)}
                {#if detailTwin}
                    <div
                        style="border:1px solid #dee2e6; border-radius:4px; padding:0.75em; margin-top:0.5em; background:white; font-size:0.82em;"
                    >
                        <div style="font-weight:bold; margin-bottom:0.5em; color:#0d6efd;">
                            {detailTwinId}
                            <span style="font-weight:normal; color:#888; font-size:0.9em;"
                                >— {detailTwin['$metadata']?.['$model'] || ''}</span
                            >
                            <button
                                class="btn btn-link p-0 ms-2"
                                style="font-size:0.85em;"
                                on:click={() => (detailTwinId = '')}>✕</button
                            >
                        </div>
                        <div style="display:flex; gap:1.5em; flex-wrap:wrap;">
                            <!-- Left: properties -->
                            <div style="flex:1; min-width:180px;">
                                <div
                                    style="font-size:0.8em; color:#888; text-transform:uppercase; margin-bottom:0.3em;"
                                >
                                    Properties
                                </div>
                                {#each Object.entries(detailTwin).filter(([k]) => !k.startsWith('$')) as [k, v]}
                                    <div><code>{k}</code>: {v}</div>
                                {/each}
                            </div>
                            <!-- Right: correlated ASP facts -->
                            <div style="flex:2; min-width:220px;">
                                <div
                                    style="font-size:0.8em; color:#888; text-transform:uppercase; margin-bottom:0.3em;"
                                >
                                    ASP Facts
                                </div>
                                {#each detailFacts as { fact, source }}
                                    <div style="font-family:monospace; margin-bottom:2px;">
                                        <span
                                            style="color:{source === 'rules'
                                                ? '#fd7e14'
                                                : source === 'upstream'
                                                  ? '#6c757d'
                                                  : '#198754'};">{fact}</span
                                        >
                                        <span style="color:#bbb; font-size:0.85em; margin-left:6px;"
                                            >← {source}</span
                                        >
                                    </div>
                                {/each}
                                {#if detailFacts.length === 0}
                                    <em style="color:#aaa;">No correlated facts.</em>
                                {/if}
                            </div>
                        </div>
                    </div>
                {/if}
            {/if}
        {/if}

        <!-- Tab: Relationships -->
        {#if activeTab === 'relationships'}
            {#if relationships.length === 0}
                <em style="font-size: 0.9em; color: #888;">
                    {#if fetchRelationships}
                        No relationships found. Press Refresh to reload.
                    {:else}
                        Enable "Fetch relationships" in the toolbar and press Refresh, or load mock
                        data.
                    {/if}
                </em>
            {:else}
                <div style="overflow-x: auto;">
                    <Table bordered size="sm" class="instances-table">
                        <thead>
                            <tr>
                                <th>Source</th>
                                <th>Relationship</th>
                                <th>Target</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each relationships as rel}
                                <tr>
                                    <td><code>{rel['$sourceId']}</code></td>
                                    <td
                                        ><span style="color:#6c757d;"
                                            >{rel['$relationshipName']}</span
                                        ></td
                                    >
                                    <td><code>{rel['$targetId']}</code></td>
                                </tr>
                            {/each}
                        </tbody>
                    </Table>
                </div>
            {/if}
        {/if}

        <!-- Tab: Edit -->
        {#if activeTab === 'edit'}
            <InputGroup class="mb-3">
                <InputGroupText style="width: 8em;">Twin</InputGroupText>
                <Input type="select" value={selectedTwinId} on:change={onTwinSelect}>
                    {#each twins as twin}
                        <option value={twin['$dtId']}>{twin['$dtId']}</option>
                    {/each}
                </Input>
            </InputGroup>

            {#if Object.keys(editValues).length === 0}
                <Alert color="info" class="py-2">No scalar properties found for this twin.</Alert>
            {:else}
                {#each Object.entries(editValues) as [propName, val]}
                    {#if is_writable(propName)}
                        <InputGroup class="mb-1">
                            <InputGroupText style="width: 10em;">{propName}</InputGroupText>
                            <Input
                                type={typeof val === 'boolean'
                                    ? 'select'
                                    : typeof val === 'number'
                                      ? 'number'
                                      : 'text'}
                                bind:value={editValues[propName]}
                            >
                                {#if typeof val === 'boolean'}
                                    <option value={true}>true</option>
                                    <option value={false}>false</option>
                                {/if}
                            </Input>
                        </InputGroup>
                    {:else}
                        <InputGroup class="mb-1">
                            <InputGroupText style="width: 10em;">{propName}</InputGroupText>
                            <Input type="text" value={String(val)} disabled />
                            <InputGroupText title="Read-only">🔒</InputGroupText>
                        </InputGroup>
                    {/if}
                {/each}

                {#if pushSuccess}
                    <Alert color="success" class="py-2 mt-2">Push completed successfully.</Alert>
                {/if}
                {#if pushError}
                    <Alert color="danger" class="py-2 mt-2">{pushError}</Alert>
                {/if}

                <Button color="primary" class="mt-2" on:click={requestPush} disabled={isLoading}>
                    {#if isLoading}
                        <Spinner size="sm" /> Sending...
                    {:else}
                        <i class="bi bi-cloud-upload"></i> Push to Azure
                    {/if}
                </Button>
            {/if}
        {/if}

        <!-- Tab: Rules -->
        {#if activeTab === 'rules'}
            <textarea
                bind:value={rulesText}
                rows="8"
                placeholder={'% Write ASP rules here. You can use:\n% dtdl_instance(T, Model) and dtdl_property_value(T, Prop, Val)\n%\n% Example:\n% alert(T, "hot") :- dtdl_property_value(T, "temperature", V), V > 25.'}
                style="width:100%; font-family:monospace; font-size:0.82em; border:1px solid #ced4da; border-radius:4px; padding:0.5em; resize:vertical;"
            ></textarea>

            <div class="d-flex align-items-center gap-2 mt-2">
                <Button
                    color="primary"
                    size="sm"
                    on:click={run_rules}
                    disabled={rulesRunning || twins.length === 0}
                >
                    {#if rulesRunning}
                        <Spinner size="sm" /> Running...
                    {:else}
                        ▶ Run Rules
                    {/if}
                </Button>
                {#if twins.length === 0}
                    <span style="font-size:0.82em; color:#888;">Load twins first.</span>
                {:else if rulesFactCount > 0}
                    <span style="font-size:0.82em; color:#198754;"
                        >✓ {rulesFactCount} derived fact{rulesFactCount !== 1 ? 's' : ''}</span
                    >
                {/if}
            </div>

            {#if rulesError}
                <Alert color="danger" class="mt-2 py-2" style="font-size:0.82em;"
                    >{rulesError}</Alert
                >
            {/if}

            {#if derivedFacts.length > 0}
                <!-- Add trailing dot for display only — derivedFacts are stored without dot -->
                <pre
                    style="font-size:0.82em; background:#f8f9fa; padding:0.75em; border-radius:4px; overflow-x:auto; margin-top:0.75em;">{derivedFacts
                        .map((f) => f + '.')
                        .join('\n')}</pre>
            {/if}
        {/if}

        <!-- Tab: Raw ASP -->
        {#if activeTab === 'raw'}
            <pre
                style="font-size: 0.82em; background: #f8f9fa; padding: 0.75em; border-radius: 4px; overflow-x: auto;">{get_asp_facts()}</pre>
        {/if}
    {:else if !isLoading && !errorMessage}
        <em style="font-size: 0.9em; color: #888;"
            >No instances loaded. Press Refresh to fetch twins from Azure DT.</em
        >
    {/if}
</div>

<Modal isOpen={confirmModalOpen} toggle={() => (confirmModalOpen = false)}>
    <ModalHeader toggle={() => (confirmModalOpen = false)}>Confirm push to Azure</ModalHeader>
    <ModalBody>
        <p>The following changes will be sent to <strong>{selectedTwinId}</strong>:</p>
        <table class="table table-sm table-bordered">
            <thead><tr><th>Property</th><th>Current</th><th>New</th></tr></thead>
            <tbody>
                {#each pendingPatches as patch}
                    <tr>
                        <td><code>{patch.propName}</code></td>
                        <td>{String(patch.oldValue ?? '')}</td>
                        <td><strong>{String(patch.newValue)}</strong></td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </ModalBody>
    <ModalFooter>
        <Button color="secondary" on:click={() => (confirmModalOpen = false)} disabled={isLoading}
            >Annulla</Button
        >
        <Button color="primary" on:click={confirmPush} disabled={isLoading}>
            {#if isLoading}<Spinner size="sm" /> Invio...{:else}Conferma push{/if}
        </Button>
    </ModalFooter>
</Modal>

<Modal isOpen={helpOpen} toggle={() => (helpOpen = false)} size="lg">
    <ModalHeader toggle={() => (helpOpen = false)}>How to use @DTDL/Instances</ModalHeader>
    <ModalBody>
        <p>
            This component fetches digital twin instances from Azure Digital Twins and lets you
            view, edit, and push changes back. It requires two ingredients to be placed <strong
                >before</strong
            > it in the pipeline.
        </p>

        <h6>Required pipeline</h6>
        <pre
            style="background:#f8f9fa; padding:0.5em; border-radius:4px; font-size:0.85em;">@DTDL/Register Azure Key → @DTDL/Config → @DTDL/Instances</pre>
        <ul>
            <li>
                <strong>@DTDL/Register Azure Key</strong> — stores your Azure AD credentials (Tenant ID,
                Client ID, Client Secret). Required to obtain an OAuth2 access token.
            </li>
            <li>
                <strong>@DTDL/Config</strong> — injects the ADT endpoint and optional model filter into
                the pipeline as ASP facts.
            </li>
        </ul>

        <h6>Optional: writable-property detection</h6>
        <pre
            style="background:#f8f9fa; padding:0.5em; border-radius:4px; font-size:0.85em;">@DTDL/Register Azure Key → @DTDL/Config → @DTDL/Parse → @DTDL/Instances</pre>
        <p>
            Adding <strong>@DTDL/Parse</strong> before this component enables automatic detection of
            which properties are declared <code>writable: true</code> in the DTDL model. Without it, all
            scalar properties are shown as editable.
        </p>

        <h6>Usage</h6>
        <ol>
            <li>Press <strong>Refresh</strong> to fetch twins from Azure Digital Twins.</li>
            <li>Use the <strong>Instances</strong> tab to browse all twins in a table.</li>
            <li>
                Use the <strong>Edit</strong> tab to select a twin and modify its writable
                properties, then press <strong>Push to Azure</strong> to save changes.
            </li>
            <li>
                Use the <strong>Raw ASP</strong> tab to inspect the facts emitted to downstream ingredients.
            </li>
        </ol>

        <h6>Output facts</h6>
        <pre
            style="background:#f8f9fa; padding:0.5em; border-radius:4px; font-size:0.85em;">dtdl_instance("twinId", "dtmi:example:Model;1").
dtdl_property_value("twinId", "propertyName", value).</pre>
    </ModalBody>
</Modal>

<svelte:window on:click={handleWindowClick} />

<style>
    :global(.instances-table th) {
        background-color: #777;
        color: white;
        font-size: 0.85em;
        white-space: nowrap;
    }
    :global(.instances-table td) {
        font-size: 0.85em;
        vertical-align: middle;
    }
</style>
