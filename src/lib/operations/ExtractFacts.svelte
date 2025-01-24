<script context="module">
    import {Recipe} from "$lib/recipe";
    import { Base64 } from "js-base64";
    import {Utils} from "$lib/utils";
    

    const operation = "Extract Facts";
    const default_extra_options = {
        height: 200,
        predicate: '__base64__',
    };

    const listeners = new Map();
    
    Recipe.register_operation_type(operation, async (input, options, index, id) => {
        let res = []
        const regex = /\b[a-zA-Z][\w_]*\([^)]*\)/g;
        try {
            listeners.get(id)(input);
            const predicates = input.find(part => part.some(atom => atom.predicate === options.predicate))
            if (predicates) {
                const facts = [];
                for (const p of predicates) {
                    const text = Base64.decode(p.terms[0].string);
                    const matches = text.match(regex);
                    if (matches)
                        matches.forEach(m => facts.push(`${m}.`));
                }
                const content = Base64.encode(facts.join('\n'));
                const encoded_content = Utils.parse_atom(`${options.predicate}("${content}")`);
                input.forEach(part => {
                    const t = []
                    part.forEach(a => {
                        if (a.predicate != options.predicate)
                            t.push(a)
                    })
                    res.push([...t, encoded_content])
                });
            }
            
        } catch (error) { /* component not mounted, possibly because of headless mode */ }
        return res;
    });

</script>

<script>
    import {Input, InputGroup, InputGroupText} from "sveltestrap";
    import {onDestroy, onMount} from "svelte";
    import Operation from "$lib/Operation.svelte";

    export let id;
    export let options;
    export let index;
    export let add_to_recipe;
    export let keybinding;

    let models = [];

    function edit() {
        Recipe.edit_operation(id, index, options);
    }

    onMount(() => {
        listeners.set(id, (input) => {
            models = input;
        });
    });

    onDestroy(() => {
        listeners.set(id, null);
    });
</script>

<Operation {id} {operation} {options} {index} {default_extra_options} {add_to_recipe} {keybinding}>
    <InputGroup>
        <InputGroupText>Height</InputGroupText>
        <Input type="number"
               bind:value={options.height}
               min="20"
               step="20"
               style="max-width: 5em;"
               on:input={edit}
        />
        <InputGroupText>Predicate</InputGroupText>
        <Input type="text"
               bind:value="{options.predicate}"
               placeholder="predicate"
               on:input={edit}
        />
    </InputGroup>
</Operation>