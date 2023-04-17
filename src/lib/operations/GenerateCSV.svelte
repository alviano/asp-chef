<script context="module">
    import {Recipe} from "$lib/recipe";
    import {Utils} from "$lib/utils";
    import XLSX from "xlsx";
    import {Base64} from "js-base64";
    import {consts} from "$lib/consts";

    const operation = "Generate CSV";
    const default_extra_options = {
        input_predicate: '__cell__',
        echo_input: false,
        separator: 'TAB',
        encode_predicate: '__base64__',
    };

    function facts2csv(aoa, options) {
        let separator = options.separator;
        if (separator === 'TAB') {
            separator = '\t';
        } else if (separator === 'SPACE') {
            separator = ' ';
        } else if (separator === '') {
            separator = consts.SYMBOLS.MODELS_SEPARATOR;
        }

        const the_aoa = [];
        aoa.forEach((value, key) => {
            while (the_aoa.length < key[0]) {
                the_aoa.push(['']);
            }
            while (the_aoa[key[0] - 1].length < key[1]) {
                the_aoa[key[0] - 1].push('');
            }
            the_aoa[key[0] - 1][key[1] - 1] = value;
        });

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(the_aoa));

        const res = XLSX.write(workbook, {
            type: 'string',
            bookType: 'csv',
            FS: separator,
        });
        return separator === consts.SYMBOLS.MODELS_SEPARATOR ? res.replaceAll(separator, '') : res;
    }

    Recipe.register_operation_type(operation, async (input, options, index) => {
        const mapper = atom => atom.str + '.';
        const res = [];
        for (const part of input) {
            try {
                const aoa = new Map();
                const program = part.map(atom => {
                     if (atom.predicate === options.input_predicate) {
                        const terms = atom.terms;
                        if (terms.length !== 3) {
                            throw Error('Error: expecting 3 arguments, found ' + terms.length);
                        }
                        aoa.set([atom.terms[0].number, atom.terms[1].number], atom.terms[2].number || atom.terms[2].string || atom.terms[2].str);
                        return options.echo_input ? mapper(atom) : '';
                    }
                    return mapper(atom);
                }).join('\n') + '\n' + `${options.encode_predicate}("${Base64.encode(facts2csv(aoa, options))}").`;
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
        <p>The <strong>{operation}</strong> operation maps constants to facts.</p>
        <p>
            Each constant value <code>v</code> in row <code>r</code> and column <code>c</code> is mapped to fact <code>__cell__(r,c,v).</code>
        </p>
        <p>
            The name of the ternary predicate <code>__cell__</code> can be specified in the recipe.
        </p>
    </div>
    <InputGroup>
        <InputGroupText>Input predicate</InputGroupText>
        <Input type="text"
               bind:value={options.input_predicate}
               placeholder="input predicate"
               on:input={edit}
               data-testid="GenerateCSV-input-predicate"
        />
        <Button outline="{!options.echo_input}" on:click={() => { options.echo_input = !options.echo_input; edit(); }}>Echo</Button>
    </InputGroup>
    <InputGroup>
        <InputGroupText>Encode predicate</InputGroupText>
        <Input type="text"
               bind:value={options.encode_predicate}
               placeholder="encode predicate"
               on:input={edit}
               data-testid="GenerateCSV-encode-predicate"
        />
        <InputGroupText>Separator</InputGroupText>
        <Input type="text"
               bind:value={options.separator}
               placeholder="TAB|SPACE|char"
               on:input={edit}
               data-testid="GenerateCSV-separator"
        />
    </InputGroup>
</Operation>
