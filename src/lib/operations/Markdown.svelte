<script context="module">
    import {Recipe} from "$lib/recipe";

    const operation = "Markdown";
    const default_extra_options = {
        predicate: '__base64__',
        echo: false,
    };

    const listeners = new Map();

    Recipe.register_operation_type(operation, async (input, options, index, id) => {
        try {
            listeners.get(id)(input);
        } catch (error) { /* component not mounted, possibly because of headless mode */ }
        return options.echo ? input : input.map(model => model.filter(atom => atom.predicate !== options.predicate));
    });
</script>

<script>
    import {Button, Input, InputGroup, InputGroupText} from "sveltestrap";
    import Operation from "$lib/operations/Operation.svelte";
    import {onDestroy, onMount, tick} from "svelte";
    import {consts} from "$lib/consts";
    import {Base64} from "js-base64";
    import {Utils} from "$lib/utils";
    import _ from "lodash";
    import renderMathInElement from 'katex/dist/contrib/auto-render.mjs';


    export let id;
    export let options;
    export let index;
    export let add_to_recipe;
    export let keybinding;

    let output = '';
    let output_div;

    function edit() {
        Recipe.edit_operation(index, options);
    }

    function check_one_term_string(atom) {
        if (atom.terms.length !== 1) {
            Utils.snackbar(`Wrong number of terms in \#${index}. Markdown: ${atom.str}`)
            return false;
        } else if (atom.terms[0].string === undefined) {
            Utils.snackbar(`Wrong argument in \#${index}. Markdown: ${atom.str}`)
            return false
        } else {
            return true;
        }
    }

    function process_match(query_answer) {
        if (query_answer.length === 0) {
            throw Error("Expected one model, 0 found");
        }

        let matrix = null;
        let separator = '\n';
        let term_separator = ', ';
        let prefix = '';
        let suffix = '';
        let sort = [];

        const replacement = [];
        let output_atoms = [];
        Utils.parse_atoms(query_answer[0]).forEach(atom => {
            if (atom.functor === undefined && atom.predicate === undefined) {
                atom.functor = '';
                atom.terms = [atom];
            }
            if (atom.functor === '') {
                output_atoms.push(atom);
            } else if (atom.predicate === 'matrix') {
                output_atoms.push(atom);
            } else if (atom.predicate === 'prefix') {
                if (check_one_term_string(atom)) {
                    prefix = atom.terms[0].string;
                }
            } else if (atom.predicate === 'suffix') {
                if (check_one_term_string(atom)) {
                    suffix = atom.terms[0].string;
                }
            } else if (atom.predicate === 'separator') {
                if (check_one_term_string(atom)) {
                    separator = atom.terms[0].string;
                }
            } else if (atom.predicate === 'term_separator') {
                if (check_one_term_string(atom)) {
                    term_separator = atom.terms[0].string;
                }
            } else if (atom.predicate === 'table') {
                if (atom.terms.length !== 0) {
                    Utils.snackbar(`Wrong number of terms in \#${index}. Markdown: ${atom.str}`);
                } else {
                    prefix = '|';
                    term_separator = '|'
                    suffix = '|';
                    separator = '\n';
                }
            } else if (atom.predicate === 'list') {
                if (atom.terms.length !== 0) {
                    Utils.snackbar(`Wrong number of terms in \#${index}. Markdown: ${atom.str}`);
                } else {
                    prefix = '- ';
                    term_separator = ', '
                    suffix = '';
                    separator = '\n';
                }
            } else if (atom.predicate === 'default') {
                if (atom.terms.length !== 0) {
                    Utils.snackbar(`Wrong number of terms in \#${index}. Markdown: ${atom.str}`);
                } else {
                    prefix = '';
                    term_separator = ', '
                    suffix = '';
                    separator = '\n';
                }
            } else if (atom.predicate === 'sort') {
                if (atom.terms.length === 0) {
                    Utils.snackbar(`Wrong number of terms in \#${index}. Markdown: ${atom.str}`);
                } else if (atom.terms.filter(term => term.number === undefined || term.number === 0).length > 0) {
                    Utils.snackbar(`Wrong term in \#${index}. Markdown: ${atom.str}`);
                } else {
                    sort.push(atom.terms.map(term => term.number));
                }
            } else {
                Utils.snackbar(`Unknown predicate in \#${index}. Markdown: ${atom.predicate}`);
            }
        });
        sort.forEach(terms => {
            const comparator = terms.map(sort_index => {
                return atom => {
                    if (atom.functor !== '') {
                        return undefined;
                    }
                    const term = atom.terms[Math.abs(sort_index) - 1];
                    if (term === undefined) {
                        return undefined
                    } else if (term.number !== undefined) {
                        return term.number;
                    } else {
                        return term.str;
                    }
                }
            });
            output_atoms = _.orderBy(output_atoms, comparator, terms.map(sort_index => sort_index > 0 ? "asc" : "desc"));
        });
        output_atoms.forEach(atom => {
            const terms = atom.terms.map(term => term.string || term.str);
            if (atom.functor === '') {
                replacement.push(prefix + terms.join(term_separator) + suffix);
            } else if (atom.predicate === 'matrix') {
                if (matrix === null) {
                    matrix = [];
                }
                if (atom.terms.length < 3) {
                    Utils.snackbar(`Wrong number of terms in \#${index}. Markdown: ${atom.str}`)
                } else {
                    const row = atom.terms[0].number;
                    const col = atom.terms[1].number;
                    const value = prefix + terms.slice(2).join(term_separator) + suffix;

                    while (matrix.length <= row) {
                        matrix.push([]);
                    }
                    while (matrix[row].length < col) {
                        matrix[row].push("");
                    }
                    while (matrix[0].length < col) {
                        matrix[0].push("");
                    }

                    matrix[row][col-1] = value;
                }
            }
        });
        if (matrix !== null) {
            replacement.push(matrix.map((row, index) => {
                let res = "|" + row.join("|") + "|";
                if (index === 0) {
                    res += "\n|" + row.map(() => "---").join("|") + "|";
                }
                return res;
            }).join("\n"));
        }
        return replacement.join(separator);
    }

    onMount(() => {
        listeners.set(id, async (input) => {
            const the_output = [];
            for (let model of input) {
                const output_part = [];
                for (let atom of model.filter(atom => atom.predicate === options.predicate)) {
                    let md = Base64.decode(atom.terms[0].string);
                    const matches = md.matchAll(/\{\{(=?)(((?!}}).)*)}}/gs);
                    if (matches !== null) {
                        for (let the_match of matches) {
                            const inline = the_match[1].trim();
                            const match = the_match[2].trim();
                            const program = model.map(atom => `${atom.str}.`).join('\n') + '\n#show.\n' +
                                (inline ? '#show ' : '') + match + (match.endsWith('.') ? '' : '.');
                            const query_answer = await Utils.search_models(program, 1, true);
                            md = md.replace(the_match[0], process_match(query_answer));
                        }
                    }
                    output_part.push(md);
                }
                the_output.push(output_part.join('\n'));
            }
            output = the_output.join(consts.SYMBOLS.MODELS_SEPARATOR);
            await tick();
            renderMathInElement(output_div,  {
                delimiters: [
                    { left: '\\(', right: '\\)', display: false },
                    { left: '\\[', right: '\\]', display: true },
                ],
            });
        });
    });

    onDestroy(() => {
        listeners.set(id, null);
    });
