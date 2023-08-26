<script context="module">
    import {Recipe} from "$lib/recipe";
    import _ from 'lodash';

    const operation = "Sort by Predicate or Argument";
    const default_extra_options = {
        sort_index: 0,
        descending: false,
    };

    Recipe.register_operation_type(operation, async (input, options) => {
        const comparator = options.sort_index === 0 ?
            [atom => atom.predicate] :
            [atom => {
                if (!atom.terms) {
                    return undefined;
                }
                const term = atom.terms[options.sort_index - 1];
                if (term === undefined) {
                    return undefined
                } else if (term.number !== undefined) {
                    return term.number;
                } else {
                    return term.str;
                }
            }];
        const mapper = options.descending ?
            model => _.sortBy(model, comparator).reverse() :
            model => _.sortBy(model, comparator);
        return input.map(mapper);
    });
</script>

<script>
    import Operation from "$lib/operations/Operation.svelte";
    import {Button, Input, InputGroup, InputGroupText} from "sveltestrap";

    export let id;
    export let options;
    export let index;
    export let add_to_recipe;
    export let keybinding;

    function edit() {
        Recipe.edit_operation(id, index, options);
    }

    function toggle_descending() {
        options.descending = !options.descending;
        edit();
    }

</script>

<Operation {id} {operation} {options} {index} {default_extra_options} {add_to_recipe} {keybinding}>
    <div slot="description">
        <p>
            The <strong>{operation}</strong> operation sorts each model in input according to the specified criteria.
        </p>
        <p>
            If the specified index is 0, atoms are sorted by predicate.
            Otherwise, atoms are sorted by the term at the specified index.
        </p>
        <p>
            The order can be ascending (the default) or descending.
        </p>
        <p>
            Note that a stable sort algorithm is used.
            Ordering of ties can be specified by adding another {operation} operation (first criteria come after in the recipe).
        </p>
    </div>
    <InputGroup>
        <InputGroupText>Index</InputGroupText>
        <Input type="number"
               min="0"
               bind:value={options.sort_index}
               on:input={edit}
               data-testid="SortByPredicateOrArgument-sort-index"
        />
        <Button outline="{!options.descending}" on:click={toggle_descending}>Descending</Button>
    </InputGroup>
</Operation>
