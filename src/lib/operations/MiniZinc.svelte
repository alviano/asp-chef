<script context="module">
    import {Recipe} from "$lib/recipe";
    import {Utils} from "$lib/utils";
    import {Base64} from "js-base64";
    //import { Model } from 'https://cdn.jsdelivr.net/npm/minizinc/dist/minizinc.mjs';

    const operation = "MiniZinc";
    const default_extra_options = {
        height: 200,
        model: '',
        number: 1,
        raises: true,
        decode_predicate: '__base64__',
        input_predicate: '__input__',
        output_predicate: '__output__',
        echo: false,
    };

    function process_output_value(value) {
        if (typeof value === "number" && !Number.isInteger(value)) {
            return `float("${value}")`;
        }
        return value;
    }

    function process_output(output_predicate, variable, value) {
        if (Array.isArray(value)) {
            if (value.length > 0 && Array.isArray(value[0])) {
                return [Utils.parse_atom(`${output_predicate}("${variable}", array2d)`)].concat(value.flatMap(
                    (element, outer_index) => element.map(
                        (element, inner_index) => Utils.parse_atom(`${output_predicate}("${variable}", ${outer_index+1}, ${inner_index+1}, ${process_output_value(element)})`)
                    )
                ));
            }
            return [Utils.parse_atom(`${output_predicate}("${variable}", array)`)].concat(value.map(
                (element, index) => Utils.parse_atom(`${output_predicate}("${variable}", ${index+1}, ${process_output_value(element)})`)
            ));
        } else if (Object.hasOwn(value, "set")) {
            return [Utils.parse_atom(`${output_predicate}("${variable}", set)`)].concat(value.set.map(
                element => Utils.parse_atom(`${output_predicate}("${variable}", ${process_output_value(element)})`)
            ));
        }
        return [
            Utils.parse_atom(`${output_predicate}("${variable}", value)`),
            Utils.parse_atom(`${output_predicate}("${variable}", ${process_output_value(value)})`)
        ];
    }

    function process_input_value(term) {
        return term.functor === "float" ? Number.parseFloat(term.terms[0].string) : term.number;
    }

    Recipe.register_operation_type(operation, async (input, options, index) => {
        const res = [];
        for (const part of input) {
            const ignored_atoms = [];
            const input_atoms = [];
            try {
                /*
                const minizinc_model = new Model();

                const program = part.map(atom => {
                    if (atom.predicate === options.decode_predicate) {
                        if (options.echo) {
                            ignored_atoms.push(atom);
                        }
                        return Base64.decode(atom.terms[0].string);
                    }
                    if (options.input_predicate && atom.predicate === options.input_predicate) {
                        input_atoms.push(atom);
                        if (!options.echo) {
                            return null;
                        }
                    }
                    ignored_atoms.push(atom);
                    return null;
                }).filter(element => element !== null).join('\n') + '\n' + options.model;
                minizinc_model.addString(program);

                const input_variable_type = {};
                const input_variable_value = {};
                input_atoms.filter(atom => {
                    if (atom.terms.length === 2 && ["value", "array", "array2d", "set"].includes(atom.terms[1].functor)) {
                        input_variable_type[atom.terms[0].string] = atom.terms[1].str;
                        if (atom.terms[1].functor !== "value") {
                            input_variable_value[atom.terms[0].string] = [];
                        }
                        return false;
                    }
                    return true;
                }).forEach(atom => {
                    if (input_variable_type[atom.terms[0].string] === "value") {
                        if (atom.terms.length !== 2) {
                            throw Error("TODO");
                        }
                        input_variable_value[atom.terms[0].string] = process_input_value(atom.terms[1]);
                    } else if (input_variable_type[atom.terms[0].string] === "array") {
                        input_variable_value[atom.terms[0].string][atom.terms[1].number - 1] = process_input_value(atom.terms[2]);
                    } else if (input_variable_type[atom.terms[0].string] === "array2d") {
                        if (input_variable_value[atom.terms[0].string][atom.terms[1].number - 1] === undefined) {
                            input_variable_value[atom.terms[0].string][atom.terms[1].number - 1] = [];
                        }
                        input_variable_value[atom.terms[0].string][atom.terms[1].number - 1][atom.terms[2].number - 1] = process_input_value(atom.terms[3]);
                    } else if (input_variable_type[atom.terms[0].string] === "set") {
                        if (atom.terms.length === 2) {
                            input_variable_value[atom.terms[0].string].push([process_input_value(atom.terms[1])]);
                        } else {
                            input_variable_value[atom.terms[0].string].push([
                                process_input_value(atom.terms[1]),
                                process_input_value(atom.terms[2]),
                            ]);
                        }
                    } else {
                        throw Error(`Unkown type: ${input_variable_type[atom.terms[0].string]} in ${atom}`)
                    }
                });
                if (Object.keys(input_variable_value).length > 0) {
                    minizinc_model.addJson(input_variable_value);
                }

                const solve = minizinc_model.solve({
                    options: {
                        solver: 'gecode',
                        'time-limit': Utils.clingo_timeout,
                        'num-solutions': options.number,
                        'intermediate': false,
                        'no-optimize': true,
                    }
                });
                solve.on('solution', solution => {
                    res.push(ignored_atoms.concat(
                        Object.entries(solution.output.json)
                            .flatMap(([key, value]) => process_output(options.output_predicate, key, value))
                    ));
                });
                await solve;*/
            } catch (error) {
                Recipe.set_errors_at_index(index, error.message || error, res);
            }
        }
        return res;
    });
</script>

<script>
    import {Button, Input, InputGroup, InputGroupText} from "@sveltestrap/sveltestrap";
    import Operation from "$lib/Operation.svelte";
    import CodeMirror from "$lib/CodeMirror.svelte";

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
    <InputGroup>
        <InputGroupText>Height</InputGroupText>
        <Input type="number"
               bind:value={options.height}
               min="20"
               step="20"
               style="max-width: 5em;"
               on:input={edit}
        />
        <InputGroupText>Input</InputGroupText>
        <Input type="text"
               bind:value={options.input_predicate}
               placeholder="input predicate"
               on:input={edit}
               data-testid="MiniZinc-input-predicate"
        />
        <InputGroupText>Decode</InputGroupText>
        <Input type="text"
               bind:value={options.decode_predicate}
               placeholder="decode predicate"
               on:input={edit}
               data-testid="MiniZinc-decode-predicate"
        />
        <Button outline="{!options.echo}" on:click={() => { options.echo = !options.echo; edit(); }}>Echo</Button>
    </InputGroup>
    <div style="height: {options.height}px; overflow-y: auto" data-testid="MiniZinc-model">
        <CodeMirror bind:value={options.model}
                    placeholder={`MiniZinc model...`}
                    lineWrapping="{true}"
                    onchange={edit}
        />
        <pre type="textarea" class="d-test">{options.model}</pre>
    </div>
    <InputGroup>
        <InputGroupText># of solutions</InputGroupText>
        <Input type="number"
               bind:value={options.number}
               min="0"
               on:input={edit}
               data-testid="MiniZinc-number"
        />
        <InputGroupText>Output predicate</InputGroupText>
        <Input type="text"
               bind:value={options.output_predicate}
               placeholder="output predicate"
               on:input={edit}
               data-testid="MiniZinc-output-predicate"
        />
    </InputGroup>
</Operation>
