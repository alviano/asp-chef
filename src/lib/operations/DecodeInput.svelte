<script context="module">
    import {Recipe} from "$lib/recipe";
    import {Base64} from "js-base64";
    import {consts} from "$lib/consts";

    const operation = "Decode Input";
    const default_extra_options = {
        predicate: '__base64__',
        echo: false,
        include_others: false,
    };

    Recipe.register_operation_type(operation, async (input, options, index) => {
        const mapper = atom => atom.str + '.';

        const expanded = input.map(part => part.map(atom => {
            if (atom.predicate === options.predicate) {
                return Base64.decode(atom.terms[0].string) + (options.echo ? '\n' + mapper(atom) : '');
            } else if (options.include_others) {
                return mapper(atom);
            }
        }).join('\n')).join('\n' + consts.SYMBOLS.MODELS_SEPARATOR + '\n');

        try {
            return await Recipe.process_input(expanded, false);
        } catch (error) {
            Recipe.set_errors_at_index(index, error);
            return [];
        }
    });
</script>

<script>
    import {Button, Input, InputGroup, InputGroupText} from "sveltestrap";
    import Operation from "$lib/operations/Operation.svelte";

    export let id;
    export let options;
    export let index;
    export let add_to_recipe;
    export let keybinding;

    function edit() {
        Recipe.edit_operation(index, options);
    }
</script>

<Operation {id} {operation} {options} {index} {default_extra_options} {add_to_recipe} {keybinding}>
    <div slot="description">
        <p>The <strong>{operation}</strong> operation expand the input with the base64 encoded content in the specified predicate.</p>
        <p>
            The expanded input is processed according to the input format, that is, using the separator {consts.SYMBOLS.MODELS_SEPARATOR} to separated models.
        </p>
        <p>
            The name of the unary predicate <code>__base64__</code> used to wrap the base64 content can be specified in the recipe.
        </p>
        <p>
            The instances of <code>__base64__</code> can be echoed or suppressed.
            Other predicates in input can be included or excluded.
        </p>
    </div>
    <InputGroup>
        <InputGroupText>Predicate</InputGroupText>
        <Input type="text"
               bind:value="{options.predicate}"
               placeholder="predicate"
               on:input={edit}
               data-testid="DecodeInput-predicate"
        />
        <Button outline="{!options.include_others}" on:click={() => { options.include_others = !options.include_others; edit(); }}>Include Others</Button>
        <Button outline="{!options.echo}" on:click={() => { options.echo = !options.echo; edit(); }}>Echo</Button>
    </InputGroup>
</Operation>
