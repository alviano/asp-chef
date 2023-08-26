<script context="module">
    import {Recipe} from "$lib/recipe";
    import {Utils} from "$lib/utils";
    import XLSX from "xlsx";
    import {Base64} from "js-base64";
    import {consts} from "$lib/consts";

    const operation = "Parse CSV";
    const default_extra_options = {
        decode_predicate: '__base64__',
        echo_encoded_content: false,
        separator: 'TAB',
        output_predicate: '__cell__',
    };

    function csv2facts(content, options) {
        let separator = options.separator;
        if (separator === 'TAB') {
            separator = '\t';
        } else if (separator === 'SPACE') {
            separator = ' ';
        } else if (separator === '') {
            separator = consts.SYMBOLS.MODELS_SEPARATOR;
            content = content.split('\n').map(line => line.split('').join(separator)).join('\n');
        }

        const csv = XLSX.read(content, {
            type: "string",
            FS: separator,
            dense: true,
        });
        const data = csv.Sheets[csv.SheetNames[0]]["!data"];
        return data.map((row_data, row) => {
            return row_data.map((value, col) => {
                return `${options.output_predicate}(${row + 1},${col + 1},${value.t === 'n' ?
                    (Number.isInteger(value.v) ? value.v : `real("${value.v}")`) :
                    '"' + value.v.replaceAll('"', '\\"') + '"'}).`;
            }).join('\n');
        }).join('\n');
    }

    Recipe.register_operation_type(operation, async (input, options, index) => {
        const mapper = atom => atom.str + '.';
        const res = [];
        for (const part of input) {
            try {
                const program = part.map(atom => {
                     if (atom.predicate === options.decode_predicate) {
                        const content = Base64.decode(atom.terms[0].string);
                        return csv2facts(content, options) + (options.echo_encoded_content ? '\n' + mapper(atom) : '');
                    }
                    return mapper(atom);
                }).join('\n');
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
        Recipe.edit_operation(id, index, options);
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
        <InputGroupText>Decode</InputGroupText>
        <Input type="text"
               bind:value={options.decode_predicate}
               placeholder="decode predicate"
               on:input={edit}
               data-testid="ParseCSV-decode-predicate"
        />
        <Button outline="{!options.echo_encoded_content}" on:click={() => { options.echo_encoded_content = !options.echo_encoded_content; edit(); }}>Echo</Button>
        <InputGroupText>Separator</InputGroupText>
        <Input type="text"
               bind:value={options.separator}
               placeholder="TAB|SPACE|char"
               on:input={edit}
               data-testid="ParseCSV-separator"
        />
    </InputGroup>
    <InputGroup>
        <InputGroupText>Output predicate</InputGroupText>
        <Input type="text"
               bind:value={options.output_predicate}
               placeholder="predicate"
               on:input={edit}
               data-testid="ParseCSV-output-predicate"
        />
    </InputGroup>
</Operation>
