<script context="module">
    import {Recipe} from "$lib/recipe";
    import {Dumbo} from "$lib/operations/@dumbo/dumbo";
    import {Base64} from "js-base64";

    const operation = "@dumbo/Expand Global Variables";
    const default_extra_options = {
        program_predicate: '__program__',
        herbrand_base_predicate: '',
        expand: {},
    };

    const listeners = new Map();

    Recipe.register_operation_type(operation, async (input, options, index, id) => {
        const res = [];
        try {
            Dumbo.validate_one_model(input);
            const input_part = [];
            const program_parts = [];
            const herbrand_base_parts = [];
            input[0].forEach(atom => {
                if (atom.predicate === options.program_predicate) {
                    program_parts.push(Base64.decode(atom.terms[0].string));
                    return;
                }
                if (atom.predicate === options.herbrand_base_predicate) {
                    herbrand_base_parts.push(Base64.decode(atom.terms[0].string));
                }
                input_part.push(atom);
            });
            let program = program_parts.join('\n');
            let herbrand_base = herbrand_base_parts.join('\n');

            try {
                await listeners.get(id)(program);
            } catch (error) { /* component not mounted, possibly because of headless mode */ }

            const expand = {};
            for (const [rule, variables] of Object.entries(options.expand)) {
                expand[rule] = Object.entries(variables)
                    .filter(([variable, expand]) => expand)
                    .map(([variable, expand]) => variable);
            }
            const json = await Dumbo.fetch("expand-global-safe-variables/", {
                program,
                herbrand_base,
                expand,
            });
            input_part.push(Dumbo.encode_program(json.program, options.program_predicate));
            res.push(input_part);
        } catch (error) {
            Recipe.set_errors_at_index(index, error, res);
        }
        return res;
    });
</script>

<script>
    import {Button, Input, InputGroup, InputGroupText} from "@sveltestrap/sveltestrap";
    import Operation from "$lib/Operation.svelte";
    import {onDestroy, onMount} from "svelte";
    import CodeMirror from "$lib/CodeMirror.svelte";
    import {AutoHideBadge} from "dumbo-svelte";

    export let id;
    export let options;
    export let index;
    export let add_to_recipe;
    export let keybinding;

    function edit() {
        Recipe.edit_operation(id, index, options);
        rules = rules;
    }

    let rules = [];

    function is_expanded(rule, variable) {
        return options.expand[rule] && options.expand[rule][variable];
    }

    function toggle_expand(rule, variable) {
        if (!(rule in options.expand)) {
            options.expand[rule] = {};
        }
        options.expand[rule][variable] = !options.expand[rule][variable];
        edit();
    }

    function clear() {
        options.expand = {};
        edit();
    }

    onMount(() => {
        listeners.set(id, async (program) => {
            const json = await Dumbo.fetch("global-safe-variables/", {
                program
            });
            rules = json.rules;
        });
    });

    onDestroy(() => {
        listeners.set(id, null);
    });
</script>

<Operation {id} {operation} {options} {index} {default_extra_options} {add_to_recipe} {keybinding}>
    <InputGroup>
        <InputGroupText style="width: 8em;">Program</InputGroupText>
        <Input type="text"
               bind:value={options.program_predicate}
               placeholder="program predicate"
               on:input={edit}
        />
    </InputGroup>
    <InputGroup>
        <InputGroupText style="width: 8em;">Herbrand base</InputGroupText>
        <Input type="text"
               bind:value={options.herbrand_base_predicate}
               placeholder="herbrand base predicate (optional)"
               on:input={edit}
        />
    </InputGroup>
    <Button block on:click={clear}>Clear expanded variables</Button>
    <div slot="output">
        {#each rules as {rule, variables}, rule_index}
            {#if variables.length > 0}
                <InputGroup>
                    <InputGroupText style="width: 6em;"><strong>Rule #{rule_index + 1}</strong></InputGroupText>
                    <Input disabled />
                    {#each variables as variable}
                        <Button outline="{!is_expanded(rule, variable)}"
                                title="Expand"
                                style="font-family: monospace; text-transform: none;"
                                on:click={() => toggle_expand(rule, variable)}>
                            {variable}
                        </Button>
                    {/each}
                </InputGroup>
                <div style="height: {options.height}px; overflow-y: auto">
                    <AutoHideBadge color="warning">readonly</AutoHideBadge>
                    <CodeMirror bind:value={rule} readonly lineWrapping="{true}" />
                </div>
            {/if}
        {/each}
    </div>
</Operation>
