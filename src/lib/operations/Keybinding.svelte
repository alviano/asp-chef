<script context="module">
    import {Recipe} from "$lib/recipe";
    import {Utils} from "$lib/utils";

    const operation = "Keybinding";
    const default_extra_options = {
        key: 'K',
        case_sensitive: false,
        output_predicate: "__key__",
    };

    const last_event = new Map();

    Recipe.register_operation_type(operation, async (input, options, index, id) => {
        if (options.output_predicate && last_event.has(id)) {
            const the_event = last_event.get(id);
            const atom = `${options.output_predicate}("${the_event[0]}",index(${index + 1}),${the_event[1]})`;
            return input.map(part => [...part, Utils.parse_atom(atom)]);
        } else {
            return input;
        }
    });
</script>

<script>
    import {Button, Input, InputGroup, InputGroupText} from "sveltestrap";
    import Operation from "$lib/Operation.svelte";
    import {onDestroy, onMount} from "svelte";
    import {keydown} from "dumbo-svelte";

    export let id;
    export let options;
    export let index;
    export let add_to_recipe;
    export let keybinding;

    function edit() {
        Recipe.edit_operation(id, index, options);
    }

    function toggle_case_sensitive() {
        options.case_sensitive = !options.case_sensitive;
        edit();
    }

    function clear() {
        last_event.delete(id);
        edit();
    }

    onMount(() => {
        if (id !== undefined) {
            $keydown.unshift([id, (event) => {
                if (options.apply &&
                    (options.case_sensitive ? options.key === event.key : options.key.toUpperCase() === event.key.toUpperCase())) {
                    const date = new Date();
                    last_event.set(id, [options.key.replaceAll('"', '\\"'), `time(${date.getHours()}, ${date.getMinutes()}, ${date.getSeconds()})`]);
                    edit();
                    return true;
                }
            }]);
        }
    });

    onDestroy(() => {
        if (id !== undefined) {
            $keydown = $keydown.filter(key_value => key_value[0] !== id);
        }
    });
</script>

<Operation {id} {operation} {options} {index} {default_extra_options} {add_to_recipe} {keybinding}>
    <InputGroup>
        <InputGroupText style="width: 9em;">Key</InputGroupText>
        <Input bind:value={options.key} />
        <Button style="width: 12em;" outline="{!options.case_sensitive}" on:click={toggle_case_sensitive}>Case sensitive</Button>
    </InputGroup>
    <InputGroup>
        <InputGroupText style="width: 9em;">Output predicate</InputGroupText>
        <Input bind:value={options.output_predicate} on:change={edit} placeholder="output predicate" />
        <Button title="Remove any emitted atom" style="width: 12em;" on:click={clear}>Clear</Button>
    </InputGroup>
</Operation>
