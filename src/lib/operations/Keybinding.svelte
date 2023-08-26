<script context="module">
    import {Recipe} from "$lib/recipe";
    import {Utils} from "$lib/utils";

    const operation = "Keybinding";
    const default_extra_options = {
        key: 'K',
        case_sensitive: false,
        output_predicate: "__key__",
        last_event: null,
    };

    Recipe.register_operation_type(operation, async (input, options, index) => {
        if (options.output_predicate && options.last_event) {
            const atom = `${options.output_predicate}("${options.key}",index(${index + 1}),${options.last_event})`;
            return input.map(part => [...part, Utils.parse_atom(atom)]);
        } else {
            return input;
        }
    });
</script>

<script>
    import {Button, Input, InputGroup, InputGroupText} from "sveltestrap";
    import Operation from "$lib/operations/Operation.svelte";
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

    onMount(() => {
        if (id !== undefined) {
            $keydown.unshift([id, (event) => {
                if (options.apply &&
                    (options.case_sensitive ? options.key === event.key : options.key.toUpperCase() === event.key.toUpperCase())) {
                    const date = new Date();
                    options.last_event = `time(${date.getHours()}, ${date.getMinutes()}, ${date.getSeconds()})`;
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
    <div slot="description">
        <p>
            The <strong>{operation}</strong> operation adds a user-defined keybinding.
        </p>
        <p>
            Keybindings are captured when no element has the focus (press <code>Escape</code> to release the focus).
            An atom of the form <code>__key__(KEY, index(INDEX), time(HOUR,MINUTES,SECONDS))</code> is added to each model in input (if predicate <code>__key__</code> is given).
        </p>
        <p>
            <strong>Attention!</strong>
            User-defined keybindings have priority over UI keybindings.
            Duplicated user-defined keybindings can result in unexpected behavior.
        </p>
    </div>
    <div class="m-3">
        <InputGroup>
            <InputGroupText style="width: 9em;">Key</InputGroupText>
            <Input bind:value={options.key} />
            <Button outline="{!options.case_sensitive}" on:click={toggle_case_sensitive}>Case sensitive</Button>
        </InputGroup>
    </div>
</Operation>
