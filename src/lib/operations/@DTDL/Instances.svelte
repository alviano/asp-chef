<script context="module">
    import { Option, Recipe } from '$lib/recipe';
    import { Utils } from '$lib/utils.js';

    const operation = '@DTDL/Instances';
    export const default_extra_options = {
        predicate_config: Option('__dtdl_azure_config__', 'Predicate to read ADT configuration from', 'predicate_name'),
        predicate_dtdl: Option('__base64__', 'Predicate containing DTDL facts (Base64) produced by @DTDL/Parse', 'predicate_name'),
        predicate_output: Option('dtdl_', 'Output predicate prefix (e.g. dtdl_instance, dtdl_property_value)', 'string'),
        label_predicates: Option('', 'Comma-separated predicates to show as badges (e.g. alert/2, anomaly/1)', 'string'),
        rules: Option('', 'ASP rules that reason over loaded twins (saved with pipeline)', 'textarea'),
    };

    const listeners = new Map();
    const derived_facts_store = new Map(); 

    export function set_derived_facts(id, facts) {
        derived_facts_store.set(id, facts);
    }

    Recipe.register_operation_type(operation, async (input, options, index, id) => {
        try {
            await listeners.get(id)(input);
        } catch (error) {
            /* component not mounted, possibly because of headless mode */
        }
        const facts = derived_facts_store.get(id) || [];
        if (facts.length === 0) return input;
        const derived_part = facts.map(f => Utils.parse_atom(f));
        return [...input, derived_part];
    });
</script>

<script>
    import Operation from '$lib/Operation.svelte';
    import { onMount, onDestroy } from 'svelte';
    import InstancesView from './+Instances.svelte';

    export let id;
    export let options;
    export let index;
    export let add_to_recipe;
    export let keybinding;

    let input_data = [];

    onMount(() => listeners.set(id, (data) => { input_data = data; }));
    onDestroy(() => { listeners.delete(id); derived_facts_store.delete(id); });
</script>

<Operation {id} {operation} {options} {index} {default_extra_options} {add_to_recipe} {keybinding}>
    <div slot="output">
        <InstancesView {id} inputData={input_data} {options} {index} />
    </div>
</Operation>