</script>

<Operation {id} {operation} {options} {index} {default_extra_options} {add_to_recipe} {keybinding}>
    <div slot="description">
        <p>
            The <strong>{operation}</strong> operation shows the markdown encoded content in each model in input.
            Latex math expressions are supported; e.g., <code>\\(x = 4\\)</code> or <code>\\[x = \frac{1}{2}\\]</code>.
        </p>
        <p>
            Models can be queried with the mustache syntax
            <code>{`{{ program with #show directives }}`}</code>
            (or <code>{`{{= (terms) : conjunctive_query }}`}</code> as a shortcut for <code>{`{{ #show (terms) : conjunctive_query. }}`}</code>).
        </p>
        <p>
            Output can be ordered via the varadics predicate <code>sort</code>, specifying the indices of the terms to use (positive for ascending, negative for descending).
        </p>
        <p>
            The separator of obtained substitutions can be specified with
            <code>{`{{ separator("\n") }}`}</code>.
            Similarly, <code>term_separator/1</code>, <code>prefix/1</code> and <code>suffix/1</code> can be used to customize the print of each obtained substitution.
            Moreover, <code>table/0</code>, <code>list/0</code> and <code>default/0</code> can be used to set the above four parameters to accommodate specific common output formats.
        </p>
        <p>
            Additionally, <code>matrix/3</code> can be used to produce a table by specifying values for each cell.
            Row 0 can be used to provide header cells.
            Columns are indexed by 1.
        </p>
        <p>
            The input is echoed in output.
        </p>
    </div>
    <InputGroup>
        <InputGroupText>Predicate</InputGroupText>
        <Input type="text" placeholder="predicate" bind:value={options.predicate} on:input={edit} data-testid="Markdown-predicate" />
        <Button outline="{!options.echo}" on:click={() => { options.echo = !options.echo; edit(); }}>Echo</Button>
    </InputGroup>
    <div bind:this="{output_div}" class="p-2 output" data-testid="Markdown-output">
        {@html Utils.render_markdown(output)}
    </div>
</Operation>

<style >
    .output :global(td), .output :global(th) {
        border: 1px solid #ddd;
        padding: 8px;
    }

    .output :global(tr:nth-child(even)) {
        background-color: #f2f2f2;
    }

    .output :global(tr:hover) {
        background-color: #ddd;
    }

    .output :global(th) {
        padding-top: 12px;
        padding-bottom: 12px;
        text-align: left;
        background-color: #777;
        color: white;
    }
</style>