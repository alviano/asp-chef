<script context="module">
    import {Recipe} from "$lib/recipe";
    import {Utils} from "$lib/utils";
    import {Base64} from "js-base64";

    const operation = "Symmetric Closure";
    const default_extra_options = {
        input_predicate: 'input_predicate',
        closure_predicate: 'closure_predicate',
        encode_predicate: '__base64__',
    };

    const listeners = new Map();

    Recipe.register_operation_type(operation, async (input, options, index, id) => {
        try {
            listeners.get(id)(input);
        } catch (error) { /* component not mounted, possibly because of headless mode */ }

        const content = Base64.encode(`
${options.closure_predicate}(X,Y) :- ${options.input_predicate}(X,Y).
${options.closure_predicate}(Y,X) :- ${options.input_predicate}(X,Y).
                `.trim());
        const encoded_content = `${options.encode_predicate}("${content}").`;
        const mapper = atom => atom.str + '.';
        const res = [];
        for (const part of input) {
            try {
                const program = part.map(mapper).join('\n') + encoded_content;
                const model = await Utils.search_model(program);
                res.push(Utils.parse_atoms(model));
            } catch (error) {
                Recipe.set_errors_at_index(index, error, res);
            }
        }
        return res;
    });
</script>

<script>
    import {Button, FormGroup, Icon, Input, InputGroup, InputGroupText} from "sveltestrap";
    import Operation from "$lib/Operation.svelte";
    import {onDestroy, onMount} from "svelte";

    export let id;
    export let options;
    export let index;
    export let add_to_recipe;
    export let keybinding;

    let input_predicates = [];
    let show_predicate_list = false;

    function toggle_show_predicate_list() {
        show_predicate_list = !show_predicate_list;
    }

    function edit() {
        Recipe.edit_operation(id, index, options);
    }

    onMount(() => {
        listeners.set(id, (input) => {
            input_predicates = Utils.predicates(input).filter(predicate => predicate !== 'CONSTANTS');
        });
    });

    onDestroy(() => {
        listeners.delete(id);
    });
</script>

<Operation {id} {operation} {options} {index} {default_extra_options} {add_to_recipe} {keybinding}>
    <div slot="description">
        <p>The <strong>{operation}</strong> operation extends models in input with the rules encoding the symmetric closure of a predicate.</p>
        <p>
            The content is base64 encoded and wrapped by predicate <code>__base64__</code>.
        </p>
        <p>
            The name of the unary predicate <code>__base64__</code> can be specified in the recipe.
        </p>
    </div>
    <InputGroup>
        <InputGroupText style="width: 10em;">Input predicate</InputGroupText>
        <Input type="text"
               bind:value={options.input_predicate}
               placeholder="input predicate"
               on:input={edit}
               data-testid="SymmetricClosure-input-predicate"
        />
        <Button on:click={() => toggle_show_predicate_list()}>
            <Icon name="list-ul" />
        </Button>
    </InputGroup>
    {#if show_predicate_list}
        <FormGroup class="p-3">
            {#each input_predicates as predicate}
                <Input type="radio"
                       bind:group={options.input_predicate}
                       value="{predicate}"
                       label="{predicate}"
                />
            {/each}
        </FormGroup>
    {/if}
    <InputGroup>
        <InputGroupText style="width: 10em;">Closure predicate</InputGroupText>
        <Input type="text"
               bind:value={options.closure_predicate}
               placeholder="closure predicate"
               on:input={edit}
               data-testid="SymmetricClosure-closure-predicate"
        />
    </InputGroup>
    <InputGroup>
        <InputGroupText style="width: 10em;">Encode predicate</InputGroupText>
        <Input type="text"
               bind:value={options.encode_predicate}
               placeholder="encode predicate"
               on:input={edit}
               data-testid="SymmetricClosure-encode-predicate"
        />
    </InputGroup>
</Operation>
