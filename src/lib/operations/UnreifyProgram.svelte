<script context="module">
    import {Recipe} from "$lib/recipe";
    import {Utils} from "$lib/utils";
    import {Base64} from "js-base64";

    const operation = "Unreify Program";
    const default_extra_options = {
        echo: false,
        include_show_directives: true,
        unconditional_show_directives_to_facts: false,
        encode_predicate: '__base64__',
        atom_predicate: '__atom__',
    };

    function unreify(part, options) {
        const rules = [];
        const outputs = new Map();
        const atom_tuple = [];
        const literal_tuple = [];
        const weighted_literal_tuple = [];
        part.forEach(atom => {
            if (atom.predicate === 'atom_tuple') {
                if (atom_tuple[atom.terms[0].number] === undefined) {
                    atom_tuple[atom.terms[0].number] = [];
                }
                if (atom.terms.length === 2) {
                    atom_tuple[atom.terms[0].number].push(atom.terms[1].number);
                }
            } else if (atom.predicate === 'literal_tuple') {
                if (literal_tuple[atom.terms[0].number] === undefined) {
                    literal_tuple[atom.terms[0].number] = [];
                }
                if (atom.terms.length === 2) {
                    literal_tuple[atom.terms[0].number].push(atom.terms[1].number);
                }
            } else if (atom.predicate === 'output') {
                outputs.set(atom.terms[0], atom.terms[1].number);
            } else if (atom.predicate === 'rule') {
                rules.push(atom.terms);
            } else if (atom.predicate === 'weighted_literal_tuple') {
                if (weighted_literal_tuple[atom.terms[0].number] === undefined) {
                    weighted_literal_tuple[atom.terms[0].number] = [];
                }
                if (atom.terms.length === 3) {
                    weighted_literal_tuple[atom.terms[0].number].push([atom.terms[1].number, atom.terms[2].number]);
                }
            }
        });

        const named_atoms = [];
        const facts_from_show_directives = [];
        outputs.forEach((literal_tuple_id, atom) => {
            const literals = literal_tuple[literal_tuple_id];
            if (atom.functor && literals.length === 1) {
                named_atoms[literals[0]] = atom;
            }
            if (atom.functor && literals.length === 0 && options.unconditional_show_directives_to_facts) {
                facts_from_show_directives.push(`${atom.str}.`);
            }
        });

        const show_directives = [];
        if (options.include_show_directives) {
            outputs.forEach((literal_tuple_id, atom) => {
                const literals = literal_tuple[literal_tuple_id];
                const condition = literals.map(literal => literal > 0 ? get_atom(literal) : `not ${get_atom(-literal)})`).join(', ');
                show_directives.push(condition ? `#show ${atom.str} : ${condition}.` : `#show ${atom.str}.`);
            });
        }

        function get_atom(atom) {
            return named_atoms[atom] ? named_atoms[atom].str : `${options.atom_predicate}(${atom})`;
        }

        return [...rules.map(rule => {
            const atoms = atom_tuple[rule[0].terms[0].number];
            let head;
            if (rule[0].functor === 'choice') {
                head = '{' + atoms.map(get_atom).join('; ') + '}';
            } else if (rule[0].functor === 'disjunction') {
                head = atoms.map(get_atom).join(' | ');
            } else {
                throw new Error('Unknown functor ' + rule[0].functor);
            }

            let body;
            if (rule[1].functor === 'normal') {
                const literals = literal_tuple[rule[1].terms[0].number];
                body = literals.map(literal => literal > 0 ? get_atom(literal) : `not ${get_atom(-literal)}`).join(', ');
            } else if (rule[1].functor === 'sum') {
                const literals = weighted_literal_tuple[rule[1].terms[0].number];
                const bound = rule[1].terms[1].number;
                body = '#sum{' +
                    literals.map(([literal, weight]) => literal > 0 ? `${weight} : ${get_atom(literal)}` : `${weight} : not ${get_atom(-literal)}`).join('; ') +
                    '} >= ' + bound;
            } else {
                throw new Error('Unknown functor ' + rule[1].functor);
            }

            return head && body ? `${head} :- ${body}.` :
                head ? `${head}.` : `:- ${body}.`;
        }), ...facts_from_show_directives, ...show_directives].join('\n');
    }

    Recipe.register_operation_type(operation, async (input, options, index) => {
        const res = [];
        for (const part of input) {
            try {
                const unreified = unreify(part, options);
                const content = `${options.encode_predicate}("${Base64.encode(unreified)}").`
                const program = part.filter(atom =>
                    options.echo || !['atom_tuple', 'literal_tuple', 'output', 'rule', 'weighted_literal_tuple'].includes(atom.predicate)
                ).map(atom => atom.str + '.').join('\n') + '\n' + content;
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
    import {Button, Input, InputGroup, InputGroupText} from "@sveltestrap/sveltestrap";
    import Operation from "$lib/Operation.svelte";

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
        <InputGroupText style="width: 10em;">Encode predicate</InputGroupText>
        <Input type="text"
               bind:value={options.encode_predicate}
               placeholder="encode predicate"
               on:input={edit}
               data-testid="UnreifyProgram-encode-predicate"
        />
        <Button style="width: 18em;" outline="{!options.unconditional_show_directives_to_facts}" on:click={() => { options.unconditional_show_directives_to_facts = !options.unconditional_show_directives_to_facts; edit(); }}>Unconditional Show to Facts</Button>
    </InputGroup>
    <InputGroup>
        <InputGroupText style="width: 10em;">Atom predicate</InputGroupText>
        <Input type="text"
               bind:value={options.atom_predicate}
               placeholder="atom predicate"
               on:input={edit}
               data-testid="UnreifyProgram-atom-predicate"
        />
        <Button style="width: 12em;" outline="{!options.include_show_directives}" on:click={() => { options.include_show_directives = !options.include_show_directives; edit(); }}>Show directives</Button>
        <Button style="width: 6em;" outline="{!options.echo}" on:click={() => { options.echo = !options.echo; edit(); }}>Echo</Button>
    </InputGroup>
</Operation>
